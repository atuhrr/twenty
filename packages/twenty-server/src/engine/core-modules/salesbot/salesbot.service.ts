// FORK: Voka CRM — Fase 14.1: graph como única fonte de verdade
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';

import { SalesbotEntity } from 'src/engine/core-modules/salesbot/salesbot.entity';
import { SalesbotSessionEntity } from 'src/engine/core-modules/salesbot/salesbot-session.entity';
import {
  CreateSalesbotInput,
  UpdateSalesbotInput,
} from 'src/engine/core-modules/salesbot/dtos/salesbot.input';
import { type BotGraph, type BotTrigger } from './salesbot-graph.types';

@Injectable()
export class SalesbotService {
  constructor(
    @InjectRepository(SalesbotEntity)
    private readonly botRepo: Repository<SalesbotEntity>,
    @InjectRepository(SalesbotSessionEntity)
    private readonly sessionRepo: Repository<SalesbotSessionEntity>,
  ) {}

  list(workspaceId: string): Promise<SalesbotEntity[]> {
    return this.botRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string, workspaceId: string): Promise<SalesbotEntity | null> {
    return this.botRepo.findOne({ where: { id, workspaceId } });
  }

  async create(
    workspaceId: string,
    input: CreateSalesbotInput,
  ): Promise<SalesbotEntity> {
    const triggerId = uuidv4();
    const startId = uuidv4();

    const defaultGraph: BotGraph = {
      nodes: [
        {
          id: triggerId,
          type: 'TRIGGER',
          config: {},
          position: { x: 50, y: 100 },
        },
        {
          id: startId,
          type: 'START',
          config: {},
          position: { x: 300, y: 100 },
        },
      ],
      edges: [],
    };

    const bot = this.botRepo.create({
      workspaceId,
      name: input.name,
      triggers: (input.triggers as BotTrigger[]) ?? [],
      graph: (input.graph as BotGraph) ?? defaultGraph,
    });

    return this.botRepo.save(bot);
  }

  async update(
    workspaceId: string,
    input: UpdateSalesbotInput,
  ): Promise<SalesbotEntity> {
    const bot = await this.botRepo.findOneOrFail({
      where: { id: input.id, workspaceId },
    });

    if (input.name !== undefined) bot.name = input.name;
    if (input.triggers !== undefined)
      bot.triggers = input.triggers as BotTrigger[];
    if (input.graph !== undefined)
      bot.graph = (input.graph as BotGraph) ?? { nodes: [], edges: [] };
    if (input.enabled !== undefined) bot.enabled = input.enabled;

    return this.botRepo.save(bot);
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    await this.botRepo.delete({ id, workspaceId });

    return true;
  }

  findActiveBotsForWorkspace(workspaceId: string): Promise<SalesbotEntity[]> {
    return this.botRepo.find({ where: { workspaceId, enabled: true } });
  }

  findActiveSession(
    workspaceId: string,
    contactPhone: string,
  ): Promise<SalesbotSessionEntity | null> {
    return this.sessionRepo.findOne({
      where: { workspaceId, contactPhone, status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
    });
  }

  createSession(
    partial: Partial<SalesbotSessionEntity>,
  ): Promise<SalesbotSessionEntity> {
    return this.sessionRepo.save(this.sessionRepo.create(partial));
  }

  saveSession(session: SalesbotSessionEntity): Promise<SalesbotSessionEntity> {
    return this.sessionRepo.save(session);
  }
}
