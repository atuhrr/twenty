# RECON.md — FASE 0: Reconhecimento

> Gerado em 2026-06-22. Todos os caminhos e comandos foram verificados no repo real.

---

## 1. Versão exata do Twenty no fork

**Versão da aplicação:** `2.16.0`
Confirmado em:
```
packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-current-version.constant.ts
export const TWENTY_CURRENT_VERSION = '2.16.0' as const;
```

Commit mais recente: `5f22908588` — "Decouple twenty-ui Avatar from app server-URL config"
Commit de bump de versão: `e59e102448` — "chore: bump version to 2.16.0"

> Nota: o `package.json` raiz mostra `"version": "0.2.1"` — este é o version do workspace
> privado Nx (não é a versão do produto). A versão do produto está em `TWENTY_CURRENT_VERSION`.

Stack confirmada:
- Node 24, Yarn 4, NestJS 11, TypeORM 0.3.29 (patched), GraphQL Yoga 4
- `@nestjs/typeorm: 11.0.0`
- typeorm: `patch:typeorm@0.3.29#./patches/typeorm+0.3.29.patch`

---

## 2. Como adicionar migrations TypeORM neste repo

O Twenty **não usa `typeorm migration:generate`** diretamente. Usa "instance commands" próprios.

### Gerar um novo instance command:
```bash
# Necessita build antes (dependsOn: ["build"])
npx nx run twenty-server:database:migrate:generate --name <nome> --type <fast|slow>
```

Internamente executa:
```bash
node dist/command/command.js generate:instance-command
```

Os arquivos gerados ficam em:
```
packages/twenty-server/src/database/commands/upgrade-version-command/<versão>/
```

Exemplo existente:
```
1-21-instance-command-fast-1775165049548-migrate-messaging-calendar-to-core.ts
```

### Rodar as migrations em produção:
```bash
npx nx run twenty-server:database:migrate
# Internamente: node dist/command/command.js run-instance-commands --force
```

### Tipos de command:
- `fast` — apenas DDL (schema changes, sem backfill de dados)
- `slow` — inclui passo `runDataMigration` (para backfill de dados)

Decoradores de descoberta automática (para registrar no runner):
- `@RegisteredInstanceCommand` — comandos por instância
- `@RegisteredWorkspaceCommand` — iteração por workspace

---

## 3. Entidades do core e como o WorkspaceEntityManager é usado

### Entidades (standard objects):
Ficam em arquivos `*.workspace-entity.ts` nos módulos:
```
packages/twenty-server/src/modules/*/standard-objects/*.workspace-entity.ts
```

Exemplos reais:
```
src/modules/company/standard-objects/company.workspace-entity.ts
src/modules/person/standard-objects/person.workspace-entity.ts
src/modules/task/standard-objects/task.workspace-entity.ts
src/modules/attachment/standard-objects/attachment.workspace-entity.ts
src/modules/opportunity/standard-objects/ (inferido do uso em company)
```

As classes são TypeScript puro (sem decorator `@Entity` do TypeORM) — os metadados
são computados separadamente pelos builders de flat field metadata.

### WorkspaceEntityManager:
```
packages/twenty-server/src/engine/twenty-orm/entity-manager/workspace-entity-manager.ts
```

Usado como `transactionManager: WorkspaceEntityManager` nos query runners:
```
src/engine/api/common/common-query-runners/common-merge-many-query-runner.service.ts
src/engine/twenty-orm/query-runner/workspace-query-runner.ts
src/engine/twenty-orm/repository/workspace.repository.ts
```

Acesso via `WorkspaceRepository.transaction(async (transactionManager) => { ... })`.

---

## 4. Como objetos custom/standard são definidos hoje

O Twenty usa um sistema de **metadata de workspace** baseado em "flat field metadata".
**NÃO** usa o padrão `defineObject` do old SDK.

### Padrão real (3 camadas):

**Camada 1 — Workspace Entity (tipo estático):**
```
src/modules/<módulo>/standard-objects/<nome>.workspace-entity.ts
```
Classe TypeScript pura. Exemplo `CompanyWorkspaceEntity`:
```typescript
export class CompanyWorkspaceEntity {
  id: string;
  name: string;
  // ...
  people: EntityRelation<PersonWorkspaceEntity[]>;
}
```

