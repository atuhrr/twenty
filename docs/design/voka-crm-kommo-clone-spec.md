# Voka CRM — Clone do Kommo sobre o Twenty CRM
### Especificação de produto + Prompt de implementação (PT-BR)

> **Objetivo:** transformar o Twenty CRM no equivalente visual e funcional do Kommo, em três telas-âncora (Funil **Kanban**, Funil **Lista**, **Caixa de Entrada / Inbox** multicanal), com toda a UI em português do Brasil e **sem resquícios visuais do Twenty**.
>
> Este documento serve para dois usos:
> 1. **Especificação de design/backend** (tokens, anatomia de tela, modelo de dados) — consultada
>    pelas fases de implementação.
> 2. **Design system + spec funcional** que o agente consulta enquanto implementa (Seções 1–7).

---

## 0. Decisão de branding (ler antes de começar)

As telas do Kommo usam cores **semânticas por etapa** (amarelo → roxo → verde → azul). Sua marca Voka é **roxo/dourado**. As duas coisas convivem bem se você separar:

- **Chrome da marca (Voka):** logo, botões primários (`+ Novo Lead`), header, estados de foco, links de navegação → **roxo Voka + dourado**.
- **Cores semânticas de etapa (Kommo):** as faixas coloridas no topo das colunas e os "pills" de etapa na lista → mantêm a **paleta exata do Kommo** que extraí abaixo, porque comunicam *progresso no funil*, não marca.

Você pediu "exatamente a mesma cor" no funil — então o **default deste spec é replicar fielmente o Kommo**, com um *toggle* documentado (Seção 2.6) para trocar o chrome para a identidade Voka quando quiser. Assim você entrega o clone fiel agora e "voka-fica" depois sem retrabalho.

---

## 1. Princípios de design (apagar o "cheiro" do Twenty)

O Twenty tem uma estética muito reconhecível: sidebar clara minimalista, tabela densa, tipografia Inter apertada, muito cinza-neutro, cantos suaves. Para que **não reste nada** disso:

1. **Substituir o tema na raiz**, não maquiar por cima. Sobrescrever `themeLight`/`themeDark` e os tokens em `packages/twenty-front/src/modules/ui/theme`. Não confie em CSS pontual — o Twenty injeta tokens em emotion/styled-components.
2. **Trocar a fonte.** Twenty usa Inter. Kommo usa uma sans mais arredondada e encorpada. Adotar **"Plus Jakarta Sans"** (títulos/headers) + **"Inter"** só para corpo denso de tabela, OU **"Nunito Sans"** para um ar mais "Kommo". Definir como token `font.family`.
3. **Densidade e respiro:** cards do Kanban têm mais padding e sombra suave; a lista é mais "arejada" que a tabela do Twenty.
4. **Iconografia única:** padronizar **um só set** alinhado ao Kommo (ver 2.5). Remover os ícones nativos do Twenty (TablerIcons) das telas-âncora ou re-skinar para o mesmo peso/estilo.
5. **Linguagem visual de status:** pontinhos coloridos de tarefa (vermelho = atrasada, verde = hoje, laranja = sem tarefa) e badges de canal sobre o avatar são marca registrada do Kommo — replicar.

---

## 2. Design Tokens

### 2.1 Cores de ETAPA do funil (amostradas pixel a pixel das suas telas)

Estas são as cores **exatas** extraídas das faixas no topo das colunas do Kanban:

| Etapa (PT-BR sugerido) | Faixa Kanban (hex exato) | Uso |
|---|---|---|
| **Leads Recebidos** | `#FFE247` (amarelo/dourado) | faixa topo coluna 1 |
| **Tomada de Decisão** | `#AE47FF` (roxo) | faixa topo coluna 2 |
| **Negociação** | `#9AED6B` (verde) | faixa topo coluna 3 |
| **Decisão Final** | `#3174FF` (azul) | faixa topo coluna 4 |

> A faixa é uma barra de **~4px** no topo do **header** da coluna (não do card). Largura total da coluna, cantos levemente arredondados em cima.

