# CLAUDE.md — Voka CRM (fork do Twenty CRM)

Este arquivo é o **contrato de engenharia** do projeto. Toda sessão do Claude Code deve
respeitá-lo à risca. Em caso de conflito entre "entregar rápido" e "fazer certo", **fazer certo
vence**. Se uma instrução de um prompt de fase conflitar com este arquivo, **este arquivo vence**
— e você deve apontar o conflito antes de codar.

---

## 1. Objetivo do projeto

Transformar o Twenty num **clone completo do Kommo** — em UI/UX **e** em funcionalidades de CRM.
100% em **português do Brasil**, com aparência de **tema claro estilo Kommo**, **sem que reste
nenhum traço visual do Twenty**.

> **Escopo = produto inteiro, não 3 telas.** As telas Pipeline/Lista/Inbox são apenas 3
> visualizações de **um** módulo. O CRM tem ~15 módulos (Leads/Funil, Perfil+Feed, Contatos/
> Empresas/Clientes/Catálogo, Chats multicanal, Mail, Team chat, Tarefas/Calendário, Salesbot,
> AI agent, Automações, Broadcast, Web forms, Chat widget, Analytics, Integrações/API,
> Configurações/Permissões, Mobile, Onboarding). Nunca reduza o trabalho às 3 telas.

---

## 1.1 Referências do projeto (FONTES DE VERDADE — consultar antes de codar)

Os arquivos de referência ficam em **`docs/design/`** do repo. **Abra e leia** o que for relevante
para a fase atual, antes de escrever código:

- `docs/design/voka-crm-kommo-clone-spec.md` — design tokens, anatomia detalhada das telas e
  especificação de backend. **Fonte dos valores** (cores, espaçamentos, estrutura).
- `docs/design/alvo-visual-voka.html` — **alvo visual** das 3 telas-âncora (Funil Kanban, Lista,
  Inbox) em PT-BR. **Leia o CSS deste arquivo** para extrair cores/medidas exatas; é referência
  legível por máquina, não enfeite.
- `docs/design/kommo-ref-1-funil-kanban.png`, `…-2-funil-lista.png`, `…-3-inbox.png` — capturas do
  Kommo original, referência de layout/intenção.
- `docs/design/voka-prompts-claude-code.md` — **mapa de produto completo** (todos os módulos) e os
  **prompts de cada fase**. O escopo total do projeto está aqui.

Regra: ao iniciar uma fase, declare no PR **quais** desses arquivos consultou e o que extraiu deles.
Não invente cores/medidas "de cabeça" quando o valor está no spec ou no alvo visual.

---

## 2. Princípios de engenharia — INEGOCIÁVEIS

1. **Clean code. Zero gambiarra.** Toda mudança deve ser a forma *idiomática* de fazê-la dentro
   da arquitetura existente. Se a solução parece um "truque para forçar", está errada — pare e
   resolva na raiz.
2. **Alterar o VALOR na origem, nunca sobrepor.** Mudança de aparência/comportamento se faz
   alterando o **token / a configuração canônica** de onde o resto do sistema consome — não
   adicionando uma camada por cima que vença por especificidade.
3. **Single source of truth.** Cada decisão (cor, fonte, espaçamento, label) mora em **um** lugar.
   Se existe em dois lugares, os dois recebem o mesmo valor na origem — nunca um corrige o outro.
4. **Investigar antes de editar.** Antes de tocar em tema, i18n ou metadata, **mapeie a arquitetura
   real** do repo (grep/leitura) e descreva no PR onde está a fonte de verdade. Só então edite lá.
5. **Sem dívida arquitetural.** Nenhuma solução pode dificultar a manutenção futura ou o `merge`
   com o upstream do Twenty mais do que o estritamente necessário.

### 2.1 PROIBIÇÕES EXPLÍCITAS (lista de "isto é gambiarra, não faça")

- ❌ `!important` para impor estilo de tema/marca. (Necessidade de `!important` = você não mudou
  o token na origem. Conserte a origem.)
