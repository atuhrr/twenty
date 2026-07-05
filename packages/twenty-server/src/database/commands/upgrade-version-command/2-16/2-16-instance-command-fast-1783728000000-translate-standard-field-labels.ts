// FORK: Voka CRM — traduz labels de campos dos objetos padrão para PT-BR
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

type FieldTranslation = {
  objectName: string | null; // null = all objects
  fieldName: string;
  ptLabel: string;
  enLabel: string;
};

const FIELD_TRANSLATIONS: FieldTranslation[] = [
  // ── Common fields present on every standard object ──────────────────────
  { objectName: null, fieldName: 'id', ptLabel: 'Id', enLabel: 'Id' },
  { objectName: null, fieldName: 'createdAt', ptLabel: 'Criado em', enLabel: 'Creation date' },
  { objectName: null, fieldName: 'updatedAt', ptLabel: 'Atualizado em', enLabel: 'Last update' },
  { objectName: null, fieldName: 'deletedAt', ptLabel: 'Excluído em', enLabel: 'Deleted at' },
  { objectName: null, fieldName: 'position', ptLabel: 'Posição', enLabel: 'Position' },
  { objectName: null, fieldName: 'createdBy', ptLabel: 'Criado por', enLabel: 'Created by' },
  { objectName: null, fieldName: 'updatedBy', ptLabel: 'Atualizado por', enLabel: 'Updated by' },
  { objectName: null, fieldName: 'searchVector', ptLabel: 'Vetor de busca', enLabel: 'Search vector' },
  // Relation targets shared by many objects
  { objectName: null, fieldName: 'taskTargets', ptLabel: 'Tarefas', enLabel: 'Tasks' },
  { objectName: null, fieldName: 'noteTargets', ptLabel: 'Notas', enLabel: 'Notes' },
  { objectName: null, fieldName: 'attachments', ptLabel: 'Anexos', enLabel: 'Attachments' },
  { objectName: null, fieldName: 'timelineActivities', ptLabel: 'Atividades', enLabel: 'Timeline Activities' },

  // ── Person (Contato) ─────────────────────────────────────────────────────
  { objectName: 'person', fieldName: 'name', ptLabel: 'Nome', enLabel: 'Name' },
  { objectName: 'person', fieldName: 'emails', ptLabel: 'E-mails', enLabel: 'Emails' },
  { objectName: 'person', fieldName: 'linkedinLink', ptLabel: 'LinkedIn', enLabel: 'Linkedin' },
  { objectName: 'person', fieldName: 'jobTitle', ptLabel: 'Cargo', enLabel: 'Job Title' },
  { objectName: 'person', fieldName: 'phones', ptLabel: 'Telefones', enLabel: 'Phones' },
  { objectName: 'person', fieldName: 'avatarUrl', ptLabel: 'Foto', enLabel: 'Avatar' },
  { objectName: 'person', fieldName: 'avatarFile', ptLabel: 'Foto', enLabel: 'Avatar File' },
  { objectName: 'person', fieldName: 'company', ptLabel: 'Empresa', enLabel: 'Company' },
  { objectName: 'person', fieldName: 'opportunities', ptLabel: 'Leads', enLabel: 'Opportunities' },
  { objectName: 'person', fieldName: 'messageParticipants', ptLabel: 'Participações em mensagens', enLabel: 'Message Participants' },
  { objectName: 'person', fieldName: 'calendarEventParticipants', ptLabel: 'Eventos de calendário', enLabel: 'Calendar Event Participants' },
  { objectName: 'person', fieldName: 'companyId', ptLabel: 'ID da empresa', enLabel: 'Company Id' },

  // ── Company (Empresa) ────────────────────────────────────────────────────
  { objectName: 'company', fieldName: 'name', ptLabel: 'Nome', enLabel: 'Name' },
  { objectName: 'company', fieldName: 'domainName', ptLabel: 'Site da empresa', enLabel: 'Domain Name' },
  { objectName: 'company', fieldName: 'address', ptLabel: 'Endereço', enLabel: 'Address' },
  { objectName: 'company', fieldName: 'linkedinLink', ptLabel: 'LinkedIn', enLabel: 'Linkedin' },
  { objectName: 'company', fieldName: 'annualRevenue', ptLabel: 'Receita anual', enLabel: 'Annual Revenue' },
  { objectName: 'company', fieldName: 'people', ptLabel: 'Contatos', enLabel: 'People' },
  { objectName: 'company', fieldName: 'accountOwner', ptLabel: 'Responsável', enLabel: 'Account Owner' },
  { objectName: 'company', fieldName: 'accountOwnerId', ptLabel: 'ID do responsável', enLabel: 'Account Owner Id' },
  { objectName: 'company', fieldName: 'opportunities', ptLabel: 'Leads', enLabel: 'Opportunities' },

  // ── Opportunity (Lead) ───────────────────────────────────────────────────
  { objectName: 'opportunity', fieldName: 'name', ptLabel: 'Nome', enLabel: 'Name' },
  { objectName: 'opportunity', fieldName: 'amount', ptLabel: 'Valor', enLabel: 'Amount' },
  { objectName: 'opportunity', fieldName: 'closeDate', ptLabel: 'Data de fechamento', enLabel: 'Close date' },
  { objectName: 'opportunity', fieldName: 'stage', ptLabel: 'Etapa', enLabel: 'Stage' },
  { objectName: 'opportunity', fieldName: 'pointOfContact', ptLabel: 'Contato responsável', enLabel: 'Point of Contact' },
  { objectName: 'opportunity', fieldName: 'pointOfContactId', ptLabel: 'ID do contato', enLabel: 'Point of Contact Id' },
  { objectName: 'opportunity', fieldName: 'company', ptLabel: 'Empresa', enLabel: 'Company' },
  { objectName: 'opportunity', fieldName: 'companyId', ptLabel: 'ID da empresa', enLabel: 'Company Id' },
  { objectName: 'opportunity', fieldName: 'owner', ptLabel: 'Responsável', enLabel: 'Owner' },
  { objectName: 'opportunity', fieldName: 'ownerId', ptLabel: 'ID do responsável', enLabel: 'Owner Id' },

  // ── Task (Tarefa) ────────────────────────────────────────────────────────
  { objectName: 'task', fieldName: 'title', ptLabel: 'Título', enLabel: 'Title' },
  { objectName: 'task', fieldName: 'bodyV2', ptLabel: 'Descrição', enLabel: 'Body' },
  { objectName: 'task', fieldName: 'dueAt', ptLabel: 'Prazo', enLabel: 'Due Date' },
  { objectName: 'task', fieldName: 'status', ptLabel: 'Status', enLabel: 'Status' },
  { objectName: 'task', fieldName: 'assignee', ptLabel: 'Responsável', enLabel: 'Assignee' },
  { objectName: 'task', fieldName: 'assigneeId', ptLabel: 'ID do responsável', enLabel: 'Assignee Id' },

  // ── Note (Nota) ──────────────────────────────────────────────────────────
  { objectName: 'note', fieldName: 'title', ptLabel: 'Título', enLabel: 'Title' },
  { objectName: 'note', fieldName: 'bodyV2', ptLabel: 'Conteúdo', enLabel: 'Body' },

  // ── Workspace Member ─────────────────────────────────────────────────────
  { objectName: 'workspaceMember', fieldName: 'name', ptLabel: 'Nome', enLabel: 'Name' },
  { objectName: 'workspaceMember', fieldName: 'colorScheme', ptLabel: 'Esquema de cores', enLabel: 'Color Scheme' },
  { objectName: 'workspaceMember', fieldName: 'locale', ptLabel: 'Idioma', enLabel: 'Language' },
  { objectName: 'workspaceMember', fieldName: 'avatarUrl', ptLabel: 'Foto', enLabel: 'Avatar Url' },
  { objectName: 'workspaceMember', fieldName: 'userEmail', ptLabel: 'E-mail', enLabel: 'User Email' },
  { objectName: 'workspaceMember', fieldName: 'userId', ptLabel: 'ID do usuário', enLabel: 'User Id' },

  // ── Calendar Event ───────────────────────────────────────────────────────
  { objectName: 'calendarEvent', fieldName: 'title', ptLabel: 'Título', enLabel: 'Title' },
  { objectName: 'calendarEvent', fieldName: 'description', ptLabel: 'Descrição', enLabel: 'Description' },
  { objectName: 'calendarEvent', fieldName: 'startsAt', ptLabel: 'Início', enLabel: 'Start' },
  { objectName: 'calendarEvent', fieldName: 'endsAt', ptLabel: 'Fim', enLabel: 'End' },
  { objectName: 'calendarEvent', fieldName: 'isFullDay', ptLabel: 'Dia inteiro', enLabel: 'Is Full Day' },
];

