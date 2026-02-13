export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const avg = (numbers = []) => {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
};