- ❌ Editar arquivos **gerados/compilados** (`dist/`, `build/`, `*.compiled.*`, catálogos `.js`
  compilados do Lingui). Edite a **fonte**; o build regenera o resto.
- ❌ Overrides globais de CSS no `index.html` (ou em qualquer folha global) para forçar fonte/cor.
- ❌ Hardcodar hex de cor ou nome de fonte em componentes. Use sempre o token do tema.
- ❌ Duplicar um token "para o meu caso". Reuse o token semântico existente ou crie um token novo
  na camada certa.
- ❌ Trocar apenas o locale default e dizer que "traduziu". Tradução exige catálogo + compilação +
  labels de metadata (ver Seção 5).
- ❌ "Funciona na minha tela" como critério. O critério é a **Definition of Done** (Seção 6).

---

## 3. Arquitetura de tema do Twenty e a REGRA DE OURO

O Twenty tem **duas camadas de tokens** que coexistem (confirme no repo antes de editar):

- **Emotion theme object** (`@emotion/react` `ThemeProvider`): tokens em
  `packages/twenty-ui/src/theme/**` (ex.: a fonte vive em `theme/constants/FontCommon.ts`,
  consumida como `theme.font.family`). Os componentes `styled` leem daqui.
- **CSS custom properties** (prefixo `--t-*`): definidas em
  `packages/twenty-ui/src/theme-constants/theme-light.css` e `theme-dark.css` (a versão `dist/`
  é **gerada** — não editar). Componentes que estilizam via CSS leem daqui.

### REGRA DE OURO do tema
> Para mudar fonte/cor/raio/espaçamento, **altere o valor do token nas DUAS origens**
> (`theme/constants/*.ts` **e** `src/theme-constants/theme-*.css`), de forma que o valor passe a
> ser o **nativo** do tema. Os componentes então consomem naturalmente, **sem nenhum override e
> sem `!important`**. Se você sentiu necessidade de forçar especificidade, é porque deixou uma das
> origens com o valor antigo. Volte e conserte a origem.

### 3.1 Fonte (Plus Jakarta Sans) — forma correta
- Instale a webfont como **dependência**: `@fontsource-variable/plus-jakarta-sans` (ou
  `@fontsource/plus-jakarta-sans`). **Não** use `<link>` do Google Fonts no `index.html`.
- Importe-a **uma vez** no entry do front (ex.: `packages/twenty-front/src/main.tsx`):
  `import '@fontsource-variable/plus-jakarta-sans';`
- Defina a família **no token**: `theme.font.family` (em `FontCommon.ts`) **e** a CSS var
  `--t-font-family` (na fonte `src/theme-constants/*.css`). Mantenha `Inter` apenas como fallback
  na cadeia (`'Plus Jakarta Sans', Inter, sans-serif`), nunca como override paralelo.
- Resultado esperado: **nenhum** `!important`, **nenhuma** edição em `dist/`, **nenhum** override
  em `index.html`. A fonte muda porque o token mudou.

### 3.2 Cores de CHROME vs cores de ETAPA (não confundir)
- **Chrome/marca** (fundo do app, superfície de card, texto, primário, foco, bordas): são **tokens
  de tema**. Ajuste-os para a paleta clara do Kommo (ver Seção 4) nas duas origens de token.
- **Cores de etapa do funil** (`#FFE247 #AE47FF #9AED6B #3174FF`): **NÃO são token de tema** e
  **NÃO se hardcoda no componente**. São **dado**: a cor de cada **opção** do campo `select`
  `stage` (por funil). A faixa de 4px no header (`RecordBoardColumnHeader.tsx`) deve **ler a cor da
  opção da etapa** do tema/metadata daquela coluna — nunca um `switch` com hex fixo. Se o conjunto
  de cores de opção do Twenty não cobre esses tons, **adicione essas cores ao catálogo de cores de
  opção** (na origem), e configure as opções do funil para usá-las.

---

