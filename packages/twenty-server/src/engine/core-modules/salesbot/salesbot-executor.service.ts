// FORK: Voka CRM — Fase 14.1: executor lê graph como única fonte de verdade
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import axios from 'axios';
import { Repository } from 'typeorm';

import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { WhatsappInstanceEntity } from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import { SalesbotEntity } from 'src/engine/core-modules/salesbot/salesbot.entity';
import { SalesbotService } from 'src/engine/core-modules/salesbot/salesbot.service';
import { SalesbotSessionEntity } from 'src/engine/core-modules/salesbot/salesbot-session.entity';
import {
  type BotGraph,
  type BotNode,
  type BotTrigger,
} from './salesbot-graph.types';

const HANDOFF_KEYWORDS = ['humano', 'atendente', 'pessoa', 'falar com'];
const DEFAULT_MAX_AI_TURNS = 10;

@Injectable()
export class SalesbotExecutorService {
  private readonly logger = new Logger(SalesbotExecutorService.name);

  constructor(
    private readonly salesbotService: SalesbotService,
    private readonly secretEncryptionService: SecretEncryptionService,
    @InjectRepository(WhatsappInstanceEntity)
    private readonly instanceRepo: Repository<WhatsappInstanceEntity>,
  ) {}

  async handleInboundMessage(
    workspaceId: string,
    contactPhone: string,
    text: string,
  ): Promise<void> {
    // 1. Sessão ativa?
    let session = await this.salesbotService.findActiveSession(
      workspaceId,
      contactPhone,
    );

    if (session) {
      await this.continueSession(session, text);

      return;
    }

    // 2. Encontrar bot correspondente pelo triggers[]
    const bots =
      await this.salesbotService.findActiveBotsForWorkspace(workspaceId);
    const bot = this.matchBot(bots, text);

    if (!bot) return;

    const startNode = bot.graph.nodes.find((n) => n.type === 'START');

    if (!startNode) return;

    // 3. Criar sessão e executar a partir do START
    session = await this.salesbotService.createSession({
      botId: bot.id,
      workspaceId,
      contactPhone,
      currentNodeId: startNode.id,
      collectedData: {},
      conversationHistory: [],
      status: 'ACTIVE',
      aiTurns: 0,
    });

    await this.executeNode(session, startNode, null, bot.graph);
  }

  // ── Helpers privados ────────────────────────────────────────────────────────

  private matchBot(
    bots: SalesbotEntity[],
    text: string,
  ): SalesbotEntity | undefined {
    const lower = text.toLowerCase().trim();

    // Prioridade: KEYWORD
    const keyword = bots.find((b) =>
      b.triggers.some(
        (t: BotTrigger) =>
          t.type === 'KEYWORD' &&
          t.keyword &&
          lower.includes(t.keyword.toLowerCase()),
      ),
    );

    if (keyword) return keyword;

    return bots.find((b) =>
      b.triggers.some((t: BotTrigger) => t.type === 'ALWAYS'),
    );
  }

  // Atravessa o grafo para obter o próximo nó via aresta
  private getNextNode(
    graph: BotGraph,
    currentId: string,
    handle: string = 'output',
  ): BotNode | null {
    const edge = graph.edges.find(
      (e) => e.source === currentId && e.sourceHandle === handle,
    );

    if (!edge) return null;

    return graph.nodes.find((n) => n.id === edge.target) ?? null;
  }

