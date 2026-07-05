// FORK: Voka CRM — Fase 15
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WebFormDTO } from 'src/engine/core-modules/web-form/dtos/web-form.dto';
import {
  CreateWebFormInput,
  UpdateWebFormInput,
} from 'src/engine/core-modules/web-form/dtos/web-form.input';
import { WebFormService } from 'src/engine/core-modules/web-form/web-form.service';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
export class WebFormResolver {
  constructor(private readonly webFormService: WebFormService) {}

  @Query(() => [WebFormDTO])
  async webForms(@AuthWorkspace() workspace: WorkspaceEntity): Promise<WebFormDTO[]> {
    const forms = await this.webFormService.list(workspace.id);

    return forms.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  @Mutation(() => WebFormDTO)
  async createWebForm(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CreateWebFormInput,
  ): Promise<WebFormDTO> {
    const form = await this.webFormService.create(workspace.id, input);

    return { ...form, createdAt: form.createdAt.toISOString() };
  }

  @Mutation(() => WebFormDTO)
  async updateWebForm(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateWebFormInput,
  ): Promise<WebFormDTO> {
    const form = await this.webFormService.update(workspace.id, input);

    return { ...form, createdAt: form.createdAt.toISOString() };
  }

  @Mutation(() => Boolean)
  async deleteWebForm(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.webFormService.remove(workspace.id, id);
  }
}
