// 自动保存相关常量
export const AUTO_SAVE_DELAY = 2000 // 2秒

// 表单初始数据
export const INITIAL_FORM_DATA = {
  name: '',
  description: '',
  quantity: 1,
  status: 'active' as const,
  purchase_date: null,
  expiry_date: null,
  purchase_price: null,
  category_id: '',
  area_id: '',
  room_id: '',
  spot_id: '',
  is_public: false,
}

// 错误消息
export const ERROR_MESSAGES = {
  ITEM_NOT_FOUND: "物品不存在",
  LOAD_ROOMS_FAILED: "加载房间失败",
  LOAD_SPOTS_FAILED: "加载位置失败",
  AUTO_SAVE_FAILED: "自动保存失败",
  GENERAL_ERROR: "发生错误，请重试"
} as const 