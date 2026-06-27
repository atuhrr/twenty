// FORK: Voka CRM — Produto (Catalog item) custom object
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const PRODUTO_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Produtos',
  labelSingular: 'Produto',
  namePlural: 'produtos',
  nameSingular: 'produto',
  icon: 'IconBox',
  description: 'Item do catálogo de produtos e serviços',
  isRemote: false,
};
