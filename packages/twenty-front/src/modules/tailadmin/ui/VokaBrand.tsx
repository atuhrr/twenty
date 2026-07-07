// FORK: Voka CRM — logo configurável: usa o logo do workspace (upload em
// Configurações → Geral) quando existir; senão, a marca "Voka CRM" em texto.
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { workspacePublicDataState } from '@/auth/states/workspacePublicDataState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isNonEmptyString } from '@sniptt/guards';
import { getImageAbsoluteURI } from 'twenty-shared/utils';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

interface VokaBrandProps {
  className?: string;
  /** Tamanho do logo em px quando imagem (default 32) */
  size?: number;
}

export const VokaBrand = ({ className = '', size = 32 }: VokaBrandProps) => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const workspacePublicData = useAtomStateValue(workspacePublicDataState);

  const rawLogo = currentWorkspace?.logo ?? workspacePublicData?.logo ?? null;
  const logoUrl = isNonEmptyString(rawLogo)
    ? getImageAbsoluteURI({
        imageUrl: rawLogo,
        baseUrl: REACT_APP_SERVER_BASE_URL,
      })
    : null;
  const nome =
    currentWorkspace?.displayName ?? workspacePublicData?.displayName;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {logoUrl !== null ? (
        <>
          <img
            src={logoUrl}
            alt={nome ?? 'Logo'}
            style={{ width: size, height: size }}
            className="rounded-lg object-cover"
          />
          {isNonEmptyString(nome) && (
            <span className="font-bold tracking-tight">{nome}</span>
          )}
        </>
      ) : (
        <span className="font-bold tracking-tight text-brand-500">
          Voka CRM
        </span>
      )}
    </span>
  );
};
