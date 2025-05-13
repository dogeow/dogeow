"use client"

import { useEffect } from "react";
import Image from "next/image";
import {styled} from "styled-components";
import { configs } from '@/app/configs';
import type { Tile } from '@/app/types';
import { useRouter } from "next/navigation";
import Footer from "@/components/app/Footer";

const TileGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem;
`;

const TileRow = styled.div`
  display: flex;
  width: 100%;
  gap: 1rem;
`;

const TileItem = styled.div<{ color: string; colSpan: number; rowSpan: number }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${props => props.color};
  flex: ${props => props.colSpan};
  height: ${props => 8 * props.rowSpan}rem;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(0.95);
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 2.5rem;
  height: 2.5rem;
`;

const TileName = styled.span`
  font-size: 1.2rem;
  color: white;
`;

export default function Home() {
  const router = useRouter();
  const tiles = configs.tiles as Tile[];

  useEffect(() => {
    // https://patorjk.com/software/taag
    // Font Name: Calvin S
    console.log(
      `%c
      ╔╦╗┌─┐┌─┐┌─┐╔═╗╦ ╦
       ║║│ ││ ┬├┤ ║ ║║║║
      ═╩╝└─┘└─┘└─┘╚═╝╚╩╝
  `,
      "color: yellow"
    );
  }, []);
  
  // 将磁贴分组为行
  const topRowTiles = tiles.slice(0, 1); // 物品管理
  const middleRowTiles = [tiles[1]]; // 实验室
  const rightColumnTiles = tiles.slice(2, 4); // 文件和Minecraft
  const bottomRowTiles = tiles.slice(4); // 导航、笔记和游戏
  
  return (
    <>
      <TileGrid>
        <TileRow>
          {topRowTiles.map((tile: Tile, index: number) => (
            <TileItem
              key={`top-${index}`}
              color={tile.color}
              colSpan={tile.colSpan}
              rowSpan={tile.rowSpan}
              onClick={() => router.push(tile.href)}
            >
              {tile.icon.length > 0 && (  
                <IconWrapper>
                  <Image
                    src={`/images/projects/${tile.icon}`}
                    alt={tile.name}
                    fill
                    className="object-contain"
                  />
                </IconWrapper>
              )}
              <TileName>{tile.name}</TileName>
            </TileItem>
          ))}
        </TileRow>
        
        <TileRow>
          {middleRowTiles.map((tile: Tile, index: number) => (
            <TileItem
              key={`middle-${index}`}
              color={tile.color}
              colSpan={1}
              rowSpan={2}
              onClick={() => router.push(tile.href)}
              style={{ width: 'calc(33.33% - 0.67rem)' }}
            >
              {tile.icon.length > 0 && (  
                <IconWrapper>
                  <Image
                    src={`/images/projects/${tile.icon}`}
                    alt={tile.name}
                    fill
                    className="object-contain"
                  />
                </IconWrapper>
              )}
              <TileName>{tile.name}</TileName>
            </TileItem>
          ))}
          
          <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(66.67% - 0.33rem)', gap: '1rem' }}>
            {rightColumnTiles.map((tile: Tile, index: number) => (
              <TileItem
                key={`right-${index}`}
                color={tile.color}
                colSpan={2}
                rowSpan={1}
                onClick={() => router.push(tile.href)}
                style={{ width: '100%'}}
              >
                {tile.icon.length > 0 && (  
                  <IconWrapper>
                    <Image
                      src={`/images/projects/${tile.icon}`}
                      alt={tile.name}
                      fill
                      className="object-contain"
                    />
                  </IconWrapper>
                )}
                <TileName>{tile.name}</TileName>
              </TileItem>
            ))}
          </div>
        </TileRow>
        
        <TileRow>
          {bottomRowTiles.map((tile: Tile, index: number) => (
            <TileItem
              key={`bottom-${index}`}
              color={tile.color}
              colSpan={1}
              rowSpan={1}
              onClick={() => router.push(tile.href)}
              style={{ width: 'calc(33.33% - 0.67rem)' }}
            >
              {tile.icon.length > 0 && (  
                <IconWrapper>
                  <Image
                    src={`/images/projects/${tile.icon}`}
                    alt={tile.name}
                    fill
                    className="object-contain"
                  />
                </IconWrapper>
              )}
              <TileName>{tile.name}</TileName>
            </TileItem>
          ))}
        </TileRow>
      </TileGrid>
      <Footer />
    </>
  );
}