## 4. Tema claro estilo Kommo (aparência-alvo)

O Kommo é **claro**. O default do app deve ser o tema **claro** com a paleta abaixo (aplicada como
**valor nativo** dos tokens semânticos correspondentes — mapeie o nome real de cada token no repo):

| Intenção (token semântico) | Valor |
|---|---|
| fundo do app | `#F2F4F7` |
| superfície de card / linha | `#FFFFFF` |
| borda sutil | `#EAECF0` |
| texto primário | `#101828` |
| texto secundário/muted | `#667085` |
| link / título de lead | `#2E90FA` |
| item ativo (seleção) | `#437EDD` |
| primário da marca (chrome) | `#7C3AED` (Voka) — ver `brand.config.ts` |
| acento da marca | `#D4AF37` (Voka) |
| painel escuro da Inbox | `#203D49` |
| ponto de tarefa: atrasada / hoje / sem | `#F04438` / `#12B76A` / `#F79009` |

Fonte canônica de marca: `packages/twenty-front/src/brand/brand.config.ts`
(`{ mode:'kommo-faithful', primary:'#7C3AED', accent:'#D4AF37' }`). O chrome lê deste arquivo.

---

## 5. Internacionalização (PT-BR) — tradução de VERDADE

Trocar o locale default **não** traduz nada por si só. Uma tela só está traduzida quando **todas**
as fontes de texto abaixo estão em PT-BR:

1. **Strings de UI (Lingui).** Botões e rótulos como *New, Filter, Sort, Options, By Stage,
   New Opportunity, New chat* vêm de mensagens i18n. Processo correto:
   - `yarn lingui extract` para colher as mensagens.
   - Traduzir o catálogo **pt-BR** (`.po`) — sem deixar `msgstr` vazio (vazio = cai no inglês).
   - `yarn lingui compile`.
   - Garantir locale ativo pt-BR (`initialI18nActivate.ts`) **e** que o catálogo pt-BR é carregado.
2. **Labels de objetos STANDARD** (Companies, People, Opportunities, Tasks, Notes, Workflows…):
   são definidos com i18n no metadata padrão do Twenty. Traduza via os `msg`/labels de origem,
   não renomeando no banco. (Companies→Empresas, People→Contatos, Opportunities→Leads, Tasks→
   Tarefas, Notes→Notas, etc. — alinhar ao glossário do projeto.)
3. **Labels de objetos CUSTOM** (no print: Pets, Survey results, Employment Histories, Pet Care
   Agreements): são **dados de metadata por workspace**, não i18n. Renomeie/ajuste via **migration
   de seed do metadata** (ou remova os de exemplo que não pertencem ao Voka). Nunca deixe rótulo
   custom em inglês "porque é i18n" — não é.
4. **Enumerações/labels de opção** (etapas, fontes, tipos de tarefa): traduzir os valores de
   exibição na configuração/seed.

> Definition of Done de i18n: abrir a tela e **não encontrar uma única palavra em inglês** —
> nem em botões, nem em nomes de objeto na sidebar, nem em menus (Filter/Sort/Options), nem em
> tooltips. Se achar inglês, **não está pronto**.

---

## 6. Definition of Done (por PR/fase)

Um PR só está "pronto" quando **todos** os itens valem:

- [ ] Mudança feita **na origem do token/config**, não por override. **Zero `!important`** novo.
- [ ] **Nenhum** arquivo em `dist/`/`build/` editado à mão.
- [ ] **Nenhum** hex/fonte hardcodado em componente; tudo via token.
- [ ] Tela em **PT-BR integral** (UI + objetos + menus), sem palavra em inglês.
- [ ] Aparência converge para o alvo Kommo (claro, fonte Plus Jakarta Sans, faixas/pills nas cores
      corretas, ícones unificados Lucide/Simple-Icons, **sem cara de Twenty**).
- [ ] `yarn build` / `yarn lint` / `typecheck` passam limpos. Sem warnings novos relevantes.
- [ ] PR pequeno e descrito: o que muda, **arquivos tocados**, **antes/depois (screenshot)**,
      **riscos**, **como testar**.

