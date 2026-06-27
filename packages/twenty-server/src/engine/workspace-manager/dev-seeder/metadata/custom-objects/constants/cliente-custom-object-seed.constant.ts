// FORK: Voka CRM — Cliente recorrente (Customer) custom object
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const CLIENTE_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Clientes',
  labelSingular: 'Cliente',
  namePlural: 'clientes',
  nameSingular: 'cliente',
  icon: 'IconUsers',
  description: 'Cliente recorrente da empresa',
  isRemote: false,
};
