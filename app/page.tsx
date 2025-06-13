"use client"

import { useEffect } from "react";
import Image from "next/image";
import {styled} from "styled-components";
import { configs } from '@/app/configs';
import type { Tile } from '@/app/types';
import { useRouter } from "next/navigation";
import Footer from "@/components/app/Footer";
import { useProjectCoverStore } from '@/stores/projectCoverStore';
import { useLoginTrigger } from '@/hooks/useLoginTrigger';
import { Lock } from 'lucide-react';

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
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, ${props.color}80, ${props.color}40);
      z-index: 2;
    }
  `}
`;

const BackgroundImage = styled(Image)`
  object-fit: cover;
  z-index: 1;
`;

const IconWrapper = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 2.5rem;
  height: 2.5rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TileName = styled.span`
  font-size: 1.2rem;
  color: white;
  z-index: 2;
  position: relative;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
`;

const LockIcon = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  backdrop-filter: blur(4px);
`;

export default function Home() {
  const router = useRouter();
  const tiles = configs.tiles as Tile[];
  const { showProjectCovers } = useProjectCoverStore();
  const { requireLogin, isAuthenticated } = useLoginTrigger();

  // 需要登录的应用路径
  const protectedRoutes = ['/thing', '/nav', '/note', '/dashboard', '/file', '/tool'];

  // 检查是否需要登录
  const isProtectedRoute = (href: string) => {
    return protectedRoutes.some(route => href.startsWith(route));
  };

  // 处理瓦片点击
  const handleTileClick = (tile: Tile) => {
    if (isProtectedRoute(tile.href)) {
      requireLogin(() => {
        router.push(tile.href);
      });
    } else {
      router.push(tile.href);
    }
  };

  // 获取瓦片的样式，为需要登录的瓦片添加视觉标识
  const getTileStyle = (tile: Tile) => {
    const baseStyle = {};
    
    // 如果是受保护的路由且用户未登录，添加视觉标识
    if (isProtectedRoute(tile.href) && !isAuthenticated) {
      return {
        ...baseStyle,
        opacity: 0.7,
        position: 'relative' as const,
      };
    }
    
    return baseStyle;
  };

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
    const isProtected = isProtectedRoute(tile.href);
    const needsLogin = isProtected && !isAuthenticated;
    
    return (
      <TileItem
        key={`${keyPrefix}-${index}`}
        color={tile.color}
        colSpan={tile.colSpan}
        rowSpan={tile.rowSpan}
        onClick={() => handleTileClick(tile)}
        style={{...style, ...getTileStyle(tile)}}
        $hasBackground={hasBackground}
      >
        {hasBackground && (
          <BackgroundImage
            src={`/images/projects/${coverImage}`}
            alt={`${tile.name} background`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index < 4}
          />
        )}
        {tile.icon.length > 0 && (  
          <IconWrapper>
            <Image
              src={`/images/projects/${tile.icon}`}
              alt={tile.name}
              width={40}
              height={40}
              className="object-contain"
              sizes="40px"
              priority={index < 4}
            />
          </IconWrapper>
        )}
        
        {/* 需要登录的标识 */}
        {needsLogin && (
          <>
            <LockIcon>
              <Lock className="h-3 w-3 text-white" />
            </LockIcon>
          </>
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
