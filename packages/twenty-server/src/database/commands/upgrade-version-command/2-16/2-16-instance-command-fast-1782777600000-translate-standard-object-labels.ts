// FORK: Voka CRM — traduz labels dos objetos padrão para PT-BR no metadata
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782777600000)
export class TranslateStandardObjectLabelsFastInstanceCommand
  implements FastInstanceCommand
{
  private readonly labels: [string, string, string][] = [
    ['company', 'Empresa', 'Empresas'],
    ['person', 'Contato', 'Contatos'],
    ['opportunity', 'Lead', 'Leads'],
    ['task', 'Tarefa', 'Tarefas'],
    ['taskTarget', 'Alvo de Tarefa', 'Alvos de Tarefa'],
    ['note', 'Nota', 'Notas'],
    ['noteTarget', 'Alvo de Nota', 'Alvos de Nota'],
    ['dashboard', 'Painel', 'Painéis'],
    ['workflow', 'Automação', 'Automações'],
    ['workflowVersion', 'Versão de Automação', 'Versões de Automação'],
    ['workflowRun', 'Execução de Automação', 'Execuções de Automação'],
    ['workflowAutomatedTrigger', 'Gatilho Automatizado', 'Gatilhos Automatizados'],
    ['workspaceMember', 'Membro', 'Membros'],
    ['attachment', 'Anexo', 'Anexos'],
    ['calendarEvent', 'Evento', 'Eventos'],
    ['message', 'Mensagem', 'Mensagens'],
    ['messageThread', 'Conversa', 'Conversas'],
    ['messageCampaign', 'Campanha', 'Campanhas'],
    ['callRecording', 'Gravação', 'Gravações'],
    ['timelineActivity', 'Atividade', 'Atividades'],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [nameSingular, labelSingular, labelPlural] of this.labels) {
      await queryRunner.query(
        `UPDATE core."objectMetadata"
         SET "labelSingular" = $1, "labelPlural" = $2
         WHERE "nameSingular" = $3`,
        [labelSingular, labelPlural, nameSingular],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to English originals
    const originals: [string, string, string][] = [
      ['company', 'Company', 'Companies'],
      ['person', 'Person', 'People'],
      ['opportunity', 'Opportunity', 'Opportunities'],
      ['task', 'Task', 'Tasks'],
      ['taskTarget', 'Task Target', 'Task Targets'],
      ['note', 'Note', 'Notes'],
      ['noteTarget', 'Note Target', 'Note Targets'],
      ['dashboard', 'Dashboard', 'Dashboards'],
      ['workflow', 'Workflow', 'Workflows'],
      ['workflowVersion', 'Workflow Version', 'Workflow Versions'],
      ['workflowRun', 'Workflow Run', 'Workflow Runs'],
      ['workflowAutomatedTrigger', 'Workflow Automated Trigger', 'Workflow Automated Triggers'],
      ['workspaceMember', 'Workspace Member', 'Workspace Members'],
      ['attachment', 'Attachment', 'Attachments'],
      ['calendarEvent', 'Calendar event', 'Calendar events'],
      ['message', 'Message', 'Messages'],
      ['messageThread', 'Message Thread', 'Message Threads'],
      ['messageCampaign', 'Campaign', 'Campaigns'],
      ['callRecording', 'Call Recording', 'Call Recordings'],
      ['timelineActivity', 'Timeline Activity', 'Timeline Activities'],
    ];

    for (const [nameSingular, labelSingular, labelPlural] of originals) {
      await queryRunner.query(
        `UPDATE core."objectMetadata"
         SET "labelSingular" = $1, "labelPlural" = $2
         WHERE "nameSingular" = $3`,
        [labelSingular, labelPlural, nameSingular],
      );
    }
  }
}
