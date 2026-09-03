// Fixed-table lookup the checker cannot see through: every caller
// derives its index from the table's own length (modulo, clamp, or a
// loop bound), so the access is in range by construction. Centralised
// so `noUncheckedIndexedAccess` stays honest everywhere else.
export const nth = <T>(xs: readonly T[], i: number): T => xs[i] as T
