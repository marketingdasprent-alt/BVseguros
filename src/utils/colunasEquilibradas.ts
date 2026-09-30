/**
 * Columns for `n` boxes when the layout wants `alvo` per row. Fewer boxes
 * than `alvo` keep their normal width (one centred row). Otherwise, in
 * order: `alvo` if it divides n; one column less (never below 2) if that
 * stays within 3 rows; one more (only from 3, up to 4, so cards don't get
 * too narrow). If none divides n and the last row would hold a single
 * box, try one column less or more to avoid it (5 -> 3+2, 7 -> 4+3).
 * Whatever is left over sits centred on the last row.
 */
export function colunasEquilibradas(n: number, alvo: number): number {
  if (n <= alvo || n % alvo === 0) return alvo;
  const menos = alvo - 1;
  if (menos >= 2 && n % menos === 0 && n / menos <= 3) return menos;
  const mais = alvo + 1;
  const podeMais = alvo >= 3 && mais <= 4;
  if (podeMais && n % mais === 0) return mais;
  if (n % alvo === 1) {
    if (menos >= 2 && n % menos > 1) return menos;
    if (podeMais && n % mais > 1) return mais;
  }
  return alvo;
}
