export const ensureEven = (size: number): number => {
  return size % 2 === 0 ? size : size - 1
}
