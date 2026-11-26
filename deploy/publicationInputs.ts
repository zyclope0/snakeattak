import { readFile, realpath, stat, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { imageMetadata } from './imageMetadata.ts';
import { validatePlayPreparation, safeAssetPath } from './playReadiness.ts';
import type { CaptureFile, Issue } from './playReadiness.ts';

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const record = (v: unknown) => (object(v) ? v : {});

/** Names that betray an advertising, billing or tracking library in what the APK ships. */
export const ADS_SDK =
  /admob|play-services-ads|google-mobile-ads|gms\.ads|applovin|unity-?ads|ironsource|appodeal|vungle|chartboost|inmobi|adcolony|mintegral|pangle/i;
export const BILLING_SDK =
  /billing|in-?app-?purchase|revenuecat|plugin-purchase|purchases|com\.android\.vending/i;
export const ANALYTICS_SDK =
  /firebase|analytics|crashlytics|sentry|amplitude|mixpanel|appsflyer|onesignal|segment\.io/i;
/** Capacitor's own runtime, not a module that adds a native capability. */
const CAPACITOR_RUNTIME = new Set([
  '@capacitor/core',
  '@capacitor/android',
  '@capacitor/ios',
  '@capacitor/cli',
]);
/** Native Capacitor modules, from package.json and from the Gradle file `cap sync` writes. */
export function nativePlugins(dependencies: string[], capacitorGradle: string): string[] {
  const found = new Set(
    dependencies.filter((name) => name.startsWith('@capacitor/') && !CAPACITOR_RUNTIME.has(name)),
  );
  for (const [, name] of capacitorGradle.matchAll(/project\(':capacitor-([a-z0-9-]+)'\)/g))
    if (name !== 'android' && name !== 'cordova-android-plugins') found.add(`@capacitor/${name}`);
  return [...found].sort();
}

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
  // The production build is optional in a draft: without it, captures are not compared to it,
  // and the check says so as a blocker.
  const html = await content(resolve(project, 'dist/index.html'), 'build.html', true);
  const read = async (path: string, code: string) =>
    (await content(resolve(project, path), code)) ?? '';
  const gradle = await read('android/app/build.gradle', 'runtime.gradle');
  const capacitorGradle = await read('android/app/capacitor.build.gradle', 'runtime.capacitor');
  const settingsGradle = await read('android/capacitor.settings.gradle', 'runtime.settings');
  const manifest = await read('android/app/src/main/AndroidManifest.xml', 'runtime.manifest');
  const dependencyNames = Object.keys(record(pkg.dependencies));
  const shipped = [
    dependencyNames.join(' '),
    gradle,
    capacitorGradle,
    settingsGradle,
    manifest,
  ].join('\n');
  const evidence = {
    appVersion,
    manifest: captures,
    files,
    buildHtmlSha256: html === null ? undefined : createHash('sha256').update(html).digest('hex'),
    runtime: {
      adsSdkInstalled: ADS_SDK.test(shipped),
      billingSdkInstalled: BILLING_SDK.test(shipped),
      analyticsSdkInstalled: ANALYTICS_SDK.test(shipped),
      internetPermission: /android\.permission\.INTERNET/.test(manifest),
      nativePlugins: nativePlugins(dependencyNames, capacitorGradle),
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
