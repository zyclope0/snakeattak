// Which ids of the page the code looks up, and which ids the code gives to the elements it
// builds, read from the syntax tree of each TypeScript source (tests/dom-ids.test.ts).
import ts from 'typescript';

/** A written id. `pattern` is set when a part of it is computed: `chapter-${i}`. */
export type WrittenId = { id: string; pattern?: RegExp; file: string; line: number };
/** A lookup whose id is written nowhere the reader can follow. */
export type Unread = { file: string; line: number; code: string };
type Parsed = { file: string; ast: ts.SourceFile };
/** A written id and the place where it is written. */
type Shape = { text: string; source: Parsed; node: ts.Node };

/** The functions that take the id of an element, and which of their arguments are ids. */
const LOOKUPS = new Map([
  ['byId', [0]],
  ['getElementById', [0]],
  ['forwardClick', [0, 1]],
]);
const LIST_CALLS = /^(map|forEach|flatMap|filter|some|every|find)$/;

const HOLE = '\u0000';
const quote = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A computed part stands for one word or one number, never for a hyphen: `chapter-${i}`. */
const patternOf = (shape: string) =>
  new RegExp(`^${shape.split(HOLE).map(quote).join('[A-Za-z0-9_]+')}$`);

export const parse = (file: string, source: string): Parsed => ({
  file,
  ast: ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true),
});

const each = (root: ts.Node, visit: (node: ts.Node) => void) => {
  const walk = (node: ts.Node) => {
    visit(node);
    ts.forEachChild(node, walk);
  };
  walk(root);
};
const lineOf = ({ ast }: Parsed, node: ts.Node) =>
  ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
const calledName = (call: ts.CallExpression) =>
  ts.isIdentifier(call.expression)
    ? call.expression.text
    : ts.isPropertyAccessExpression(call.expression)
      ? call.expression.name.text
      : null;
const baseName = (path: string) => path.replace(/^.*\//, '').replace(/\.ts$/, '');

/** Reads the ids written in a set of sources, following a name back to where it is written. */
function reader(sources: Parsed[]) {
  /** Calls of a plain function name, by name: `soundSwitch('setting-music')`. */
  const calls = new Map<string, { source: Parsed; call: ts.CallExpression }[]>();
  /** For each source, the names it imports and the file each one comes from. */
  const imports = new Map<Parsed, Map<string, string>>();
  for (const source of sources) {
    const names = new Map<string, string>();
    imports.set(source, names);
    each(source.ast, (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        calls.set(name, [...(calls.get(name) ?? []), { source, call: node }]);
      } else if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.importClause?.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      )
        for (const item of node.importClause.namedBindings.elements)
          if (!item.propertyName) names.set(item.name.text, baseName(node.moduleSpecifier.text));
    });
  }

  /** Where a name gets its value: a parameter, a local constant or the item of a list. */
  type Origin =
    | { kind: 'value'; value: ts.Expression }
    | { kind: 'items'; list: ts.Expression }
    | { kind: 'parameter'; owner: string; index: number };
  function originOf(name: ts.Identifier): Origin | null {
    for (let node: ts.Node = name; node.parent; node = node.parent) {
      if (ts.isFunctionLike(node)) {
        const index = node.parameters.findIndex(
          (parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === name.text,
        );
        if (index < 0) continue;
        if (ts.isFunctionDeclaration(node) && node.name)
          return { kind: 'parameter', owner: node.name.text, index };
        const holder = node.parent;
        if (ts.isVariableDeclaration(holder) && ts.isIdentifier(holder.name))
          return { kind: 'parameter', owner: holder.name.text, index };
        // `['a', 'b'].map((id) => byId(id))`: the ids are the items of the list.
        if (
          index === 0 &&
          ts.isCallExpression(holder) &&
          ts.isPropertyAccessExpression(holder.expression) &&
          LIST_CALLS.test(holder.expression.name.text)
        )
          return { kind: 'items', list: holder.expression.expression };
        return null;
      }
      const declared = (list: ts.VariableDeclarationList) =>
        list.declarations.find(
          (declaration) =>
            ts.isIdentifier(declaration.name) &&
            declaration.name.text === name.text &&
            declaration.name !== name,
        );
      if (ts.isForOfStatement(node) && ts.isVariableDeclarationList(node.initializer)) {
        if (declared(node.initializer)) return { kind: 'items', list: node.expression };
      } else if (ts.isBlock(node) || ts.isSourceFile(node)) {
        for (const statement of node.statements) {
          if (!ts.isVariableStatement(statement)) continue;
          const found = declared(statement.declarationList);
          if (!found) continue;
          const constant = statement.declarationList.flags & ts.NodeFlags.Const;
          return constant && found.initializer ? { kind: 'value', value: found.initializer } : null;
        }
      }
    }
    return null;
  }

  /**
   * The ids an expression can be, each with the place where it is written; a computed part is
   * a hole. An empty list is the id of an element the code already holds (`field.id`): nothing
   * to check. `null` when nothing says what the id is.
   */
  function shapes(source: Parsed, node: ts.Expression, depth = 0): Shape[] | null {
    const here = (text: string): Shape => ({ text, source, node });
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      return [here(node.text)];
    if (ts.isTemplateExpression(node)) {
      let found = [node.head.text];
      for (const span of node.templateSpans) {
        const parts = shapes(source, span.expression, depth);
        const values = parts?.length ? parts.map((part) => part.text) : [HOLE];
        found = found.flatMap((start) => values.map((value) => start + value + span.literal.text));
      }
      return found.map(here);
    }
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return shapes(source, node.expression, depth);
    if (ts.isConditionalExpression(node)) {
      const yes = shapes(source, node.whenTrue, depth);
      const no = shapes(source, node.whenFalse, depth);
      return yes && no ? [...yes, ...no] : null;
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = shapes(source, node.left, depth)?.map((part) => part.text);
      const right = shapes(source, node.right, depth)?.map((part) => part.text);
      // `'camp-tool-' + field` has a written part; `a + b` has none and says nothing.
      if (!left?.length && !right?.length) return null;
      return (left?.length ? left : [HOLE]).flatMap((start) =>
        (right?.length ? right : [HOLE]).map((end) => here(start + end)),
      );
    }
    if (ts.isArrayLiteralExpression(node)) {
      const items = node.elements.map((item) => shapes(source, item, depth));
      return items.every((item) => item !== null) ? items.flat() : null;
    }
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'id') return [];
    if (!ts.isIdentifier(node) || depth > 4) return null;
    const origin = originOf(node);
    if (!origin) return null;
    if (origin.kind === 'value') return shapes(source, origin.value, depth + 1);
    if (origin.kind === 'items') return shapes(source, origin.list, depth + 1);
    // The lookups themselves: every one of their calls is read where it is written.
    if (LOOKUPS.has(origin.owner)) return [];
    const callers = (calls.get(origin.owner) ?? []).filter(
      (caller) =>
        caller.call.arguments.length > origin.index &&
        (caller.source === source ||
          imports.get(caller.source)?.get(origin.owner) === baseName(source.file)),
    );
    if (!callers.length) return null;
    const given = callers.map((caller) =>
      shapes(caller.source, caller.call.arguments[origin.index], depth + 1),
    );
    return given.every((item) => item !== null) ? given.flat() : null;
  }

  const written = (found: Shape[]): WrittenId[] =>
    found.map(({ text, source, node }) => ({
      id: text.split(HOLE).join('${…}'),
      ...(text.includes(HOLE) ? { pattern: patternOf(text) } : {}),
      file: source.file,
      line: lineOf(source, node),
    }));
  return { shapes, written };
}

