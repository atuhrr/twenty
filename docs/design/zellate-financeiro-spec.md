# Zellate Financeiro — Especificação e Prompts de Fase

> **Missão:** fechar o ciclo *lead → dinheiro*. O Zellate já capta (webhook/forms),
> conversa (Inbox/bot), qualifica (funil) e acompanha (tarefas/calendário). Este
> módulo faz o que nenhum concorrente entrega redondo para PME brasileira:
> **cobrar pelo WhatsApp com Pix/cartão e confirmar o pagamento sozinho**.
>
> Referência visual: `docs/design/fatura.png` (página Invoices TailAdmin).
> Este documento segue o contrato do `CLAUDE.md` (uma fase por PR, OK explícito
> entre fases, Definition of Done da Seção 6).

---

## 1. O negócio (por que isso vende)

**Dor real:** o dono de PME fecha o negócio no WhatsApp, sai do sistema, abre o
app do banco, gera um Pix na mão, cola na conversa e depois vive perguntando
"pagou?". Cobrança atrasada não é lembrada; recorrência é planilha.

**Promessa do Zellate:** *"o CRM que cobra por você"*:

1. Botão **Cobrar** no lead → fatura criada com o valor do negócio;
2. Cliente recebe **na própria conversa do WhatsApp**: Pix copia-e-cola + QR
   **e** link de pagamento onde ele escolhe **cartão de crédito ou boleto**;
3. Pagou → webhook confirma → fatura **Paga** → lead move para **Ganho**
   sozinho → notificação no sininho → receita aparece nas Estatísticas;
4. Não pagou → lembrete automático de vencimento/atraso pelo WhatsApp.

**Fluxo do dinheiro (modelo da F1 — conta própria):** cada workspace conecta
a **própria conta Asaas** (chave de API do cliente, colada numa tela guiada).
O dinheiro cai direto na conta do cliente — o Zellate **nunca intermedia
valores** (zero risco regulatório para nós) e não cobra nada em cima; nosso
ganho é a assinatura do CRM. Criar a conta no Asaas é grátis e leva minutos;
o onboarding do Zellate guia o cliente passo a passo.

> 🔮 **Evolução planejada:** quando o fundador tiver empresa constituída (PJ),
> o modelo migra para **Zellate Pay** (subcontas white-label criadas por
> dentro do produto + split por transação como segunda linha de receita).
> Está TODO especificado na **Fase F5** deste documento — a arquitetura por
> driver e o modelo de dados da F1 já nascem preparados para essa virada,
> sem retrabalho.

---

## 2. Provedor e custos (transparência total)

