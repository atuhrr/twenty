// FORK: Voka CRM — T-10: Canais conectados (cards TailAdmin)
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { IconAt, IconMessage, IconPhone, IconSend } from 'twenty-ui/icon';

import Badge from '@/tailadmin/ui/Badge';

type Channel = {
  id: string;
  icon: ComponentType<{ size?: number }>;
  name: string;
  description: string;
  settingsPath?: string;
  status: 'configured' | 'available';
  badge?: string;
};

const CHANNELS: Channel[] = [
  {
    id: 'whatsapp',
    icon: IconMessage,
    name: 'WhatsApp Business',
    description: 'Envie e receba mensagens via Meta Cloud API.',
    settingsPath: getSettingsPath(SettingsPath.Whatsapp),
    status: 'configured',
    badge: 'Ativo',
  },
  {
    id: 'email',
    icon: IconAt,
    name: 'E-mail',
    description: 'Conecte contas IMAP/SMTP para envio e recepção de e-mails.',
    settingsPath: getSettingsPath(SettingsPath.AccountsEmails),
    status: 'configured',
  },
  {
    id: 'instagram',
    icon: IconPhone,
    name: 'Instagram Direct',
    description:
      'Responda mensagens diretas do Instagram (requer Facebook Business).',
    status: 'available',
    badge: 'Em breve',
  },
  {
    id: 'telegram',
    icon: IconSend,
    name: 'Telegram',
    description: 'Conecte um bot do Telegram para atendimento.',
    status: 'available',
    badge: 'Em breve',
  },
];

const CardConteudo = ({ channel }: { channel: Channel }) => (
  <>
    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0">
      <channel.icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {channel.name}
        </span>
        {channel.badge !== undefined && (
          <Badge
            color={channel.status === 'configured' ? 'success' : 'light'}
            size="sm"
          >
            {channel.badge}
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {channel.description}
      </p>
    </div>
    {channel.settingsPath !== undefined && (
      <svg
        className="w-4 h-4 text-gray-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    )}
  </>
);

export const SettingsCanaisConectados = () => (
  <div className="p-4 md:p-6">
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        Canais conectados
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Gerencie todos os canais de comunicação do seu CRM.
      </p>
    </div>

    <div className="flex flex-col gap-3 max-w-[680px]">
      {CHANNELS.map((channel) =>
        channel.settingsPath !== undefined ? (
          <Link
            key={channel.id}
            to={channel.settingsPath}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            <CardConteudo channel={channel} />
          </Link>
        ) : (
          <div
            key={channel.id}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] opacity-70"
          >
            <CardConteudo channel={channel} />
          </div>
        ),
      )}
    </div>
  </div>
);
