export const isLightColor = (color: string): boolean => {
  // Assumes hex color format (e.g., #RRGGBB)
  // Handles short hex codes as well by duplicating digits (e.g. #RGB -> #RRGGBB)
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  if (hex.length !== 6) {
    // Return a default or throw an error if hex is not valid
    // For now, returning false as a sensible default for invalid colors
    console.warn(`Invalid color format: ${color}. Defaulting to dark.`);
    return false; 
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Formula for perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // Threshold might need adjustment (128 is often used for mid-point)
};
