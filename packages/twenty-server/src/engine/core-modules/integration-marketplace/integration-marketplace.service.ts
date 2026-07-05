// FORK: Voka CRM — Fase 16: Integration Marketplace
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InstalledIntegrationEntity } from './installed-integration.entity';

export type IntegrationConfigField = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
};

export type IntegrationDef = {
  key: string;
  name: string;
  description: string;
  category: string;
  logoUrl: string;
  configFields: IntegrationConfigField[];
  events: string[];
  docsUrl?: string;
};

export const INTEGRATION_CATALOG: IntegrationDef[] = [
  {
    key: 'slack',
    name: 'Slack',
    description:
      'Receba notificações no Slack quando leads são criados ou têm etapas alteradas.',
    category: 'Notificações',
    logoUrl: 'https://cdn.simpleicons.org/slack',
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Slack Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://hooks.slack.com/services/...',
      },
      {
        key: 'channel',
        label: 'Canal (opcional)',
        type: 'text',
        required: false,
        placeholder: '#leads',
      },
    ],
    events: ['opportunity.created', 'opportunity.stage_changed'],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
  },
  {
    key: 'zapier',
    name: 'Zapier',
    description:
      'Conecte o Voka CRM a mais de 5.000 apps sem código usando Zapier.',
    category: 'Automações',
    logoUrl: 'https://cdn.simpleicons.org/zapier',
    configFields: [
      {
        key: 'catchHookUrl',
        label: 'Zapier Catch Hook URL',
        type: 'url',
        required: true,
        placeholder: 'https://hooks.zapier.com/hooks/catch/...',
      },
    ],
    events: ['opportunity.created'],
    docsUrl: 'https://zapier.com/apps/webhooks',
  },
  {
    key: 'n8n',
    name: 'n8n',
    description:
      'Automações avançadas com o n8n — self-hosted ou cloud.',
    category: 'Automações',
    logoUrl: 'https://cdn.simpleicons.org/n8n',
    configFields: [
      {
        key: 'webhookUrl',
        label: 'n8n Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://seu-n8n.com/webhook/...',
      },
    ],
    events: ['opportunity.created', 'opportunity.stage_changed'],
  },
  {
    key: 'google_sheets',
    name: 'Google Sheets',
    description:
      'Exporte leads automaticamente para uma planilha do Google Sheets.',
    category: 'Produtividade',
    logoUrl: 'https://cdn.simpleicons.org/googlesheets',
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Apps Script Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://script.google.com/macros/s/...',
      },
    ],
    events: ['opportunity.created'],
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp Business',
    description:
      'Integração nativa com WhatsApp via Evolution API. Configure em Configurações → WhatsApp.',
    category: 'Mensagens',
    logoUrl: 'https://cdn.simpleicons.org/whatsapp',
    configFields: [],
    events: [],
    docsUrl: '/settings/whatsapp',
  },
  {
    key: 'voka_api',
    name: 'API do Voka CRM',
    description:
      'REST e GraphQL para integrar qualquer sistema. Crie chaves de API em Configurações → Desenvolvedores.',
    category: 'Desenvolvedores',
    logoUrl: '',
    configFields: [],
    events: [],
    docsUrl: '/settings/developers',
  },
];

@Injectable()
export class IntegrationMarketplaceService {
  constructor(
    @InjectRepository(InstalledIntegrationEntity)
    private readonly repo: Repository<InstalledIntegrationEntity>,
  ) {}

  getCatalog(): IntegrationDef[] {
    return INTEGRATION_CATALOG;
  }

  async listInstalled(workspaceId: string): Promise<InstalledIntegrationEntity[]> {
    return this.repo.find({ where: { workspaceId } });
  }

  async findInstalled(
    workspaceId: string,
    integrationKey: string,
  ): Promise<InstalledIntegrationEntity | null> {
    return this.repo.findOne({ where: { workspaceId, integrationKey } });
  }

  async install(
    workspaceId: string,
    integrationKey: string,
    config: Record<string, string>,
  ): Promise<InstalledIntegrationEntity> {
    const existing = await this.findInstalled(workspaceId, integrationKey);
    if (existing) {
      existing.config = config;
      existing.enabled = true;
      return this.repo.save(existing);
    }
    return this.repo.save(
      this.repo.create({ workspaceId, integrationKey, config, enabled: true }),
    );
  }

  async update(
    workspaceId: string,
    integrationKey: string,
    config: Record<string, string>,
    enabled: boolean,
  ): Promise<InstalledIntegrationEntity> {
    const existing = await this.findInstalled(workspaceId, integrationKey);
    if (!existing) throw new Error(`Integration ${integrationKey} not installed`);
    existing.config = config;
    existing.enabled = enabled;
    return this.repo.save(existing);
  }

  async uninstall(workspaceId: string, integrationKey: string): Promise<boolean> {
    const existing = await this.findInstalled(workspaceId, integrationKey);
    if (!existing) return false;
    await this.repo.remove(existing);
    return true;
  }
}
