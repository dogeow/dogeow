/**
 * 判断颜色是否为浅色
 * @param color 十六进制颜色值，格式为 #RGB 或 #RRGGBB
 * @returns 如果是浅色返回 true，否则返回 false
 */
export const isLightColor = (color: string): boolean => {
  // 移除 # 前缀并验证格式
  let hex = color.replace('#', '');
  
  // 处理短十六进制格式 (#RGB -> #RRGGBB)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // 验证十六进制格式
  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    console.warn(`无效的颜色格式: ${color}，默认为深色`);
    return false;
  }
  
  // 解析 RGB 值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 使用感知亮度公式 (ITU-R BT.709)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  
  // 使用 128 作为中点阈值
  return brightness > 128;
};

/**
 * 生成一个随机的十六进制颜色值
 * @returns 格式为 #RRGGBB 的十六进制颜色值
 */
export function generateRandomColor(): string {
  // 生成随机的 RGB 值 (0-255)
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  
  // 转换为十六进制并确保两位数格式
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 将十六进制颜色值转换为 HSL 格式
 * @param hex 十六进制颜色值，格式为 #RRGGBB 或 #RGB
 * @returns HSL 格式的颜色字符串，如 "hsl(0 0% 0%)"
 */
export function hexToHSL(hex: string): string {
  // 移除 # 前缀
  let cleanHex = hex.replace(/^#/, '');
  
  // 处理短十六进制格式
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // 验证格式
  if (cleanHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    console.warn(`无效的颜色格式: ${hex}，返回默认 HSL 值`);
    return 'hsl(0 0% 0%)';
  }
  
  // 解析 RGB 值并归一化到 0-1 范围
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  
  // 计算最大值和最小值
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  // 计算亮度 (Lightness)
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  // 如果不是灰色，计算色相和饱和度
  if (delta !== 0) {
    // 计算饱和度 (Saturation)
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    // 计算色相 (Hue)
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }
  
  // 转换为度数和百分比，并四舍五入
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `hsl(${hDeg} ${sPercent}% ${lPercent}%)`;
}