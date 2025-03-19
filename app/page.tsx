"use client"

import Image from "next/image";
import config from '@/configs/app';
import type { Tile } from '@/types/app';
import { BackgroundWrapper } from "@/components/provider/BackgroundWrapper";
import { useRouter } from "next/navigation";
import Footer from "@/components/app/Footer";
export default function Home() {
  const router = useRouter()
  const tiles = config.tiles as Tile[];

  // https://patorjk.com/software/taag
  // Font Name: Calvin S
  console.log(
    `%c
    ╔╦╗┌─┐┌─┐┌─┐╔═╗╦ ╦
     ║║│ ││ ┬├┤ ║ ║║║║
    ═╩╝└─┘└─┘└─┘╚═╝╚╩╝
`,
    "color: pink"
  );
  
  return (
    <BackgroundWrapper>
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap gap-4">
          {tiles.map((tile: Tile, index: number) => (
            <div
              key={index}
              className="relative flex flex-col items-start justify-end p-4 rounded-lg transition-transform hover:translate-y-[-5px]"
              style={{ 
                backgroundColor: tile.color,
                width: `calc(${(100 / 3) * tile.colSpan}% - ${tile.colSpan > 1 ? (4 * (tile.colSpan - 1)) : 0}px)`,
                height: `${8 * tile.rowSpan}rem`,
                flexGrow: 0,
                flexShrink: 0
              }}
              onClick={() => router.push(tile.href)}
            >
              <div className="absolute top-3 left-3 w-10 h-10">
                <Image
                  src={`/images/projects/${tile.icon}`}
                  alt={tile.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-light text-lg text-white">{tile.name}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </BackgroundWrapper>
  );
}
