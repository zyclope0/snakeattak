import { assertAndroidDistribution } from '../deploy/androidDistribution.ts';
const root = process.argv[2] ?? 'dist-android';
const { info, files } = assertAndroidDistribution(root);
console.log(
  `Android ${info.android.versionName} / ${info.android.versionCode}: ${Object.keys(files).length} files, isolated target ${info.source.commit ?? 'unversioned'}`,
);
