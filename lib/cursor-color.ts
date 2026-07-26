// Fixed palette, chosen to stay visually distinct against the app's dark
// surface tokens (see ui-context.md) while still reading clearly as
// "different users" next to each other in a shared cursor layer.
const CURSOR_COLOR_PALETTE = [
  "#ff8a00", // brand accent
  "#00c8d4",
  "#7c5cff",
  "#22c55e",
  "#f43f5e",
  "#eab308",
  "#38bdf8",
  "#ec4899",
] as const;

// Deterministic hash-of-user-id-mod-palette-length: the same Clerk user ID
// always maps to the same color, across sessions and across users.
export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % CURSOR_COLOR_PALETTE.length;
  return CURSOR_COLOR_PALETTE[index];
}
