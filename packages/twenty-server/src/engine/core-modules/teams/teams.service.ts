// FORK: Voka CRM — Fase 18: equipes
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { TeamEntity } from './team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
  ) {}

  findAll(workspaceId: string): Promise<TeamEntity[]> {
    return this.teamRepo.find({ where: { workspaceId }, order: { name: 'ASC' } });
  }

  findOne(workspaceId: string, id: string): Promise<TeamEntity | null> {
    return this.teamRepo.findOne({ where: { workspaceId, id } });
  }

  create(workspaceId: string, dto: { name: string; description?: string; memberIds?: string[] }): Promise<TeamEntity> {
    return this.teamRepo.save(
      this.teamRepo.create({
        workspaceId,
        name: dto.name,
        description: dto.description ?? null,
        memberIds: dto.memberIds ?? [],
      }),
    );
  }

  async update(
    workspaceId: string,
    id: string,
    dto: Partial<{ name: string; description: string; memberIds: string[] }>,
  ): Promise<TeamEntity> {
    await this.teamRepo.update({ workspaceId, id }, dto);
    return this.teamRepo.findOneOrFail({ where: { workspaceId, id } });
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.teamRepo.delete({ workspaceId, id });
  }
}
