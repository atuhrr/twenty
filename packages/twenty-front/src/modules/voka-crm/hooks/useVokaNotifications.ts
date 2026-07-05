// FORK: Voka CRM — Fase 1: central de notificações
import { useMutation, useQuery } from '@apollo/client/react';

import {
  GET_VOKA_NOTIFICATIONS,
  GET_VOKA_NOTIFICATIONS_COUNT,
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
} from '../graphql/queries';

export type VokaNotification = {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string | null;
  link: string | null;
  lida: boolean;
  createdAt: string;
};

export const useVokaNotifications = () => {
  const { data, loading, refetch } = useQuery<{
    vokaNotifications: VokaNotification[];
  }>(GET_VOKA_NOTIFICATIONS, {
    variables: { apenasNaoLidas: false, limit: 30 },
    fetchPolicy: 'cache-and-network',
    pollInterval: 60_000,
  });

  const { data: countData, refetch: refetchCount } = useQuery<{
    vokaNotificationsUnreadCount: number;
  }>(GET_VOKA_NOTIFICATIONS_COUNT, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60_000,
  });

  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    onCompleted: () => { refetch(); refetchCount(); },
  });

  const [markOneRead] = useMutation(MARK_NOTIFICATION_READ, {
    onCompleted: () => { refetch(); refetchCount(); },
  });

  return {
    notifications: data?.vokaNotifications ?? [],
    unreadCount:   countData?.vokaNotificationsUnreadCount ?? 0,
    loading,
    markAllRead:   () => markAllRead(),
    markOneRead:   (id: string) => markOneRead({ variables: { id } }),
  };
};