### 2.2 "Pills" de etapa (List View — amostrados da tela 2)

Na lista, a etapa vira uma tag colorida (fundo claro + texto escuro da mesma matiz):

| Etapa | Fundo (hex) | Texto sugerido |
|---|---|---|
| **Primeiro Contato** (azul) | `#99CCFF` | `#1E40AF` |
| **Discussões / Em Negociação** (amarelo) | `#FFFF99` | `#92700A` |
| **Discussão de Contrato** (rosa) | `#FFCCCC` | `#B42318` |

> Padronize: cada etapa do funil tem **uma cor base**; o Kanban usa a versão saturada (faixa) e a Lista usa a versão clara (pill). Gere a clara a ~85% lightness da base.

### 2.3 Cores de sistema / chrome

| Token | Hex | Uso |
|---|---|---|
| `link.blue` | `#2E90FA` | títulos de lead clicáveis (azul Kommo) |
| `active.item` | `#437EDD` | item selecionado na inbox |
| `surface.app` | `#F2F4F7` | fundo do app |
| `surface.card` | `#FFFFFF` | cards e linhas |
| `border.subtle` | `#EAECF0` | bordas de card/linha |
| `text.primary` | `#101828` | texto principal |
| `text.muted` | `#667085` | datas, metadados |
| `inbox.darkpanel` | `#203D49` | painel de contato (centro da inbox) — teal escuro |
| `bubble.sent` | `#2E90FA` | balão enviado (gradiente azul) |
| `dot.overdue` | `#F04438` | tarefa atrasada (●) |
| `dot.today` | `#12B76A` | tarefa hoje (●) |
| `dot.none` | `#F79009` | sem tarefa (●) |

### 2.4 Tags de card (Kanban)

Tags pequenas em pill cinza-claro com texto cinza: `Urgente`, `Fácil`, `Demo`, `VIP`, `Upsell`, `Importante`. Fundo `#F2F4F7`, borda `#EAECF0`, texto `#475467`, fonte 11–12px, padding 2×8.

### 2.5 Ícones de canal (badge sobre o avatar)

Círculo pequeno (16–18px) sobreposto no canto inferior-direito do avatar:

| Canal | Cor base | Ícone |
|---|---|---|
| WhatsApp | `#25D366` | telefone/balão WA |
| Instagram | gradiente `#F58529→#DD2A7B→#8134AF` | câmera IG |
| Facebook Messenger | `#0084FF` | raio Messenger |
| Telegram | `#229ED9` | avião papel |
| Google / Gmail | `#EA4335` (G multicolor) | "G" |
| E-mail | `#667085` | envelope |

> Use **um único pacote** para coerência: **Lucide** ou **Simple Icons** (este último tem os logos de marca prontos: `siWhatsapp`, `siInstagram`, `siTelegram`, `siMessenger`). Mantenha todos no mesmo peso de traço. **Não misture** com os Tabler do Twenty.

### 2.6 Toggle de marca (Voka)

Defina um arquivo `brand.config.ts`:
```ts
export const BRAND = {
  mode: 'kommo-faithful', // | 'voka'
  primary: '#7C3AED',     // roxo Voka (ativo só em mode='voka')
  accent:  '#D4AF37',     // dourado Voka
};
```
No modo `kommo-faithful`, chrome usa azul `#2E90FA`. No modo `voka`, botões primários e foco passam a roxo/dourado, **mas as cores de etapa do funil permanecem** (são semânticas).

---

## 3. Internacionalização (PT-BR)

- Ativar i18n do Twenty (Lingui, já presente). Definir locale padrão `pt-BR`.
- Traduzir **toda** string de UI das três telas. Glossário-base:

