import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conqueteserpents.famille',
  appName: 'La Conquête des Serpents',
  webDir: 'dist',
  plugins: {
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover' },
  },
  ...(process.env.SERPENTS_PERF === '1' ? { server: { appStartPath: '/?perf=1' } } : {}),
};

export default config;
