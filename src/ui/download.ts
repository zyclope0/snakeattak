import { make } from './dom.ts';

/**
 * The name of a family file. One saved from the start-up failure carries its player's number;
 * a copy the game kept beside the save carries what it is.
 */
export const familyFileName = (which?: number | 'mis-de-cote') =>
  `conquete-serpents-famille${which ? `-${which}` : ''}.json`;

/**
 * What became of a file the family asked for: handed over (to the browser, or to the app the
 * family chose in Android's share sheet), refused by nobody but closed by the family
 * (`canceled`), impossible here, or failed.
 */
export type Handover = 'saved' | 'canceled' | 'unavailable' | 'failed';

/** The build this page comes from; nothing outside a build (the unit tests). */
const buildMode = (): string => (import.meta.env ? import.meta.env.MODE : '');
/**
 * True in the Android application's build. Written so that the build can decide it: the
 * website then holds none of the plugins' code.
 */
const APP = typeof __APP_BUILD__ !== 'undefined' && __APP_BUILD__;
/** True in the Android application's build. */
export const buildIsApp = (): boolean => APP;

/** What the Android application's native side says it offers, before any plugin is loaded. */
type Bridge = { PluginHeaders?: readonly { name: string }[] };
/** The two plugins a file needs to leave the application: one writes it, one shares it. */
const NATIVE_PLUGINS = ['Filesystem', 'Share'] as const;
const nativeShare = (bridge = (globalThis as { Capacitor?: Bridge }).Capacitor): boolean => {
  const headers = bridge?.PluginHeaders;
  return !!headers && NATIVE_PLUGINS.every((name) => headers.some((one) => one.name === name));
};

/**
 * Whether this page can hand a file over. A website can: the browser saves it. The Android
 * application can when its native side has the two plugins (from build 65): the file is
 * written in the application's cache and Android's share sheet opens. Before them, asking
 * for a download did nothing at all (tried by the parent on build 64, 22 November 2026):
 * there, no button offers a file and no sentence says that one is ready.
 */
export const canHandOver = (mode: string = buildMode(), native = nativeShare): boolean =>
  mode !== 'android' || native();

/** The plugins, loaded only in the application and only when a file is asked for. */
export type SharePlugins = {
  write: (name: string, text: string) => Promise<string>;
  /** True when an app was chosen: Android names it. */
  share: (name: string, uri: string) => Promise<boolean>;
};
async function loadPlugins(): Promise<SharePlugins> {
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  return {
    write: async (name, text) =>
      (
        await Filesystem.writeFile({
          path: name,
          data: text,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        })
      ).uri,
    share: async (name, uri) => !!(await Share.share({ title: name, files: [uri] })).activityType,
  };
}

/**
 * In the application: writes the file in its cache, then opens Android's share sheet, where
 * the family chooses Drive, Files, an e-mail… The plugin answers once the sheet is gone:
 * « canceled » when the game was not left meanwhile, a success otherwise — even when the
 * family left the game (home, a call, the screen locked) and then closed the sheet without
 * choosing. Only the name of the app chosen, which Android gives when there is one, says that
 * the file went somewhere; it never says whether that app kept it.
 */
export async function shareInApp(
  raw: string,
  name: string,
  native = nativeShare,
  load: () => Promise<SharePlugins> = loadPlugins,
): Promise<Handover> {
  if (!native()) return 'unavailable';
  let plugins: SharePlugins;
  let uri: string;
  try {
    plugins = await load();
    uri = await plugins.write(name, raw);
  } catch {
    return 'failed';
  }
  try {
    return (await plugins.share(name, uri)) ? 'saved' : 'canceled';
  } catch (error) {
    return /cancel/i.test(error instanceof Error ? error.message : String(error))
      ? 'canceled'
      : 'failed';
  }
}

/**
 * The share asked for and not yet answered. The plugin refuses a second one while its sheet
 * is open; a second tap (the same button, or another one) waits for the first instead, and
 * is told the same thing.
 */
export const oneAtATime = (
  run: (raw: string, name: string) => Promise<Handover>,
): ((raw: string, name: string) => Promise<Handover>) => {
  let pending: Promise<Handover> | null = null;
  return (raw, name) => (pending ??= run(raw, name).finally(() => (pending = null)));
};
const shareOnce = oneAtATime((raw, name) => shareInApp(raw, name));

/**
 * Hands a text over as a file to save, and says what became of it. On a website « saved »
 * means the browser took it; a browser does not tell the page where the file went, nor
 * whether the family kept it.
 */
export async function handOver(raw: string, name: string): Promise<Handover> {
  if (APP) return shareOnce(raw, name);
  try {
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = make('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'saved';
  } catch {
    return 'failed';
  }
}
