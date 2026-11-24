import type { CapacitorConfig } from '@capacitor/cli';
import { MIN_WEBVIEW_VERSION, OLD_WEBVIEW_PAGE } from './deploy/androidWebView.ts';

const config: CapacitorConfig = {
  appId: 'com.conqueteserpents.famille',
  appName: 'La Conquête des Serpents',
  webDir: 'dist-android',
  // Below this WebView the game's page breaks: Android shows instead a page that says to
  // update it (deploy/androidWebView.ts).
  android: { minWebViewVersion: MIN_WEBVIEW_VERSION },
  plugins: {
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover' },
    // « Retour » stays Android's own until the game says it listens (src/ui/backButton.ts):
    // a game that did not start, or the page of a WebView too old, can still be left.
    App: { disableBackButtonHandler: true },
  },
  server: {
    errorPath: OLD_WEBVIEW_PAGE,
    ...(process.env.SERPENTS_PERF === '1' ? { appStartPath: '/?perf=1' } : {}),
  },
};

export default config;
