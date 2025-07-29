/**
 * Translation data for multi-language support
 * Supports: Chinese Simplified, Chinese Traditional, English, Japanese
 */

export interface Translations {
  [languageCode: string]: {
    [key: string]: string
  }
}

export const translations: Translations = {
  'zh-CN': {
    // App
    'app.title': 'Doge先锋',

    // Navigation
    'nav.thing': '物品管理',
    'nav.lab': '实验室',
    'nav.file': '文件',
    'nav.tool': '工具',
    'nav.nav': '导航',
    'nav.note': '笔记',
    'nav.game': '游戏',
    'nav.chat': '聊天',
    'nav.about': '关于',

    // Settings
    'settings.language': '语言设置',
    'settings.theme': '主题设置',
    'settings.background': '背景设置',
    'settings.audio': '音频设置',
    'settings.title': '设置',

    // Common UI
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.add': '添加',
    'common.search': '搜索',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.confirm': '确认',

    // Language selector
    'language.selector.title': '选择语言',
    'language.current': '当前语言',
    'settings.current_language': '当前语言',

    // Games
    'game.sliding-puzzle': '滑块拼图',
    'game.sliding-puzzle.desc': '经典的数字滑块拼图游戏，通过移动数字方块来排列顺序',
    'game.picture-puzzle': '图片拼图',
    'game.picture-puzzle.desc': '将打乱的图片碎片重新拼接成完整图片',
    'game.jigsaw-puzzle': '传统拼图',
    'game.jigsaw-puzzle.desc': '传统的拼图游戏，考验你的观察力和耐心',
    'game.shooting-range': '射击训练场',
    'game.shooting-range.desc': '射击训练游戏，提高你的瞄准技巧',
    'game.maze': '迷宫',
    'game.maze.desc': '陀螺仪控制的物理迷宫游戏，倾斜设备控制小球到达终点',
    'game.bowling': '保龄球',
    'game.bowling.desc': '陀螺仪控制的保龄球游戏，倾斜设备瞄准并投球',
    'game.tetris': '俄罗斯方块',
    'game.tetris.desc': '经典的俄罗斯方块游戏，消除方块获得高分',
    'game.2048': '2048',
    'game.2048.desc': '数字合并游戏，通过滑动合并相同数字达到2048',
    'game.snake': '贪吃蛇',
    'game.snake.desc': '经典的贪吃蛇游戏，控制蛇吃食物并避免撞到自己',
    'game.minesweeper': '扫雷',
    'game.minesweeper.desc': '经典的扫雷游戏，通过数字提示找出所有地雷',
    'game.tic-tac-toe': '井字棋',
    'game.tic-tac-toe.desc': '简单的井字棋游戏，三子连线即可获胜',

    // Module descriptions
    'module.nav.name': '导航管理',
    'module.nav.desc': '管理和组织你的网站导航链接',
    'module.note.name': 'Markdown笔记',
    'module.note.desc': '支持Markdown格式的在线笔记编辑器',
    'module.file.name': '文件管理',
    'module.file.desc': '在线文件存储和管理系统',
    'module.lab.name': '实验室工具',
    'module.lab.desc': '各种实用的在线工具和实验功能',

    // Theme colors
    'theme.overwatch': '守望先锋',
    'theme.minecraft': '我的世界',
    'theme.zelda': '塞尔达传说',

    // Backgrounds
    'background.none': '无背景',
    'background.bg1': '你的名字？·untitled',
    'background.bg3': '2·untitled',

    // App Grid buttons
    'appgrid.music': '打开音乐',
    'appgrid.theme': '切换主题',
    'appgrid.settings': '打开设置',

    // Auth
    'auth.login': '登录',

    // Settings options
    'settings.project_covers': '功能封面图',
    'settings.follow_system': '跟随系统',

    // Search
    'search.placeholder': '搜索...',
    'search.searching': '搜索中...',
    'search.no_results': '未找到相关结果',
    'search.login_for_more': '登录后可搜索更多内容',
    'search.enter_keywords': '请输入搜索关键词',
    'search.scope': '搜索范围:',
    'search.all': '全部',
    'search.clear_content': '清除搜索内容',
    'search.global': '全站搜索',
    'search.in': '搜索',

    // Navigation/UI
    'ui.back': '返回',
    'ui.close': '关闭',
    'ui.open': '打开',
    'ui.toggle': '切换',

    // Delete confirmation
    'delete.confirm_title': '确定要删除吗？',
    'delete.confirm_description': '此操作将永久删除"{itemName}"。此操作无法撤销。',
    'delete.confirm_action': '删除',

    // Status indicators
    'status.public': '公开',
    'status.private': '私有',

    // Categories
    'category.thing': '物品',
    'category.lab': '实验室',
    'category.note': '笔记',
    'category.file': '文件',
    'category.game': '游戏',
    'category.tool': '工具',
    'category.nav': '导航',
    'category.all': '全部',

    // Navigation items
    'nav.all_things': '所有物品',
    'nav.categories': '分类',
    'nav.locations': '位置',
    'nav.tags': '标签',
    'nav.my_notes': '我的笔记',
    'nav.manage_categories': '管理分类',
    'nav.add_nav': '添加导航',

    // Page titles
    'page.navigation': '导航',
    'page.laboratory': '实验室',
    'page.chat_settings': '聊天设置',
    'page.chat_help': '聊天帮助',
    'page.room_info': '房间信息',
    'page.notifications': '通知设置',

    // Chat UI
    'chat.go_back': '返回',
    'chat.rooms': '房间',
    'chat.browser_notifications': '浏览器通知',
    'chat.sound_notifications': '声音通知',
    'chat.mention_notifications': '提及通知',
    'chat.more_settings': '更多设置',
    'chat.help': '帮助',
    'chat.online_users': '在线用户',
    'chat.room_settings': '房间设置',

    // Error messages
    'error.network': '网络连接错误',
    'error.server': '服务器错误',
    'error.unauthorized': '未授权访问',
    'error.not_found': '页面未找到',
    'error.validation': '输入验证失败',
    'error.unknown': '未知错误',

    // Success messages
    'success.saved': '保存成功',
    'success.deleted': '删除成功',
    'success.updated': '更新成功',
    'success.created': '创建成功',

    // Confirmation messages
    'confirm.leave_without_save': '确认离开',
    'confirm.leave_description': '您有未保存的内容，请选择如何处理：',
    'confirm.save_draft': '保存为草稿',
    'confirm.save': '保存',
    'confirm.discard': '放弃保存',

    // Form labels
    'form.name': '名称',
    'form.description': '描述',
    'form.category': '分类',
    'form.tags': '标签',
    'form.location': '位置',
    'form.status': '状态',
    'form.visibility': '可见性',

    // Actions
    'action.add': '添加',
    'action.edit': '编辑',
    'action.delete': '删除',
    'action.save': '保存',
    'action.cancel': '取消',
    'action.back': '返回',
    'action.close': '关闭',
    'action.open': '打开',
    'action.search': '搜索',
    'action.filter': '筛选',
    'action.sort': '排序',
    'action.refresh': '刷新',
    'action.export': '导出',
    'action.import': '导入',

    // Status and indicators
    'status.online': '在线',
    'status.offline': '离线',
    'status.away': '离开',
    'status.busy': '忙碌',
    'status.connecting': '连接中...',
    'status.connected': '已连接',
    'status.disconnected': '已断开',

    // Time and date
    'time.now': '刚刚',
    'time.minutes_ago': '{count}分钟前',
    'time.hours_ago': '{count}小时前',
    'time.days_ago': '{count}天前',
    'time.weeks_ago': '{count}周前',
    'time.months_ago': '{count}个月前',
    'time.years_ago': '{count}年前',

    // Notifications
    'notification.new_message': '新消息',
    'notification.mention': '有人提到了你',
    'notification.system': '系统通知',
    'notification.warning': '警告',
    'notification.info': '信息',

    // Tooltips
    'tooltip.add_item': '添加新项目',
    'tooltip.edit_item': '编辑此项目',
    'tooltip.delete_item': '删除此项目',
    'tooltip.search_items': '搜索项目',
    'tooltip.filter_items': '筛选项目',
    'tooltip.sort_items': '排序项目',
    'tooltip.refresh_list': '刷新列表',
    'tooltip.export_data': '导出数据',
    'tooltip.import_data': '导入数据',
  },

  'zh-TW': {
    // App
    'app.title': 'Doge先鋒',

    // Navigation
    'nav.thing': '物品管理',
    'nav.lab': '實驗室',
    'nav.file': '檔案',
    'nav.tool': '工具',
    'nav.nav': '導航',
    'nav.note': '筆記',
    'nav.game': '遊戲',
    'nav.chat': '聊天',
    'nav.about': '關於',

    // Settings
    'settings.language': '語言設定',
    'settings.theme': '主題設定',
    'settings.background': '背景設定',
    'settings.audio': '音頻設定',
    'settings.title': '設定',

    // Common UI
    'common.save': '儲存',
    'common.cancel': '取消',
    'common.delete': '刪除',
    'common.edit': '編輯',
    'common.add': '新增',
    'common.search': '搜尋',
    'common.loading': '載入中...',
    'common.error': '錯誤',
    'common.success': '成功',
    'common.confirm': '確認',

    // Language selector
    'language.selector.title': '選擇語言',
    'language.current': '目前語言',
    'settings.current_language': '目前語言',

    // Games
    'game.sliding-puzzle': '滑塊拼圖',
    'game.sliding-puzzle.desc': '經典的數字滑塊拼圖遊戲，通過移動數字方塊來排列順序',
    'game.picture-puzzle': '圖片拼圖',
    'game.picture-puzzle.desc': '將打亂的圖片碎片重新拼接成完整圖片',
    'game.jigsaw-puzzle': '傳統拼圖',
    'game.jigsaw-puzzle.desc': '傳統的拼圖遊戲，考驗你的觀察力和耐心',
    'game.shooting-range': '射擊訓練場',
    'game.shooting-range.desc': '射擊訓練遊戲，提高你的瞄準技巧',
    'game.maze': '迷宮',
    'game.maze.desc': '陀螺儀控制的物理迷宮遊戲，傾斜設備控制小球到達終點',
    'game.bowling': '保齡球',
    'game.bowling.desc': '陀螺儀控制的保齡球遊戲，傾斜設備瞄準並投球',
    'game.tetris': '俄羅斯方塊',
    'game.tetris.desc': '經典的俄羅斯方塊遊戲，消除方塊獲得高分',
    'game.2048': '2048',
    'game.2048.desc': '數字合併遊戲，通過滑動合併相同數字達到2048',
    'game.snake': '貪吃蛇',
    'game.snake.desc': '經典的貪吃蛇遊戲，控制蛇吃食物並避免撞到自己',
    'game.minesweeper': '掃雷',
    'game.minesweeper.desc': '經典的掃雷遊戲，通過數字提示找出所有地雷',
    'game.tic-tac-toe': '井字棋',
    'game.tic-tac-toe.desc': '簡單的井字棋遊戲，三子連線即可獲勝',

    // Module descriptions
    'module.nav.name': '導航管理',
    'module.nav.desc': '管理和組織你的網站導航連結',
    'module.note.name': 'Markdown筆記',
    'module.note.desc': '支援Markdown格式的線上筆記編輯器',
    'module.file.name': '檔案管理',
    'module.file.desc': '線上檔案儲存和管理系統',
    'module.lab.name': '實驗室工具',
    'module.lab.desc': '各種實用的線上工具和實驗功能',

    // Theme colors
    'theme.overwatch': '鬥陣特攻',
    'theme.minecraft': '當個創世神',
    'theme.zelda': '薩爾達傳說',

    // Backgrounds
    'background.none': '無背景',
    'background.bg1': '你的名字？·untitled',
    'background.bg3': '2·untitled',

    // App Grid buttons
    'appgrid.music': '開啟音樂',
    'appgrid.theme': '切換主題',
    'appgrid.settings': '開啟設定',

    // Auth
    'auth.login': '登入',

    // Settings options
    'settings.project_covers': '功能封面圖',
    'settings.follow_system': '跟隨系統',

    // Search
    'search.placeholder': '搜尋...',
    'search.searching': '搜尋中...',
    'search.no_results': '未找到相關結果',
    'search.login_for_more': '登入後可搜尋更多內容',
    'search.enter_keywords': '請輸入搜尋關鍵詞',
    'search.scope': '搜尋範圍:',
    'search.all': '全部',
    'search.clear_content': '清除搜尋內容',
    'search.global': '全站搜尋',
    'search.in': '搜尋',

    // Navigation/UI
    'ui.back': '返回',
    'ui.close': '關閉',
    'ui.open': '開啟',
    'ui.toggle': '切換',

    // Delete confirmation
    'delete.confirm_title': '確定要刪除嗎？',
    'delete.confirm_description': '此操作將永久刪除"{itemName}"。此操作無法撤銷。',
    'delete.confirm_action': '刪除',

    // Status indicators
    'status.public': '公開',
    'status.private': '私有',

    // Categories
    'category.thing': '物品',
    'category.lab': '實驗室',
    'category.note': '筆記',
    'category.file': '檔案',
    'category.game': '遊戲',
    'category.tool': '工具',
    'category.nav': '導航',
    'category.all': '全部',

    // Navigation items
    'nav.all_things': '所有物品',
    'nav.categories': '分類',
    'nav.locations': '位置',
    'nav.tags': '標籤',
    'nav.my_notes': '我的筆記',
    'nav.manage_categories': '管理分類',
    'nav.add_nav': '新增導航',

    // Page titles
    'page.navigation': '導航',
    'page.laboratory': '實驗室',
    'page.chat_settings': '聊天設定',
    'page.chat_help': '聊天幫助',
    'page.room_info': '房間資訊',
    'page.notifications': '通知設定',

    // Chat UI
    'chat.go_back': '返回',
    'chat.rooms': '房間',
    'chat.browser_notifications': '瀏覽器通知',
    'chat.sound_notifications': '聲音通知',
    'chat.mention_notifications': '提及通知',
    'chat.more_settings': '更多設定',
    'chat.help': '幫助',
    'chat.online_users': '線上用戶',
    'chat.room_settings': '房間設定',

    // Error messages
    'error.network': '網路連線錯誤',
    'error.server': '伺服器錯誤',
    'error.unauthorized': '未授權存取',
    'error.not_found': '頁面未找到',
    'error.validation': '輸入驗證失敗',
    'error.unknown': '未知錯誤',

    // Success messages
    'success.saved': '儲存成功',
    'success.deleted': '刪除成功',
    'success.updated': '更新成功',
    'success.created': '建立成功',

    // Confirmation messages
    'confirm.leave_without_save': '確認離開',
    'confirm.leave_description': '您有未儲存的內容，請選擇如何處理：',
    'confirm.save_draft': '儲存為草稿',
    'confirm.save': '儲存',
    'confirm.discard': '放棄儲存',

    // Form labels
    'form.name': '名稱',
    'form.description': '描述',
    'form.category': '分類',
    'form.tags': '標籤',
    'form.location': '位置',
    'form.status': '狀態',
    'form.visibility': '可見性',

    // Actions
    'action.add': '新增',
    'action.edit': '編輯',
    'action.delete': '刪除',
    'action.save': '儲存',
    'action.cancel': '取消',
    'action.back': '返回',
    'action.close': '關閉',
    'action.open': '開啟',
    'action.search': '搜尋',
    'action.filter': '篩選',
    'action.sort': '排序',
    'action.refresh': '重新整理',
    'action.export': '匯出',
    'action.import': '匯入',

    // Status and indicators
    'status.online': '線上',
    'status.offline': '離線',
    'status.away': '離開',
    'status.busy': '忙碌',
    'status.connecting': '連線中...',
    'status.connected': '已連線',
    'status.disconnected': '已斷線',

    // Time and date
    'time.now': '剛剛',
    'time.minutes_ago': '{count}分鐘前',
    'time.hours_ago': '{count}小時前',
    'time.days_ago': '{count}天前',
    'time.weeks_ago': '{count}週前',
    'time.months_ago': '{count}個月前',
    'time.years_ago': '{count}年前',

    // Notifications
    'notification.new_message': '新訊息',
    'notification.mention': '有人提到了你',
    'notification.system': '系統通知',
    'notification.warning': '警告',
    'notification.info': '資訊',

    // Tooltips
    'tooltip.add_item': '新增新項目',
    'tooltip.edit_item': '編輯此項目',
    'tooltip.delete_item': '刪除此項目',
    'tooltip.search_items': '搜尋項目',
    'tooltip.filter_items': '篩選項目',
    'tooltip.sort_items': '排序項目',
    'tooltip.refresh_list': '重新整理列表',
    'tooltip.export_data': '匯出資料',
    'tooltip.import_data': '匯入資料',
  },

  en: {
    // App
    'app.title': 'DogeOw',

    // Navigation
    'nav.thing': 'Things',
    'nav.lab': 'Lab',
    'nav.file': 'Files',
    'nav.tool': 'Tools',
    'nav.nav': 'Navigation',
    'nav.note': 'Notes',
    'nav.game': 'Games',
    'nav.chat': 'Chat',
    'nav.about': 'About',

    // Settings
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.background': 'Background',
    'settings.audio': 'Audio',
    'settings.title': 'Settings',

    // Common UI
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',

    // Language selector
    'language.selector.title': 'Select Language',
    'language.current': 'Current Language',
    'settings.current_language': 'Current Language',

    // Games
    'game.sliding-puzzle': 'Sliding Puzzle',
    'game.sliding-puzzle.desc':
      'Classic number sliding puzzle game, arrange numbers by moving blocks',
    'game.picture-puzzle': 'Picture Puzzle',
    'game.picture-puzzle.desc': 'Reassemble scattered picture pieces into a complete image',
    'game.jigsaw-puzzle': 'Jigsaw Puzzle',
    'game.jigsaw-puzzle.desc':
      'Traditional jigsaw puzzle game that tests your observation and patience',
    'game.shooting-range': 'Shooting Range',
    'game.shooting-range.desc': 'Shooting training game to improve your aiming skills',
    'game.maze': 'Maze',
    'game.maze.desc':
      'Gyroscope-controlled physics maze game, tilt device to control ball to destination',
    'game.bowling': 'Bowling',
    'game.bowling.desc': 'Gyroscope-controlled bowling game, tilt device to aim and throw',
    'game.tetris': 'Tetris',
    'game.tetris.desc': 'Classic Tetris game, eliminate blocks to get high scores',
    'game.2048': '2048',
    'game.2048.desc': 'Number merging game, slide to merge same numbers to reach 2048',
    'game.snake': 'Snake',
    'game.snake.desc': 'Classic snake game, control snake to eat food and avoid hitting yourself',
    'game.minesweeper': 'Minesweeper',
    'game.minesweeper.desc': 'Classic minesweeper game, find all mines using number clues',
    'game.tic-tac-toe': 'Tic Tac Toe',
    'game.tic-tac-toe.desc': 'Simple tic-tac-toe game, get three in a row to win',

    // Module descriptions
    'module.nav.name': 'Navigation Manager',
    'module.nav.desc': 'Manage and organize your website navigation links',
    'module.note.name': 'Markdown Notes',
    'module.note.desc': 'Online note editor with Markdown format support',
    'module.file.name': 'File Manager',
    'module.file.desc': 'Online file storage and management system',
    'module.lab.name': 'Lab Tools',
    'module.lab.desc': 'Various useful online tools and experimental features',

    // Theme colors
    'theme.overwatch': 'Overwatch',
    'theme.minecraft': 'Minecraft',
    'theme.zelda': 'The Legend of Zelda',

    // Backgrounds
    'background.none': 'No Background',
    'background.bg1': 'Your Name? · untitled',
    'background.bg3': '2 · untitled',

    // App Grid buttons
    'appgrid.music': 'Open Music',
    'appgrid.theme': 'Toggle Theme',
    'appgrid.settings': 'Open Settings',

    // Auth
    'auth.login': 'Login',

    // Settings options
    'settings.project_covers': 'Project Covers',
    'settings.follow_system': 'Follow System',

    // Search
    'search.placeholder': 'Search...',
    'search.searching': 'Searching...',
    'search.no_results': 'No results found',
    'search.login_for_more': 'Login to search more content',
    'search.enter_keywords': 'Please enter search keywords',
    'search.scope': 'Search scope:',
    'search.all': 'All',
    'search.clear_content': 'Clear search content',
    'search.global': 'Global search',
    'search.in': 'Search',

    // Navigation/UI
    'ui.back': 'Back',
    'ui.close': 'Close',
    'ui.open': 'Open',
    'ui.toggle': 'Toggle',

    // Delete confirmation
    'delete.confirm_title': 'Are you sure you want to delete?',
    'delete.confirm_description':
      'This action will permanently delete "{itemName}". This action cannot be undone.',
    'delete.confirm_action': 'Delete',

    // Status indicators
    'status.public': 'Public',
    'status.private': 'Private',

    // Categories
    'category.thing': 'Things',
    'category.lab': 'Lab',
    'category.note': 'Notes',
    'category.file': 'Files',
    'category.game': 'Games',
    'category.tool': 'Tools',
    'category.nav': 'Navigation',
    'category.all': 'All',

    // Navigation items
    'nav.all_things': 'All Things',
    'nav.categories': 'Categories',
    'nav.locations': 'Locations',
    'nav.tags': 'Tags',
    'nav.my_notes': 'My Notes',
    'nav.manage_categories': 'Manage Categories',
    'nav.add_nav': 'Add Navigation',

    // Page titles
    'page.navigation': 'Navigation',
    'page.laboratory': 'Laboratory',
    'page.chat_settings': 'Chat Settings',
    'page.chat_help': 'Chat Help',
    'page.room_info': 'Room Info',
    'page.notifications': 'Notifications',

    // Chat UI
    'chat.go_back': 'Go Back',
    'chat.rooms': 'Rooms',
    'chat.browser_notifications': 'Browser Notifications',
    'chat.sound_notifications': 'Sound Notifications',
    'chat.mention_notifications': 'Mention Notifications',
    'chat.more_settings': 'More Settings',
    'chat.help': 'Help',
    'chat.online_users': 'Online Users',
    'chat.room_settings': 'Room Settings',

    // Error messages
    'error.network': 'Network Connection Error',
    'error.server': 'Server Error',
    'error.unauthorized': 'Unauthorized Access',
    'error.not_found': 'Page Not Found',
    'error.validation': 'Input Validation Failed',
    'error.unknown': 'Unknown Error',

    // Success messages
    'success.saved': 'Saved Successfully',
    'success.deleted': 'Deleted Successfully',
    'success.updated': 'Updated Successfully',
    'success.created': 'Created Successfully',

    // Confirmation messages
    'confirm.leave_without_save': 'Confirm Leave',
    'confirm.leave_description': 'You have unsaved content, please choose how to handle it:',
    'confirm.save_draft': 'Save as Draft',
    'confirm.save': 'Save',
    'confirm.discard': 'Discard',

    // Form labels
    'form.name': 'Name',
    'form.description': 'Description',
    'form.category': 'Category',
    'form.tags': 'Tags',
    'form.location': 'Location',
    'form.status': 'Status',
    'form.visibility': 'Visibility',

    // Actions
    'action.add': 'Add',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.back': 'Back',
    'action.close': 'Close',
    'action.open': 'Open',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.sort': 'Sort',
    'action.refresh': 'Refresh',
    'action.export': 'Export',
    'action.import': 'Import',

    // Status and indicators
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.away': 'Away',
    'status.busy': 'Busy',
    'status.connecting': 'Connecting...',
    'status.connected': 'Connected',
    'status.disconnected': 'Disconnected',

    // Time and date
    'time.now': 'Just now',
    'time.minutes_ago': '{count} minutes ago',
    'time.hours_ago': '{count} hours ago',
    'time.days_ago': '{count} days ago',
    'time.weeks_ago': '{count} weeks ago',
    'time.months_ago': '{count} months ago',
    'time.years_ago': '{count} years ago',

    // Notifications
    'notification.new_message': 'New Message',
    'notification.mention': 'Someone mentioned you',
    'notification.system': 'System Notification',
    'notification.warning': 'Warning',
    'notification.info': 'Information',

    // Tooltips
    'tooltip.add_item': 'Add new item',
    'tooltip.edit_item': 'Edit this item',
    'tooltip.delete_item': 'Delete this item',
    'tooltip.search_items': 'Search items',
    'tooltip.filter_items': 'Filter items',
    'tooltip.sort_items': 'Sort items',
    'tooltip.refresh_list': 'Refresh list',
    'tooltip.export_data': 'Export data',
    'tooltip.import_data': 'Import data',
  },

  ja: {
    // App
    'app.title': 'DogeOw',

    // Navigation
    'nav.thing': 'アイテム',
    'nav.lab': 'ラボ',
    'nav.file': 'ファイル',
    'nav.tool': 'ツール',
    'nav.nav': 'ナビ',
    'nav.note': 'ノート',
    'nav.game': 'ゲーム',
    'nav.chat': 'チャット',
    'nav.about': 'について',

    // Settings
    'settings.language': '言語',
    'settings.theme': 'テーマ',
    'settings.background': '背景',
    'settings.audio': 'オーディオ',
    'settings.title': '設定',

    // Common UI
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.add': '追加',
    'common.search': '検索',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.confirm': '確認',

    // Language selector
    'language.selector.title': '言語を選択',
    'language.current': '現在の言語',
    'settings.current_language': '現在の言語',

    // Games
    'game.sliding-puzzle': 'スライディングパズル',
    'game.sliding-puzzle.desc':
      'クラシックな数字スライディングパズルゲーム、ブロックを動かして数字を並べる',
    'game.picture-puzzle': '絵合わせパズル',
    'game.picture-puzzle.desc': 'バラバラになった絵のピースを組み合わせて完全な画像にする',
    'game.jigsaw-puzzle': 'ジグソーパズル',
    'game.jigsaw-puzzle.desc': '伝統的なジグソーパズルゲーム、観察力と忍耐力を試す',
    'game.shooting-range': 'シューティングレンジ',
    'game.shooting-range.desc': 'シューティング練習ゲーム、狙撃スキルを向上させる',
    'game.maze': '迷路',
    'game.maze.desc': 'ジャイロスコープ制御の物理迷路ゲーム、デバイスを傾けてボールを目的地に導く',
    'game.bowling': 'ボウリング',
    'game.bowling.desc': 'ジャイロスコープ制御のボウリングゲーム、デバイスを傾けて狙いを定めて投球',
    'game.tetris': 'テトリス',
    'game.tetris.desc': 'クラシックなテトリスゲーム、ブロックを消してハイスコアを獲得',
    'game.2048': '2048',
    'game.2048.desc': '数字合成ゲーム、スライドして同じ数字を合成して2048を目指す',
    'game.snake': 'スネーク',
    'game.snake.desc':
      'クラシックなスネークゲーム、蛇を操作して食べ物を食べ、自分にぶつからないようにする',
    'game.minesweeper': 'マインスイーパー',
    'game.minesweeper.desc':
      'クラシックなマインスイーパーゲーム、数字のヒントを使ってすべての地雷を見つける',
    'game.tic-tac-toe': '三目並べ',
    'game.tic-tac-toe.desc': 'シンプルな三目並べゲーム、三つ並べれば勝利',

    // Module descriptions
    'module.nav.name': 'ナビゲーション管理',
    'module.nav.desc': 'ウェブサイトのナビゲーションリンクを管理・整理',
    'module.note.name': 'Markdownノート',
    'module.note.desc': 'Markdown形式対応のオンラインノートエディター',
    'module.file.name': 'ファイル管理',
    'module.file.desc': 'オンラインファイルストレージと管理システム',
    'module.lab.name': 'ラボツール',
    'module.lab.desc': '様々な便利なオンラインツールと実験機能',

    // Theme colors
    'theme.overwatch': 'オーバーウォッチ',
    'theme.minecraft': 'マインクラフト',
    'theme.zelda': 'ゼルダの伝説',

    // Backgrounds
    'background.none': '背景なし',
    'background.bg1': '君の名は？・untitled',
    'background.bg3': '2・untitled',

    // App Grid buttons
    'appgrid.music': '音楽を開く',
    'appgrid.theme': 'テーマ切替',
    'appgrid.settings': '設定を開く',

    // Auth
    'auth.login': 'ログイン',

    // Settings options
    'settings.project_covers': 'プロジェクトカバー',
    'settings.follow_system': 'システムに従う',

    // Search
    'search.placeholder': '検索...',
    'search.searching': '検索中...',
    'search.no_results': '結果が見つかりません',
    'search.login_for_more': 'ログインしてより多くのコンテンツを検索',
    'search.enter_keywords': '検索キーワードを入力してください',
    'search.scope': '検索範囲:',
    'search.all': 'すべて',
    'search.clear_content': '検索内容をクリア',
    'search.global': 'グローバル検索',
    'search.in': '検索',

    // Navigation/UI
    'ui.back': '戻る',
    'ui.close': '閉じる',
    'ui.open': '開く',
    'ui.toggle': '切り替え',

    // Delete confirmation
    'delete.confirm_title': '削除してもよろしいですか？',
    'delete.confirm_description':
      'この操作により"{itemName}"が完全に削除されます。この操作は元に戻せません。',
    'delete.confirm_action': '削除',

    // Status indicators
    'status.public': '公開',
    'status.private': 'プライベート',

    // Categories
    'category.thing': 'アイテム',
    'category.lab': 'ラボ',
    'category.note': 'ノート',
    'category.file': 'ファイル',
    'category.game': 'ゲーム',
    'category.tool': 'ツール',
    'category.nav': 'ナビ',
    'category.all': 'すべて',

    // Navigation items
    'nav.all_things': 'すべてのアイテム',
    'nav.categories': 'カテゴリ',
    'nav.locations': '場所',
    'nav.tags': 'タグ',
    'nav.my_notes': 'マイノート',
    'nav.manage_categories': 'カテゴリ管理',
    'nav.add_nav': 'ナビ追加',

    // Page titles
    'page.navigation': 'ナビゲーション',
    'page.laboratory': 'ラボラトリー',
    'page.chat_settings': 'チャット設定',
    'page.chat_help': 'チャットヘルプ',
    'page.room_info': 'ルーム情報',
    'page.notifications': '通知設定',

    // Chat UI
    'chat.go_back': '戻る',
    'chat.rooms': 'ルーム',
    'chat.browser_notifications': 'ブラウザ通知',
    'chat.sound_notifications': '音声通知',
    'chat.mention_notifications': 'メンション通知',
    'chat.more_settings': 'その他の設定',
    'chat.help': 'ヘルプ',
    'chat.online_users': 'オンラインユーザー',
    'chat.room_settings': 'ルーム設定',

    // Error messages
    'error.network': 'ネットワーク接続エラー',
    'error.server': 'サーバーエラー',
    'error.unauthorized': '認証エラー',
    'error.not_found': 'ページが見つかりません',
    'error.validation': '入力検証エラー',
    'error.unknown': '不明なエラー',

    // Success messages
    'success.saved': '保存しました',
    'success.deleted': '削除しました',
    'success.updated': '更新しました',
    'success.created': '作成しました',

    // Confirmation messages
    'confirm.leave_without_save': '離脱確認',
    'confirm.leave_description': '未保存のコンテンツがあります。処理方法を選択してください：',
    'confirm.save_draft': '下書きとして保存',
    'confirm.save': '保存',
    'confirm.discard': '破棄',

    // Form labels
    'form.name': '名前',
    'form.description': '説明',
    'form.category': 'カテゴリ',
    'form.tags': 'タグ',
    'form.location': '場所',
    'form.status': 'ステータス',
    'form.visibility': '可視性',

    // Actions
    'action.add': '追加',
    'action.edit': '編集',
    'action.delete': '削除',
    'action.save': '保存',
    'action.cancel': 'キャンセル',
    'action.back': '戻る',
    'action.close': '閉じる',
    'action.open': '開く',
    'action.search': '検索',
    'action.filter': 'フィルター',
    'action.sort': '並び替え',
    'action.refresh': '更新',
    'action.export': 'エクスポート',
    'action.import': 'インポート',

    // Status and indicators
    'status.online': 'オンライン',
    'status.offline': 'オフライン',
    'status.away': '離席中',
    'status.busy': '忙しい',
    'status.connecting': '接続中...',
    'status.connected': '接続済み',
    'status.disconnected': '切断済み',

    // Time and date
    'time.now': '今',
    'time.minutes_ago': '{count}分前',
    'time.hours_ago': '{count}時間前',
    'time.days_ago': '{count}日前',
    'time.weeks_ago': '{count}週間前',
    'time.months_ago': '{count}ヶ月前',
    'time.years_ago': '{count}年前',

    // Notifications
    'notification.new_message': '新しいメッセージ',
    'notification.mention': 'あなたがメンションされました',
    'notification.system': 'システム通知',
    'notification.warning': '警告',
    'notification.info': '情報',

    // Tooltips
    'tooltip.add_item': '新しいアイテムを追加',
    'tooltip.edit_item': 'このアイテムを編集',
    'tooltip.delete_item': 'このアイテムを削除',
    'tooltip.search_items': 'アイテムを検索',
    'tooltip.filter_items': 'アイテムをフィルター',
    'tooltip.sort_items': 'アイテムを並び替え',
    'tooltip.refresh_list': 'リストを更新',
    'tooltip.export_data': 'データをエクスポート',
    'tooltip.import_data': 'データをインポート',
  },
}

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']
