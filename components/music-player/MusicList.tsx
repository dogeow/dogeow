'use client';

import React from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface MusicItem {
  id?: string | number;
  name: string;
  artist?: string;
  path: string; // m3u8 地址或直接音频地址
  duration?: number;
  coverUrl?: string;
}

interface MusicListProps {
  musics: MusicItem[];
  currentMusic?: MusicItem | null;
  isPlaying: boolean;
  onSelect: (music: MusicItem) => void;
  onTogglePlay: () => void;
  className?: string;
}

const MusicList: React.FC<MusicListProps> = ({
  musics,
  currentMusic,
  isPlaying,
  onSelect,
  onTogglePlay,
  className,
}) => {
  if (!musics.length) {
    return (
      <div className={cn("text-center p-4", className)}>
        <p className="text-muted-foreground">没有找到音乐</p>
      </div>
    );
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ScrollArea className={cn("h-[300px] w-full border rounded-md", className)}>
      <div className="p-1">
        {musics.map((music, index) => {
          const isActive = currentMusic?.path === music.path;
          return (
            <div
              key={music.id || index}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md hover:bg-accent group cursor-pointer transition-colors",
                isActive && "bg-accent"
              )}
              onClick={() => onSelect(music)}
            >
              <div className="w-8 h-8 flex items-center justify-center text-center shrink-0">
                {isActive ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlay();
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <Music className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{music.name}</p>
                {music.artist && (
                  <p className="text-xs text-muted-foreground truncate">
                    {music.artist}
                  </p>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground shrink-0">
                {formatTime(music.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default MusicList; 