// Live Firestore subscription to the current user's inbox.
//
// Reads happen client-side (allowed by firestore.rules for
// recipientUid = auth.uid); writes go through the /api/partner/
// notifications/[id] server route so the audit trail lives in one
// place.

import { useEffect, useMemo, useState } from 'react';
import {
  collection, onSnapshot, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { authedPatch } from '../lib/apiClient';

export type NotificationSeverity = 'info' | 'warn' | 'urgent';

export interface NotificationDoc {
  id: string;
  ruleId?: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  link?: { referralId?: string; path?: string } | null;
  read: boolean;
  readAt?: string | null;
  dismissed: boolean;
  dismissedAt?: string | null;
  snoozedUntil?: string | null;
  createdAt?: any; // Firestore Timestamp
}

interface UseNotificationsResult {
  notifications: NotificationDoc[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  snooze7d: (id: string) => Promise<void>;
  snooze1d: (id: string) => Promise<void>;
  unsnooze: (id: string) => Promise<void>;
}

export function useNotifications(currentUid: string | undefined): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Server-side query: non-dismissed only, newest 50. Dismissed rows
    // are still queryable via a separate call if we want a history view.
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', currentUid),
      where('dismissed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: NotificationDoc[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setNotifications(rows);
        setLoading(false);
      },
      (err) => {
        console.error('[useNotifications] subscribe error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [currentUid]);

  const unreadCount = useMemo(() => {
    const now = Date.now();
    return notifications.filter(n => {
      if (n.read) return false;
      // Snoozed notifications don't contribute to the badge count until
      // their snooze expires — this is the task-fatigue guardrail.
      if (n.snoozedUntil) {
        const until = new Date(n.snoozedUntil).getTime();
        if (!isNaN(until) && until > now) return false;
      }
      return true;
    }).length;
  }, [notifications]);

  const call = async (id: string, action: string) => {
    try {
      await authedPatch(`/api/partner/notifications/${id}`, { action });
    } catch (e) {
      console.error(`[useNotifications] ${action} failed`, e);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markRead:   (id) => call(id, 'read'),
    markUnread: (id) => call(id, 'unread'),
    dismiss:    (id) => call(id, 'dismiss'),
    snooze7d:   (id) => call(id, 'snooze7d'),
    snooze1d:   (id) => call(id, 'snooze1d'),
    unsnooze:   (id) => call(id, 'unsnooze'),
  };
}
