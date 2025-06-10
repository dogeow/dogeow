// 应用启动器配置
export const configs = {
  tiles: [
    { name: "物品管理", icon: "", href: "/thing", color: "#2196F3", size: "large", colSpan: 3, rowSpan: 1 },
    { name: "实验室", icon: "", href: "/lab", color: "#388e3c", size: "medium", colSpan: 1, rowSpan: 2 },
    { name: "文件", icon: "", href: "/file", color: "#FF5722", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "工具", icon: "", href: "/tool", color: "#8B5A2B", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "导航", icon: "", href: "/nav", color: "#FFA000", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "笔记", icon: "", href: "/note", color: "#1976D2", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "游戏", icon: "", href: "/game", color: "#424242", size: "small", colSpan: 1, rowSpan: 1 },
  ],
  // 可用的音频文件列表
  availableTracks: [
    { name: 'I WiSH - 明日への扉~5 years brew version~', path: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3' },
    { name: '和楽器バンド - 東風破.mp3', path: '/musics/和楽器バンド - 東風破.mp3' },
  ],

  // 系统提供的背景图列表
  systemBackgrounds: [
    { id: "none", name: "无背景", url: "" },
    { id: "bg1", name: "你的名字？·untitled", url: "wallhaven-72rd8e_2560x1440-1.webp" },
    { id: "bg3", name: "2·untitled", url: "F_RIhiObMAA-c8N.jpeg" },
  ],
  
  // 预设的主题色彩配置
  themeColors: [
    {
      id: "overwatch",
      name: "守望先锋",
      primary: "hsl(35 97% 55%)",
      color: "#fc9d1c"
    },
    {
      id: "minecraft",
      name: "我的世界",
      primary: "hsl(101 50% 43%)",
      color: "#5d9c32"
    },
     {
      id: "zelda",
      name: "塞尔达传说",
      primary: "hsl(41 38% 56%)",
      color: "#b99f65"
    }
  ],

  // 功能封面图映射
  projectCovers: {
    "/thing": "thing.png",
    "/lab": "lab.png", 
    "/file": "file.png",
    "/tool": "tool.png",
    "/nav": "nav.png",
    "/note": "note.png",
    "/game": "game.png"
  }
};