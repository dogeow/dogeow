import { AppConfig } from '@/types/app';

const config: AppConfig = {
  tiles: [
    { name: "物品管理", icon: "/item-management.svg", href: "/thing", color: "#2196F3", size: "large", colSpan: 3, rowSpan: 1 },
    { name: "实验室", icon: "/laboratory.svg", href: "/lab", color: "#388e3c", size: "medium", colSpan: 1, rowSpan: 2 },
    { name: "文件", icon: "/todo.svg", href: "/file", color: "#FF5722", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "Minecraft", icon: "/minecraft.svg", href: "/mc", color: "#8B5A2B", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "导航", icon: "/navigation.svg", href: "/nav", color: "#FFA000", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "笔记", icon: "/wiki.svg", href: "/note", color: "#1976D2", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "游戏", icon: "/game.svg", href: "/game", color: "#424242", size: "small", colSpan: 1, rowSpan: 1 },
  ],
};

export default config; 