**Camada 2 — Flat Field Metadata (definição de campos):**
```
src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/
  build-*-standard-flat-field-metadata.util.ts
```
Builders que retornam `FlatFieldMetadata[]`:
```
compute-company-standard-flat-field-metadata.util.ts
compute-person-standard-flat-field-metadata.util.ts
...
```

**Camada 3 — Standard Application (registro):**
```
src/engine/workspace-manager/twenty-standard-application/utils/
  twenty-standard-application-all-flat-entity-maps.constant.ts
```

**Tipo base:**
```
src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type.ts
```

> Para objetos novos do WhatsApp: criar `*.workspace-entity.ts` + builder de flat metadata
> e registrar no mapa global. Ver Epic 2 para decisão de abordagem.

---

## 5. Estrutura real de pastas do frontend

> Atenção: o nome "right drawer" **não existe** no repo. O componente equivalente é `side-panel`.

### Board / Kanban:
```
packages/twenty-front/src/modules/object-record/record-board/
├── components/
├── constants/
├── contexts/
├── hooks/
├── record-board-card/          # cards individuais
│   ├── components/
│   ├── hooks/
│   └── states/
├── record-board-column/        # colunas do kanban
│   └── components/
├── states/
├── types/
└── utils/
```

### Right drawer → Side Panel:
```
packages/twenty-front/src/modules/side-panel/
├── components/
├── hooks/
├── pages/
│   ├── ai-chat-threads/
│   ├── ask-ai/
│   ├── compose-email/
│   ├── page-layout/
│   └── record-page/            # ← painel de detalhes do record
├── states/
└── types/

packages/twenty-front/src/modules/object-record/record-side-panel/
└── states/
```

### Settings:
```
packages/twenty-front/src/modules/settings/     # lógica de settings
packages/twenty-front/src/pages/settings/        # rotas/páginas de settings
packages/twenty-front/src/pages/settings/admin-panel/
packages/twenty-front/src/modules/settings/admin-panel/
```

### Sidebar (navigation):
```
packages/twenty-front/src/modules/ui/navigation/navigation-drawer/
├── components/
├── constants/
├── hooks/
├── states/
├── types/
└── utils/

packages/twenty-front/src/modules/navigation/   # lógica de navegação
```

### Workspace Switcher:
Não encontrado como componente standalone com esse nome. A troca de workspace usa
o fluxo de token nativo do Twenty — investigar em `src/modules/auth/` e
`src/modules/ui/navigation/navigation-drawer/` para ponto de extensão exato.

---

## 6. Como o front injeta queries GraphQL

**Abordagem híbrida: codegen estático + factory dinâmica por objeto.**

### Codegen estático:
Configs:
```
packages/twenty-front/codegen.cjs           # API principal
packages/twenty-front/codegen-metadata.cjs  # API de metadata
packages/twenty-front/codegen-admin.cjs     # API de admin
```

Output:
```
packages/twenty-front/src/generated/graphql.ts   # TypedDocumentNode para operações estáticas
```

Comando:
```bash
npx nx run twenty-front:graphql:generate
# ou com config específica:
npx nx run twenty-front:graphql:generate --configuration=metadata
```

O arquivo gerado usa `@graphql-typed-document-node/core`:
```typescript
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
```

### Factory dinâmica (para objetos de workspace):
```
packages/twenty-front/src/modules/object-record/graphql/types/RecordGqlOperationSignatureFactory.ts
packages/twenty-front/src/modules/object-record/hooks/useLazyFindOneRecord.ts
packages/twenty-front/src/modules/object-record/hooks/useLazyFindManyRecords.ts
packages/twenty-front/src/modules/object-record/multiple-objects/hooks/useGenerateCombinedFindManyRecordsQuery.ts
```

Queries de objetos CRM são construídas dinamicamente via `OperationSignature` factories
(não há `gql` templates estáticos para cada objeto — schema é gerado em runtime).

