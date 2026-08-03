export function formatVnd(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("vi-VN")} ₫`;
}
