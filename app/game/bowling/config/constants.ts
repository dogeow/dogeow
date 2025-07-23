// 物理引擎配置
export const PHYSICS_CONFIG = {
  GRAVITY: -9.82, // 重力加速度
  BALL_MASS: 15, // 增加球的重量，提高冲击力
  PIN_MASS: 0.1, // 大幅减少球瓶重量，让它们更容易倒下
  BALL_RADIUS: 0.6, // 减少球的半径，让它更小
  PIN_HEIGHT: 1.5, // 球瓶高度
  PIN_RADIUS_TOP: 0.15, // 球瓶顶部半径
  PIN_RADIUS_BOTTOM: 0.2, // 球瓶底部半径
  LANE_WIDTH: 5.0, // 增加球道宽度，给玩家更多操作空间
  LANE_LENGTH: 19.2, // 标准球道长度19.152米
  WALL_HEIGHT: 1.0, // 降低墙壁高度
  WALL_THICKNESS: 0.5, // 墙壁厚度
  GUTTER_WIDTH: 0.25, // 边沟宽度
  THROW_TIMEOUT: 15000, // 增加到15秒，给球更多时间滚到球瓶
  PHYSICS_STEP: 1 / 60, // 物理步长
} as const

// 材质配置
export const MATERIALS_CONFIG = {
  BALL_GROUND: { friction: 0.08, restitution: 0.0 }, // 适当增加摩擦力，防止球滑太远
  BALL_PIN: { friction: 0.6, restitution: 0.1 }, // 大幅减少反弹，防止球往回走
  PIN_GROUND: { friction: 0.4, restitution: 0.05 }, // 减少球瓶反弹，让它们更容易倒下
  PIN_PIN: { friction: 0.4, restitution: 0.2 }, // 减少球瓶间反弹
} as const

// 相机配置
export const CAMERA_CONFIG = {
  FOV: 60, // 调整FOV，获得更自然、更聚焦的视野
  NEAR: 0.1, // 近裁剪面
  FAR: 1000, // 远裁剪面
  INITIAL_POSITION: { x: 0, y: 4, z: 16 }, // 更低的玩家视角，更具沉浸感
  FOLLOW_HEIGHT: 8, // 跟随时相机的高度
  FIXED_VIEW: { x: 0, y: 8, z: -12 }, // 调整固定观看位置
  LERP_SPEED: 0.1, // 线性插值速度
  SLOW_LERP_SPEED: 0.05, // 慢速线性插值速度
} as const

// 球瓶位置配置
export const PIN_POSITIONS = [
  [0, 1.0, -18.3], // 第1号球瓶，距离投球线18.288米（约-18.3）
  [-0.6, 1.0, -19.2],
  [0.6, 1.0, -19.2], // 第二排，增加间距
  [-1.2, 1.0, -20.1],
  [0, 1.0, -20.1],
  [1.2, 1.0, -20.1], // 第三排，增加间距
  [-1.8, 1.0, -21.0],
  [-0.6, 1.0, -21.0],
  [0.6, 1.0, -21.0],
  [1.8, 1.0, -21.0], // 第四排，增加间距
] as const
