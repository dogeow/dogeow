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