---

## 7. Processo de trabalho

- **Uma fase por PR.** Não misturar fases. Não avançar de fase **sem meu OK explícito**.
- **Investigação primeiro:** todo PR que mexe em tema/i18n/metadata começa com um parágrafo
  "onde está a fonte de verdade" (resultado do grep/leitura) antes do diff.
- **Stack:** React/TS + Recoil + `@emotion` (front); NestJS + GraphQL + PostgreSQL (back). Reusar
  o **metadata engine** e o **multi-tenant** do Twenty; não reinventar.
- **Ícones:** um único set — `lucide-react` + `simple-icons` (logos de canal). Remover Tabler das
  telas que refizemos. Não misturar bibliotecas.
- **Migrations** sempre reversíveis; jamais quebrar dados existentes.
- **Upstream-friendly:** preferir mudanças que não dificultem futuros merges com o Twenty.
  Quando precisar divergir, isolar e documentar o porquê.

---

## 8. Checklist anti-gambiarra (rodar mentalmente ANTES de abrir o PR)

1. Usei `!important` para tema/marca? → **Reverter.** Mude o token na origem.
2. Editei algo em `dist/`/`build/`? → **Reverter.** Edite a fonte e rode o build.
3. Coloquei `<link>`/`<style>` global no `index.html` para forçar fonte/cor? → **Reverter.**
4. Hardcodei um hex/fonte num componente? → Trocar por token.
5. "Traduzi" só mudando o locale? → Completar catálogo + compile + labels de metadata.
6. A faixa/pill de etapa tem hex fixo no componente? → Ler a cor da **opção** da etapa.
7. Sobrou alguma palavra em inglês na tela? → Não está pronto.
8. Minha mudança vai estourar no próximo `yarn build` limpo? → Refazer direito.

---

## 9. Estado atual / dívida a sanar (Fase 0)

A primeira execução da Fase 0 **violou** este contrato (uso de `!important`, edição de `dist/` e
override no `index.html`). Antes de seguir, a Fase 0 deve ser **refeita corretamente**:

1. **Reverter** os `!important` e os overrides globais em `theme-light.css`, `theme-dark.css` e
   `index.html`; **reverter** edições em `dist/`.
2. Carregar a fonte via `@fontsource-variable/plus-jakarta-sans` (import no entry) e definir a
   família **no token** (`FontCommon.ts` + CSS var `--t-font-family` na fonte `src/theme-constants`),
   como valor nativo — sem forçar.
3. Aplicar a paleta clara do Kommo (Seção 4) nos tokens semânticos, tema **claro como padrão**.
4. Tradução de verdade (Seção 5): catálogo pt-BR completo + compile + labels de objetos
   (standard via i18n, custom via metadata). Zero inglês na tela.
5. Faixa de etapa lendo a cor da **opção** (Seção 3.2), sem hex fixo.

Só considere a Fase 0 concluída quando passar **integralmente** na Definition of Done (Seção 6).

---

## 10. Glossário PT-BR (rótulos canônicos)

Companies→Empresas · People→Contatos · Opportunities→Leads · Tasks→Tarefas · Notes→Notas ·
Dashboards→Painéis · Workflows→Automações · Settings→Configurações · Search→Buscar ·
New→Novo · Filter→Filtrar · Sort→Ordenar · Options→Opções · By Stage→Por etapa ·
New Opportunity→Novo Lead · New chat→Nova conversa · Pipeline→Funil de vendas ·
Inbox→Caixa de Entrada · Stage→Etapa · Lead stage→Etapa do lead · Sale/Value→Valor ·
Responsible user→Responsável · Today→Hoje · No tasks→Sem tarefas · Tags→Etiquetas ·
Incoming/Unsorted leads→Leads não classificados · Won/Lost→Ganho/Perdido.
Moeda **R$** (1.234,56) · datas **DD/MM/AAAA**.
