// 应用启动器配置
export const configs = {
  tiles: [
    { name: "物品管理", icon: "/item-management.svg", href: "/thing", color: "#2196F3", size: "large", colSpan: 3, rowSpan: 1 },
    { name: "实验室", icon: "/laboratory.svg", href: "/lab", color: "#388e3c", size: "medium", colSpan: 1, rowSpan: 2 },
    { name: "文件", icon: "/todo.svg", href: "/file", color: "#FF5722", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "工具", icon: "/tool.svg", href: "/tool", color: "#8B5A2B", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "导航", icon: "/navigation.svg", href: "/nav", color: "#FFA000", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "笔记", icon: "/wiki.svg", href: "/note", color: "#1976D2", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "游戏", icon: "/game.svg", href: "/game", color: "#424242", size: "small", colSpan: 1, rowSpan: 1 },
  ],
  // 可用的音频文件列表
  availableTracks: [
    { name: 'Example', path: '/musics/example.mp3' },
    { name: '和楽器バンド - 東風破', path: '/musics/和楽器バンド - 東風破.mp3' },
    { name: 'I WiSH - 明日への扉~5 years brew version~', path: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3' }
  ],

  // 系统提供的背景图列表
  systemBackgrounds: [
    { id: "none", name: "无背景", url: "" },
    { id: "bg1", name: "你的名字？·untitled", url: "wallhaven-72rd8e_2560x1440-1.webp" },
    { id: "bg2", name: "书房·我的世界", url: "我的世界.png" },
    { id: "bg3", name: "2·untitled", url: "F_RIhiObMAA-c8N.jpeg" },
  ],
  
  // 预设的主题色彩配置
  themeColors: [
    {
      id: "default",
      name: "默认蓝",
      primary: "hsl(221.2 83.2% 53.3%)",
      color: "#3b82f6"
    },
    {
      id: "red",
      name: "热情红",
      primary: "hsl(0 84.2% 60.2%)",
      color: "#ef4444"
    },
    {
      id: "green",
      name: "清新绿",
      primary: "hsl(142.1 76.2% 36.3%)",
      color: "#10b981"
    },
    {
      id: "purple",
      name: "梦幻紫",
      primary: "hsl(262.1 83.3% 57.8%)",
      color: "#8b5cf6"
    },
    {
      id: "orange",
      name: "活力橙",
      primary: "hsl(24.6 95% 53.1%)",
      color: "#f97316"
    },
    {
      id: "pink",
      name: "浪漫粉",
      primary: "hsl(330.1 81.2% 60.2%)",
      color: "#ec4899"
    },
    {
      id: "cyan",
      name: "清澈青",
      primary: "hsl(189.5 94.5% 43.1%)",
      color: "#06b6d4"
    },
    {
      id: "yellow",
      name: "明亮黄",
      primary: "hsl(47.9 95.8% 53.1%)",
      color: "#eab308"
    },
    // 我的世界风格
    {
      id: "minecraft",
      name: "草方绿",
      primary: "hsl(101 50% 43%)",
      color: "#5d9c32"
    },
  ]
};