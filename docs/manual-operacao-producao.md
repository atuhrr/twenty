# Manual de Operação — Zellate em Produção

> **Público:** quem mantém o Zellate no ar (hoje: o fundador + Claude Code).
> **Escopo:** commit, deploy, migrations, análise dentro do servidor, análise de logs e
> resolução dos problemas já conhecidos. Atualizado em 11/07/2026.
>
> ⚠️ **Nunca escreva segredos neste arquivo.** Chaves e senhas moram só em
> `/opt/voka/deploy/.env` (chmod 600) no servidor.

---

## 1. Mapa do ambiente

| Item | Valor |
|---|---|
| Servidor | Hetzner, `root@95.217.152.146` (Ubuntu 24.04, Docker 29, swap 8 GB) |
| Firewall | UFW liberando só 22/80/443 + fail2ban |
| Repo no servidor | `/opt/voka`, branch **`feat/whatsapp-integration`** |
| Stack | `deploy/docker-compose.prod.yml` + `/opt/voka/deploy/.env` |
| Domínio | `https://app.zellate.com` — Cloudflare (SSL **Full**) → Traefik v3.6 (Let's Encrypt + rate-limit) |
| Serviços do compose | `traefik`, `server`, `worker`, `db` (PostgreSQL), `redis`, `backup` |
| Volumes | `traefik-certs`, `server-data`, `db-data` |
| E-mail | Resend via `smtp.resend.com:587`, remetente `nao-responda@zellate.com` |
| Backups | Bucket S3 `zellate-backups` na região **hel1** (Hetzner Object Storage), cron 03:00 UTC, retenção 14 dias |

Papéis dos serviços:

- **traefik** — proxy reverso: TLS (Let's Encrypt), roteamento do domínio, rate-limit. Só ele expõe portas para fora.
- **server** — API GraphQL/REST, serve o front pré-buildado, segura as conexões SSE do Inbox.
- **worker** — filas (BullMQ/Redis): webhook do WhatsApp, webhook do Asaas, crons (lembretes de fatura, etc.). **Não** roda migrations nem registra crons no boot (`DISABLE_DB_MIGRATIONS` / `DISABLE_CRON_JOBS_REGISTRATION: 'true'`) — remover isso corrompe o banco (duplicate `pg_type`).
- **db** — PostgreSQL, dados em volume `db-data`. Não exposto para fora do Docker.
- **redis** — filas **e** o pub/sub do tempo real do Inbox (canal `zellate:whatsapp:msg:<workspaceId>`).
- **backup** — dump do Postgres + rclone para o bucket (cron interno do container às 03:00 UTC; o crontab do root no host fica **vazio** de propósito).

### 1.1 Acesso ao servidor

```bash
ssh root@95.217.152.146
cd /opt/voka          # tudo se opera daqui
```

O acesso é por **chave SSH** (a chave privada está na máquina local do fundador; senha
desabilitada). Se trocar de máquina, gere um par novo e adicione a pública em
`/root/.ssh/authorized_keys` **antes** de descartar a máquina antiga.

Atalho recomendado no `~/.ssh/config` local:

```
Host zellate
  HostName 95.217.152.146
  User root
```

---

## 1.2 Segredos — onde estão e como acessar

Existem **três cofres**, cada um com um tipo de segredo:

### a) `/opt/voka/deploy/.env` (chmod 600, só root) — segredos de infraestrutura

Ler: `ssh root@95.217.152.146 "cat /opt/voka/deploy/.env"`. Variáveis presentes:

| Variável | O que é | Onde se obtém/renova |
|---|---|---|
| `DOMAIN` | `app.zellate.com` | — |
| `ACME_EMAIL` | e-mail do Let's Encrypt | — |
| `APP_SECRET` | chave-mestra do Twenty: assina JWTs **e criptografa segredos no banco** | gerada uma vez; **perdê-la = perder tokens salvos no banco** — está no backup do `.env` |
| `PG_PASSWORD` | senha do PostgreSQL | usada só dentro da rede Docker |
| `IS_MULTIWORKSPACE_ENABLED` | `true` (multiworkspace ligado em 15/07/2026) | — |
| `IS_MULTIWORKSPACE_SINGLE_DOMAIN_ENABLED` | `true` — todas as workspaces no domínio único `app.zellate.com`; a workspace é resolvida pelo token de login, não pelo subdomínio | — |
| `EMAIL_DRIVER`, `SMTP_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM` | SMTP Resend (`smtp.resend.com:587`, user `resend`) | painel resend.com → API Keys |
| `CAPTCHA_DRIVER`, `CAPTCHA_SITE_KEY`, `CAPTCHA_SECRET_KEY` | Cloudflare Turnstile | dash.cloudflare.com → Turnstile |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION` | credenciais do backup (bucket `zellate-backups`, região `hel1`) | console Hetzner → Object Storage |
| `META_VERIFY_TOKEN` | token de verificação do webhook do WhatsApp | definido por nós; tem de bater com o painel Meta |

**Editar um segredo:**

```bash
ssh root@95.217.152.146
nano /opt/voka/deploy/.env
cd /opt/voka && docker compose -f deploy/docker-compose.prod.yml up -d server worker  # recria com o env novo
```

> Regra: variável opcional **não pode existir com valor vazio** (`VAR=` quebra a validação
> de config do Twenty). Ou tem valor válido, ou apague a linha.

### b) Banco de dados (criptografados com `APP_SECRET`) — segredos por workspace

Configurados **pela UI do app**, não por env:

- **WhatsApp/Meta**: access token e App Secret do app Meta → Configurações → Integrações → WhatsApp.
- **Asaas**: `apiKeyEncrypted` + `webhookToken` na tabela `core."financeiroConta"` → Configurações → Financeiro.

Nunca ficam legíveis no banco; para trocar, use a própria tela de configuração.

### c) Painéis externos (conta do fundador `atuhrr@gmail.com`)

| Painel | O que controla |
|---|---|
| Cloudflare | DNS do zellate.com, SSL (modo **Full**), Turnstile |
| Hetzner Console | o servidor + Object Storage (backups) |
| developers.facebook.com (app 2480890755742204) | WhatsApp Cloud API: webhook, App Secret, templates, nome de exibição |
| resend.com | SMTP + verificação do domínio de e-mail |
| asaas.com | conta de cobrança (Pix/cartão/boleto), chave de API, webhooks |

> **Backup dos segredos:** o `.env` não está no git (correto). Mantenha uma cópia dele em
> local seguro fora do servidor (gerenciador de senhas). O backup automático cobre o
> **banco**, não o `.env`.

---

## 1.3 Operando a stack (Docker, Redis, Postgres, Traefik)

### Docker Compose — comandos do dia a dia

Sempre a partir de `/opt/voka` e sempre com `-f deploy/docker-compose.prod.yml`
(vale criar o alias `alias dc='docker compose -f deploy/docker-compose.prod.yml'`):

```bash
dc ps                        # estado de todos os serviços
dc logs -f server            # logs ao vivo (Ctrl+C sai)
dc restart server            # reinicia SEM rebuild (config/env não muda!)
dc up -d server worker       # recria containers (aplica .env novo e imagem nova)
dc stop server && dc start server
dc exec server sh            # shell dentro do container
dc exec server node dist/command/command.js --help   # CLI do Twenty
dc down                      # ⚠️ derruba TUDO (site fora do ar); dados sobrevivem nos volumes
dc up -d                     # sobe tudo de volta
```

Diferenças que importam:
- **`restart`** reinicia o processo com a MESMA imagem e MESMO env. Não serve para aplicar
  `.env` editado nem imagem rebuildada — para isso é **`up -d`** (recria o container).
- **`down` não apaga dados** (volumes `db-data` etc. persistem). `down -v` apagaria — **nunca usar**.
- Reboot do host: os serviços têm `restart: unless-stopped`, sobem sozinhos. Conferir com `dc ps`.

### Redis

```bash
dc exec redis redis-cli
> INFO memory              # uso de memória
> INFO clients             # conexões (server + worker)
> KEYS bull:*              # filas BullMQ
> LLEN bull:whatsapp-queue:failed
> PUBSUB CHANNELS zellate:*   # tempo real do Inbox
> FLUSHALL                 # ⚠️ NUNCA — apaga filas com jobs pendentes
```

O Redis aqui é **descartável mas não gratuito**: perder o dado = perder jobs enfileirados
ainda não processados (webhooks chegando naquele instante). Não persiste nada de negócio —
o negócio mora no Postgres.

### PostgreSQL

```bash
dc exec db psql -U postgres -d default        # entrar no banco (Seção 3.2 tem as queries)
dc exec db pg_dump -U postgres -Fc default > /root/dump-manual.dump   # dump manual
dc exec db psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('default'));"
```

### Traefik

Sem painel; opera-se por logs e labels no compose:

```bash
dc logs traefik --tail 50                     # erros de certificado/roteamento
dc exec traefik sh -c "ls /letsencrypt"       # certificados no volume traefik-certs
```

Certificado renova sozinho (Let's Encrypt). Se o site cair com erro TLS: conferir que o
Cloudflare está em SSL **Full** (Flexible causa loop de redirect) e ver os logs do traefik.

---

## 2. Ritual de deploy (o caminho feliz)

### 2.0 Como o código chega no servidor (modelo mental — leia antes)

O deploy **não é** "só um `git pull`" nem "empurrar uma imagem Docker pronta". É um **híbrido de
três partes**, porque o servidor Hetzner não tem memória para buildar o front:

```
┌─ SUA MÁQUINA (Windows) ──────────────┐        ┌─ SERVIDOR (Hetzner /opt/voka) ─────────┐
│                                      │        │                                        │
│ 1. código-fonte  ──── git push ──────┼───────►│  git pull  (traz o fonte novo)         │
│                                      │        │                                        │
│ 2. front buildado ─── scp (tar) ─────┼───────►│  extrai em packages/twenty-front/build │
│    (nx build twenty-front)           │        │                                        │
│                                      │        │  3. docker compose build server        │
│                                      │        │     (monta a IMAGEM aqui, do fonte      │
│                                      │        │      + front extraído) → voka-crm:latest│
│                                      │        │                                        │
│                                      │        │  4. docker compose up -d server worker  │
│                                      │        │     (recria os containers com a imagem) │
└──────────────────────────────────────┘        └────────────────────────────────────────┘
```

Em uma frase: **o fonte vai por `git pull`; o front vai pré-buildado por `scp`; a imagem Docker
é montada NO servidor** (não existe registry — a imagem `voka-crm:latest` só existe na máquina).
Consequências práticas que explicam os erros mais comuns:

- **Commitou e não deu push?** O `git pull` no servidor não vê a mudança → deploy sobe código velho.
- **Não mandou o `build/` do front novo antes do `build server`?** A imagem **copia o front velho**
  que já está no disco (o Dockerfile pula o build do front quando `build/` existe). Sempre: **scp do
  front → depois `build server`**.
- **Só `restart` em vez de `up -d`?** `restart` reusa a MESMA imagem e o MESMO `.env` — não aplica
  imagem nova nem `.env` editado. Para aplicar, é **`up -d server worker`** (recria o container).
- **Editou só o `.env`** (segredos/flags, fora do git)? Aí não tem `git pull`/imagem — basta
  `up -d server worker` para o container reler o env.

### 2.1 Build do front (na máquina local, Git Bash)

```bash
cd /c/Users/atuhr/crm/twenty
NODE_OPTIONS="--max-old-space-size=5120" npx nx build twenty-front
echo "EXIT=${PIPESTATUS[0]}"          # se usar | tail, o exit do tail mascara o do nx!
```

**Verificação obrigatória do artefato** (já shipamos bundle velho por pular isso):

```bash
grep -rl "uma-string-nova-do-seu-codigo" packages/twenty-front/build/assets/
```

Se o grep não achar, o build falhou ou o nx replayou cache velho — **não shipe**.

### 2.2 Commit e push

```bash
cd /c/Users/atuhr/crm/twenty        # SEMPRE — o cwd do shell deriva e o git dá exit 128
git add <paths>
git commit --no-gpg-sign -m "feat(...): ..."
git push origin feat/whatsapp-integration
```

### 2.3 Envio do front + rebuild do server

```bash
cd /c/Users/atuhr/crm/twenty/packages/twenty-front
tar -czf /tmp/voka-front-build.tgz build
scp /tmp/voka-front-build.tgz root@95.217.152.146:/opt/voka/voka-front-build.tgz
```

No servidor:

```bash
cd /opt/voka
git pull --ff-only origin feat/whatsapp-integration
rm -rf packages/twenty-front/build
tar -xzf voka-front-build.tgz -C packages/twenty-front/ && rm voka-front-build.tgz

# Build da imagem — NUNCA com nohup (morre com a sessão SSH, exit 130).
systemctl reset-failed voka-build 2>/dev/null
systemd-run --unit=voka-build --working-directory=/opt/voka \
  /usr/bin/docker compose -f deploy/docker-compose.prod.yml build server

journalctl -u voka-build -f                 # acompanhar
systemctl show voka-build -p Result --value # "success" quando terminar

docker compose -f deploy/docker-compose.prod.yml up -d server worker
docker compose -f deploy/docker-compose.prod.yml logs -f server | grep -m1 "Nest application successfully started"
```

> O Dockerfile **pula** o lingui e o build do front quando `packages/twenty-front/build/`
> já existe (guard do commit `921d0d1f`). Por isso o tar precisa chegar **antes** do build
> da imagem.

### 2.4 Prova final (do domínio, não do disco)

O hash do `index-*.js` **não muda** quando só chunks lazy mudam. A prova real é baixar o
chunk novo do domínio e grepar a string nova nele:

```bash
ssh root@95.217.152.146 "grep -rl 'string-nova' /opt/voka/packages/twenty-front/build/assets/"
curl -s "https://app.zellate.com/assets/<ChunkEncontrado>.js" | grep -c "string-nova"   # tem de dar ≥1
curl -s -o /dev/null -w "%{http_code}\n" https://app.zellate.com/healthz                # 200
```

Atenção: o Vite pode separar código novo num **chunk próprio** (ex.: `useWhatsappSSE-*.js`),
não no chunk da página. Se o grep der 0 no chunk esperado, procure em todos antes de
concluir que o deploy falhou.

### 2.5 Migrations (quando o deploy inclui instance command novo)

O boot roda `upgrade`, mas com a instância já na versão atual ele **pula** comandos fork
novos. Rodar manualmente (idempotente — comandos já executados são pulados):

```bash
docker compose -f deploy/docker-compose.prod.yml exec server \
  node dist/command/command.js run-instance-commands --force
```

Para **reexecutar** um comando que "completou" sem efeito (depois de corrigi-lo):

```sql
DELETE FROM core."upgradeMigration" WHERE name LIKE '%NomeDoComando%';
```

…e rodar o `--force` de novo. Depois de mexer em **metadata** (objetos/campos):

```bash
docker compose -f deploy/docker-compose.prod.yml exec server yarn command:prod cache:flush
```

E avisar o usuário que o navegador precisa de **hard reload** (Ctrl+Shift+R) — metadata
velho no front gera erros "unknown fields".

### 2.6 Receita completa (copiar de cima a baixo)

Sequência única de um deploy típico (código + front). Troque `SUA-STRING-NOVA` por um trecho de
texto que só existe no código desta entrega (serve de prova de que o bundle certo subiu).

```bash
# ── NA SUA MÁQUINA (Git Bash) ─────────────────────────────────────────────
cd /c/Users/atuhr/crm/twenty

# 1. Build do front
NODE_OPTIONS="--max-old-space-size=5120" npx nx build twenty-front
echo "EXIT=${PIPESTATUS[0]}"                                   # tem de ser 0
grep -rl "SUA-STRING-NOVA" packages/twenty-front/build/assets/ # tem de achar algo — senão NÃO shipe

# 2. Commit + push (sem isso, o git pull no servidor não vê nada)
git add <arquivos>
git commit --no-gpg-sign -m "feat(...): ..."
git push origin feat/whatsapp-integration

# 3. Empacotar e enviar o front pré-buildado
cd packages/twenty-front
tar -czf /tmp/voka-front-build.tgz build
scp /tmp/voka-front-build.tgz root@95.217.152.146:/opt/voka/voka-front-build.tgz

# ── NO SERVIDOR ───────────────────────────────────────────────────────────
ssh root@95.217.152.146
cd /opt/voka

# 4. Puxar o fonte novo e trocar o front pelo recém-enviado (ANTES do build da imagem!)
git pull --ff-only origin feat/whatsapp-integration
rm -rf packages/twenty-front/build
tar -xzf voka-front-build.tgz -C packages/twenty-front/ && rm voka-front-build.tgz

# 5. (Só se mudou .env — flags/segredos) editar e conferir
# nano deploy/.env

# 6. Buildar a imagem NO servidor (nunca nohup — use systemd-run)
systemctl reset-failed voka-build 2>/dev/null
systemd-run --unit=voka-build --working-directory=/opt/voka \
  /usr/bin/docker compose -f deploy/docker-compose.prod.yml build server
journalctl -u voka-build -f                                   # Ctrl+C quando terminar
systemctl show voka-build -p Result --value                   # "success"

# 7. Recriar os containers com a imagem nova (e o .env novo)
docker compose -f deploy/docker-compose.prod.yml up -d server worker
docker compose -f deploy/docker-compose.prod.yml logs -f server | grep -m1 "Nest application successfully started"

# 8. Migrations (só se a entrega tem instance command novo) — ver 2.5
# docker compose -f deploy/docker-compose.prod.yml exec server node dist/command/command.js run-instance-commands --force

# ── PROVA FINAL (do domínio, não do disco) ────────────────────────────────
curl -s -o /dev/null -w "%{http_code}\n" https://app.zellate.com/healthz   # 200
CHUNK=$(ssh root@95.217.152.146 "grep -rl 'SUA-STRING-NOVA' /opt/voka/packages/twenty-front/build/assets/ | head -1 | xargs -n1 basename")
curl -s "https://app.zellate.com/assets/$CHUNK" | grep -c "SUA-STRING-NOVA"  # ≥ 1
```

> Se o passo 6 falhar, veja `journalctl -u voka-build` e a Seção 5.8. Se o server não subir no
> passo 7, quase sempre é variável de ambiente vazia no `.env` (Seção 5.8, item 2).

---

## 3. Análises dentro do servidor

### 3.1 Saúde geral

```bash
docker compose -f deploy/docker-compose.prod.yml ps        # tudo Up?
df -h /                                                    # disco (já lotou uma vez!)
free -h                                                    # memória + swap
docker system df                                           # imagens/volumes acumulados
docker system prune -f                                     # limpar builds antigos (seguro)
```

### 3.2 Entrar no banco

```bash
docker compose -f deploy/docker-compose.prod.yml exec db psql -U postgres -d default
```

Estrutura: schema **`core`** (usuários, workspaces, billing, metadata, tabelas fork como
`whatsappMessage`, `fatura`, `salesbot`) e um schema **por workspace**
(`workspace_<id-sem-hifens>`) com os dados de CRM (opportunity, person, company, task…).

Consultas úteis:

```sql
-- Workspaces e estado de ativação
SELECT id, "displayName", "activationStatus" FROM core.workspace;

-- Descobrir o schema de um workspace (o nome deriva do id)
SELECT nspname FROM pg_namespace WHERE nspname LIKE 'workspace_%';

-- ⚠️ core."dataSource" fica VAZIA nesta versão — nunca fazer JOIN com ela;
-- o schema é derivado no código por getWorkspaceSchemaName(workspaceId).

-- Últimas mensagens de WhatsApp
SELECT "contactId", direction, LEFT(content, 60) AS content, "createdAt"
FROM core."whatsappMessage" ORDER BY "createdAt" DESC LIMIT 20;

-- Janela de contato (nome, lead vinculado, bot pausado, janela de 24h)
SELECT "contactName", "phoneNumber", "opportunityId", "botPaused", "lastInboundAt"
FROM core."whatsappContactWindow" ORDER BY "lastInboundAt" DESC LIMIT 20;

-- Faturas e eventos (auditoria/idempotência de webhook)
SELECT "numeroSeq", status, "valorCentavos", "createdAt" FROM core.fatura ORDER BY "createdAt" DESC LIMIT 20;
SELECT tipo, detalhe, "createdAt" FROM core."faturaEvento" ORDER BY "createdAt" DESC LIMIT 20;

-- Migrations fork já executadas
SELECT name, "createdAt" FROM core."upgradeMigration" ORDER BY "createdAt" DESC LIMIT 20;

-- Leads de um workspace (troque o schema)
SELECT name, stage, "isUnclassified", "createdAt"
FROM workspace_xxxx.opportunity ORDER BY "createdAt" DESC LIMIT 20;
```

### 3.3 Redis (filas e tempo real)

```bash
docker compose -f deploy/docker-compose.prod.yml exec redis redis-cli

> KEYS bull:*                          # filas BullMQ
> LLEN bull:whatsapp-queue:failed      # jobs falhos (investigar se > 0)
> PUBSUB CHANNELS zellate:*            # canais de tempo real ativos
> MONITOR                              # ver tráfego ao vivo (Ctrl+C para sair; usar com parcimônia)
```

Teste de fumaça do tempo real (com um Inbox aberto no navegador):

```bash
> PUBSUB NUMPAT        # ≥1 = o server está com psubscribe ativo
```

### 3.4 Backup

```bash
# Rodar um backup manual e conferir a saída
docker compose -f deploy/docker-compose.prod.yml exec backup sh /backup.sh
docker compose -f deploy/docker-compose.prod.yml logs backup --tail 50
```

Gotcha: o rclone precisa da variável de região (**hel1**) — sem ela o CreateBucket manda
`us-east-1` e dá `NoSuchBucket`/`LocationConstraint`.

**Restauração (ensaie antes de precisar):** baixar o dump do bucket, `docker compose stop
server worker`, `psql` para dropar/recriar o database, `pg_restore`, subir de novo.

---

## 4. Análise de logs

### 4.1 Onde cada coisa aparece

| Sintoma | Onde olhar |
|---|---|
| Erro de API / GraphQL / login | `logs server` |
| WhatsApp não chega / bot não responde / lembrete não sai | `logs worker` (webhooks e crons rodam lá) |
| Fatura não atualiza após pagamento | `logs worker` (webhook Asaas) + tabela `faturaEvento` |
| 502/SSL/domínio | `logs traefik` |
| Build da imagem | `journalctl -u voka-build` |
| Backup | `logs backup` |

### 4.2 Comandos

```bash
cd /opt/voka
docker compose -f deploy/docker-compose.prod.yml logs server --since 30m --tail 200
docker compose -f deploy/docker-compose.prod.yml logs -f worker          # ao vivo

# Filtros que mais usamos
docker compose -f deploy/docker-compose.prod.yml logs server --since 2h | grep -iE "error|exception" | tail -40
docker compose -f deploy/docker-compose.prod.yml logs worker --since 2h | grep -i whatsapp | tail -40
docker compose -f deploy/docker-compose.prod.yml logs worker --since 2h | grep -iE "asaas|financeiro" | tail -40
docker compose -f deploy/docker-compose.prod.yml logs server --since 1h | grep -i "tempo real"   # avisos do pub/sub
```

### 4.3 Convenção de erros do fork

O server lança erros com **prefixo** e o front traduz em snackbar amigável. Ao ver esses
prefixos no log, o significado é:

| Prefixo | Significado | Ação |
|---|---|---|
| `META_ERROR:` | A API do WhatsApp (Meta) rejeitou o envio | Ler o código Meta na mensagem (ex.: 131037 = nome de exibição pendente de aprovação) |
| `WINDOW_EXPIRED` | Fora da janela de 24h — só template aprovado pode ser enviado | Configurar/usar template de lembrete |
| `ASAAS_ERROR:` | A API do Asaas rejeitou a operação | A descrição vem do próprio Asaas; conferir chave/permissões |
| `FINANCEIRO_NAO_CONECTADO` | Workspace sem conta Asaas conectada | Conectar em Configurações → Financeiro |

---

## 5. Resolução de problemas (casos já vividos)

### 5.1 "Sorry, something went wrong" no app
Quase sempre é **front velho contra server novo** (ou vice-versa) ou bundle quebrado shipado.
1. `curl https://app.zellate.com/healthz` → 200? Se não, ver logs do server.
2. Conferir se o chunk servido tem o código esperado (Seção 2.4).
3. Hard reload no navegador. Se persistir, olhar o console do navegador (F12).

### 5.2 Mensagem de WhatsApp não chega no CRM
1. No painel Meta (developers.facebook.com): o webhook está **verificado** e o campo
   **`messages` assinado**? (Já esquecemos de assinar o campo — nada chega sem isso.)
2. `logs worker` na hora do teste: chegou POST? Assinatura válida?
   - "invalid signature" → o **App Secret** no CRM não bate com o painel Meta
     (já aconteceu: valor copiado errado por overlay de gerenciador de senhas).
3. Chegou mas não virou lead → conferir `whatsappContactWindow` e `opportunity`
   (`isUnclassified = true`) no banco.

### 5.3 Envio para o WhatsApp falha
- Log com `META_ERROR: ... 131037` → nome de exibição do número pendente de aprovação na Meta.
- `WINDOW_EXPIRED` → mais de 24h desde a última mensagem do cliente; só template aprovado.
- Número internacional errado → regra: **inbound nunca ganha prefixo 55** (`normalizeWaId`);
  o 55 só é adicionado a números digitados pelo usuário com menos de 12 dígitos.

### 5.4 Salesbot não dispara
1. O gatilho está como **`[{"type":"ALWAYS"}]`** no banco? (Uma vez foi salvo como KEYWORD
   com a palavra "sempre" — não é a mesma coisa.)
2. `botPaused` na `whatsappContactWindow` do contato?
3. `logs worker` — o executor loga cada disparo.

### 5.5 Inbox não atualiza em tempo real
1. F12 → aba Network → tem uma conexão `whatsapp/sse/events` pendurada? (Reconecta a cada 3s se cair.)
2. No Redis: `PUBSUB NUMPAT` ≥ 1 com um Inbox aberto?
3. `logs server | grep -i "tempo real"` — o publish é best-effort e loga warning se falhar.
4. Rede de segurança: mesmo sem SSE, o polling de 60s atualiza.

### 5.6 Migration fork "rodou" mas não teve efeito
Causa clássica: comando consultando `core."dataSource"` (vazia) em vez de derivar o schema
por `getWorkspaceSchemaName`. Corrigir o comando, apagar as linhas dele em
`core."upgradeMigration"` e rodar `run-instance-commands --force` de novo (Seção 2.5).

### 5.7 Build do front falha ou gera bundle velho
- **OOM local (errno 1455)**: pagefile do Windows debilitado — usar
  `NODE_OPTIONS="--max-old-space-size=5120"`; cura definitiva é reiniciar o Windows.
- **Exit mascarado**: nunca confiar em `| tail`; usar `${PIPESTATUS[0]}`.
- **Cache do nx**: sempre grepar uma string nova no artefato antes de shipar.

### 5.8 Server não sobe após rebuild
1. `journalctl -u voka-build` → o build da imagem terminou com `Result=success`?
2. `logs server --tail 100` → erro de **validação de config** costuma ser variável de
   ambiente com string vazia (`VAR: ${X:-}` injeta `""` e o Twenty rejeita — a variável
   opcional precisa **não existir** ou ter default válido).
3. Conferir que o compose builda o stage certo (`build.target: twenty`) — sem isso builda o
   stage dev com Postgres embutido.

### 5.9 Disco cheio
Já derrubou o ambiente uma vez (camadas de build acumuladas).

```bash
df -h /
docker system prune -f          # seguro
docker image prune -a -f        # remove imagens não usadas (o próximo build refaz)
journalctl --vacuum-size=200M
```

### 5.10 E-mail não sai
Resend exige o domínio `zellate.com` **verificado** no painel deles. Ver `logs server`
na hora do envio (erro SMTP aparece lá).

---

## 6. Checklist de deploy (resumo de bolso)

1. [ ] Build local do front com `NODE_OPTIONS` + `${PIPESTATUS[0]}` = 0
2. [ ] `grep -rl "string-nova" build/assets/` encontra o chunk
3. [ ] `cd /c/Users/atuhr/crm/twenty` antes de qualquer `git`
4. [ ] Commit + push na `feat/whatsapp-integration`
5. [ ] tar + scp do `build/` → extrair em `/opt/voka/packages/twenty-front/`
6. [ ] `git pull` no servidor + `systemd-run --unit=voka-build ... build server`
7. [ ] `up -d server worker` + esperar "Nest application successfully started"
8. [ ] Se houver migration nova: `run-instance-commands --force` (+ `cache:flush` se metadata)
9. [ ] Prova do domínio: curl do chunk novo + `healthz` 200
10. [ ] Teste funcional da feature no app real
