import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // 使用亮度公式: (0.299*R + 0.587*G + 0.114*B)
  // 这个公式考虑了人眼对不同颜色的敏感度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // 亮度阈值为155，高于此值视为浅色
}