---

## 7. Worker / Fila BullMQ

**Sim, existe.** O Twenty tem uma camada de abstração própria sobre BullMQ/Redis.

### Módulo de fila:
```
packages/twenty-server/src/engine/core-modules/message-queue/
├── message-queue.constants.ts      # enum MessageQueue (todas as filas)
├── decorators/
│   ├── processor.decorator.ts      # @Processor
│   └── process.decorator.ts        # @Process
│   └── message-queue.decorator.ts  # InjectMessageQueue
└── interfaces/
    └── message-queue-module-options.interface.ts  # enum MessageQueueDriverType
```

### Filas disponíveis (enum `MessageQueue`):
```
taskAssignedQueue, messagingQueue, webhookQueue, cronQueue, emailQueue,
calendarQueue, contactCreationQueue, billingQueue, workspaceQueue,
entityEventsToDbQueue, workflowQueue, delayedJobsQueue, deleteCascadeQueue,
logicFunctionQueue, triggerQueue, aiQueue, aiStreamQueue
```

### Padrão de registro de job:
```typescript
// job file: *.job.ts
@Processor(MessageQueue.emailQueue)
export class EmailSenderJob {
  constructor(private readonly emailSenderService: EmailSenderService) {}

  @Process(EmailSenderJob.name)
  async handle(data: SendMailOptions): Promise<void> {
    await this.emailSenderService.send(data);
  }
}
```
Exemplo real: `src/engine/core-modules/email/email-sender.job.ts`

### Enfileirar (enqueue):
```typescript
await this.messageQueueService.add<SendMailOptions>(
  EmailSenderJob.name,
  payload,
);
```
Exemplo real: `src/engine/core-modules/email/email.service.ts:18`

### Fila a usar para WhatsApp:
Criar nova fila `whatsappQueue` no enum `MessageQueue`, ou reutilizar `webhookQueue`
para processamento de webhooks entrantes (decisão no Epic 3).

---

## 8. Como rodar o projeto localmente

### Opção 1 — Script de setup (recomendado para dev):
```bash
bash packages/twenty-utils/setup-dev-env.sh
# Sobe Postgres + Redis (auto-detecta local vs Docker), cria DBs, roda migrations
```

### Opção 2 — Docker só infra (Postgres 16 + Redis 7):
```bash
docker compose -f packages/twenty-docker/docker-compose.dev.yml up -d
```
Serviços: `db` (postgres:16, porta 5432) + `redis` (redis:7, porta 6379)
Healthchecks configurados em ambos.

### Opção 3 — Stack completa em Docker:
```bash
docker compose -f packages/twenty-docker/docker-compose.yml up
```

### Iniciar o projeto (depois de infra pronta):
```bash
# Tudo junto (front + server + worker):
yarn start
# Internamente: concurrently 'nx run-many -t start -p twenty-server twenty-front' + worker

# Individual:
npx nx start twenty-front      # frontend Vite (porta 3001)
npx nx start twenty-server     # NestJS (porta 3000)
npx nx run twenty-server:worker # BullMQ worker
```

---

## Decisão antecipada para Epic 2 — Modelo de dados WhatsApp

**Escolha: entidades TypeORM no schema core** (não custom objects via metadata de workspace).

**Justificativa:**
- `WhatsappInstance`, `WhatsappMessage`, `WhatsappTemplate`, `WhatsappContactWindow` são
  entidades de infra/canal, não objetos de CRM customizáveis pelo usuário final.
- O padrão do Twenty para integrações técnicas (ex.: messaging, calendar) usa TypeORM
  no schema core, não metadata de workspace.
- Custom objects via metadata são para objetos de negócio que o usuário cria via UI
  (ex.: "Proposta", "Contrato") — não para tabelas de infra de integração.
- Migrations via `database:migrate:generate --type fast` são suficientes (DDL puro).

**Ponto de atenção:** Associar `contactId` em `WhatsappMessage` ao objeto `Person`
do workspace requer usar o `workspaceId` como foreign key indireto, já que o schema
de workspace é multi-tenant e isolado por schema Postgres.
