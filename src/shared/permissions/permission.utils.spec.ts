import { add, remove, has } from './permission.utils';
import {
  SEND_MESSAGE, SEND_REACTION, JOIN_AS_PLAYER, MANAGE_USERS,
  ROLE_PLAYER, ROLE_REFEREE, ROLE_SUPPORT, ROLE_ADMIN,
} from './permission.constants';

describe('Permission utils — bitmask (slides)', () => {

  describe('add (mask = mask | PERM)', () => {
    it('ajoute une permission à 0n', () => {
      expect(add(0n, SEND_MESSAGE)).toBe(1n);
    });
    it('combine plusieurs permissions via |', () => {
      let mask = 0n;
      mask = add(mask, SEND_MESSAGE);    // 1
      mask = add(mask, JOIN_AS_PLAYER);  // 4
      expect(mask).toBe(5n);
    });
  });

  describe('remove (mask = mask & ~PERM)', () => {
    it('retire une permission existante', () => {
      expect(remove(ROLE_PLAYER, JOIN_AS_PLAYER)).toBe(SEND_MESSAGE); // 5 - 4 = 1
    });
    it('ne change rien si la permission était absente', () => {
      expect(remove(ROLE_PLAYER, MANAGE_USERS)).toBe(ROLE_PLAYER);
    });
  });

  describe('has ((mask & PERM) !== 0n)', () => {
    it('retourne true si le bit est actif', () => {
      expect(has(ROLE_PLAYER, SEND_MESSAGE)).toBe(true);
      expect(has(ROLE_PLAYER, JOIN_AS_PLAYER)).toBe(true);
    });
    it('retourne false si le bit est inactif', () => {
      expect(has(ROLE_PLAYER, SEND_REACTION)).toBe(false);
      expect(has(ROLE_PLAYER, MANAGE_USERS)).toBe(false);
    });
    it('teste plusieurs permissions via | dans le paramètre (au moins une)', () => {
      // has(mask, A | B) → (mask & (A|B)) !== 0n
      expect(has(ROLE_PLAYER, SEND_MESSAGE | SEND_REACTION)).toBe(true);  // a SEND_MESSAGE
      expect(has(ROLE_REFEREE, SEND_MESSAGE | SEND_REACTION)).toBe(true); // a SEND_REACTION
      expect(has(ROLE_SUPPORT, SEND_MESSAGE | SEND_REACTION)).toBe(false); // n'a aucune
    });
  });

  describe('Rôles prédéfinis', () => {
    it('ROLE_PLAYER = 5 (0b000000101)', () => expect(ROLE_PLAYER).toBe(5n));
    it('ROLE_REFEREE = 26 (0b000011010)', () => expect(ROLE_REFEREE).toBe(26n));
    it('ROLE_SUPPORT = 96 (0b001100000)', () => expect(ROLE_SUPPORT).toBe(96n));
    it('ROLE_ADMIN a tous les bits 0-8 actifs (511)', () => expect(ROLE_ADMIN).toBe(511n));

    it('un joueur peut écrire des messages mais pas des réactions', () => {
      expect(has(ROLE_PLAYER, SEND_MESSAGE)).toBe(true);
      expect(has(ROLE_PLAYER, SEND_REACTION)).toBe(false);
    });
    it('un arbitre peut réagir mais pas envoyer de messages', () => {
      expect(has(ROLE_REFEREE, SEND_REACTION)).toBe(true);
      expect(has(ROLE_REFEREE, SEND_MESSAGE)).toBe(false);
    });
    it('un admin possède toutes les permissions', () => {
      for (const perm of [SEND_MESSAGE, SEND_REACTION, JOIN_AS_PLAYER, MANAGE_USERS]) {
        expect(has(ROLE_ADMIN, perm)).toBe(true);
      }
    });
  });
});
