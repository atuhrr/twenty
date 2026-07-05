// FORK: Voka CRM — B2.1
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplateEntity } from 'src/engine/core-modules/template/template.entity';
import { TemplateService } from 'src/engine/core-modules/template/template.service';
import { TemplateResolver } from 'src/engine/core-modules/template/template.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity])],
  providers: [TemplateService, TemplateResolver],
  exports: [TemplateService],
})
export class TemplateModule {}
