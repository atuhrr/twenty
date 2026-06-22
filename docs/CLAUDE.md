# PROMPT MESTRE — Fork Twenty CRM + WhatsApp (Evolution API → Cloud API oficial)

> Cole este arquivo na raiz do repositório como `CLAUDE.md` (ou use como prompt inicial da sessão). Ele é a fonte de verdade para todas as sessões do Claude Code neste projeto.
>
> **Arquivo companheiro:** `docs/DESIGN_SPEC.md` define cores, tokens e anatomia de cada componente de UI. É leitura obrigatória antes dos Epics 4 e 5. Persiga aqueles valores-alvo, mapeando para tokens do `twenty-ui` quando existirem e usando Linaria custom quando não.

---

## 0. PAPEL E REGRAS DE OURO

Você é Engenheiro Full-Stack Sênior especialista no **core real do Twenty CRM**. Vai customizar um fork do Twenty integrando WhatsApp via Evolution API.

**Regras inegociáveis (lê antes de qualquer linha de código):**

1. **EXPLORE ANTES DE ASSUMIR.** Você tem acesso ao filesystem. Nunca invente caminho de arquivo, nome de classe, nome de tabela ou import. Sempre localize com `grep`/`glob`/leitura de arquivo real antes de editar. Se não achou, diga "não encontrei X" — não alucine.
2. **NUNCA reescreva um arquivo inteiro** para mudar 5 linhas. Use edições cirúrgicas (str_replace). Reescrita completa só para arquivos novos.
3. **ECONOMIA DE TOKENS é prioridade.** Leia o mínimo necessário (use `grep -n` e `view` com range, não `cat` em arquivo de 2000 linhas). Não repita código já no contexto. Não cole conteúdo de arquivo que você só precisa editar.
4. **SEM PLACEHOLDERS.** Proibido `// TODO: resto aqui` ou `// ... código antigo`. Código de produção, completo e funcional, ou não escreve.
5. **UMA FASE POR SESSÃO.** Ao terminar uma fase, faça commit, rode os testes de aceitação dela, reporte ✅/❌ por critério, e PARE. Eu vou rodar `/clear` e te chamar para a próxima fase com contexto limpo.
6. **TESTE O QUE VOCÊ FAZ.** Toda fase tem "Definition of Done" testável. Você não declara uma fase pronta sem rodar o teste e mostrar a saída real (não inventada).
7. **Respostas em português.** Explicações textuais mínimas (1–2 frases por bloco).

---

## 1. STACK REAL DO TWENTY (corrigida — o briefing original estava errado)

| Camada | Tecnologia REAL | NÃO é |
|---|---|---|
| ORM | **TypeORM 0.3.x** + `WorkspaceEntityManager` (multi-tenant) | ~~Prisma~~ |
| Objetos de negócio | **Metadata de workspace** (custom objects/fields via SDK `defineObject` ou API de metadata) | ~~entidades estáticas em schema~~ |
| GraphQL server | **GraphQL Yoga 4** | ~~Apollo Server~~ |
| Frontend state | **Jotai** + **Apollo Client 4** | ~~Recoil~~ |
| Estilo | **Linaria (CSS-in-JS, zero-runtime)** + design system `twenty-ui` | ~~Tailwind~~ |
| Runtime | Node 24, Yarn 4.13, NestJS 11 | — |

**Implicações que você DEVE respeitar:**
- **Não existe `schema.prisma`.** Mudanças de dados são feitas via migrations TypeORM do Twenty (`yarn database:migrate`) e/ou via metadata de workspace. Antes de criar qualquer tabela, confirme na Fase 0 como o Twenty da sua versão faz isso.
- Componentes novos usam `styled` do Linaria + tokens do `twenty-ui`. Nada de classe Tailwind.
- O switch de workspace **não é** "trocar header do Apollo": o Twenty emite token por workspace. Use o fluxo nativo de workspace switching.

---

## 1.5. DECISÃO DE WHATSAPP: CLOUD API OFICIAL (PAGA) VIA EVOLUTION v2

Usaremos a **WhatsApp Cloud API oficial da Meta**, não o modo Baileys/QR. A Evolution API v2 entra apenas como **gateway/normalizador** em modo Cloud API — ela traduz os webhooks da Meta para um formato único e expõe um REST consistente, então o `whatsapp.service.ts` fala só com a Evolution e não muda se um dia trocar o provedor.

