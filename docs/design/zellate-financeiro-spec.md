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

**Fluxo do dinheiro — modelo ZELLATE PAY (subcontas white-label):** o Zellate
tem uma **conta raiz** no Asaas e abre uma **subconta em nome de cada cliente
via API**, por dentro do produto — o cliente nunca visita o site do Asaas. O
dinheiro das vendas dele cai na subconta **dele** (segregação financeira por
CNPJ/CPF preservada), e cada cobrança carrega um **split automático** para a
carteira raiz: a taxa Zellate por transação vira **segunda linha de receita**
além da assinatura.

Consequências assumidas: (a) o white-label precisa ser **habilitado pelo
gerente de contas do Asaas** na conta raiz (contato comercial antes da F1);
(b) o KYC continua existindo — os documentos do cliente são enviados pelo
onboarding do Asaas (link/URL embutível na nossa tela), e o Asaas pode
**bloquear a criação de novas subcontas** quando limites regulatórios de
quantidade/valor são atingidos até a documentação ser avaliada — a UI trata
os estados "pendente de documentos" e "em análise" como cidadãos de primeira
classe; (c) a `apiKey` da subconta é retornada **UMA única vez** na criação —
persistir cifrada imediatamente ou a conta fica órfã.

Caminho secundário mantido: cliente que **já tem** conta Asaas pode conectar
colando a própria chave (sem split — vira argumento para migrar para a
subconta Zellate Pay, onde tudo é gerenciado por nós).

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

**Taxa Zellate (split):** sobre cada cobrança recebida via subconta Zellate
Pay, um split fixo configurável (ex.: **R$ 0,50/transação**, definido em
configuração da instância — env `ZELLATE_PAY_TAXA_CENTAVOS`) é transferido
automaticamente à carteira raiz. A tela de custos do cliente exibe as duas
linhas separadas ("taxa do provedor Asaas" e "taxa Zellate Pay") — nunca
misturar. Taxas white-label da conta raiz são negociáveis com o comercial do
Asaas; renegociar com volume.

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
  tipo ('SUBCONTA_ZELLATE'|'CONTA_PROPRIA'),
  apiKeyEncrypted (da SUBconta; retornada 1x na criação — cifrar na hora),
  walletId (para o split), asaasAccountId,
  ambiente ('SANDBOX'|'PRODUCAO'), webhookToken,
  statusConta ('PENDENTE_DOCUMENTOS'|'EM_ANALISE'|'APROVADA'|'REPROVADA'|'ERRO'),
  onboardingUrl (link de envio de documentos do Asaas),
  dadosCadastrais jsonb (nome/razão, cpfCnpj, email, telefone, endereço,
  tipo de empresa — o que foi enviado no POST /accounts),
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
2. `FinanceiroProvider` (interface): `criarSubconta`, `statusSubconta`,
   `criarCliente`, `criarCobranca` (com `split[]`), `obterPix`,
   `cancelarCobranca`, `validarWebhook`, `testarConexao`.
   `AsaasProvider` implementa contra `https://api-sandbox.asaas.com/v3`
   (sandbox) e `https://api.asaas.com/v3` (produção) — header `access_token`.
   **Duas chaves em jogo:** a chave RAIZ (env `ZELLATE_PAY_ROOT_API_KEY` +
   `ZELLATE_PAY_ROOT_WALLET_ID`, só no servidor) é usada apenas para
   `POST /accounts` (criar subconta) e consultas de plataforma; TODAS as
   operações de cobrança usam a chave da SUBconta do workspace.
2b. **Onboarding Zellate Pay** (mutation `ativarZellatePay(dados)`):
   `POST /accounts` com os dados cadastrais do cliente → resposta traz
   `apiKey` (cifrar e persistir IMEDIATAMENTE — só vem uma vez) + `walletId`
   + `accountId` → configurar webhooks da subconta via API em seguida →
   persistir `onboardingUrl` de envio de documentos → statusConta
   'PENDENTE_DOCUMENTOS'. Webhooks de status de conta (aprovação/reprovação)
   atualizam `statusConta` e notificam o sininho. Falha em passo posterior à
   criação NÃO pode perder a apiKey (persistir antes de qualquer outro passo).
2c. **Split:** toda cobrança criada por subconta Zellate Pay inclui
   `split: [{ walletId: RAIZ, fixedValue: taxa }]`. Contas do tipo
   CONTA_PROPRIA não têm split.
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
8. **Configurações → Financeiro — "Ativar recebimentos" (Zellate Pay)**:
   formulário guiado em passos, tudo dentro do produto:
   - Passo 1 — dados do negócio: nome/razão social, CPF/CNPJ, e-mail,
     telefone, endereço, tipo de empresa (MEI/ME/etc.);
   - Passo 2 — criação instantânea da conta de recebimento (POST /accounts
     por baixo; o cliente não vê o Asaas);
   - Passo 3 — **envio de documentos** (KYC): botão que abre o
     `onboardingUrl` do Asaas; a tela mostra o status em tempo real
     ("Pendente de documentos" → "Em análise" → "Aprovada ✓"), atualizado
     por webhook, com aviso honesto de que a aprovação é do provedor;
   - Quadro de custos SEMPRE visível com as duas linhas separadas:
     taxa do provedor (tabela Seção 2) e **taxa Zellate Pay
     (R$ X,XX/transação recebida)** — transparência é feature;
   - Enquanto statusConta ≠ APROVADA: pode criar fatura em rascunho, não
     pode enviar cobrança (CTA explica o porquê);
   - Link discreto "Já tenho conta Asaas" → fluxo alternativo de colar a
     chave própria (tipo CONTA_PROPRIA, sem split).
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

**DoD F1:** ativar Zellate Pay no sandbox cria subconta e persiste
apiKey/walletId cifrados; split da taxa Zellate presente na cobrança de teste;
criar fatura sandbox no fluxo lead→WhatsApp; pagar no sandbox;
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

1. Criar a **conta raiz** do Zellate no Asaas (PJ, em nome da sua empresa)
   em <https://www.asaas.com> e completar o cadastro/verificação dela.
2. **Falar com o comercial/gerente de contas do Asaas** e pedir a habilitação
   de **criação de subcontas white-label** na conta raiz (é liberação
   comercial, não técnica) — aproveitar para negociar as taxas white-label
   e entender os limites regulatórios de criação de subcontas
   (docs: <https://docs.asaas.com/docs/criacao-de-subcontas-whitelabel>).
3. Gerar a **chave de API do Sandbox** da conta raiz (Painel → Integrações →
   API) e me enviar junto com o **walletId** da raiz.
4. Definir a **taxa Zellate Pay** por transação (sugestão inicial:
   R$ 0,50 fixo — simples de comunicar; revisitar com volume).
5. OK explícito para iniciar a F1 (contrato CLAUDE.md §7).