@RegisteredInstanceCommand('2.16.0', 1783728000000)
export class TranslateStandardFieldLabelsFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const t of FIELD_TRANSLATIONS) {
      if (t.objectName === null) {
        await queryRunner.query(
          `UPDATE core."fieldMetadata"
           SET "label" = $1
           WHERE "name" = $2`,
          [t.ptLabel, t.fieldName],
        );
      } else {
        await queryRunner.query(
          `UPDATE core."fieldMetadata"
           SET "label" = $1
           WHERE "name" = $2
             AND "objectMetadataId" IN (
               SELECT id FROM core."objectMetadata"
               WHERE "nameSingular" = $3
             )`,
          [t.ptLabel, t.fieldName, t.objectName],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const t of FIELD_TRANSLATIONS) {
      if (t.objectName === null) {
        await queryRunner.query(
          `UPDATE core."fieldMetadata"
           SET "label" = $1
           WHERE "name" = $2`,
          [t.enLabel, t.fieldName],
        );
      } else {
        await queryRunner.query(
          `UPDATE core."fieldMetadata"
           SET "label" = $1
           WHERE "name" = $2
             AND "objectMetadataId" IN (
               SELECT id FROM core."objectMetadata"
               WHERE "nameSingular" = $3
             )`,
          [t.enLabel, t.fieldName, t.objectName],
        );
      }
    }
  }
}
