// Maps our stored team abbreviations to ESPN's logo CDN slugs (most match
// directly; a handful of exceptions are normalized here).
const ESPN_SLUG_OVERRIDES: Record<string, string> = {
  WAS: "wsh",
};

export function teamLogoUrl(team: string | null | undefined): string | null {
  if (!team) return null;
  const slug = ESPN_SLUG_OVERRIDES[team.toUpperCase()] ?? team.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${slug}.png`;
}
