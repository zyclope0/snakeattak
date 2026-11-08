import { readFile, realpath, stat, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { imageMetadata } from './imageMetadata.ts';
import { validatePlayPreparation, safeAssetPath } from './playReadiness.ts';
import type { CaptureFile, Issue } from './playReadiness.ts';

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const record = (v: unknown) => (object(v) ? v : {});
export async function inspectPublication(
  folder = resolve('docs/publication'),
  project = process.cwd(),
) {
  const inputErrors: Issue[] = [];
  async function content(path: string, code: string, optional = false): Promise<string | null> {
    try {
      return await readFile(path, 'utf8');
    } catch (e) {
      if (!(optional && (e as NodeJS.ErrnoException).code === 'ENOENT'))
        inputErrors.push({
          code,
          message: `Fichier de préparation illisible : ${relative(project, path)}`,
        });
      return null;
    }
  }
  async function json(path: string, code: string, optional = false): Promise<unknown> {
    const raw = await content(path, code, optional);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      inputErrors.push({
        code,
        message: `JSON de préparation invalide : ${relative(project, path)}`,
      });
      return null;
    }
  }
  const config = await json(resolve(folder, 'configuration.json'), 'configuration.json');
  const copies = await json(resolve(folder, 'fiches.json'), 'copies.json');
  const captures = await json(resolve(folder, 'captures.json'), 'assets.json', true);
  const pkg = record(await json(resolve(project, 'package.json'), 'package.json'));
  const appVersion = typeof pkg.version === 'string' ? pkg.version : 'unknown';
  const files: CaptureFile[] = [];
  const rawAssets = record(captures).assets;
  const physicalRoot = await realpath(folder).catch(() => resolve(folder));
  if (Array.isArray(rawAssets) && rawAssets.length <= 20)
    for (const a of rawAssets) {
      if (!object(a) || !safeAssetPath(a.file)) continue;
      const candidate = resolve(folder, a.file);
      try {
        const physical = await realpath(candidate),
          child = relative(physicalRoot, physical);
        if (child === '..' || child.startsWith('..' + sep) || isAbsolute(child)) {
          inputErrors.push({ code: 'asset.path', message: 'Lien de capture hors du dossier.' });
          continue;
        }
        if ((await stat(physical)).size > 8 * 1024 * 1024) {
          inputErrors.push({ code: 'asset.size', message: `Image trop volumineuse : ${a.file}` });
          continue;
        }
        const b = await readFile(physical),
          info = imageMetadata(b) ?? {
            width: 0,
            height: 0,
            format: null,
            channels: 0,
            bitDepth: 0,
          };
        files.push({
          ...info,
          file: a.file,
          bytes: b.length,
          sha256: createHash('sha256').update(b).digest('hex'),
        });
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT')
          inputErrors.push({ code: 'asset.read', message: `Capture illisible : ${a.file}` });
      }
    }
  const html = await content(resolve(project, 'dist/index.html'), 'build.html');
  const gradle =
    (await content(resolve(project, 'android/app/build.gradle'), 'runtime.gradle')) ?? '';
  const manifest =
    (await content(
      resolve(project, 'android/app/src/main/AndroidManifest.xml'),
      'runtime.manifest',
    )) ?? '';
  const dependencyNames = Object.keys(record(pkg.dependencies)).join(' ');
  const evidence = {
    appVersion,
    manifest: captures,
    files,
    buildHtmlSha256: html === null ? undefined : createHash('sha256').update(html).digest('hex'),
    runtime: {
      adsSdkInstalled: /admob|play-services-ads/i.test(dependencyNames + gradle),
      billingSdkInstalled: /billing|purchases|revenuecat/i.test(dependencyNames + gradle),
      internetPermission: /android.permission.INTERNET/.test(manifest),
    },
  };
  const result = validatePlayPreparation(config, copies, evidence);
  const errors = [...inputErrors, ...result.errors];
  const report = {
    ...result,
    errors,
    state:
      errors.length || result.blockers.length
        ? ('blocked' as const)
        : ('manual-review-required' as const),
    appVersion,
    checkedAt: new Date().toISOString(),
    assetFilesChecked: files.length,
    scope:
      'Local source/artifact preparation only; no Play Console, SDK approval, policy certification or automatic publication',
  };
  return { config, copies, captures, evidence, report };
}

export async function writePlayReport(
  report: unknown,
  target = resolve('reports/store-preparation.json'),
) {
  await mkdir(dirname(target), { recursive: true });
  const temporary = target + '.' + process.pid + '.tmp';
  await writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
  await rename(temporary, target);
}
