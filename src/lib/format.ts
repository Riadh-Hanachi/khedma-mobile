/** The API returns avgRating as a decimal string ("0.00"), which is truthy -- check the review count instead. */
export function formatRating(avgRating: number | string, reviewsCount: number, withCount = false) {
  if (reviewsCount <= 0) return 'Pas encore noté';
  const base = `⭐ ${Number(avgRating).toFixed(1)}`;
  return withCount ? `${base} (${reviewsCount})` : base;
}