**Provedor da Fase F1: Asaas** (asaas.com). Motivos: feito para cobrança de
PME, API simples com sandbox grátis, webhooks confiáveis, e **uma única
cobrança serve Pix + boleto + cartão** (billingType `UNDEFINED` gera a fatura
`invoiceUrl` onde o pagador escolhe o meio — resolve o pedido de "link de
pagamento para cartão" sem provedor extra).

**Tabela de custos Asaas para o cliente do Zellate** (cobrada pelo Asaas, só
quando a cobrança é **efetivamente paga**; emissão não paga é grátis):

| Meio | Custo por cobrança recebida | Observação |
|---|---|---|
| **Pix** | **R$ 1,99** (promo: R$ 0,99 nos 3 primeiros meses) | dinheiro na conta na hora |
| **Boleto** | **R$ 1,99** (promo: R$ 0,99 nos 3 primeiros meses) | compensação 1–2 dias úteis |
| **Cartão de crédito** | percentual sobre a venda + fixo por transação (varia à vista/parcelado) | ver tabela vigente no link abaixo |

> ⚠️ Valores de referência coletados em **10/07/2026** na página oficial
> <https://www.asaas.com/precos-e-taxas> (ver também
> <https://blog.asaas.com/taxas-asaas/> e <https://www.asaas.com/link-pagamento>).
> A UI do Zellate deve exibir esses custos na tela de conexão da conta
> ("Custos do provedor — pagos ao Asaas, não ao Zellate") com link para a
> tabela oficial, e **nunca** apresentá-los como taxa nossa.

**Roadmap de drivers:** arquitetura por driver desde a F1
(`FinanceiroProvider` interface). F1 = Asaas. Futuro: Mercado Pago (marca que
o consumidor final conhece), Efí/Gerencianet (Pix de custo mínimo).
**Stripe descartado** para este público (caro no BR, Pix secundário).

---

## 3. Modelo de dados (core, multi-tenant como whatsapp/salesbot)

```
core."financeiroConta"    — 1..n por workspace
  id, workspaceId, provider ('ASAAS'),
  tipo ('CONTA_PROPRIA' na F1 | 'SUBCONTA_ZELLATE' reservado à F5,
        default 'CONTA_PROPRIA'),
  apiKeyEncrypted, ambiente ('SANDBOX'|'PRODUCAO'), webhookToken,
  statusConta ('CONECTADA'|'ERRO' na F1; a F5 adiciona
               'PENDENTE_DOCUMENTOS'|'EM_ANALISE'|'APROVADA'|'REPROVADA'),
  nomeConta,
  -- campos abaixo NULOS na F1, usados pela F5 (já nascem no schema para a
  -- virada Zellate Pay ser plug-in, sem migração dolorosa):
  walletId, asaasAccountId, onboardingUrl, dadosCadastrais jsonb,
  createdAt/updatedAt

core."fatura"             — a cobrança
  id, workspaceId, numero (sequencial por workspace: ZLT-0001…),
  leadId (uuid, opcional), personId (uuid, opcional), contactWindowId (opcional),
  clienteNome, clienteCpfCnpj (opcional), clienteEmail (opcional), clienteTelefone,
  descricao, valorCentavos, vencimento (date),
  meios ('PIX'|'CARTAO'|'BOLETO'|'TODOS'),
  status ('RASCUNHO'|'PENDENTE'|'PAGA'|'VENCIDA'|'CANCELADA'|'ESTORNADA'),
  provider, providerCobrancaId, providerClienteId,
  linkPagamento (invoiceUrl), pixPayload (copia-e-cola), pixQrCodeBase64,
  pagaEm, valorPagoCentavos, formaPagamento,
  jurosPercent, multaPercent, descontoCentavos (F2),
  nfseStatus/nfseId/nfsePdfUrl (F3, nullable),
  createdAt/updatedAt, índice (workspaceId, status), (workspaceId, vencimento)

core."faturaEvento"       — trilha de auditoria
  id, faturaId, workspaceId, tipo ('CRIADA'|'ENVIADA_WHATSAPP'|'PAGA'|'VENCIDA'|
  'LEMBRETE_ENVIADO'|'CANCELADA'|'NFSE_EMITIDA'|...), payload jsonb, createdAt
```

Regras estruturais (mesmo padrão dos módulos fork existentes):
`TypeOrmModule.forFeature([...])` **sem** segundo argumento; migrations fast
instance command registradas em `INSTANCE_COMMANDS`; chaves de API cifradas
com o `SecretEncryptionService` existente; resolvers GraphQL com
`@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)` e
`WorkspaceScopedRepository`; webhook REST público com validação de token.

---

# FASE F1 — Cobrar e Receber (o coração)

**Prompt:**

Implemente o módulo financeiro do Zellate (driver Asaas) de ponta a ponta:
conectar conta, criar fatura a partir do lead, enviar pelo WhatsApp, receber
confirmação por webhook e refletir no funil. Referência visual da página:
`docs/design/fatura.png`. Nada decorativo: todo elemento da tela liga em dado
real.

**Backend:**
1. Módulo `core-modules/financeiro`: entidades acima (`financeiroConta`,
   `fatura`, `faturaEvento`) + migrations fast instance command.
2. `FinanceiroProvider` (interface): `criarCliente`, `criarCobranca`,
   `obterPix`, `cancelarCobranca`, `validarWebhook`, `testarConexao` —
   e, **reservados para a F5** (declarados na interface, não implementados
   na F1): `criarSubconta`, `statusSubconta`.
   `AsaasProvider` implementa contra `https://api-sandbox.asaas.com/v3`
   (sandbox) e `https://api.asaas.com/v3` (produção) — header `access_token`.
   Todas as operações usam a chave do workspace (`financeiroConta`).
3. Fluxo criar fatura: upsert de cliente no Asaas (nome + CPF/CNPJ opcional +
   telefone do lead vinculado) → `POST /payments` com `billingType`
   conforme escolha do usuário (`PIX` | `CREDIT_CARD` | `BOLETO` |
   `UNDEFINED` = cliente escolhe no link) → guardar `invoiceUrl` +
   `GET /payments/{id}/pixQrCode` (payload copia-e-cola + QR base64).
4. Webhook `POST /financeiro/webhook/:workspaceId` (público): validar
   `asaas-access-token` contra o `webhookToken` da conta; eventos
   `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` → fatura PAGA (+pagaEm, forma,
   valor); `PAYMENT_OVERDUE` → VENCIDA. Idempotente (evento duplicado não
   reprocessa). Registrar `faturaEvento` sempre.
5. Efeitos do pagamento: lead vinculado → `stage: 'GANHO'` e
   `isUnclassified: false` (via GlobalWorkspaceOrmManager, padrão do
   whatsapp-webhook.job); notificação no sininho ("💰 Fatura ZLT-0007 paga —
   R$ 1.500,00 de Fulano"); mensagem de agradecimento opcional na conversa.
6. Envio WhatsApp: mutation `enviarFaturaWhatsapp(faturaId)` — usa o canal
   existente (`whatsappService.sendTextMessage`) para a conversa do lead:
   texto com descrição, valor, vencimento, **Pix copia-e-cola** e **link de
   pagamento** (cartão/boleto). Registrar `ENVIADA_WHATSAPP`.
7. GraphQL: `faturas(filtro)`, `faturaResumo` (cards do overview),
   `criarFatura`, `cancelarFatura`, `enviarFaturaWhatsapp`,
   `conectarFinanceiro(apiKey, ambiente)`, `financeiroStatus`.

**Frontend:**
8. **Configurações → Financeiro** — tela guiada de conexão:
   - Passo a passo ilustrado: "1. Crie sua conta grátis no Asaas (link) →
     2. Painel → Integrações → API → gerar chave → 3. Cole aqui";
   - Campo da chave + ambiente (sandbox/produção) + botão "Testar conexão"
     (mostra nome da conta conectada quando ok);
   - Webhook criado automaticamente via API (`POST /webhooks`) na conexão —
     o cliente não configura nada manualmente;
   - **Quadro de custos da Seção 2 sempre visível**, com link para a tabela
     oficial e a frase "cobrados pelo Asaas por cobrança recebida — o
     Zellate não cobra nada sobre seus recebimentos";
   - Chave exibida mascarada (só últimos 4 caracteres) após salvar.
9. **Página `/faturas`** fiel a `fatura.png`, em PT-BR:
   - Cards do overview: **Vencidas (R$)** · **A vencer em 30 dias (R$)** ·
     **Tempo médio para receber (dias)** · **Recebido no mês (R$)**;
   - Botão **"+ Criar fatura"** → modal central: cliente (buscar lead — puxa
     nome/telefone do contato vinculado — ou digitar avulso), descrição,
     valor (R$), vencimento, meios de pagamento (Pix / Cartão / Boleto /
     Deixar o cliente escolher), juros/multa desabilitados (chegam na F2);
   - Tabela: Nº, Cliente, Criada em, Vencimento, Valor, Status (chips:
     Pendente amarelo, Paga verde, Vencida vermelho, Cancelada cinza), menu
     "⋯" com Ver link, Copiar Pix, **Enviar por WhatsApp**, Cancelar;
   - Abas Todas/Pendentes/Pagas/Vencidas + busca + exportar CSV;
   - Moeda R$ (1.234,56), datas DD/MM/AAAA (glossário CLAUDE.md).
10. **Botão "Cobrar" no painel do lead** (Inbox, aba Principal) e na página
    de detalhe do lead: abre o modal de fatura com cliente/valor
    pré-preenchidos do lead; ao criar, oferece "Enviar agora pelo WhatsApp".
11. Item **Faturas** no menu (ícone lucide `Receipt`), entre Calendário e
    Estatísticas.

**Sem conta conectada:** a página `/faturas` mostra empty-state com o pitch e
botão para Configurações → Financeiro (não esconder o menu).

**DoD F1:** conectar conta sandbox pela tela guiada (webhook criado via
API); criar fatura sandbox no fluxo lead→WhatsApp; pagar no sandbox;
ver status virar Paga sem refresh manual (polling 60s na página é aceitável na
F1); lead move para Ganho; cards do overview batem com a tabela; zero inglês;
typecheck + build + verificação de artefato no domínio (ritual de deploy).

---

# FASE F2 — Cobrança que se cobra sozinha

**Prompt:**

Transforme a fatura em cobrador automático e ligue receita ao funil.

1. **Juros/multa/desconto** no modal (Asaas: `fine`, `interest`,
   `discount`) — percentuais configuráveis com default do workspace em
   Configurações → Financeiro.
2. **Lembretes automáticos via WhatsApp** (motor: cron job no worker, padrão
   dos crons existentes): D-1 do vencimento, D0 e D+1/D+3/D+7 de atraso —
   régua configurável por workspace, com opt-out por fatura. Dentro da janela
   de 24h manda texto normal; fora da janela usa **template aprovado da Meta**
   (pré-requisito: cadastrar templates `lembrete_vencimento` e
   `cobranca_atrasada` — a tela de Templates do WhatsApp já existe).
   Registrar `LEMBRETE_ENVIADO` na trilha.
3. **Recorrência**: assinaturas Asaas (`POST /subscriptions`) ligadas à tela
   Clientes Recorrentes existente — criar/pausar/cancelar mensalidade, faturas
   geradas aparecem na página Faturas normalmente.
4. **Estatísticas de receita** (aba nova em `/estatisticas`): recebido por
   mês (12m), por etapa de origem, por responsável, inadimplência %, ticket
   médio, previsão do mês (pendentes com vencimento no mês).
5. Tempo real na página Faturas: reaproveitar o mecanismo de eventos do
   webhook para invalidar a lista (ou SSE se o do Inbox já existir até lá).

**DoD F2:** régua dispara no sandbox (relógio simulado ou vencimento curto);
recorrência cria fatura mensal visível; estatísticas batem com a tabela;
templates fora da janela documentados na tela.

---

# FASE F3 — Nota fiscal (opcional por natureza)

**Prompt:**

Emissão de **NFS-e** integrada, mantendo o modo "sem nota" como padrão.

1. **Princípio:** nota fiscal é OPCIONAL. Workspace sem configuração fiscal
   continua faturando normalmente (muitos MEI/autônomos não emitem por
   cobrança). Nada do fluxo F1/F2 depende desta fase.
2. **Caminho A (preferido): NFS-e nativa do Asaas** — o Asaas emite NFS-e
   atrelada à cobrança (`POST /invoices`, agendável para "quando pagar").
   Menos um fornecedor, mesma chave. Validar cobertura do município do
   cliente na própria API.
3. **Caminho B (fallback): FocusNFe ou eNotas** como segundo driver
   (`NotaFiscalProvider`), para municípios não cobertos ou cliente que já
   usa outro emissor.
4. Configurações → Financeiro → aba **Nota fiscal**: toggle "Emitir NFS-e"
   (desligado por padrão), dados do prestador (CNPJ, inscrição municipal,
   código de serviço, alíquota ISS), momento da emissão (manual | ao pagar).
5. UI: coluna/badge NFS-e na tabela de faturas (—, Agendada, Emitida com
   link do PDF, Erro com motivo); botão "Emitir nota" no menu ⋯ quando
   manual; PDF anexado à conversa do WhatsApp opcionalmente.
6. Custos de emissão (tabela Asaas/fornecedor) visíveis na tela, mesmo
   padrão de transparência da Seção 2.

**DoD F3:** workspace SEM fiscal configurado: zero mudança de comportamento;
com fiscal: emitir no sandbox/homologação, PDF acessível, erro de emissão não
bloqueia a fatura (status independente).

---

# FASE F4 — Fechamento financeiro (polimento que retém)

**Prompt:**

1. **Conciliação**: página "Recebimentos" com repasses/saldo Asaas
   (`GET /finance/balance`, extrato), diferença bruta×líquida (taxas do
   provedor discriminadas por fatura — reforça a transparência de custos).
2. **Exportações contábeis**: CSV completo + OFX do período para o contador.
3. **Estorno/cancelamento** com trilha (`PAYMENT_REFUNDED` no webhook).
4. **Múltiplas contas** por workspace (ex.: CNPJ separado por unidade) —
   seletor de conta na criação da fatura.
5. **Link de pagamento avulso** (sem lead): gerar link/QR reutilizável para
   balcão (Asaas paymentLinks), listado em aba própria.
6. Automações: expor gatilhos `FATURA_PAGA`/`FATURA_VENCIDA` no motor de
   automações existente (ex.: "quando pagar → criar tarefa de onboarding").

**DoD F4:** exportações abrem no Excel/contabilidade; estorno reflete em
tudo (fatura, lead não regride sozinho — apenas notifica); gatilhos aparecem
no builder de automações.

---

# FASE F5 — Zellate Pay (FUTURO — requer empresa constituída)

> **Status: implementação a ser feita.** Pré-condição de negócio: o fundador
> ter PJ e contrato white-label com o Asaas. Nada da F1–F4 depende desta
> fase; o schema e o driver já nascem preparados (campos anuláveis +
> métodos reservados na interface).

**Prompt:**

Migre o modelo de conexão de "cliente cola a própria chave" para **subcontas
white-label criadas por dentro do Zellate**, com split por transação como
segunda linha de receita.

1. **Conta raiz** (da empresa do fundador) em envs do servidor:
   `ZELLATE_PAY_ROOT_API_KEY` + `ZELLATE_PAY_ROOT_WALLET_ID` (nunca por
   workspace). Habilitação white-label negociada com o gerente Asaas
   (docs: <https://docs.asaas.com/docs/cria%C3%A7%C3%A3o-de-subcontas-whitelabel>).
2. **Onboarding "Ativar recebimentos"** (substitui a tela de colar chave,
   que permanece como caminho alternativo "Já tenho conta Asaas"):
   formulário em passos com dados do negócio (razão social, CPF/CNPJ,
   e-mail, telefone, endereço, tipo de empresa) → `POST /accounts` com a
   chave raiz → resposta traz `apiKey` da subconta (**retornada UMA única
   vez — cifrar e persistir IMEDIATAMENTE, antes de qualquer outro passo**),
   `walletId` e `accountId` → configurar webhooks da subconta via API →
   persistir `onboardingUrl` de envio de documentos → statusConta
   'PENDENTE_DOCUMENTOS'.
3. **KYC embutido:** botão que abre o `onboardingUrl` (envio de documentos
   do Asaas); status ao vivo na tela ("Pendente de documentos" → "Em
   análise" → "Aprovada ✓" → ou "Reprovada" com motivo), atualizado por
   webhooks de status de conta, com notificação no sininho. Tratar o
   bloqueio regulatório de criação de novas subcontas (limites de
   quantidade/valor até avaliação da documentação) como estado de primeira
   classe na UI.
4. **Split:** toda cobrança de subconta Zellate Pay inclui
   `split: [{ walletId: RAIZ, fixedValue: taxa }]` com a taxa da env
   `ZELLATE_PAY_TAXA_CENTAVOS` (sugestão inicial: R$ 0,50 fixo/transação).
   Contas CONTA_PROPRIA seguem sem split. A tela de custos passa a exibir
   DUAS linhas separadas: "taxa do provedor Asaas" e "taxa Zellate Pay" —
   transparência é feature, nunca misturar.
5. **Migração assistida:** workspaces CONTA_PROPRIA veem um convite para
   migrar ("gerenciamos tudo para você") — criar subconta nova e passar a
   usá-la nas próximas faturas; faturas antigas permanecem na conta antiga.
6. Enquanto statusConta ≠ APROVADA: fatura em rascunho permitida, envio de
   cobrança bloqueado com CTA explicando o porquê.

**Pré-requisitos do fundador para a F5:**
1. Empresa constituída (PJ) + conta raiz Asaas verificada em nome dela;
2. Contrato/habilitação white-label com o comercial do Asaas (negociar
   taxas da raiz e entender limites regulatórios de subcontas);
3. Chave de API do sandbox da raiz + walletId;
4. Definição da taxa Zellate Pay por transação.

**DoD F5:** ativar no sandbox cria subconta e persiste apiKey/walletId
cifrados; split presente na cobrança de teste; estados de KYC visíveis e
atualizados por webhook; caminho CONTA_PROPRIA intacto (regressão zero na
F1); migração assistida funcional.

---

## 4. Segurança e conformidade (todas as fases)

- Chave de API cifrada em repouso (`SecretEncryptionService`), nunca logada,
  nunca devolvida ao front (só últimos 4 caracteres).
- Webhook: token secreto por conta + idempotência por `event.id`; responder
  200 rápido e processar via fila (padrão whatsapp-queue).
- Rate limit do Traefik já cobre o endpoint público.
- Valores sempre em **centavos** (inteiro) no banco; formatação R$ só na UI.
- LGPD: CPF/CNPJ do pagador é dado do cliente do workspace; não usar fora do
  fluxo de cobrança.

## 5. Fora de escopo (por decisão)

- Zellate como subadquirente/split de pagamentos (vira regulado — não).
- Gateway próprio de cartão (PCI — não).
- Conta digital embutida (é o negócio do Asaas, não o nosso).

## 6. Pré-requisitos do fundador antes da F1

1. Criar conta em <https://www.asaas.com> (grátis — funciona com CPF; seus
   clientes usarão as contas deles) e gerar a **chave de API do Sandbox**
   (Painel → Integrações → API) para eu desenvolver e testar.
2. Confirmar a tabela de taxas vigente na conta criada (Seção 2).
3. OK explícito para iniciar a F1 (contrato CLAUDE.md §7).

> Os pré-requisitos do **Zellate Pay** (empresa PJ, contrato white-label,
> conta raiz) estão na própria Fase F5 — para quando chegar a hora.
