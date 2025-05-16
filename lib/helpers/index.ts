import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 和 tailwind-merge 组合类名并解决冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将十六进制颜色值转换为HSL格式
 * @param hex 十六进制颜色值，格式为 #RRGGBB
 * @returns HSL格式的颜色字符串，如 "hsl(0, 0%, 0%)"
 */
export function hexToHSL(hex: string): string {
  // 去除#前缀
  hex = hex.replace(/^#/, '');
  
  // 解析RGB值
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // 找出RGB中的最大值和最小值
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // 计算亮度 (lightness)
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    // 计算色相 (hue)
    if (max === r) {
      h = ((g - b) / (max - min)) * 60;
      if (g < b) h += 360;
    } else if (max === g) {
      h = ((b - r) / (max - min)) * 60 + 120;
    } else {
      h = ((r - g) / (max - min)) * 60 + 240;
    }
    
    // 计算饱和度 (saturation)
    s = l > 0.5 
      ? (max - min) / (2 - max - min) 
      : (max - min) / (max + min);
  }
  
  // 四舍五入并格式化HSL字符串
  h = Math.round(h);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `hsl(${h} ${s}% ${lPercent}%)`;
} 

/**
 * 判断颜色是否为浅色
 * 通过计算颜色的亮度值来确定颜色是否为浅色
 * 常用于决定文本在该背景色上应该使用深色还是浅色以确保可读性
 * 
 * @param color - 十六进制颜色值，例如 "#FFFFFF" 或 "FFFFFF"
 * @returns 如果是浅色返回 true，深色返回 false
 */
export function isLightColor(color: string): boolean {
  if (!color) return false;
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // 使用亮度公式: (0.299*R + 0.587*G + 0.114*B)
  // 这个公式考虑了人眼对不同颜色的敏感度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // 亮度阈值为155，高于此值视为浅色
} 