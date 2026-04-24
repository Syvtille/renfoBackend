/**
 * Mutex asynchrone pour Node.js.
 *
 * Même si Node.js est mono-thread, les opérations async peuvent s'entrelacer
 * (interleaving), ce qui peut corrompre un état partagé entre deux coroutines.
 * Ce mutex sérialise l'accès à une section critique.
 *
 * Exemple d'utilisation :
 *   const mutex = new AsyncMutex();
 *   const release = await mutex.acquire();
 *   try {
 *     // section critique
 *   } finally {
 *     release();
 *   }
 */
export class AsyncMutex {
  private queue: Array<(release: () => void) => void> = [];
  private locked = false;

  /**
   * Acquiert le verrou. Retourne une fonction `release` à appeler pour libérer.
   * Si le verrou est déjà pris, la promesse sera résolue quand il se libère.
   */
  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve(() => this.release());
      } else {
        this.queue.push(resolve);
      }
    });
  }

  private release(): void {
    const next = this.queue.shift();
    if (next) {
      // Passe le verrou directement au prochain demandeur (locked reste true)
      next(() => this.release());
    } else {
      this.locked = false;
    }
  }

  /** Vrai si le verrou est libre et aucune coroutine n'attend */
  get isIdle(): boolean {
    return !this.locked && this.queue.length === 0;
  }
}
