import test from 'node:test';
import assert from 'node:assert/strict';
import { adSenseAdsTxt } from '../deploy/adsenseVerification.ts';

test('ads.txt authorizes only the exact publisher supplied by the parent', () => {
  assert.equal(adSenseAdsTxt(), 'google.com, pub-8498417364292905, DIRECT, f08c47fec0942fa0\n');
});
