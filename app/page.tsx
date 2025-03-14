import Link from "next/link";
import Image from "next/image";
import config from '@/configs/app';
import type { Tile } from '@/types/app';
import { BackgroundWrapper } from "@/components/BackgroundWrapper";

export default function Home() {
  const tiles = config.tiles as Tile[];
  
  return (
    <BackgroundWrapper>
      <div className="min-h-screen container mx-auto p-4">
        <div className="grid grid-cols-3 auto-rows-[8rem] gap-4">
          {tiles.map((tile: Tile, index: number) => (
            <Link 
              key={index}
              href={tile.href}
              className="relative flex flex-col items-start justify-end p-4 rounded-lg transition-transform hover:translate-y-[-5px]"
              style={{ 
                backgroundColor: tile.color,
                gridColumn: `span ${tile.colSpan} / span ${tile.colSpan}`,
                gridRow: `span ${tile.rowSpan} / span ${tile.rowSpan}`
              }}
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
    </BackgroundWrapper>
  );
}
