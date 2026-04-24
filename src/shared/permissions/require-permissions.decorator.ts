import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Déclare le bitmask de permissions requis pour un endpoint.
 * On passe un bigint déjà combiné via |, comme dans les slides :
 *
 *   @RequirePermissions(MANAGE_USERS | SPECTATE_LOBBY)
 *   → at least one bit of the mask must be active in user's permissions
 */
export const RequirePermissions = (mask: bigint) =>
  SetMetadata(PERMISSIONS_KEY, mask);
