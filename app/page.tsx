"use client"

import { useEffect } from "react";
import Image from "next/image";
import {styled} from "styled-components";
import { configs } from '@/app/configs';
import type { Tile } from '@/app/types';
import { useRouter } from "next/navigation";
import Footer from "@/components/app/Footer";
import { useProjectCoverStore } from '@/stores/projectCoverStore';

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

const TileItem = styled.div<{ color: string; colSpan: number; rowSpan: number; $hasBackground?: boolean }>`
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
  overflow: hidden;
  
  &:hover {
    transform: scale(0.95);
  }

  ${props => props.$hasBackground && `
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, ${props.color}80, ${props.color}40);
      z-index: 1;
    }
  `}
`;

const IconWrapper = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 2.5rem;
  height: 2.5rem;
  z-index: 2;
`;

const TileName = styled.span`
  font-size: 1.2rem;
  color: white;
  z-index: 2;
  position: relative;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
`;

export default function Home() {
  const router = useRouter();
  const tiles = configs.tiles as Tile[];
  const { showProjectCovers } = useProjectCoverStore();

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
  
  // 获取功能封面图
  const getCoverImage = (href: string) => {
    if (!showProjectCovers) return null;
    return configs.projectCovers[href as keyof typeof configs.projectCovers];
  };
  
  // 将磁贴分组为行
  const topRowTiles = tiles.slice(0, 1); // 物品管理
  const middleRowTiles = [tiles[1]]; // 实验室
  const rightColumnTiles = tiles.slice(2, 4); // 文件和工具
  const bottomRowTiles = tiles.slice(4); // 导航、笔记和游戏
  
  const renderTile = (tile: Tile, index: number, keyPrefix: string, style?: React.CSSProperties) => {
    const coverImage = getCoverImage(tile.href);
    const hasBackground = !!coverImage;
    
    return (
      <TileItem
        key={`${keyPrefix}-${index}`}
        color={tile.color}
        colSpan={tile.colSpan}
        rowSpan={tile.rowSpan}
        onClick={() => router.push(tile.href)}
        style={{
          ...style,
          ...(hasBackground && {
            backgroundImage: `url(/images/projects/${coverImage})`
          })
        }}
        $hasBackground={hasBackground}
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
    );
  };
  
  return (
    <>
      <TileGrid>
        <TileRow>
          {topRowTiles.map((tile: Tile, index: number) => 
            renderTile(tile, index, 'top')
          )}
        </TileRow>
        
        <TileRow>
          {middleRowTiles.map((tile: Tile, index: number) => 
            renderTile(tile, index, 'middle', { width: 'calc(33.33% - 0.67rem)' })
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(66.67% - 0.33rem)', gap: '1rem' }}>
            {rightColumnTiles.map((tile: Tile, index: number) => 
              renderTile(tile, index, 'right', { width: '100%' })
            )}
          </div>
        </TileRow>
        
        <TileRow>
          {bottomRowTiles.map((tile: Tile, index: number) => 
            renderTile(tile, index, 'bottom', { width: 'calc(33.33% - 0.67rem)' })
          )}
        </TileRow>
      </TileGrid>
      <Footer />
    </>
  );
}