**Consequências que mudam o design (respeite em todos os epics):**
- **Sem QR Code.** A conexão é por credenciais: `phoneNumberId`, `wabaId` (WhatsApp Business Account ID), `accessToken` permanente e `appSecret`. A tela de Settings (Epic 4) coleta/valida essas credenciais e mostra status — **não** renderiza QR.
- **Número dedicado + verificação.** Cada um dos 3 workspaces tem seu próprio número, WABA e Business Manager verificado. Modele credenciais por workspace.
- **Janela de serviço de 24h.** Responder dentro de 24h após a última mensagem do cliente = mensagem livre e **grátis**. Fora da janela, só **template aprovado** (utility/marketing), que tem custo. O service deve saber em que janela está cada contato (guardar `lastInboundAt`).
- **Templates.** Mensagens proativas (ex.: automação do Epic 6) exigem `templateName` + `languageCode` + parâmetros, pré-aprovados no Business Manager. Modele uma tabela/config de templates por workspace.
- **Validação de webhook da Meta.** Verificação inicial via `hub.challenge` (GET) e validação de assinatura `X-Hub-Signature-256` (HMAC SHA-256 com o `appSecret`) em cada POST. Isso substitui o token simples do plano antigo.
- **Sem risco de ban / sem "simular digitação" como gambiarra.** O delay de 3000ms do Epic 6 vira opcional/estético (a Cloud API tem `typing indicator` próprio se desejado), não um disfarce anti-detecção.

---

## 2. FASE -1 — FORK E SETUP DO REPOSITÓRIO (uma vez só)

Antes de qualquer reconhecimento de código:

1. O fork do `twentyhq/twenty` para a conta do usuário é feito **manualmente na UI do GitHub** (botão "Fork"). Não tente forkar via API sem confirmar que o `gh` CLI está autenticado.
2. Clone o fork do usuário: `git clone git@github.com:<USUARIO>/twenty.git`.
3. Adicione o upstream para puxar updates depois: `git remote add upstream https://github.com/twentyhq/twenty.git` e `git fetch upstream`.
4. Crie a branch de trabalho: `git checkout -b feat/whatsapp-integration`.
5. Confirme a versão/tag em que o fork está e registre em `docs/RECON.md`.

**DoD Fase -1:** `git remote -v` mostra `origin` (fork do usuário) e `upstream` (twentyhq); branch `feat/whatsapp-integration` ativa.

---

## 3. FASE 0 — RECONHECIMENTO (OBRIGATÓRIA, antes de tudo)

Não escreva código de feature aqui. Só descubra e **registre num arquivo `docs/RECON.md`** as respostas:

1. Versão exata do Twenty no fork (`package.json` raiz e `twenty-server`).
2. Como se adicionam migrations TypeORM neste repo (procure scripts em `package.json` do server, ex.: `database:migrate`, `typeorm migration:generate`). Cole o comando real.
3. Onde ficam as entidades do core e como o `WorkspaceEntityManager` é usado (`grep -rn "WorkspaceEntityManager"`).
4. Como objetos custom são definidos hoje (procure `defineObject`, `metadata`, `standardObjectMetadata`).
5. Estrutura real de pastas do front para: board/kanban, right drawer, settings, sidebar. **Liste os caminhos reais** (os do briefing original podem não existir).
6. Como o front injeta queries GraphQL (geração de código? `gql` manual?).
7. Se já existe worker/fila (BullMQ) e como jobs são registrados.
8. Como rodar o projeto localmente (docker-compose existente? `yarn start`?).

**DoD Fase 0:** `docs/RECON.md` preenchido com comandos e caminhos reais verificados. Sem isso, NÃO avança.

---

## 4. EPICS (ordem de execução)

Cada epic = uma sessão. Commit + testes verdes antes de seguir.