/**
 * Every id the sources look up. An id given through a parameter is followed to the calls of
 * that function; a lookup that cannot be followed comes back in `unread`.
 */
export function lookedUpIds(sources: Parsed[]): { ids: WrittenId[]; unread: Unread[] } {
  const { shapes, written } = reader(sources);
  const ids: WrittenId[] = [];
  const unread: Unread[] = [];
  for (const source of sources)
    each(source.ast, (node) => {
      if (!ts.isCallExpression(node)) return;
      for (const index of LOOKUPS.get(calledName(node) ?? '') ?? []) {
        const argument = node.arguments[index];
        if (!argument) continue;
        const found = shapes(source, argument);
        if (found) ids.push(...written(found));
        else
          unread.push({
            file: source.file,
            line: lineOf(source, node),
            code: node.getText(source.ast).replace(/\s+/g, ' ').slice(0, 80),
          });
      }
    });
  return { ids, unread };
}

/**
 * Every id the sources give to an element they build: `make(tag, { id })`, `node.id = …`,
 * `setAttribute('id', …)` and `id="…"` written in markup.
 */
export function createdIds(sources: Parsed[]): WrittenId[] {
  const { shapes, written } = reader(sources);
  const ids: WrittenId[] = [];
  for (const source of sources) {
    const add = (node: ts.Expression) => ids.push(...written(shapes(source, node) ?? []));
    each(source.ast, (node) => {
      if (ts.isCallExpression(node) && calledName(node) === 'make') {
        const features = node.arguments[1];
        if (!features || !ts.isObjectLiteralExpression(features)) return;
        for (const property of features.properties) {
          if (!property.name || !ts.isIdentifier(property.name) || property.name.text !== 'id')
            continue;
          if (ts.isPropertyAssignment(property)) add(property.initializer);
          else if (ts.isShorthandPropertyAssignment(property)) add(property.name);
        }
      } else if (
        ts.isCallExpression(node) &&
        calledName(node) === 'setAttribute' &&
        node.arguments.length === 2 &&
        ts.isStringLiteral(node.arguments[0]) &&
        node.arguments[0].text === 'id'
      )
        add(node.arguments[1]);
      else if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) &&
        node.left.name.text === 'id'
      )
        add(node.right);
      else if (
        ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateExpression(node)
      )
        for (const markup of shapes(source, node) ?? [])
          for (const match of markup.text.matchAll(/<[a-z][^<>]*?\sid=["']([^"']+)["']/gi))
            ids.push(...written([{ ...markup, text: match[1] }]));
    });
  }
  return ids;
}

/** Every `id="…"` of a page of markup. */
export const pageIds = (html: string): string[] =>
  [...html.matchAll(/<[a-z][^<>]*?\sid="([^"]+)"/gi)].map((match) => match[1]);

/**
 * The lookups of an id that nothing provides, as `file:line id`. An id is provided by the page
 * or by the code that builds the element; a computed id (`chapter-${i}`) by at least one id of
 * that shape.
 */
export function missingIds(sources: Parsed[], html: string): string[] {
  const created = createdIds(sources);
  const exact = new Set([
    ...pageIds(html),
    ...created.filter((made) => !made.pattern).map((made) => made.id),
  ]);
  const computed = created.filter((made) => made.pattern);
  return lookedUpIds(sources)
    .ids.filter(({ id, pattern }) =>
      pattern
        ? ![...exact].some((known) => pattern.test(known)) &&
          !computed.some((made) => made.id === id)
        : !exact.has(id) && !computed.some((made) => made.pattern?.test(id)),
    )
    .map(({ id, file, line }) => `${file}:${line} ${id}`);
}
