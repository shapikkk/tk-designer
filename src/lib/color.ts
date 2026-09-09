export const luminanceOf = (color: string | undefined): number | null => {
  const hex = /^#([0-9a-f]{6})$/i.exec(color ?? "");
  if (!hex) return null;
  const value = parseInt(hex[1], 16);
  return (
    (0.299 * ((value >> 16) & 255) +
      0.587 * ((value >> 8) & 255) +
      0.114 * (value & 255)) /
    255
  );
};

export const isDarkSurface = (color: string | undefined): boolean => {
  const luminance = luminanceOf(color);
  return luminance !== null && luminance <= 0.55;
};

export const readableOn = (color: string | undefined): string =>
  isDarkSurface(color) ? "#f5f5f5" : "#111111";
