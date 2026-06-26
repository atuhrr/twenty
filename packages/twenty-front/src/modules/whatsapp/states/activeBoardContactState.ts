import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// recordId of the kanban card whose chat is shown in the persistent right panel
export const activeBoardContactState = createAtomState<string | null>({
  key: 'activeBoardContactState',
  defaultValue: null,
});
