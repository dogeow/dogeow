import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";
import Image from "next/image";
import config from '@/configs/app';
import type { Tile } from '@/types/app';

export default function Home() {
  const tiles = config.tiles as Tile[];
  
  return (
    <div className="min-h-screen p-4">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      
      <h1 className="text-4xl font-light mb-8 mt-8 ml-2">我的应用</h1>
      
      <div className="grid grid-cols-3 auto-rows-[8rem] gap-4 max-w-5xl mx-auto">
        {tiles.map((tile: Tile, index: number) => (
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
