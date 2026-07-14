import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { isMultiWorkspaceSingleDomainEnabledState } from '@/client-config/states/isMultiWorkspaceSingleDomainEnabledState';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useReadDefaultDomainFromConfiguration = () => {
  const domainConfiguration = useAtomStateValue(domainConfigurationState);
  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const isMultiWorkspaceSingleDomainEnabled = useAtomStateValue(
    isMultiWorkspaceSingleDomainEnabledState,
  );

  // Single-domain mode serves every workspace on the front domain, so the hub
  // (default domain) is the front domain itself — no default subdomain prefix.
  const defaultDomain =
    isMultiWorkspaceEnabled && !isMultiWorkspaceSingleDomainEnabled
      ? `${domainConfiguration.defaultSubdomain}.${domainConfiguration.frontDomain}`
      : domainConfiguration.frontDomain;

  return {
    defaultDomain,
  };
};
