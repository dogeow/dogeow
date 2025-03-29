// 预设的主题色彩配置
export const themeColors = [
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
];

// 自定义主题类型
export type CustomTheme = {
  id: string;
  name: string;
  primary: string;
  color: string;
}; 