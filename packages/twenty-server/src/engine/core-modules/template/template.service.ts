// FORK: Voka CRM — B2.1
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { TemplateEntity } from 'src/engine/core-modules/template/template.entity';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
} from 'src/engine/core-modules/template/dtos/template.input';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly repo: Repository<TemplateEntity>,
  ) {}

  list(workspaceId: string): Promise<TemplateEntity[]> {
    return this.repo.find({
      where: { workspaceId },
      order: { criadoEm: 'DESC' },
    });
  }

  findById(id: string, workspaceId: string): Promise<TemplateEntity | null> {
    return this.repo.findOne({ where: { id, workspaceId } });
  }

  async create(
    workspaceId: string,
    input: CreateTemplateInput,
  ): Promise<TemplateEntity> {
    const entity = this.repo.create({
      workspaceId,
      nome: input.nome,
      tipo: input.tipo as TemplateEntity['tipo'],
      canal: input.canal ?? null,
      assunto: input.assunto ?? null,
      corpo: input.corpo ?? '',
      variaveis: input.variaveis ?? [],
    });

    return this.repo.save(entity);
  }

  async update(
    workspaceId: string,
    input: UpdateTemplateInput,
  ): Promise<TemplateEntity> {
    const entity = await this.repo.findOneOrFail({
      where: { id: input.id, workspaceId },
    });

    if (input.nome !== undefined) entity.nome = input.nome;
    if (input.canal !== undefined) entity.canal = input.canal ?? null;
    if (input.assunto !== undefined) entity.assunto = input.assunto ?? null;
    if (input.corpo !== undefined) entity.corpo = input.corpo;
    if (input.variaveis !== undefined) entity.variaveis = input.variaveis;
    if (input.ativo !== undefined) entity.ativo = input.ativo;

    return this.repo.save(entity);
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    await this.repo.delete({ id, workspaceId });

    return true;
  }
}
