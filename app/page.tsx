"use client"

import Image from "next/image";
import {styled} from "styled-components";
import config from '@/configs/app';
import type { Tile } from '@/types/app';
import { BackgroundWrapper } from "@/components/provider/BackgroundWrapper";
import { useRouter } from "next/navigation";
import Footer from "@/components/app/Footer";

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1rem;
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
  grid-column: span ${props => props.colSpan} / span ${props => props.colSpan};
  grid-row: span ${props => props.rowSpan} / span ${props => props.rowSpan};
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
  color: white;
`;

export default function Home() {
  const router = useRouter();
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
      <TileGrid>
        {tiles.map((tile: Tile, index: number) => (
          <TileItem
            key={index}
            color={tile.color}
            colSpan={tile.colSpan}
            rowSpan={tile.rowSpan}
            onClick={() => router.push(tile.href)}
          >
            <IconWrapper>
              <Image
                src={`/images/projects/${tile.icon}`}
                alt={tile.name}
                fill
                className="object-contain"
              />
            </IconWrapper>
            <TileName>{tile.name}</TileName>
          </TileItem>
        ))}
      </TileGrid>
      <Footer />
    </BackgroundWrapper>
  );
}
