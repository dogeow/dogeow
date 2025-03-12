import { AppConfig } from '@/types/app';

const config: AppConfig = {
  tiles: [
    { name: "物品管理", icon: "/item-management.svg", href: "/things", color: "#2196F3", size: "large", colSpan: 3, rowSpan: 2 },
    { name: "实验室", icon: "/laboratory.svg", href: "/lab", color: "#388e3c", size: "medium", colSpan: 1, rowSpan: 2 },
    { name: "待办事项", icon: "/todo.svg", href: "/todo", color: "#FF5722", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "Minecraft", icon: "/minecraft.svg", href: "/mc", color: "#8B5A2B", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "导航", icon: "/navigation.svg", href: "/nav", color: "#FFA000", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "博客", icon: "/blog.svg", href: "/blog", color: "#1976D2", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "游戏", icon: "/game.svg", href: "/game", color: "#424242", size: "small", colSpan: 1, rowSpan: 1 },
  ],
  // 这里可以添加更多配置
  // theme: {
  //   primary: '#1976D2',
  //   secondary: '#424242',
  // },
  // api: {
  //   baseUrl: 'http://api.example.com',
  //   timeout: 5000,
  // }
};

export default config; 