### EPIC 1 — Infra local (sem deploy ainda)
- `docker-compose.dev.yml`: serviços `db` (Postgres 16), `redis`, `server`, `worker`, `front`, `evolution-api` (modo Cloud API). Healthchecks em todos. `mem_limit` por serviço. Rede interna isolada. Volumes nomeados para Postgres e Evolution.
- `.env.example`: consolidar tudo — `PG_DATABASE_URL`, `APP_SECRET`, `REDIS_URL`, `SERVER_URL`, `FRONT_BASE_URL`, bloco Evolution (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`) e bloco Meta Cloud API por workspace (`META_APP_SECRET`, `META_VERIFY_TOKEN`, e por instância: `WABA_ID`, `PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`). **Nunca** commitar `.env` real; tokens da Meta ficam criptografados no banco, o `.env` só tem o de dev.
- **DoD:** `docker compose -f docker-compose.dev.yml up` sobe tudo healthy; `curl` no healthcheck do server e da Evolution retorna 200; front abre no browser.

### EPIC 2 — Modelo de dados WhatsApp
Decida na Fase 0 entre: (a) entidades TypeORM no schema core, ou (b) custom objects via metadata. Justifique a escolha em `docs/RECON.md`. Implemente:
- `WhatsappInstance`: `workspaceId`, `wabaId`, `phoneNumberId`, `accessTokenEncrypted`, `appSecretEncrypted`, `connectionStatus` (enum), `displayPhoneNumber`, timestamps.
- `WhatsappMessage`: `workspaceId`, `contactId`, `direction` (INBOUND/OUTBOUND), `type` (TEXT/IMAGE/AUDIO/DOCUMENT/TEMPLATE), `content`, `mediaUrl`, `externalMessageId` (**único**, para idempotência), `status` (SENT/DELIVERED/READ/FAILED), `timestamp`.
- `WhatsappContactWindow` (ou campo no contato): `lastInboundAt` por contato, para saber se a janela de 24h está aberta.
- `WhatsappTemplate`: `workspaceId`, `name`, `languageCode`, `category`, `bodyParamsSchema` — espelha os templates aprovados no Business Manager.
- Migration aplicável via o comando real descoberto na Fase 0.
- **DoD:** migration roda sem erro; `\d whatsapp_message` mostra as colunas; índice único em `externalMessageId` existe (teste: inserir duplicado falha).

### EPIC 3 — Backend core
- `whatsapp.service.ts`: wrapper Evolution v2 em modo Cloud API. Métodos `registerInstance` (salva credenciais), `sendTextMessage`, `sendTemplateMessage`, `checkConnectionStatus`, `markAsRead`. accessToken/appSecret lidos criptografados por workspace. Timeout + retry exponencial. **Testes unitários** mockando HTTP.
- `whatsapp.resolver.ts` (GraphQL Yoga): queries `whatsappMessages(contactId)`, `whatsappConnectionStatus`, `whatsappTemplates`; mutations `connectWhatsapp` (recebe e valida credenciais Meta), `sendWhatsappMessage`. Guards de workspace.
- `whatsapp.controller.ts`: dois handlers no `:workspaceId`:
  - `@Get('webhook/:workspaceId')` → verificação inicial da Meta: ecoa `hub.challenge` se `hub.verify_token` bater com `META_VERIFY_TOKEN`.
  - `@Post('webhook/:workspaceId')` → **valida assinatura `X-Hub-Signature-256`** (HMAC SHA-256 com `appSecret` do workspace); responde 200 rápido e **enfileira** o processamento num job (worker), não inline. Job: higieniza número BR → busca/cria contato → grava mensagem com dedupe por `externalMessageId` → atualiza `lastInboundAt` se INBOUND.
- **Higienização BR (regra explícita):** remove não-dígitos; garante DDI `55`; trata 9º dígito (a Cloud API às vezes entrega `wa_id` sem o 9 após o DDD); normaliza para `55DDDNNNNNNNNN`. Cobrir com teste unitário (casos: com/sem 9, com/sem +55, número fixo).
- **Eventos do webhook Meta a tratar:** `messages` (entrantes), `statuses` (sent/delivered/read/failed). Atualizar `WhatsappMessage.status` a partir dos `statuses`.
- **DoD:** unit tests do service e da higienização verdes; GET de verificação retorna o challenge com token correto e 403 com token errado; POST com payload `messages` (fixture) e assinatura válida cria contato+mensagem; assinatura inválida → 401; reenvio do mesmo payload NÃO duplica (idempotência).

### EPIC 4 — Front: conexão e multi-workspace
> Leia `docs/DESIGN_SPEC.md` antes (sidebar, badge de status, tela de Settings).
- Usar o **workspace switcher nativo** do Twenty (descoberto na Fase 0) — não criar troca de header manual. Se precisar de ajuste visual, estilizar com `twenty-ui` conforme o spec.
- `WhatsappSettings.tsx` (Linaria, não Tailwind): formulário para colar credenciais Meta (`wabaId`, `phoneNumberId`, `accessToken`, `appSecret`) → mutation `connectWhatsapp` valida contra a Graph API e salva criptografado; mostra status conectado + número exibido. **Sem QR.** Mostrar também a URL de webhook a configurar no Business Manager.
- Badge de conexão no rodapé da sidebar refletindo `whatsappConnectionStatus` (verde "Conectado" / cinza "Desconectado").
- **DoD:** colar credenciais válidas → status vira "Conectado" e número aparece; credenciais inválidas → erro claro; cada workspace mostra a própria conexão; badge da sidebar reflete o estado.

### EPIC 5 — Front: Kanban + Chat
> Leia `docs/DESIGN_SPEC.md` antes — ele define o card do kanban, os balões de chat, as tags de origem e o input. Persiga aqueles valores.
- Card do board: exibir `lastWhatsappMessage` (preview), tempo decorrido (relativo), tag de origem. Buscar via query existente do board + campo novo (evitar N+1).
- Right drawer com abas **Chat | Detalhes** (usar o padrão de tabs do `twenty-ui`).
- `ChatTab.tsx`: lista mensagens do `contactId` (balões INBOUND/OUTBOUND estilizados com Linaria), input + botão enviar → mutation `sendWhatsappMessage`. **Realtime:** atualizar via SSE/subscription do GraphQL Yoga; se inviável na versão, polling com intervalo configurável.
- **DoD:** abrir lead mostra histórico; enviar mensagem aparece otimista e persiste; mensagem recebida via webhook aparece no chat aberto sem reload (realtime/polling); card mostra preview da última msg.

### EPIC 6 — Automação reativa
- Listener NestJS no evento de mudança de stage da Oportunidade. Se stage → "Reunião Agendada": busca credenciais do workspace e dispara mensagem via `whatsapp.service`, **respeitando a janela de 24h**:
  - Se `lastInboundAt` do contato < 24h → envia mensagem livre (free-form), grátis.
  - Se ≥ 24h ou nunca → envia **template aprovado** (`sendTemplateMessage`) com os parâmetros configurados.
- Idempotente (não dispara 2x para a mesma transição). Roda no worker, não bloqueia a request. Delay de digitação é opcional/estético.
- **DoD:** mover card para "Reunião Agendada" com janela aberta gera 1 mensagem OUTBOUND free-form gravada; com janela fechada usa template; mover de volta e de novo não duplica indevidamente; teste de integração do listener verde (cobrindo os dois caminhos da janela).

### EPIC 7 — DEPLOY NA VPS (só depois de TODO o resto verde local)
Pré-requisitos que você deve validar/listar antes:
- VPS mínima sugerida: 4 vCPU / 8 GB RAM / 80 GB SSD (Twenty + Postgres + Redis + Evolution + worker). Confirme consumo real medido localmente.
- **Domínio + HTTPS obrigatórios:** a Meta só entrega webhook em URL pública HTTPS com certificado válido. Configurar reverse proxy (Caddy ou Traefik) com TLS automático. Webhook = `https://SEU_DOMINIO/whatsapp/webhook/:workspaceId`, cadastrado no Business Manager de cada workspace.
- **Pré-prod (fora do Claude Code):** cada workspace precisa de número dedicado, WABA criada, Business Manager verificado e templates aprovados. Liste isso como checklist manual para o usuário.
- `docker-compose.prod.yml`: imagens fixadas por tag (sem `latest`), restart policy, sem portas de DB/Redis expostas publicamente, secrets via env do host.
- Firewall: abrir só 80/443. Backup automatizado do Postgres (cron + `pg_dump` + retenção).
- **DoD:** smoke test em produção — login, conectar credenciais Meta, receber 1 mensagem real (cliente manda → aparece no chat) e responder dentro da janela, automação de stage dispara. Webhook verificado pela Meta com TLS válido.

---

## 5. ESTRATÉGIA DE ISOLAMENTO DO FORK (evitar conflito com upstream)
- Todo código novo em **módulos isolados** (`modules/whatsapp/...`) e arquivos novos. Evitar editar arquivos do core; quando inevitável, edição mínima e marcada com comentário `// FORK:`.
- Manter `upstream` como remote; rebase periódico. Registrar pontos de toque no core em `docs/FORK_NOTES.md`.

## 6. PROTOCOLO DE ECONOMIA DE TOKENS (por sessão)
1. Releia só este `CLAUDE.md` + o `docs/RECON.md` + os arquivos da fase atual.
2. Para localizar: `grep -rn "termo"` / `glob`. Para ler: `view` com range. Nunca `cat` em arquivo gigante.
3. Não recolar no chat código que já está num arquivo — referencie o caminho.
4. Ao terminar a fase: commit, rodar testes de aceitação, colar **apenas a saída real** dos testes, marcar ✅/❌ por critério, e parar.
5. Se o contexto encher antes do fim de um arquivo: pare no fim de um arquivo completo e peça "Continue".

## 7. FORMATO DE ENTREGA POR FASE
```
## Fase N — <nome>
Arquivos criados/editados: <lista de caminhos>
Comandos rodados: <comandos>
Resultado dos testes (saída real):
<colar saída>
DoD:
- [✅/❌] critério 1
- [✅/❌] critério 2
Próximo passo: rodar /clear e iniciar Fase N+1.
```

---

### Comece pela **FASE -1** (fork/setup) e depois a **FASE 0** (reconhecimento). Não escreva código de feature até `docs/RECON.md` estar preenchido e verificado.
