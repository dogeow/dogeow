/**
 * 全屏 API 的跨浏览器类型扩展
 */
export type EnhancedElement = HTMLElement & {
  requestFullscreen?: () => Promise<void>
  mozRequestFullScreen?: () => Promise<void>
  webkitRequestFullscreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

export type EnhancedDocument = Document & {
  fullscreenElement?: Element | null
  webkitFullscreenElement?: Element | null
  mozFullScreenElement?: Element | null
  msFullscreenElement?: Element | null
  exitFullscreen?: () => Promise<void>
  mozCancelFullScreen?: () => Promise<void>
  webkitExitFullscreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
}

/**
 * 进入全屏
 * @throws 浏览器不支持全屏时抛出
 */
export function fullscreen(): void {
  const docElm = document.documentElement as EnhancedElement
  const requestFullscreen =
    docElm.requestFullscreen ??
    docElm.webkitRequestFullscreen ??
    docElm.mozRequestFullScreen ??
    docElm.msRequestFullscreen

  if (requestFullscreen) {
    requestFullscreen.call(docElm)
  } else {
    throw new Error('您所使用的浏览器不支持全屏')
  }
}

/**
 * 退出全屏
 * @throws 浏览器不支持退出全屏时抛出
 */
export function exitFullscreen(): void {
  const doc = document as EnhancedDocument
  const exit =
    doc.exitFullscreen ??
    doc.mozCancelFullScreen ??
    doc.webkitExitFullscreen ??
    doc.msExitFullscreen

  if (exit) {
    exit.call(doc)
  } else {
    throw new Error('您所使用的浏览器不支持退出全屏，请按 ESC')
  }
}

/**
 * 当前是否处于全屏状态
 */
export function isFullscreen(): boolean {
  const doc = document as EnhancedDocument
  const el =
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement
  return el != null
}
