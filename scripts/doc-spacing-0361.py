#!/usr/bin/env python3
"""Bounded French prose spacing. Dry run by default; never rewrites protected spans."""
import argparse
import json
from pathlib import Path
import re

# Explicit prose vocabulary: unknown tokens (identifiers, names, hashes) stay intact.
PREFIXES = set('Version version versions les Les des de à À en et avec après avant contre puis soit environ pendant vers sur entre novembre code codes camp camps sauvegarde sauvegardes checkpoint checkpoints format formats famille familiale familial enveloppe Phaser Android APK Node Capacitor lot étape point points vague vagues mission missions grand caprice caprices audit conseil enfant profil profils portrait marges site Site Sites publié Verify tests prévision contient délai maximum minimum plus reste'.split())
SUFFIXES = set('px ms s seconde secondes octets Ko Mo Mio KiB MiB Go GiB PNG WebP fichiers tests contrôles formats cas cibles campagnes ans points vagues voies étoiles parties graines chapitres victoires défaites pièces statistiques simulations scénarios écrans textes phrases captures pixels caractères états paires versions étapes plafonds alliés caprices défis missions unités'.split())
NUMBER = r'\d+(?:[.,]\d+)*'
TOKEN = re.compile(r"[\wÀ-ÿ]+(?:[.,][\wÀ-ÿ]+)*", re.UNICODE)
PROTECTED = re.compile(r'`+[^`\n]*`+|https?://\S+|\[[^\]\n]*\]\([^\n]*?\)|!\[[^\]\n]*\]\([^\n]*?\)|«[^»]*»|“[^”]*”|"[^"\n]*"|(?:\S*[/\\_#=@]\S*)|\b(?:[a-fA-F0-9]{7,}|SHA\d+|Base\d+|S24|PR\d+|Task\d+|rules\d+|codev\d+|campv\d+)\b')


def prose(text):
    def token(match):
        value = match[0]
        found = re.fullmatch(r'([A-Za-zÀ-ÿ]+)?(' + NUMBER + r')([A-Za-zÀ-ÿ]+)?', value)
        if not found:
            return value
        prefix, number, suffix = found.groups()
        if prefix and prefix not in PREFIXES or suffix and suffix not in SUFFIXES:
            return value
        return ' '.join(part for part in (prefix, number, suffix) if part)
    return TOKEN.sub(token, text)


def transform(text, preserve_tables=False):
    output, fence = [], False
    for line in text.splitlines(keepends=True):
        if re.match(r'^\s*(```|~~~)', line):
            fence = not fence
            output.append(line)
            continue
        # Keep heading anchors, block quotes, historical quote paragraphs and names in catalog tables.
        if fence or re.match(r'^\s*(?:#|>)', line) or (preserve_tables and line.lstrip().startswith('|')):
            output.append(line)
            continue
        parts, position = [], 0
        for span in PROTECTED.finditer(line):
            parts.extend((prose(line[position:span.start()]), span[0]))
            position = span.end()
        parts.append(prose(line[position:]))
        output.append(''.join(parts))
    return ''.join(output)


def self_test():
    fixture = '# les36caprices\nles36caprices prévision5écrans 48px Version0.36.1 code47\n`441tests` SHA256 Base64 S24 PR3 abc123dead https://a.test/48px docs/48px.png [les36](x.md#48px) « les36caprices » "48px"\n> les36caprices\n```ts\nles36caprices\n```\n'
    result = transform(fixture)
    assert result == fixture.replace('les36caprices prévision5écrans 48px Version0.36.1 code47', 'les 36 caprices prévision 5 écrans 48 px Version 0.36.1 code 47')
    assert transform(result) == result
    assert transform('| Le roi123 | 48px |\n', True) == '| Le roi123 | 48px |\n'
    print('Safety fixtures: protected spans, headings, quotes, catalog rows and idempotence PASS')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    changes = []
    for path in sorted(Path('docs').rglob('*.md')):
        if 'originaux' in path.parts:
            continue
        before = path.read_text()
        after = transform(before, path.name == 'CAPRICES.md')
        if before != after:
            changes.append({'path': str(path), 'changedLines': sum(a != b for a, b in zip(before.splitlines(), after.splitlines())), 'addedSpaces': len(after) - len(before)})
            if args.write:
                path.write_text(after)
    print(json.dumps({'write': args.write, 'files': len(changes), 'addedSpaces': sum(x['addedSpaces'] for x in changes), 'changes': changes}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