  private async continueSession(
    session: SalesbotSessionEntity,
    text: string,
  ): Promise<void> {
    const bot = await this.salesbotService.findById(
      session.botId,
      session.workspaceId,
    );

    if (!bot) return;

    const node = bot.graph.nodes.find((n) => n.id === session.currentNodeId);

    if (!node) return;

    // PAUSE: qualquer mensagem do usuário avança para o próximo nó
    if (node.type === 'PAUSE') {
      await this.advanceTo(session, bot.graph, node.id, 'output');

      return;
    }

    // LIST_MESSAGE: guarda escolha do usuário e avança
    if (node.type === 'LIST_MESSAGE') {
      session.collectedData = { ...session.collectedData, listChoice: text };
      await this.advanceTo(session, bot.graph, node.id, 'output');

      return;
    }

    // VALIDATION: valida formato, branch true/false
    if (node.type === 'VALIDATION') {
      const field = (node.config.field as string | undefined) ?? 'value';
      const validationType =
        (node.config.validationType as string | undefined) ?? 'text';
      const isValid = this.validateInput(text, validationType);

      if (!isValid) {
        await this.sendText(
          session.workspaceId,
          session.contactPhone,
          `Formato inválido para ${field}. Tente novamente.`,
        );
        await this.salesbotService.saveSession(session);

        return;
      }

      session.collectedData = { ...session.collectedData, [field]: text };
      await this.advanceTo(session, bot.graph, node.id, 'true');

      return;
    }

    // ACTION / MESSAGE com coleta implícita de campo
    if (node.type === 'ACTION' || node.type === 'MESSAGE') {
      const fieldToSave = node.config.fieldToSave as string | undefined;

      if (fieldToSave && !session.collectedData[fieldToSave]) {
        session.collectedData = {
          ...session.collectedData,
          [fieldToSave]: text,
        };
        await this.salesbotService.saveSession(session);

        const nextNode = this.getNextNode(bot.graph, node.id, 'output');

        if (nextNode) {
          session.currentNodeId = nextNode.id;
          await this.salesbotService.saveSession(session);
          await this.executeNode(session, nextNode, null, bot.graph);
        } else {
          session.status = 'COMPLETED';
          await this.salesbotService.saveSession(session);
        }

        return;
      }
    }

    await this.executeNode(session, node, text, bot.graph);
  }

  private async executeNode(
    session: SalesbotSessionEntity,
    node: BotNode,
    incomingText: string | null,
    graph: BotGraph,
  ): Promise<void> {
    switch (node.type) {
      case 'START':
        // START apenas avança para o próximo nó
        await this.advanceTo(session, graph, node.id, 'output');
        break;
      case 'MESSAGE':
        await this.execMessage(session, node, graph);
        break;
      case 'ACTION':
        await this.execAction(session, node, incomingText, graph);
        break;
      case 'CONDITION':
        await this.execCondition(session, node, graph);
        break;
      case 'AI_AGENT':
        await this.execAiAgent(session, node, incomingText ?? '', graph);
        break;
      case 'HANDOFF':
        await this.execHandoff(session, node);
        break;
      case 'PAUSE':
        // Aguarda próxima mensagem — apenas persiste estado
        await this.salesbotService.saveSession(session);
        break;
      case 'REACTION':
        await this.execReaction(session, node, graph);
        break;
      case 'COMMENT':
        await this.execComment(session, node, graph);
        break;
      case 'INTERNAL_MESSAGE':
        await this.execInternalMessage(session, node, graph);
        break;
      case 'LIST_MESSAGE':
        await this.execListMessage(session, node, graph);
        break;
      case 'SUBSCRIBE':
        // Stub: avança automaticamente (integração de funil na Fase 15+)
        await this.advanceTo(session, graph, node.id, 'output');
        break;
      case 'VALIDATION':
        await this.execValidation(session, node, incomingText, graph);
        break;
      case 'STOP':
        session.status = 'COMPLETED';
        await this.salesbotService.saveSession(session);
        break;
      default:
        await this.advanceTo(session, graph, node.id, 'output');
    }
  }

  private async execMessage(
    session: SalesbotSessionEntity,
    node: BotNode,
    graph: BotGraph,
  ): Promise<void> {
    const text = node.config.text as string | undefined;

    if (text) {
      await this.sendText(session.workspaceId, session.contactPhone, text);
    }

    await this.advanceTo(session, graph, node.id, 'output');
  }

  private async execAction(
    session: SalesbotSessionEntity,
    node: BotNode,
    incomingText: string | null,
    graph: BotGraph,
  ): Promise<void> {
    const fieldToSave = node.config.fieldToSave as string | undefined;
    const question = node.config.question as string | undefined;
    const key = fieldToSave ?? 'value';

    if (!session.collectedData[key]) {
      if (question) {
        await this.sendText(session.workspaceId, session.contactPhone, question);
      }

      await this.salesbotService.saveSession(session);

      return;
    }

    // Campo já coletado — avança
    await this.advanceTo(session, graph, node.id, 'output');
  }

  private async execCondition(
    session: SalesbotSessionEntity,
    node: BotNode,
    graph: BotGraph,
  ): Promise<void> {
    const field = (node.config.field as string) ?? '';
    const operator = (node.config.operator as string) ?? 'exists';
    const expected = (node.config.value as string) ?? '';
    const fieldValue = (session.collectedData[field] as string) ?? '';

    const met = this.evaluateCondition(fieldValue, operator, expected);
    const handle = met ? 'true' : 'false';

    await this.advanceTo(session, graph, node.id, handle);
  }

