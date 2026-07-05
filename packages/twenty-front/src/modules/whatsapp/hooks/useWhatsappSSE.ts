// FORK: Voka CRM — Fase 9: SSE real-time hook (replaces 15s polling)
import { useEffect, useRef } from 'react';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type UseWhatsappSSEOptions = {
  onMessage: (msg: WhatsappMessage) => void;
  skip?: boolean;
};

export const useWhatsappSSE = ({ onMessage, skip }: UseWhatsappSSEOptions) => {
  const tokenPair = useAtomStateValue(tokenPairState);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (skip) return;

    const token = tokenPair?.accessOrWorkspaceAgnosticToken?.token;

    if (!token) return;

    const controller = new AbortController();
    let active = true;

    const connect = async () => {
      try {
        const response = await fetch(
          `${REACT_APP_SERVER_BASE_URL}/whatsapp/sse/events`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
            signal: controller.signal,
          },
        );

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');

          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const dataLine = part
              .split('\n')
              .find((l) => l.startsWith('data: '));

            if (!dataLine) continue;

            try {
              const msg = JSON.parse(dataLine.slice(6)) as WhatsappMessage;

              onMessageRef.current(msg);
            } catch {
              // ignore malformed SSE frames
            }
          }
        }
      } catch {
        // connection dropped — reconnect after 3s if still mounted
        if (active) {
          setTimeout(() => { if (active) void connect(); }, 3_000);
        }
      }
    };

    void connect();

    return () => {
      active = false;
      controller.abort();
    };
  }, [tokenPair?.accessOrWorkspaceAgnosticToken?.token, skip]);
};