| EN (Kommo) | PT-BR |
|---|---|
| Pipeline | Funil de Vendas |
| Incoming Leads | Leads Recebidos |
| Decision Making | Tomada de Decisão |
| Contract Discussion | Negociação |
| Final Decision | Decisão Final |
| New Lead | Novo Lead |
| Automate | Automatizar |
| Search and filter | Buscar e filtrar |
| leads / $32,000 | leads / R$ 32.000 |
| Lead title | Título do lead |
| Main contact | Contato principal |
| Contact's company | Empresa do contato |
| Lead stage | Etapa do lead |
| Sale | Valor |
| Inbox | Caixa de Entrada |
| Responsible user | Responsável |
| No tasks | Sem tarefas |
| Today | Hoje |
| Follow up | Acompanhar |
| Add contact | Adicionar contato |
| Write a message | Escreva uma mensagem |
| Send / Cancel | Enviar / Cancelar |

- Formatos: moeda **R$ 1.234,56**, datas **DD/MM/AAAA**, milhares com ponto.

---

## 4. Telas (anatomia detalhada)

### 4.1 Funil — KANBAN (tela 1)

**Top bar (esquerda → direita):**
- Logo "VOKA" + toggle de visão (ícones Kanban / Lista).
- Campo de busca "Buscar e filtrar" com lupa.
- À direita: `48 leads: R$ 32.000` (negrito no valor), menu `…`, botão **Automatizar** (ícone raio dourado, fundo claro), botão **+ Novo Lead** (azul/roxo, texto branco).

**Colunas:**
- Header da coluna: título em CAPS + **faixa de 4px** com a cor da etapa (2.1) logo abaixo. Contador opcional.
- Cards (de cima p/ baixo):
  - Linha 1: **avatar circular** (com badge de canal sobreposto) + **nome** + **data** (à direita, `text.muted`).
  - Linha 2: **título da tarefa/lead** em `link.blue`, clicável.
  - Linha 3: **valor** (`R$ 450`) + **tags** (pills cinza).
  - Linha 4 (rodapé): status de tarefa à direita — texto + **ponto colorido** (`2d ●` vermelho / `Hoje ●` verde / `Sem tarefas ●` laranja).
  - Card: fundo branco, borda `#EAECF0`, raio 10px, sombra suave, padding 12–14px, hover com leve elevação.
- **Drag & drop** de cards entre colunas (reaproveitar `RecordBoard` do Twenty, re-skinado).

### 4.2 Funil — LISTA (tela 2)

Tabela arejada com colunas: **Título do lead** (azul link) · **Contato principal** (sublinhado) · **Empresa do contato** · **Etapa do lead** (pill colorido 2.2) · **Valor (R$)** (alinhado à direita).
- Linhas zebra sutis ou apenas divisórias `#EAECF0`.
- Mesmo header/top-bar da tela Kanban (visão alternável).

### 4.3 CAIXA DE ENTRADA — Inbox (tela 3)

Layout de **3 painéis**:

**Painel 1 — Lista de conversas (esquerda, claro):**
- Busca + engrenagem no topo.
- "INBOX" com contador (ex.: `180`), botão **Filtrar**, `…`.
- Itens: avatar + **badge de canal**, nome, prévia da última mensagem, **hora**, estrela (favorito). Item ativo destacado em `#437EDD`/seleção.
- Seção inferior: "MENÇÕES E CHAT DA EQUIPE".

**Painel 2 — Cartão do contato (centro, FUNDO ESCURO `#203D49`):**
- Nome grande, `+ ADICIONAR TAGS`.
- "Funil de vendas: **Leads Recebidos**" (dropdown para mover etapa).
- Abas: **Principal** · Estatísticas · Configuração.
- Responsável (avatar+nome), **Valor R$ 1.200**.
- Bloco de contato: avatar + nome + badge canal, Telefone, E-mail, Cargo, "mais".
- `+ Adicionar contato`.

**Painel 3 — Conversa (direita, claro):**
- Cabeçalho "Hoje".
- Balões: enviado = azul (`bubble.sent`, alinhado à direita), recebido = cinza claro (esquerda), com avatar+badge de canal e timestamp.
- **Cards de tarefa inline** no fluxo (ex.: "Acompanhar: verificar satisfação" com check; "Cliente fez uma grande compra…").
- Indicador "Fulano está digitando…".
- Caixa de envio: alternador **Chat / com {colega}**, campo "Escreva uma mensagem…", emoji, anexo, **Enviar** / **Cancelar**.

