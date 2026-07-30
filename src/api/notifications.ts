import { del, get, post } from './client';
import type { NotificationDto } from './types';

/** Notifikasi untuk level role pemanggil; server yang menyaring audiensnya. */
export const listNotifications = (unreadOnly = false): Promise<NotificationDto[]> =>
  get<NotificationDto[]>('/notifications', { query: { unread: unreadOnly ? 1 : undefined } });

/** Angka lencana saja — sengaja terpisah agar polling tidak menyeret seluruh daftar. */
export const unreadCount = (): Promise<number> =>
  get<{ unread: number }>('/notifications/unread-count').then((r) => r.unread);

export const markNotificationRead = (id: string): Promise<NotificationDto> =>
  post<NotificationDto>(`/notifications/${id}/read`);

export const markAllNotificationsRead = (): Promise<number> =>
  post<{ marked: number }>('/notifications/read-all').then((r) => r.marked);

/**
 * Kosongkan kotak notifikasi pemanggil. Berbeda dari "tandai terbaca" yang berlaku
 * satu level, ini pribadi: barisnya tetap utuh untuk rekan selevel.
 */
export const clearNotifications = (): Promise<number> =>
  post<{ cleared: number }>('/notifications/clear').then((r) => r.cleared);

/** Buang satu notifikasi dari kotak pemanggil. */
export const dismissNotification = (id: string): Promise<null> => del<null>(`/notifications/${id}`);
