// =================================================================
// Système de permissions bitmask — 1 permission = 1 bit (BigInt)
// =================================================================

// --- Permissions unitaires ---
export const SEND_MESSAGE      = 1n << 0n;  // 1   — joueur : envoyer un message chat
export const SEND_REACTION     = 1n << 1n;  // 2   — arbitre : envoyer une réaction
export const JOIN_AS_PLAYER    = 1n << 2n;  // 4   — rejoindre un lobby en tant que joueur
export const JOIN_AS_REFEREE   = 1n << 3n;  // 8   — rejoindre un lobby en tant qu'arbitre
export const DESIGNATE_WINNER  = 1n << 4n;  // 16  — arbitre : désigner le gagnant
export const SPECTATE_LOBBY    = 1n << 5n;  // 32  — staff : spectateur invisible dans un lobby
export const MANAGE_USERS      = 1n << 6n;  // 64  — support : activer/désactiver des comptes
export const MANAGE_TOPICS     = 1n << 7n;  // 128 — content manager : rédiger des sujets
export const ADMIN_ALL         = 1n << 8n;  // 256 — admin : accès total

// --- Rôles prédéfinis (combinaisons via | bitwise) ---
export const ROLE_PLAYER          = SEND_MESSAGE | JOIN_AS_PLAYER;
// → 1 | 4 = 5 → binaire : 000000101

export const ROLE_REFEREE         = SEND_REACTION | JOIN_AS_REFEREE | DESIGNATE_WINNER;
// → 2 | 8 | 16 = 26 → binaire : 000011010

export const ROLE_SUPPORT         = SPECTATE_LOBBY | MANAGE_USERS;
// → 32 | 64 = 96 → binaire : 001100000

export const ROLE_CONTENT_MANAGER = SPECTATE_LOBBY | MANAGE_TOPICS;
// → 32 | 128 = 160 → binaire : 010100000

export const ROLE_ADMIN           = (1n << 9n) - 1n;
// → 511 → binaire : 111111111 (tous les bits 0–8 actifs)
