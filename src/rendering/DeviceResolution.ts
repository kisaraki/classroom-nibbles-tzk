export function normalizeDevicePixelRatio(devicePixelRatio: number): number {
  return Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? devicePixelRatio
    : 1;
}

export function detectDevicePixelRatio(): number {
  return normalizeDevicePixelRatio(window.devicePixelRatio);
}
