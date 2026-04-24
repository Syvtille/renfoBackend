import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { NotificationModel } from '../domain/notification.model';

/**
 * Service injectable qui gère les streams SSE par utilisateur.
 * Utilisé par les controllers pour exposer les événements et
 * par les use cases pour pousser de nouvelles notifications.
 */
@Injectable()
export class NotificationEmitter {
  /** Map userId → Subject de notifications */
  private streams = new Map<string, Subject<NotificationModel>>();

  /**
   * Obtenir (ou créer) le stream Observable pour un utilisateur.
   * Utilisé par le controller SSE.
   */
  getStream(userId: string): Observable<NotificationModel> {
    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Subject<NotificationModel>());
    }
    return this.streams.get(userId)!.asObservable();
  }

  /**
   * Émettre une notification vers le stream SSE d'un utilisateur.
   * Utilisé par CreateNotificationUseCase.
   */
  emit(userId: string, notification: NotificationModel): void {
    if (this.streams.has(userId)) {
      this.streams.get(userId)!.next(notification);
    }
  }

  /**
   * Nettoyer un stream quand le client se déconnecte.
   */
  removeStream(userId: string): void {
    if (this.streams.has(userId)) {
      this.streams.get(userId)!.complete();
      this.streams.delete(userId);
    }
  }
}
