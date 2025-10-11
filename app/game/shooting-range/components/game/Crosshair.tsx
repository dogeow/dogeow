/**
 * 准星UI组件
 */
export function Crosshair() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 100 }}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        {/* 中心点 */}
        <div className="absolute h-1 w-1 rounded-full bg-white opacity-80"></div>

        {/* 十字准星 - 减小间隔 */}
        <div className="absolute left-1/2 flex h-[1px] w-6 -translate-x-1/2 justify-between bg-white opacity-80">
          <div className="h-full w-2"></div>
          <div className="h-full w-2"></div>
        </div>
        <div className="absolute top-1/2 flex h-6 w-[1px] -translate-y-1/2 flex-col justify-between bg-white opacity-80">
          <div className="h-2 w-full"></div>
          <div className="h-2 w-full"></div>
        </div>
      </div>
    </div>
  )
}
