// =================================================================
// Opérations bitwise sur les permissions — voir slides cours
// =================================================================

/** AJOUTER une permission : mask = mask | PERM */
export const add = (m: bigint, p: bigint): bigint => m | p;

/** RETIRER une permission : mask = mask & ~PERM */
export const remove = (m: bigint, p: bigint): bigint => m & ~p;

/**
 * TESTER une permission : (mask & PERM) !== 0n
 *
 * Fonctionne aussi pour tester plusieurs en même temps :
 *   has(mask, PERM_A | PERM_B)  → au moins une des deux
 */
export const has = (m: bigint, p: bigint): boolean => (m & p) !== 0n;
