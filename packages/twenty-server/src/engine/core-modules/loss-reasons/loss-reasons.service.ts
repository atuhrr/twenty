// FORK: Voka CRM — Fase 18/19: motivos de perda
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { LossReasonEntity } from './loss-reason.entity';

const DEFAULT_REASONS = [
  'Preço alto',
  'Escolheu a concorrência',
  'Produto não atende às necessidades',
  'Falta de budget',
  'Timing errado',
  'Sem resposta',
];

@Injectable()
export class LossReasonsService {
  constructor(
    @InjectRepository(LossReasonEntity)
    private readonly repo: Repository<LossReasonEntity>,
  ) {}

  async findAll(workspaceId: string): Promise<LossReasonEntity[]> {
    let reasons = await this.repo.find({
      where: { workspaceId },
      order: { position: 'ASC', label: 'ASC' },
    });

    // Seed defaults on first access
    if (reasons.length === 0) {
      reasons = await this.seedDefaults(workspaceId);
    }

    return reasons;
  }

  create(workspaceId: string, dto: { label: string; position?: number }): Promise<LossReasonEntity> {
    const count = this.repo.count({ where: { workspaceId } });

    return count.then((n) =>
      this.repo.save(
        this.repo.create({
          workspaceId,
          label: dto.label,
          position: dto.position ?? n,
          isDefault: false,
        }),
      ),
    );
  }

  async update(workspaceId: string, id: string, dto: Partial<{ label: string; position: number }>): Promise<LossReasonEntity> {
    await this.repo.update({ workspaceId, id }, dto);

    return this.repo.findOneOrFail({ where: { workspaceId, id } });
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.repo.delete({ workspaceId, id });
  }

  private async seedDefaults(workspaceId: string): Promise<LossReasonEntity[]> {
    const entities = DEFAULT_REASONS.map((label, i) =>
      this.repo.create({ workspaceId, label, position: i, isDefault: true }),
    );

    return this.repo.save(entities);
  }
}