  private evaluateCondition(
    fieldValue: string,
    operator: string,
    expected: string,
  ): boolean {
    switch (operator) {
      case 'eq':
        return fieldValue.toLowerCase() === expected.toLowerCase();
      case 'contains':
        return fieldValue.toLowerCase().includes(expected.toLowerCase());
      case 'exists':
        return fieldValue.length > 0;
      default:
        return false;
    }
  }

  private async execAiAgent(
    session: SalesbotSessionEntity,
    node: BotNode,
    userMessage: string,
    graph: BotGraph,
  ): Promise<void> {
    const wantsHuman = HANDOFF_KEYWORDS.some((kw) =>
      userMessage.toLowerCase().includes(kw),
    );
    const maxTurns =
      (node.config.maxAiTurns as number | undefined) ?? DEFAULT_MAX_AI_TURNS;

    if (wantsHuman || session.aiTurns >= maxTurns) {
      await this.triggerHandoff(session, node);

      return;
    }

    session.conversationHistory = [
      ...session.conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not set — handoff forced');
      await this.triggerHandoff(session, node);

      return;
    }

    try {
      const anthropic = createAnthropic({ apiKey });
      const systemPrompt =
        (node.config.systemPrompt as string | undefined) ??
        `Você é um assistente de vendas. Responda de forma amigável e concisa em português.
Se não souber responder, diga que vai transferir para um atendente.`;

      const { text } = await generateText({
        model: anthropic('claude-haiku-4-5-20251001'),
        system: systemPrompt,
        messages: session.conversationHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as string,
        })),
      });

      const aiWantsHandoff = HANDOFF_KEYWORDS.some((kw) =>
        text.toLowerCase().includes(kw),
      );

      session.conversationHistory = [
        ...session.conversationHistory,
        { role: 'assistant', content: text },
      ];
      session.aiTurns += 1;

      await this.sendText(session.workspaceId, session.contactPhone, text);

      if (aiWantsHandoff) {
        await this.triggerHandoff(session, node);
      } else {
        await this.salesbotService.saveSession(session);
      }
    } catch (err) {
      this.logger.error(
        `AI agent error: ${err instanceof Error ? err.message : String(err)}`,
      );
      await this.triggerHandoff(session, node);
    }
  }

  private async triggerHandoff(
    session: SalesbotSessionEntity,
    node: BotNode,
  ): Promise<void> {
    await this.sendText(
      session.workspaceId,
      session.contactPhone,
      'Vou transferir você para um de nossos atendentes. Aguarde um momento!',
    );
    session.status = 'HANDED_OFF';
    await this.salesbotService.saveSession(session);
  }

  private async execHandoff(
    session: SalesbotSessionEntity,
    node: BotNode,
  ): Promise<void> {
    const msg = node.config.message as string | undefined;

    if (msg) {
      await this.sendText(session.workspaceId, session.contactPhone, msg);
    }

    session.status = 'HANDED_OFF';
    await this.salesbotService.saveSession(session);
  }

  private async advanceTo(
    session: SalesbotSessionEntity,
    graph: BotGraph,
    currentId: string,
    handle: string,
  ): Promise<void> {
    const nextNode = this.getNextNode(graph, currentId, handle);

    if (!nextNode) {
      session.status = 'COMPLETED';
      await this.salesbotService.saveSession(session);

      return;
    }

    session.currentNodeId = nextNode.id;
    await this.salesbotService.saveSession(session);

    // Nós que auto-avançam (não aguardam input do usuário)
    const autoAdvance: BotNode['type'][] = [
      'START',
      'MESSAGE',
      'CONDITION',
      'HANDOFF',
      'STOP',
      'REACTION',
      'COMMENT',
      'INTERNAL_MESSAGE',
      'SUBSCRIBE',
    ];

    if (autoAdvance.includes(nextNode.type)) {
      await this.executeNode(session, nextNode, null, graph);
    } else if (nextNode.type === 'ACTION') {
      await this.execAction(session, nextNode, null, graph);
    }
    // AI_AGENT e PAUSE aguardam input — sem auto-execução
  }

  // ── Handlers de nós estendidos (14.3B / 14.5A) ──────────────────────────────

  private async execReaction(
    session: SalesbotSessionEntity,
    node: BotNode,
    graph: BotGraph,
  ): Promise<void> {
    const emoji = (node.config.emoji as string | undefined) ?? '👍';

    // Fallback: emoji como texto (WhatsApp Cloud API suporta reactions mas
    // requer message_id da msg anterior, não armazenado na sessão atual)
    await this.sendText(session.workspaceId, session.contactPhone, emoji);
    await this.advanceTo(session, graph, node.id, 'output');
  }

  private async execComment(
    session: SalesbotSessionEntity,
    node: BotNode,
    graph: BotGraph,
  ): Promise<void> {
    // Comentários internos são visíveis apenas no CRM — não enviados ao contato
    const text = node.config.text as string | undefined;

    this.logger.log(
      `Bot comment [session=${session.id}]: ${text ?? '(vazio)'}`,
    );
    await this.advanceTo(session, graph, node.id, 'output');
  }

  private async execInternalMessage(
    session: SalesbotSessionEntity,
    node: BotNode,
    graph: BotGraph,
  ): Promise<void> {
    const text = node.config.text as string | undefined;

    this.logger.log(
      `Bot internal message [session=${session.id}]: ${text ?? '(vazio)'}`,
    );
    await this.advanceTo(session, graph, node.id, 'output');
  }

  private async execListMessage(
    session: SalesbotSessionEntity,
    node: BotNode,
    graph: BotGraph,
  ): Promise<void> {
    const header = (node.config.headerText as string | undefined) ?? 'Escolha uma opção:';
    const items = (node.config.items as Array<{ id: string; title: string }> | undefined) ?? [];

    await this.sendInteractiveList(
      session.workspaceId,
      session.contactPhone,
      header,
      items,
    );

    // Aguarda resposta do usuário (continueSession avançará quando receber input)
    await this.salesbotService.saveSession(session);
  }

  private async execValidation(
    session: SalesbotSessionEntity,
    node: BotNode,
    incomingText: string | null,
    graph: BotGraph,
  ): Promise<void> {
    const field = (node.config.field as string | undefined) ?? 'value';
    const validationType = (node.config.validationType as string | undefined) ?? 'text';

    if (!incomingText) {
      // Primeira vez: pede o dado ao usuário
      await this.sendText(
        session.workspaceId,
        session.contactPhone,
        `Por favor, informe seu ${field}:`,
      );
      await this.salesbotService.saveSession(session);

      return;
    }

    const isValid = this.validateInput(incomingText, validationType);

    if (!isValid) {
      await this.sendText(
        session.workspaceId,
        session.contactPhone,
        `Formato inválido para ${field}. Tente novamente.`,
      );
      await this.salesbotService.saveSession(session);

      return;
    }

    session.collectedData = { ...session.collectedData, [field]: incomingText };
    await this.advanceTo(session, graph, node.id, 'true');
  }

  private validateInput(value: string, type: string): boolean {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\+?[\d\s\-()]{8,}$/.test(value.replace(/\s/g, ''));
      case 'number':
        return !Number.isNaN(Number(value));
      default:
        return value.trim().length > 0;
    }
  }

  // ── Envio WhatsApp (direto, sem dep circular) ──────────────────────────────

  private async sendText(
    workspaceId: string,
    phone: string,
    text: string,
  ): Promise<void> {
    try {
      const instance =
        (await this.instanceRepo.findOne({ where: { workspaceId, isDefault: true } })) ??
        (await this.instanceRepo.findOne({ where: { workspaceId } }));

      if (!instance?.accessTokenEncrypted || !instance.phoneNumberId) return;

      const accessToken = this.secretEncryptionService.decrypt(
        instance.accessTokenEncrypted,
      );

      await axios.post(
        `https://graph.facebook.com/v19.0/${instance.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: text },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch (err) {
      this.logger.warn(
        `Salesbot sendText to ${phone}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async sendInteractiveList(
    workspaceId: string,
    phone: string,
    headerText: string,
    items: Array<{ id: string; title: string }>,
  ): Promise<void> {
    try {
      const instance =
        (await this.instanceRepo.findOne({ where: { workspaceId, isDefault: true } })) ??
        (await this.instanceRepo.findOne({ where: { workspaceId } }));

      if (!instance?.accessTokenEncrypted || !instance.phoneNumberId) return;

      const accessToken = this.secretEncryptionService.decrypt(
        instance.accessTokenEncrypted,
      );

      await axios.post(
        `https://graph.facebook.com/v19.0/${instance.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: headerText },
            action: {
              button: 'Escolher',
              sections: [
                {
                  title: 'Opções',
                  rows: items.map((it) => ({ id: it.id, title: it.title })),
                },
              ],
            },
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch (err) {
      this.logger.warn(
        `Salesbot sendInteractiveList to ${phone}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
