import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  // 定义磁贴数据
  const tiles = [
    { name: "物品管理", icon: "/item-management.svg", href: "/things", color: "#2196F3", size: "large", colSpan: 3, rowSpan: 1 },
    { name: "实验室", icon: "/laboratory.svg", href: "/lab", color: "#388e3c", size: "medium", colSpan: 1, rowSpan: 2 },
    { name: "待办事项", icon: "/todo.svg", href: "/todo", color: "#FF5722", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "Minecraft", icon: "/minecraft.svg", href: "/mc", color: "#8B5A2B", size: "medium", colSpan: 2, rowSpan: 1 },
    { name: "导航", icon: "/navigation.svg", href: "/nav", color: "#FFA000", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "博客", icon: "/blog.svg", href: "/blog", color: "#1976D2", size: "small", colSpan: 1, rowSpan: 1 },
    { name: "游戏", icon: "/game.svg", href: "/game", color: "#424242", size: "small", colSpan: 1, rowSpan: 1 },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      
      <h1 className="text-4xl font-light mb-8 mt-8 ml-2">我的应用</h1>
      
      <div className="grid grid-cols-3 auto-rows-[8rem] gap-4 max-w-5xl mx-auto">
        {tiles.map((tile, index) => (
          <Link 
            key={index}
            href={tile.href}
            className={`
              relative flex flex-col items-start justify-end p-4 rounded-lg transition-transform hover:translate-y-[-5px]
              ${tile.colSpan > 1 ? `col-span-${tile.colSpan}` : ''}
              ${tile.rowSpan > 1 ? `row-span-${tile.rowSpan}` : ''}
            `}
            style={{ backgroundColor: tile.color }}
          >
            <div className="absolute top-3 left-3 w-10 h-10">
              <Image
                src={tile.icon}
                alt={tile.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-light text-lg text-white">{tile.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
