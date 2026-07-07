// FORK: Voka CRM — Fase C: notificações do workspace (REST /metadata/notifications)
import { useCallback, useEffect, useState } from 'react';

export type VokaNotification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const getHeaders = () => {
  const raw = localStorage.getItem('tokenPair');
  const token =
    raw !== null
      ? ((JSON.parse(raw) as { accessToken?: { token?: string } })?.accessToken
          ?.token ?? '')
      : '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const BASE = '/metadata/notifications';

export const useNotifications = (aberto: boolean) => {
  const [notificacoes, setNotificacoes] = useState<VokaNotification[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const carregarContagem = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/unread-count`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const { count } = (await res.json()) as { count: number };
        setNaoLidas(count);
      }
    } catch {
      // servidor sem o módulo — mantém 0 silenciosamente
    }
  }, []);

  const carregarLista = useCallback(async () => {
    try {
      const res = await fetch(BASE, { headers: getHeaders() });
      if (res.ok) setNotificacoes((await res.json()) as VokaNotification[]);
    } catch {
      setNotificacoes([]);
    }
  }, []);

  // Contagem no mount + polling leve a cada 60s
  useEffect(() => {
    void carregarContagem();
    const timer = setInterval(() => void carregarContagem(), 60_000);
    return () => clearInterval(timer);
  }, [carregarContagem]);

  // Lista quando o dropdown abre
  useEffect(() => {
    if (aberto) void carregarLista();
  }, [aberto, carregarLista]);

  const marcarLida = useCallback(
    async (id: string) => {
      await fetch(`${BASE}/${id}/read`, {
        method: 'PATCH',
        headers: getHeaders(),
      }).catch(() => undefined);
      setNotificacoes((lista) =>
        lista.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      void carregarContagem();
    },
    [carregarContagem],
  );

  const marcarTodasLidas = useCallback(async () => {
    await fetch(`${BASE}/read-all`, {
      method: 'PATCH',
      headers: getHeaders(),
    }).catch(() => undefined);
    setNotificacoes((lista) =>
      lista.map((n) => ({
        ...n,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
    );
    setNaoLidas(0);
  }, []);

  return { notificacoes, naoLidas, marcarLida, marcarTodasLidas };
};
