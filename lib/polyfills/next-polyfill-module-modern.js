// The default Next.js polyfill-module includes several APIs that are already
// available in the browsers this app targets. Keep only URL.canParse, which is
// still missing in part of Next.js' default support matrix (for example
// Chrome 111 and Safari 16.4).
if (typeof URL !== 'undefined' && !('canParse' in URL)) {
  URL.canParse = function canParse(url, base) {
    try {
      new URL(url, base)
      return true
    } catch {
      return false
    }
  }
}
