/** Public publisher ID supplied by the owner. Verification only: no ad delivery code. */
export const ADSENSE_PUBLISHER_ID = 'pub-8498417364292905';

export function adSenseVerificationMeta(): string {
  return `<meta name="google-adsense-account" content="ca-${ADSENSE_PUBLISHER_ID}">`;
}

export function adSenseAdsTxt(): string {
  return `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`;
}
