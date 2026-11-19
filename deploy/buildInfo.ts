import type { BuildTarget } from './buildTargets.ts';

export type AndroidRelease = { applicationId: string; versionName: string; versionCode: number };
/** Build provenance only. No player data, credentials, hostname or changing timestamp. */
export function makeBuildInfo(
  target: BuildTarget,
  version: string,
  commit: string | null,
  dirty: boolean,
  android?: AndroidRelease,
) {
  return {
    schema: 1,
    target: target.name,
    version,
    source: { commit, dirty },
    capabilities: {
      publicPages: target.website,
      webSupport: target.website,
      advertising: target.googleAdvertising,
      adPreview: target.adPreview,
      standInAdvertising: target.standInAdvertising,
    },
    ...(target.name === 'android' ? { android } : {}),
  };
}

export function readAndroidRelease(gradle: string): AndroidRelease {
  const applicationId = /applicationId\s+"([^"]+)"/.exec(gradle)?.[1];
  const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1];
  const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1]);
  if (!applicationId || !versionName || !Number.isSafeInteger(versionCode) || versionCode <= 0)
    throw new Error('Android release identity is missing or invalid');
  return { applicationId, versionName, versionCode };
}
