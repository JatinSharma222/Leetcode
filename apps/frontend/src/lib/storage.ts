export function getStorageScope(): string {
  try {
    return localStorage.getItem("username")?.trim() || "guest";
  } catch {
    return "guest";
  }
}

export function scopedStorageKey(base: string): string {
  return `${base}:${getStorageScope()}`;
}
