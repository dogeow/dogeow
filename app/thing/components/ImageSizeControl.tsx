"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ImageDownIcon, ImageUpIcon, Columns2Icon, Columns3Icon, Columns4Icon, GripIcon } from "lucide-react";
import { ensureEven } from "@/lib/helpers/mathUtils"; // Import ensureEven

interface ImageSizeControlProps {
  initialSize: number;
  maxSize: number;
  onSizeChange: (newSize: number) => void;
}

export function ImageSizeControl({
  initialSize,
  maxSize,
  onSizeChange,
}: ImageSizeControlProps) {
  const [imageSize, setImageSize] = useState(initialSize);
  const [currentSizePreset, setCurrentSizePreset] = useState<string | null>(null);

  const getCalculatedSize = useCallback((preset: string, containerWidth: number): number => {
    let columns;
    switch (preset) {
      case "xs": columns = 6; break; // Example: 6 columns for extra small
      case "sm": columns = 4; break; // Example: 4 columns for small
      case "md": columns = 3; break; // Example: 3 columns for medium
      case "lg": columns = 2; break; // Example: 2 columns for large
      case "xl": columns = 1; break; // Example: 1 column for extra large
      default: columns = Math.floor(containerWidth / initialSize) || 1; // Fallback to initialSize based columns
    }
    const gap = 8; // Assuming 0.5rem gap (8px)
    const newSize = ensureEven((containerWidth - (columns - 1) * gap) / columns);
    return Math.max(60, Math.min(newSize, maxSize)); // Ensure min and max bounds
  }, [initialSize, maxSize]);

  useEffect(() => {
    // Initialize with a medium preset or based on initialSize
    const container = document.getElementById("item-gallery-container");
    if (container) {
        const newSize = getCalculatedSize("md", container.offsetWidth);
        setImageSize(newSize);
        onSizeChange(newSize);
        setCurrentSizePreset("md");
    }
  }, [getCalculatedSize, onSizeChange]);


  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("item-gallery-container");
      if (container) {
        // Recalculate based on current preset or a default if none active
        const presetToUse = currentSizePreset || "md";
        const newSize = getCalculatedSize(presetToUse, container.offsetWidth);
        setImageSize(newSize);
        onSizeChange(newSize);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentSizePreset, getCalculatedSize, onSizeChange]);

  const handlePresetClick = (preset: string) => {
    const container = document.getElementById("item-gallery-container");
    if (container) {
      const newSize = getCalculatedSize(preset, container.offsetWidth);
      setImageSize(newSize);
      onSizeChange(newSize);
      setCurrentSizePreset(preset);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const newSize = ensureEven(value[0]);
    setImageSize(newSize);
    onSizeChange(newSize);
    setCurrentSizePreset(null); // Clear preset when slider is used manually
  };

  const sizePresets = [
    { id: "xs", label: "XS", icon: <GripIcon className="h-4 w-4" /> },
    { id: "sm", label: "S", icon: <Columns4Icon className="h-4 w-4" /> },
    { id: "md", label: "M", icon: <Columns3Icon className="h-4 w-4" /> },
    { id: "lg", label: "L", icon: <Columns2Icon className="h-4 w-4" /> },
    // { id: "xl", label: "XL", icon: <ImageIcon className="h-4 w-4" /> }, // Placeholder, adjust icon
  ];

  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-background/80 backdrop-blur-sm sticky top-0 z-10 rounded-md border">
      <div className="flex items-center gap-1">
        {sizePresets.map((preset) => (
          <Button
            key={preset.id}
            variant={currentSizePreset === preset.id ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset.id)}
            title={`Set image size to ${preset.label}`}
            className="h-8 px-2.5"
          >
            {preset.icon}
            <span className="ml-1 hidden sm:inline">{preset.label}</span>
          </Button>
        ))}
      </div>
      <ImageDownIcon className="h-4 w-4 text-muted-foreground" />
      <Slider
        min={60}
        max={maxSize}
        step={2} // Ensure even numbers
        value={[imageSize]}
        onValueChange={handleSliderChange}
        className="w-full max-w-xs"
      />
      <ImageUpIcon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground w-12 text-right">
        {imageSize}px
      </span>
    </div>
  );
}
