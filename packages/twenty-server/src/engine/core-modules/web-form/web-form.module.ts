// FORK: Voka CRM — Fase 15
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WebFormEntity } from 'src/engine/core-modules/web-form/web-form.entity';
import { WebFormSubmissionEntity } from 'src/engine/core-modules/web-form/web-form-submission.entity';
import { WebFormService } from 'src/engine/core-modules/web-form/web-form.service';
import { WebFormController } from 'src/engine/core-modules/web-form/web-form.controller';
import { WebFormResolver } from 'src/engine/core-modules/web-form/web-form.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([WebFormEntity, WebFormSubmissionEntity])],
  controllers: [WebFormController],
  providers: [WebFormService, WebFormResolver],
  exports: [WebFormService],
})
export class WebFormModule {}
