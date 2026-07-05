// FORK: Voka CRM — B2.1
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TemplateDTO } from 'src/engine/core-modules/template/dtos/template.dto';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
} from 'src/engine/core-modules/template/dtos/template.input';
import { TemplateService } from 'src/engine/core-modules/template/template.service';

const toDTO = (e: { criadoEm: Date; atualizadoEm: Date } & object): TemplateDTO =>
  ({ ...e, criadoEm: (e as any).criadoEm.toISOString(), atualizadoEm: (e as any).atualizadoEm.toISOString() }) as TemplateDTO;

@Resolver()
@UseGuards(WorkspaceAuthGuard)
export class TemplateResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Query(() => [TemplateDTO])
  async templates(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<TemplateDTO[]> {
    const items = await this.templateService.list(workspace.id);

    return items.map(toDTO);
  }

  @Query(() => TemplateDTO, { nullable: true })
  async template(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<TemplateDTO | null> {
    const item = await this.templateService.findById(id, workspace.id);

    return item ? toDTO(item) : null;
  }

  @Mutation(() => TemplateDTO)
  async createTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CreateTemplateInput,
  ): Promise<TemplateDTO> {
    return toDTO(await this.templateService.create(workspace.id, input));
  }

  @Mutation(() => TemplateDTO)
  async updateTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateTemplateInput,
  ): Promise<TemplateDTO> {
    return toDTO(await this.templateService.update(workspace.id, input));
  }

  @Mutation(() => Boolean)
  async deleteTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.templateService.remove(workspace.id, id);
  }
}
