/** Distribution choices belong to the build, never to game rules or a runtime URL. */
export function buildTarget(mode: string, adsEnabled: boolean) {
  if (
    !['production', 'development', 'android', 'portable', 'ads-preview', 'ads-test'].includes(mode)
  )
    throw new Error(`Unknown build mode: ${mode}`);
  const name = mode === 'production' || mode === 'development' ? 'web' : mode;
  return {
    name,
    outDir: name === 'web' ? 'dist' : `dist-${name}`,
    website: name !== 'android' && name !== 'portable',
    portable: name === 'portable',
    adPreview: name === 'ads-preview',
    googleAdvertising: mode === 'production' && adsEnabled,
    standInAdvertising: name === 'ads-test',
  };
}
export type BuildTarget = ReturnType<typeof buildTarget>;