---

## 5. Backend / Funcionalidades

### 5.1 Modelo de dados (objetos)

Reaproveitar o sistema de objetos do Twenty (metadata-driven). Objetos:

- **Lead** (≈ Opportunity do Twenty): `titulo`, `valor`, `etapa (stage)`, `responsavel`, `contatoPrincipal`, `empresa`, `tags[]`, `canalOrigem`, `criadoEm`, `proximaTarefa`.
- **Funil (Pipeline)** e **Etapa (Stage)**: cada etapa tem `nome`, `cor` (token 2.1), `ordem`, `probabilidade%`.
- **Contato** e **Empresa** (já existem no Twenty).
- **Conversa (Thread)**: `contato`, `canal`, `status`, `naoLido`, `responsavel`, `ultimaMensagemEm`, `vinculadoAoLead`.
- **Mensagem**: `thread`, `direcao (in/out)`, `corpo`, `anexos[]`, `canal`, `metadados (id externo)`, `enviadoEm`, `status (entregue/lido)`.
- **Tarefa**: `titulo`, `prazo`, `responsavel`, `relacionadoA (lead/contato)`, `status` → alimenta os pontinhos coloridos.
- **Template / Resposta Rápida**: `nome`, `corpo`, `variaveis[]`, `tipo (texto/imagem/video/doc)`.
- **Automação (Pipeline Rule)**: gatilho + condição + ação (ver 5.5).

### 5.2 Central de mensagens multicanal (caixa unificada)

Módulo NestJS novo: `messaging-omni` (separado do `messaging` de e-mail nativo do Twenty).

- **Padrão de adapter por canal:** interface `ChannelAdapter { send(), receiveWebhook(), normalize() }`. Implementações: `WhatsAppAdapter`, `InstagramAdapter`, `MessengerAdapter`, `TelegramAdapter`, `EmailAdapter`.
- Webhooks entram → `normalize()` → grava `Mensagem` + atualiza `Thread` → push em tempo real (WebSocket/SSE) pra inbox.
- **Dedupe** por `id externo`; **idempotência** nos webhooks.
- Reaproveite seu conhecimento de mensageria assíncrona (você já trabalha com isso): considere um **Outbox** para envio (persistir → worker despacha → atualiza status de entrega), garantindo entrega confiável e retry — exatamente o padrão que você implementa no CUBI.

### 5.3 WhatsApp Cloud API (multi-número / multi-atendente)

- Integração **WhatsApp Cloud API (Meta)** — você já domina isso do Voka CRM.
- **Vários atendentes em um número:** roteamento por `responsavel` da Thread + atribuição automática (round-robin ou por etapa do funil).
- **Múltiplos números:** `WhatsAppPhoneNumber` (1 phone_number_id por linha) ligado a um `Funil`/equipe.
- Suporte a **templates aprovados** (HSM) para iniciar conversa fora da janela de 24h; mensagens livres dentro da janela.
- Status de entrega/leitura via webhook → refletir no balão.

### 5.4 Templates / Respostas rápidas

- CRUD de templates com **variáveis** (`{{nome}}`, `{{valor}}`).
- Tipos: texto, imagem, vídeo, documento.
- Inserção rápida no compositor (atalho `/` ou botão).

### 5.5 Chatbots com IA

- Builder de fluxo (gatilho → nós de condição/mensagem/coleta de dado → handoff humano).
- Nó "IA" usando a Anthropic API (você já usa o SDK): qualificar lead, responder FAQ, agendar, coletar dados 24/7.
- **Handoff:** quando confiança baixa ou intenção "falar com humano" → atribui Thread a atendente e marca como `precisa de resposta`.

### 5.6 Automações (regras do funil)

- **Gatilhos:** lead muda de etapa; mensagem recebida; tarefa vence; lead criado.
- **Condições:** valor > X; canal = WhatsApp; tag contém; etapa = Y.
- **Ações:** criar tarefa; enviar template; mover etapa; atribuir responsável; enviar webhook; disparar bot.
- Modelar como motor de regras simples (event-driven). Casa com sua arquitetura de eventos de domínio.

