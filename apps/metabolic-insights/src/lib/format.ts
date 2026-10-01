export function formatSigned(value: number, digits: number, suffix = ""): string {
  const abs = Math.abs(value).toFixed(digits);
  if (value < -0.0000001) return `−${abs}${suffix}`;
  return `${abs}${suffix}`;
}

export function formatPercent(value: number, digits = 1): string {
  return formatSigned(value, digits, "%");
}

export function formatMeasure(value: number, digits: number): string {
  return digits === 0 ? String(Math.round(value)) : value.toFixed(digits);
}
