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
  ITEM_NOT_FOUND: '物品不存在',
  LOAD_ROOMS_FAILED: '加载房间失败',
  LOAD_SPOTS_FAILED: '加载位置失败',
  AUTO_SAVE_FAILED: '自动保存失败',
  GENERAL_ERROR: '发生错误，请重试',
} as const

// 表单字段的占位符文本
export const FORM_PLACEHOLDERS = {
  name: '请输入物品名称',
  description: '请输入物品描述（可选）',
  purchase_price: '请输入购买价格',
  purchase_date: '选择购买日期',
  expiry_date: '选择过期日期',
  category: '选择分类',
  status: '选择状态',
} as const

// 表单验证规则
export const FORM_VALIDATION = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  description: {
    maxLength: 1000,
  },
  quantity: {
    min: 1,
    max: 999999,
  },
  purchase_price: {
    min: 0,
    step: 0.01,
  },
} as const

// 表单字段标签
export const FORM_LABELS = {
  name: '名称',
  description: '描述',
  quantity: '数量',
  category_id: '分类',
  status: '状态',
  purchase_date: '购买日期',
  expiry_date: '过期日期',
  purchase_price: '购买价格',
  location: '存放位置',
  is_public: '公开物品',
} as const
