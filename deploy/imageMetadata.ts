/** Read-only inspection of store PNG/JPEG headers; does not transform pixels. */
export type ImageMetadata = {
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  channels: number;
  bitDepth: number;
};
export function imageMetadata(bytes: Uint8Array): ImageMetadata | null {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length >= 33 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n) &&
    String.fromCharCode(...bytes.subarray(12, 16)) === 'IHDR'
  ) {
    const width = v.getUint32(16),
      height = v.getUint32(20),
      bitDepth = bytes[24],
      channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[bytes[25]];
    return width && height && channels
      ? { width, height, format: 'png', channels, bitDepth }
      : null;
  }
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return null;
  for (let i = 2; i + 8 < bytes.length;) {
    if (bytes[i] !== 255) return null;
    const marker = bytes[i + 1],
      length = v.getUint16(i + 2);
    if (length < 2 || i + 2 + length > bytes.length) return null;
    if ([192, 193, 194].includes(marker)) {
      if (length < 8 || i + 9 >= bytes.length || length < 8 + 3 * bytes[i + 9]) return null;
      const height = v.getUint16(i + 5),
        width = v.getUint16(i + 7);
      return width && height
        ? { width, height, format: 'jpeg', bitDepth: bytes[i + 4], channels: bytes[i + 9] }
        : null;
    }
    i += length + 2;
  }
  return null;
}