### 5.7 Tarefas

- Lembretes, follow-ups, próximos passos vinculados a lead/contato.
- O **status da próxima tarefa** define o pontinho colorido no card/lista (5.1).

### 5.8 Relatórios e KPIs

- Dashboards: desempenho por atendente, **tempo de resposta** (1ª resposta + médio), volume de vendas, **taxa de conversão por etapa** (funil), leads por canal, valor em pipeline.
- Agregações sobre `Lead`, `Mensagem`, `Tarefa`.

---

## 6. Mapeamento para o Twenty (reusar vs. substituir)

| Área | Twenty traz pronto | O que fazer |
|---|---|---|
| Kanban | `RecordBoard` (pipeline de Opportunities) | **Re-skin total** (faixa de etapa, card anatomy, badges) |
| Lista | `RecordTable` | Re-skin para a lista arejada do Kommo + pills de etapa |
| Objetos/CRUD | Metadata engine, GraphQL | Reusar; criar objetos da Seção 5.1 |
| Auth / multi-tenant / workspaces | Sim | Reusar |
| E-mail/Calendar sync | Módulo `messaging`/`calendar` | **Não** é a inbox multicanal; criar `messaging-omni` à parte |
| Inbox multicanal de chat | ❌ não existe | **Construir do zero** (maior esforço do projeto) |
| Tema/Design system | `ui/theme` (light/dark) | **Sobrescrever na raiz** (fonte, cores, densidade, ícones) |
| i18n | Lingui | Ativar `pt-BR` e traduzir |

> **Realismo:** a Inbox (4.3 + 5.2–5.5) é praticamente um produto novo dentro do Twenty — planeje como módulo independente. O resto é majoritariamente re-skin + objetos.

---

## 7. Roadmap por fases

1. **Fase 0 — Tema:** sobrescrever tokens, fonte, ícones; provar que "sumiu o Twenty" numa tela.
2. **Fase 1 — Funil Kanban + Lista** re-skinados, objetos Lead/Etapa, cores exatas, PT-BR.
3. **Fase 2 — Inbox UI** (3 painéis, painel escuro) com dados mock.
4. **Fase 3 — Backend omnicanal:** adapters + webhooks + WhatsApp Cloud API (1 número), tempo real.
5. **Fase 4 — Templates, multi-número/multi-atendente, tarefas + pontinhos.**
6. **Fase 5 — Automações + Chatbot IA (Anthropic).**
7. **Fase 6 — Relatórios/KPIs.**

---

## 8. Como executar (fluxo oficial)

> **Atenção:** o "prompt-mestre" que existia aqui foi **removido** por conflitar com o contrato do
> projeto. O fluxo de execução agora é único e mora em dois lugares:
>
> 1. **`/CLAUDE.md`** (raiz do repo) — o **contrato de engenharia**. Define como mexer em tema,
>    i18n e metadata **sem gambiarra** (alterar o valor do token na origem, zero `!important`, zero
>    edição em `dist/`, tradução de verdade). Prevalece sobre qualquer outra instrução.
> 2. **`docs/design/voka-prompts-claude-code.md`** — o **mapa de produto completo** e os **prompts
>    de cada fase**, colados um por vez.
>
> Este `spec.md` continua sendo a **fonte de verdade de design/backend** (tokens, anatomia das
> telas, modelo de dados) — consultado pelas fases, mas **não** dá ordens de processo. Em caso de
> conflito, `CLAUDE.md` vence.

---

### Anexo — checklist de "sumiu o Twenty?"
- [ ] Fonte trocada (não é Inter pura)
- [ ] Sidebar/topbar com chrome próprio (não o cinza minimalista do Twenty)
- [ ] Cards Kanban com faixa de etapa + badges de canal + pontinhos de tarefa
- [ ] Ícones unificados (zero Tabler nas 3 telas)
- [ ] Painel de contato da inbox em teal escuro `#203D49`
- [ ] Tudo em PT-BR, R$ e DD/MM/AAAA
