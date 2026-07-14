import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { isMultiWorkspaceEnabledState } from '@/client-config/states/isMultiWorkspaceEnabledState';
import { isMultiWorkspaceSingleDomainEnabledState } from '@/client-config/states/isMultiWorkspaceSingleDomainEnabledState';
import { useReadDefaultDomainFromConfiguration } from '@/domain-manager/hooks/useReadDefaultDomainFromConfiguration';
import { domainConfigurationState } from '@/domain-manager/states/domainConfigurationState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

export const useIsCurrentLocationOnAWorkspace = () => {
  const { defaultDomain } = useReadDefaultDomainFromConfiguration();

  const isMultiWorkspaceEnabled = useAtomStateValue(
    isMultiWorkspaceEnabledState,
  );
  const isMultiWorkspaceSingleDomainEnabled = useAtomStateValue(
    isMultiWorkspaceSingleDomainEnabledState,
  );
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const domainConfiguration = useAtomStateValue(domainConfigurationState);

  if (
    isMultiWorkspaceEnabled &&
    (!isDefined(domainConfiguration.frontDomain) ||
      !isDefined(domainConfiguration.defaultSubdomain))
  ) {
    throw new Error('frontDomain and defaultSubdomain are required');
  }

  // In single-domain mode the hostname never identifies a workspace (all
  // workspaces share the front domain). "Being on a workspace" therefore means
  // an authenticated workspace context is loaded, not a matching hostname.
  const isOnAWorkspace = !isMultiWorkspaceEnabled
    ? true
    : isMultiWorkspaceSingleDomainEnabled
      ? isDefined(currentWorkspace)
      : window.location.hostname !== defaultDomain;

  return {
    isOnAWorkspace,
  };
};
