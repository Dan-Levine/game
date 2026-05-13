// Lightweight Capacitor detection that won't crash on web bundles where the
// native plugins may be stubbed. Avoids importing @capacitor/core eagerly.

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === 'function' ? cap.isNativePlatform() : false;
}
