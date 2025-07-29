import namer from 'color-namer';

export function getColorName(hex: string) {
  try {
    return namer(hex).pantone[0].name;
  } catch {
    return hex;
  }
}
