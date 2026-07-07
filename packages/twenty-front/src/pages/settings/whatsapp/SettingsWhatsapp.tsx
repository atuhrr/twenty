// FORK: Voka CRM — T-10: WhatsApp Business (TailAdmin; hooks preservados)
import { type FormEvent, useState } from 'react';
import { useLingui } from '@lingui/react/macro';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useConnectWhatsapp } from '@/settings/whatsapp/hooks/useConnectWhatsapp';
import { useWhatsappConnectionStatus } from '@/settings/whatsapp/hooks/useWhatsappConnectionStatus';
import Badge from '@/tailadmin/ui/Badge';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  useWhatsappPhoneNumbers,
  type WhatsappPhoneNumber,
} from '@/whatsapp/hooks/useWhatsappPhoneNumbers';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

const FORM_INICIAL = {
  wabaId: '',
  phoneNumberId: '',
  accessToken: '',
  appSecret: '',
  displayPhoneNumber: '',
};

function LinhaNumero({
  num,
  onSetDefault,
  onDelete,
  ocupado,
}: {
  num: WhatsappPhoneNumber;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  ocupado: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex-1 text-sm text-gray-800 dark:text-white/90">
        {num.displayPhoneNumber ?? num.phoneNumberId}
      </span>
      {num.isDefault ? (
        <Badge color="success" size="sm">
          Padrão
        </Badge>
      ) : (
        <button
          onClick={() => onSetDefault(num.id)}
          disabled={ocupado}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
        >
          Tornar padrão
        </button>
      )}
      <button
        onClick={() => onDelete(num.id)}
        disabled={ocupado}
        className="text-xs font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/[0.12] rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
      >
        Excluir
      </button>
    </li>
  );
}

export const SettingsWhatsapp = () => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { status, displayPhoneNumber } = useWhatsappConnectionStatus();
  const { connectWhatsapp, loading } = useConnectWhatsapp();
  const {
    phoneNumbers,
    loading: loadingNumbers,
    settingDefault,
    deleting,
    setDefault,
    deleteNumber,
    refetch: refetchNumbers,
  } = useWhatsappPhoneNumbers();

  const [formValues, setFormValues] = useState(FORM_INICIAL);

  const isConnected = status === 'CONNECTED';

  const webhookUrl =
    typeof currentWorkspace?.id === 'string'
      ? `${REACT_APP_SERVER_BASE_URL}/whatsapp/webhook/${currentWorkspace.id}`
      : `${REACT_APP_SERVER_BASE_URL}/whatsapp/webhook/<workspace-id>`;

  const handleChange =
    (field: keyof typeof formValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const {
      wabaId,
      phoneNumberId,
      accessToken,
      appSecret,
      displayPhoneNumber: phone,
    } = formValues;

    if (
      wabaId === '' ||
      phoneNumberId === '' ||
      accessToken === '' ||
      appSecret === ''
    ) {
      enqueueErrorSnackBar({
        message: t`Preencha WABA ID, Phone Number ID, Access Token e App Secret.`,
      });
      return;
    }

    try {
      const result = await connectWhatsapp({
        wabaId,
        phoneNumberId,
        accessToken,
        appSecret,
        ...(phone !== '' ? { displayPhoneNumber: phone } : {}),
      });

      if (result?.status === 'CONNECTED') {
        enqueueSuccessSnackBar({ message: t`WhatsApp conectado com sucesso.` });
        setFormValues(FORM_INICIAL);
        void refetchNumbers();
      } else {
        enqueueErrorSnackBar({
          message: t`Verifique as credenciais e tente novamente.`,
        });
      }
    } catch {
      enqueueErrorSnackBar({
        message: t`Não foi possível salvar as credenciais.`,
      });
    }
  };

  const campos: {
    chave: keyof typeof formValues;
    rotulo: string;
    placeholder: string;
    tipo?: string;
    obrigatorio: boolean;
  }[] = [
    {
      chave: 'wabaId',
      rotulo: 'WABA ID',
      placeholder: '123456789012345',
      obrigatorio: true,
    },
    {
      chave: 'phoneNumberId',
      rotulo: 'Phone Number ID',
      placeholder: '987654321098765',
      obrigatorio: true,
    },
    {
      chave: 'displayPhoneNumber',
      rotulo: 'Número exibido (opcional)',
      placeholder: '+55 11 99999-9999',
      obrigatorio: false,
    },
    {
      chave: 'accessToken',
      rotulo: 'Access Token permanente',
      placeholder: 'EAAxxxxx...',
      tipo: 'password',
      obrigatorio: true,
    },
    {
      chave: 'appSecret',
      rotulo: 'App Secret',
      placeholder: 'abcdef1234567890...',
      tipo: 'password',
      obrigatorio: true,
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[680px]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          WhatsApp Business
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Conexão via Meta Cloud API — sem QR Code, direto pela API oficial.
        </p>
      </div>

      {/* Status da conexão */}
      <div
        className={`rounded-2xl border p-5 mb-5 ${
          isConnected
            ? 'border-success-500/30 bg-success-50 dark:bg-success-500/[0.08]'
            : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-success-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              isConnected
                ? 'text-success-700 dark:text-success-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
          {isConnected && displayPhoneNumber !== null && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              · {displayPhoneNumber}
            </span>
          )}
        </div>
      </div>

      {/* Webhook */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          URL do Webhook
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Configure esta URL no Meta Business Manager como endpoint de webhook.
        </p>
        <code className="block px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 break-all">
          {webhookUrl}
        </code>
      </div>

      {/* Números conectados */}
      {phoneNumbers.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5 overflow-hidden">
          <div className="px-5 pt-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Números conectados ({phoneNumbers.length})
            </h3>
          </div>
          {loadingNumbers && phoneNumbers.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">Carregando…</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 mt-3">
              {phoneNumbers.map((num) => (
                <LinhaNumero
                  key={num.id}
                  num={num}
                  onSetDefault={setDefault}
                  onDelete={deleteNumber}
                  ocupado={settingDefault || deleting}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Credenciais */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {phoneNumbers.length > 0
            ? 'Adicionar número'
            : 'Credenciais Meta Cloud API'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Cole as credenciais do Meta Business Manager.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {campos.map((c) => (
            <div key={c.chave}>
              <label className={labelClass}>{c.rotulo}</label>
              <input
                type={c.tipo ?? 'text'}
                value={formValues[c.chave]}
                onChange={handleChange(c.chave)}
                placeholder={c.placeholder}
                required={c.obrigatorio}
                className={inputClass}
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {isConnected ? 'Atualizar credenciais' : 'Conectar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
