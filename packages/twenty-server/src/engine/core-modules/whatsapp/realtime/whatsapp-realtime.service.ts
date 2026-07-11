// FORK: Zellate — tempo real do Inbox via Redis pub/sub.
// O emitter em memória não funciona em produção: quem SALVA a mensagem é o
// processo worker, quem segura a conexão SSE com o navegador é o server —
// o evento precisa cruzar processos, e o Redis (já na stack) é a ponte.
// Módulo standalone de propósito: whatsapp E salesbot publicam aqui sem
// criar import circular entre eles.
import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';

import { EventEmitter } from 'events';
import type IORedis from 'ioredis';
import { Observable } from 'rxjs';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';

const PREFIXO_CANAL = 'zellate:whatsapp:msg:';

@Injectable()
export class WhatsappRealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappRealtimeService.name);
  // Fan-out local: o assinante Redis único distribui aos observers SSE
  private readonly emitter = new EventEmitter();
  private subscriber: IORedis | null = null;

  constructor(private readonly redisClientService: RedisClientService) {
    this.emitter.setMaxListeners(0);
  }

  private canal(workspaceId: string): string {
    return `${PREFIXO_CANAL}${workspaceId}`;
  }

  async publicarMensagem(
    workspaceId: string,
    mensagem: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.redisClientService
        .getClient()
        .publish(this.canal(workspaceId), JSON.stringify(mensagem));
    } catch (err) {
      // Tempo real é best-effort: nunca derruba o fluxo da mensagem
      this.logger.warn(
        `Falha ao publicar mensagem em tempo real: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Criado sob demanda: só o processo que serve SSE (server) assina o Redis
  private garantirAssinatura(): void {
    if (this.subscriber) return;

    this.subscriber = this.redisClientService.getClient().duplicate();
    void this.subscriber.psubscribe(`${PREFIXO_CANAL}*`);
    this.subscriber.on(
      'pmessage',
      (_pattern: string, channel: string, payload: string) => {
        this.emitter.emit(channel, payload);
      },
    );
    this.subscriber.on('error', (err: Error) => {
      this.logger.warn(`Assinante Redis do tempo real: ${err.message}`);
    });
  }

  assinarMensagens(workspaceId: string): Observable<{ data: string }> {
    this.garantirAssinatura();

    return new Observable((subscriber) => {
      const canal = this.canal(workspaceId);
      const handler = (payload: string) => subscriber.next({ data: payload });

      this.emitter.on(canal, handler);

      return () => {
        this.emitter.off(canal, handler);
      };
    });
  }

  onModuleDestroy(): void {
    this.subscriber?.disconnect();
  }
}
