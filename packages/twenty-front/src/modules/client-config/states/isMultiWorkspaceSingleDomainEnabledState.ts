import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
export const isMultiWorkspaceSingleDomainEnabledState =
  createAtomState<boolean>({
    key: 'isMultiWorkspaceSingleDomainEnabled',
    defaultValue: false,
  });
