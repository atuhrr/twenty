# Voka CRM — Plano de Migração TailAdmin
**Documento de referência para execução fase a fase**

> Cada seção "PROMPT FASE T-X" é um prompt completo e autocontido para ser colado no Claude Code
> numa sessão dedicada. Não misture fases. Não avance sem o OK explícito após cada fase.

---

## Visão geral da migração

### O que muda
O Voka CRM (fork do Twenty) ganha a interface visual completa do **TailAdmin Free React**
(Tailwind CSS 4 + React 19 + Vite). Toda funcionalidade existente permanece; apenas a camada
visual é substituída componente a componente.

### Stack do template (fonte de verdade visual)
- **Localização no repo:** `free-react-tailwind-admin-dashboard-main/free-react-tailwind-admin-dashboard-main/`
- Tailwind CSS 4 · React 19 · Vite 6 · React Router 7 · ApexCharts · FullCalendar
- Fonte: **Outfit** (substituirá Plus Jakarta Sans)
- Dark/light mode via classe `.dark` no `<html>`

### Stack atual do twenty-front
- React 19 · Vite · React Router DOM 6 · Emotion/Linaria · Recoil · Apollo GraphQL
- Tailwind: **não instalado ainda**
- Todas as pages Voka usam `styled` do Linaria

### Princípio de coexistência
Tailwind 4 e Emotion/Linaria **convivem** no mesmo projeto.  
Durante a migração, páginas novas usam Tailwind; páginas antigas do Twenty core mantêm Linaria.  
O objetivo final é 100% Tailwind, mas o core do Twenty (kanban interno, filter dropdowns,
record detail) será migrado por último (Fase T-10), pois requer substituição dos 500+
componentes do `twenty-ui`.

### Cor da marca Voka
O `--color-brand-500` do TailAdmin (`#465fff`) deve ser **substituído por `#7C3AED`** (roxo Voka)
em toda configuração do Tailwind. Isso é a única cor que difere do template original.

---

## PROMPT FASE T-0 — Fundação: Tailwind CSS no twenty-front

```
Você está trabalhando no Voka CRM (fork do Twenty em C:/Users/atuhr/crm/twenty).

OBJETIVO desta fase: instalar e configurar Tailwind CSS 4 em packages/twenty-front,
copiando os tokens de design do template TailAdmin que está em:
  free-react-tailwind-admin-dashboard-main/free-react-tailwind-admin-dashboard-main/

REGRAS (CLAUDE.md manda):
- Zero !important · zero edição de dist/ · zero hardcode de hex em componente
- Tailwind deve COEXISTIR com Emotion/Linaria existente (não remover Linaria ainda)
- Não tocar em nenhuma página existente nesta fase — apenas infraestrutura

PASSO 1 — Instalar dependências em packages/twenty-front:
  yarn workspace twenty-front add tailwindcss@^4 @tailwindcss/postcss postcss
  yarn workspace twenty-front add @fontsource/outfit
  yarn workspace twenty-front add apexcharts react-apexcharts
  yarn workspace twenty-front add clsx tailwind-merge
  yarn workspace twenty-front add @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction

PASSO 2 — Criar packages/twenty-front/postcss.config.mjs:
  export default { plugins: { '@tailwindcss/postcss': {} } }

PASSO 3 — Criar packages/twenty-front/src/tailwind.css com TODOS os tokens do template:
  - Copiar o bloco @import + @theme do arquivo:
    free-react-tailwind-admin-dashboard-main/free-react-tailwind-admin-dashboard-main/src/index.css
  - SUBSTITUIR a linha --font-outfit por --font-outfit: 'Outfit', sans-serif;
  - SUBSTITUIR todos os valores de --color-brand-* para a paleta Voka:
      --color-brand-25: #f5f0ff
      --color-brand-50: #ede9fe
      --color-brand-100: #ddd6fe
      --color-brand-200: #c4b5fd
      --color-brand-300: #a78bfa
      --color-brand-400: #8b5cf6
      --color-brand-500: #7C3AED   ← cor primária Voka
      --color-brand-600: #6d28d9
      --color-brand-700: #5b21b6
      --color-brand-800: #4c1d95
      --color-brand-900: #3b0764
      --color-brand-950: #2e1065
  - Manter TODOS os outros tokens (gray, success, error, warning, orange, etc.) idênticos ao template
  - Copiar também todos os blocos de utilitários CSS (.menu-item, .menu-item-active, etc.)
    que estão na parte final do index.css do template
  - Adicionar ao final:
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap')
      layer(base);
    OU importar via @fontsource/outfit (preferível — sem CDN externo):
      Adicionar no entry point: import '@fontsource/outfit/variable.css'

PASSO 4 — Importar tailwind.css no entry do front:
  Em packages/twenty-front/src/main.tsx, adicionar ANTES dos outros imports:
    import '~/tailwind.css'

PASSO 5 — Criar packages/twenty-front/src/modules/tailadmin/ com a estrutura:
  context/
    SidebarContext.tsx  ← copiar de template/src/context/SidebarContext.tsx
    ThemeContext.tsx    ← copiar de template/src/context/ThemeContext.tsx
  hooks/
    useModal.ts         ← copiar de template/src/hooks/useModal.ts
  icons/
    index.ts            ← copiar de template/src/icons/index.ts
    (todos os SVG inline do template/src/icons/)
  ui/
    Button.tsx          ← copiar e adaptar (trocar import paths)
    Badge.tsx
    Alert.tsx
    Avatar.tsx
    Dropdown.tsx
    DropdownItem.tsx
    Modal.tsx           ← copiar de template/src/components/ui/modal/index.tsx
    Table.tsx           ← copiar de template/src/components/ui/table/index.tsx
  form/
    InputField.tsx
    TextArea.tsx
    Checkbox.tsx
    Radio.tsx
    Switch.tsx
    Select.tsx
    MultiSelect.tsx
    Label.tsx
  common/
    PageBreadCrumb.tsx
    ThemeToggleButton.tsx

  Todos os arquivos são copiados do template com imports ajustados para caminhos relativos.
  Não alterar lógica — apenas paths de import.

PASSO 6 — Criar packages/twenty-front/src/modules/tailadmin/layout/
  AppLayout.tsx     ← adaptar template/src/layout/AppLayout.tsx
    - Substituir import from "react-router" por import from "react-router-dom"
    - Manter toda lógica de SidebarContext
  Backdrop.tsx      ← copiar
  SidebarWidget.tsx ← copiar (substituir links por placeholders por enquanto)

PASSO 7 — Envolver o App em ThemeProvider:
  Em packages/twenty-front/src/App.tsx (ou onde o root é renderizado),
  adicionar <ThemeProvider> do módulo tailadmin/context/ThemeContext.tsx
  como wrapper externo, sem remover nenhum provider existente.

PASSO 8 — Verificar:
  yarn workspace twenty-front typecheck 2>&1 | grep -i error | grep tailadmin
  Se zero erros nos novos arquivos → fase concluída.

DEFINITION OF DONE:
- tailwind.css importado no entry, tokens de cor Voka (brand=roxo) no @theme
- Pasta tailadmin/ com context, hooks, icons, ui, form, common, layout
- ThemeProvider envolvendo o App
- yarn build passa sem erros nos novos arquivos
- Nenhuma página existente foi alterada
```

---

## PROMPT FASE T-1 — Shell: Sidebar + Header TailAdmin

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
A Fase T-0 foi concluída: Tailwind CSS 4 está instalado, tokens Voka configurados,
pasta packages/twenty-front/src/modules/tailadmin/ existe com os componentes base.

OBJETIVO: substituir o shell visual do app (sidebar + header + layout wrapper)
pelo AppLayout/AppSidebar/AppHeader do TailAdmin.

CONTEXTO DO ROUTING:
O roteamento do app vive em:
  packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx
O layout wrapper atual é:
  packages/twenty-front/src/modules/ui/layout/page/components/MainAppLayout.tsx
A navegação atual é:
  packages/twenty-front/src/modules/navigation/components/VokaNavSection.tsx

PASSO 1 — Criar VokaAppSidebar em packages/twenty-front/src/modules/tailadmin/layout/VokaAppSidebar.tsx
Baseado em template/src/layout/AppSidebar.tsx, adaptar para:

  import { Link, useLocation } from 'react-router-dom'; // react-router-dom v6 (não v7)
  import { useSidebar } from '../context/SidebarContext';

  Nav items do Voka CRM (em português):
  MENU PRINCIPAL:
  - { name: 'Painel', icon: <GridIcon />, path: '/' }
  - { name: 'Funil de Vendas', icon: <PipelineIcon />, path: '/objects/opportunities' }
  - { name: 'Caixa de Entrada', icon: <InboxIcon />, path: '/inbox' }
  - { name: 'Contatos', icon: <UsersIcon />, path: '/objects/people' }
  - { name: 'Empresas', icon: <BuildingIcon />, path: '/objects/companies' }
  - { name: 'Tarefas', icon: <ChecklistIcon />, path: '/tarefas' }
  - { name: 'Calendário', icon: <CalendarIcon />, path: '/calendar' (futuro) }
  VENDAS:
  - { name: 'Automações', icon: <AutomationIcon />, path: '/automacoes' }
  - { name: 'Salesbot', icon: <BotIcon />, path: '/salesbot' }
  - { name: 'Broadcast', icon: <BroadcastIcon />, path: '/broadcast' }
  - { name: 'Web Forms', icon: <FormIcon />, path: '/web-forms' }
  - { name: 'Catálogo', icon: <CatalogIcon />, path: '/catalogo' }
  MARKETING:
  - { name: 'Templates', icon: <TemplateIcon />, path: '/templates' }
  - { name: 'Estatísticas', icon: <ChartIcon />, path: '/estatisticas' }
  SISTEMA:
  - { name: 'Configurações', icon: <SettingsIcon />, path: '/settings' }

  Logo: usar texto "Voka CRM" estilizado com a cor brand-500 quando expandido,
        e iniciais "V" quando colapsado — sem depender de arquivo de imagem.
  
  Usar os ícones de lucide-react (já instalado no projeto) para todos os itens.
  Mapeamento: GridIcon→LayoutDashboard, PipelineIcon→GitMerge, InboxIcon→Inbox,
  UsersIcon→Users, BuildingIcon→Building2, ChecklistIcon→CheckSquare,
  AutomationIcon→Zap, BotIcon→Bot, BroadcastIcon→Radio, FormIcon→FileText,
  CatalogIcon→Package, TemplateIcon→LayoutTemplate, ChartIcon→BarChart3,
  SettingsIcon→Settings, CalendarIcon→Calendar.

  Manter TODA a lógica de colapso/expand/hover/mobile do template original.
  Substituir `import from "react-router"` por `import from "react-router-dom"`.

PASSO 2 — Criar VokaAppHeader em packages/twenty-front/src/modules/tailadmin/layout/VokaAppHeader.tsx
Baseado em template/src/layout/AppHeader.tsx, adaptar para:
  - Substituir react-router por react-router-dom
  - Campo de busca: conectar ao handler de busca existente do Twenty
    (importar useCommandMenu do Twenty para abrir o command menu via ⌘K)
  - Notificações: usar VokaNotificationBell existente
    (packages/twenty-front/src/modules/navigation/components/VokaNotificationBell.tsx)
  - User dropdown: ler dados do currentWorkspaceMember via hook do Twenty
    (useRecoilValue(currentWorkspaceMemberState) de @/modules/auth/states)
    Mostrar avatar, nome e email do usuário logado
  - ThemeToggle: usar o ThemeToggleButton do tailadmin/common/

PASSO 3 — Criar VokaAppLayout em packages/twenty-front/src/modules/tailadmin/layout/VokaAppLayout.tsx
Baseado em template/src/layout/AppLayout.tsx:
  import { SidebarProvider } from '../context/SidebarContext';
  import { Outlet } from 'react-router-dom';
  import VokaAppHeader from './VokaAppHeader';
  import VokaAppSidebar from './VokaAppSidebar';
  import Backdrop from './Backdrop';

  Manter exatamente a mesma lógica de layout do template (ml-[290px]/ml-[90px]).
  O <Outlet /> renderiza as rotas filhas (todo o conteúdo do CRM).

PASSO 4 — Integrar VokaAppLayout no roteamento do Twenty:
  Em packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx:
  - Importar VokaAppLayout
  - Substituir o wrapper de layout atual pelo VokaAppLayout para todas as rotas
    autenticadas (as que hoje usam o layout com sidebar)
  - Rotas de auth (login, signup, onboarding) NÃO usam VokaAppLayout — ficam sem sidebar

PASSO 5 — Desativar o sidebar antigo:
  Em packages/twenty-front/src/modules/navigation/components/VokaNavSection.tsx:
  - Não deletar o arquivo (pode haver imports) — apenas exportar um fragment vazio:
    export const VokaNavSection = () => null;
  
  Em packages/twenty-front/src/modules/ui/layout/page/components/MainAppLayout.tsx:
  - Remover a renderização do sidebar/nav antigo se ainda presente
  - O VokaAppLayout já cuida do layout

PASSO 6 — Verificar:
  yarn workspace twenty-front typecheck
  yarn workspace twenty-front build

DEFINITION OF DONE:
- Sidebar TailAdmin visível com todos os itens Voka em PT-BR
- Sidebar colapsa para 90px com ícones, expande para 290px
- Hover expand funciona no desktop
- Mobile: sidebar vira drawer com overlay
- Header com busca (⌘K), toggle de tema, notificações, avatar do usuário
- Todas as rotas existentes continuam funcionando dentro do novo layout
- Zero page branca ou erro de rota
```

---

## PROMPT FASE T-2 — Página Inicial: Dashboard Voka

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 e T-1 concluídas: Tailwind instalado, sidebar/header TailAdmin ativos.

OBJETIVO: construir a página inicial do CRM (rota "/") como um dashboard executivo
usando componentes TailAdmin + ApexCharts, conectado aos dados reais via GraphQL.

REFERÊNCIA VISUAL: template em
  free-react-tailwind-admin-dashboard-main/free-react-tailwind-admin-dashboard-main/
  Consultar: src/pages/Dashboard/Home.tsx e src/components/ecommerce/

CRIAR packages/twenty-front/src/pages/dashboard/VokaDashboardPage.tsx

Layout com grid-cols-12 (igual ao template Home.tsx), seções:

── SEÇÃO 1: KPI Cards (col-span-12) ─────────────────────────────────────────
4 cards estilo EcommerceMetrics do template:
  Card 1 — Leads Totais
    Query GraphQL: useFindManyRecords({ objectNameSingular: 'opportunity', limit: 0 })
    → totalCount do resultado
    Ícone: GitMerge, cor brand-500
  Card 2 — Receita do Mês (soma de amount dos leads Ganho no mês)
    Query: leads com stage='WON' e closeDate no mês atual
    Exibir em R$ formatado (1.234,56)
    Ícone: DollarSign, cor success-500
  Card 3 — Taxa de Conversão
    = leads Ganho / total leads × 100 (%)
    Ícone: TrendingUp, cor brand-500
  Card 4 — Tarefas Pendentes
    Query: useFindManyRecords({ objectNameSingular: 'task' }) onde status != DONE
    Ícone: CheckSquare, cor warning-500

  Cada card: fundo white, border border-gray-200 rounded-2xl p-6,
  variação % em relação ao mês anterior (badge verde/vermelho).
  Skeleton loading enquanto carrega (animate-pulse bg-gray-200 rounded).

── SEÇÃO 2: Funil por Etapa (col-span-12 xl:col-span-7) ─────────────────────
  Gráfico de barras ApexCharts (BarChart) mostrando contagem de leads por etapa.
  Usar react-apexcharts, tipo 'bar', horizontal: false.
  Dados: agrupar leads por campo 'stage', contar por etapa.
  Cores das barras: array com as cores das etapas do funil Voka.
  Título: "Leads por Etapa"
  Card com fundo white, border, rounded-2xl, p-6.

── SEÇÃO 3: Meta do Mês (col-span-12 xl:col-span-5) ─────────────────────────
  Estilo MonthlyTarget do template (radial chart ApexCharts).
  Mostrar % da meta de receita atingida (meta = valor fixo configurável,
  por ora hardcode como R$ 50.000).
  Valor alcançado = receita do mês (já calculada no Card 2).
  Cores: brand-500 para progresso, gray-100 para trilha.

── SEÇÃO 4: Atividade Recente (col-span-12 xl:col-span-5) ──────────────────
  Lista dos últimos 5 leads criados/atualizados.
  Query: useFindManyRecords opportunity, orderBy: createdAt DESC, limit: 5.
  Cada linha: avatar com iniciais do nome, nome do lead, etapa (badge colorido),
  valor (R$), data relativa ("há 2 horas").
  Estilo: lista com divide-y divide-gray-100.

── SEÇÃO 5: Tarefas de Hoje (col-span-12 xl:col-span-7) ─────────────────────
  Tabela estilo RecentOrders do template.
  Query: tasks com dueAt = hoje, status != DONE.
  Colunas: Tarefa | Relacionado (lead/contato) | Prazo | Status.
  Badge de status: "A fazer"=gray, "Em andamento"=brand, "Atrasada"=error.

CONECTAR A ROTA:
  Em packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx,
  substituir (ou adicionar) rota index "/" para renderizar VokaDashboardPage.
  (Hoje "/" pode apontar para o objeto padrão do Twenty — redirecionar para cá)

DEFINITION OF DONE:
- Dashboard visível em "/" com 4 KPI cards, 2 charts, lista de leads, tabela de tarefas
- Dados reais via GraphQL (não mocks)
- Loading state com skeleton
- Responsivo: mobile empilhado, desktop grid-cols-12
- Zero palavra em inglês
- yarn build limpo
```

---

## PROMPT FASE T-3 — Listas: Leads, Contatos, Empresas com TailAdmin Tables

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0, T-1, T-2 concluídas.

OBJETIVO: substituir as views de lista do Twenty (record table) pelas páginas
de lista TailAdmin para os 3 objetos principais: Leads, Contatos, Empresas.

REFERÊNCIA: template src/components/tables/BasicTables/ e src/pages/Tables/

NOTA IMPORTANTE: As listas do Twenty core (useFindManyRecords + record table component)
continuam funcionando como backend de dados. Esta fase cria NOVAS páginas de lista
que consomem os mesmos hooks mas renderizam com Tailwind. As rotas do Twenty para esses
objetos (/objects/opportunities etc.) são SUBSTITUÍDAS pelas novas páginas.

── CRIAR packages/twenty-front/src/pages/leads/LeadsListPage.tsx ────────────
  Título: "Leads" com contagem total entre parênteses
  Toolbar: botão "Novo Lead" (brand-500), input busca, filtro por etapa (select)
  
  Tabela TailAdmin com colunas:
    □ Checkbox | Nome | Empresa | Etapa (badge) | Valor (R$) | Responsável | 
    Data de fechamento | Criado em | ⋮ Ações
  
  Dados: useFindManyRecords({ objectNameSingular: 'opportunity', limit: 50 })
  Filtro local: filtrar pelo campo 'stage' via estado React
  Busca: filtrar por 'name' localmente
  
  Badges de etapa: cada etapa com cor diferente
    "Leads Recebidos" → bg-blue-light-50 text-blue-light-700
    "Tomada de Decisão" → bg-brand-50 text-brand-700
    "Negociação" → bg-orange-50 text-orange-700
    "Decisão Final" → bg-warning-50 text-warning-700
    "Ganho" → bg-success-50 text-success-700
    "Perdido" → bg-error-50 text-error-700
  
  Ao clicar na linha → navegar para o record detail do Twenty:
    navigate(`/objects/opportunities/${record.id}`)
  
  Paginação: botões Anterior/Próximo, "Mostrando X de Y leads"

── CRIAR packages/twenty-front/src/pages/contatos/ContatosListPage.tsx ─────
  Similar ao LeadsListPage.
  Colunas: □ | Avatar+Nome | E-mail | Telefone | Empresa | Cargo | Criado em | ⋮
  Dados: useFindManyRecords({ objectNameSingular: 'person', limit: 50 })
  Avatar: círculo com iniciais do nome, bg baseado em hash do nome
  Ao clicar → navigate(`/objects/people/${record.id}`)

── CRIAR packages/twenty-front/src/pages/empresas/EmpresasListPage.tsx ─────
  Colunas: □ | Logo+Nome | Site | Endereço | Receita Anual | Responsável | ⋮
  Dados: useFindManyRecords({ objectNameSingular: 'company', limit: 50 })
  Logo: ícone Building2 se não houver imagem
  Ao clicar → navigate(`/objects/companies/${record.id}`)

── COMPONENTE COMPARTILHADO: TailAdminTable ────────────────────────────────
  Criar packages/twenty-front/src/modules/tailadmin/ui/DataTable.tsx
  Props: columns[], data[], onRowClick?, loading?, emptyMessage?
  Renderiza: <table> com thead/tbody em estilos TailAdmin
    (border-b border-gray-100, hover:bg-gray-50, etc.)
  Skeleton: 5 linhas de placeholder quando loading=true

── CONECTAR ROTAS ──────────────────────────────────────────────────────────
  Em useCreateAppRouter.tsx:
  - Adicionar rota '/leads' → LeadsListPage
  - Adicionar rota '/contatos' → ContatosListPage
  - Adicionar rota '/empresas' → EmpresasListPage
  
  Em VokaAppSidebar.tsx (criado na T-1):
  - Atualizar paths: Funil → '/leads' para view de lista,
    manter '/objects/opportunities' para o kanban
    (separar as duas views: "Lista" e "Kanban" como sub-itens)
  - Contatos → '/contatos'
  - Empresas → '/empresas'

DEFINITION OF DONE:
- 3 páginas de lista com tabela TailAdmin mostrando dados reais
- Busca local funciona
- Filtro de etapa funciona (leads)
- Clicar na linha → abre o record detail do Twenty
- Botão "Novo Lead/Contato/Empresa" → abre o create modal do Twenty
  (usar useOpenCreateActivityDrawer ou triggerCreateRecordOptimistic)
- Responsivo, PT-BR, zero inglês
- yarn build limpo
```

---

## PROMPT FASE T-4 — Funil Kanban TailAdmin

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-3 concluídas.

OBJETIVO: reconstruir o Funil de Vendas Kanban (rota '/objects/opportunities' ou '/funil')
com visual TailAdmin completo, mantendo drag-and-drop e dados reais do Twenty.

REFERÊNCIA VISUAL: o Kommo kanban (docs/design/kommo-ref-1-funil-kanban.png)
e o visual do docs/design/alvo-visual-voka.html (consultar antes de codar).

CRIAR packages/twenty-front/src/pages/funil/FunilKanbanPage.tsx

── ESTRUTURA DE LAYOUT ──────────────────────────────────────────────────────
  Toolbar no topo:
    - Título "Funil de Vendas" (text-2xl font-semibold text-gray-900)
    - Tabs: "Kanban" | "Lista" (alternado para /leads)
    - Botão "+ Novo Lead" (brand-500)
    - Busca por nome
    - Filtro por responsável (select com membros do workspace)
  
  Área do kanban:
    - flex overflow-x-auto gap-4 pb-4
    - Cada coluna: min-w-[280px] w-[280px] flex-shrink-0

── COLUNAS ─────────────────────────────────────────────────────────────────
  Buscar as opções do campo 'stage' do objeto opportunity via:
    useObjectMetadataItem({ objectNameSingular: 'opportunity' })
    → field.options[] onde field.name === 'stage'
  
  Cada coluna renderiza:
    Header: faixa colorida 4px no topo (cor da opção de etapa), nome da etapa,
            contagem de leads, valor total em R$
    Background: bg-gray-50 rounded-2xl p-3
    Cards: lista de LeadKanbanCard

── LEAD KANBAN CARD ─────────────────────────────────────────────────────────
  Criar packages/twenty-front/src/modules/funil/LeadKanbanCard.tsx
  
  Visual (bg-white rounded-xl border border-gray-200 p-4 shadow-theme-xs):
    - Nome do lead (font-semibold text-gray-900, link azul ao clicar)
    - Avatar + nome do contato responsável (text-sm text-gray-500)
    - Nome da empresa (text-xs text-gray-400)
    - Valor (R$) alinhado à direita (font-semibold brand-500)
    - Data de fechamento (text-xs, vermelho se vencida)
    - Linha de baixo: avatar do responsável + badge de prioridade se houver tarefa atrasada
  
  Drag: usar react-dnd (já no projeto) ou @dnd-kit/core
    (instalar @dnd-kit/core @dnd-kit/sortable se preferível ao react-dnd)

── DADOS ────────────────────────────────────────────────────────────────────
  useFindManyRecords({ objectNameSingular: 'opportunity', limit: 200 })
  Agrupar localmente: leads.reduce por lead.stage
  
  Ao soltar card em nova coluna:
    useUpdateOneRecord({ objectNameSingular: 'opportunity' })
    → atualizar campo stage com o novo valor

── VAZIO ────────────────────────────────────────────────────────────────────
  Coluna vazia: área de drop com borda tracejada e texto "Arraste leads aqui"
  (border-2 border-dashed border-gray-200 rounded-xl min-h-[120px])

DEFINITION OF DONE:
- Kanban com colunas dinâmicas vindas das opções do campo stage
- Cards com informações do lead (nome, empresa, valor, prazo, responsável)
- Drag-and-drop funcional: mover card atualiza stage no banco via GraphQL
- Toolbar com busca e filtro por responsável funcionando
- Tab "Lista" navega para /leads
- Botão Novo Lead abre create flow do Twenty
- PT-BR, responsivo
- yarn build limpo
```

---

## PROMPT FASE T-5 — Caixa de Entrada (Inbox) TailAdmin

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-4 concluídas.

OBJETIVO: reconstruir a Caixa de Entrada (rota '/inbox') com visual TailAdmin completo,
integrando o WhatsApp (Evolution/Meta API) e mensagens do Twenty.

REFERÊNCIA: docs/design/kommo-ref-3-inbox.png e docs/design/alvo-visual-voka.html

CRIAR packages/twenty-front/src/pages/inbox/VokaInboxPage.tsx (substituir o existente)

── LAYOUT GERAL ─────────────────────────────────────────────────────────────
  Layout de 3 colunas (apenas 2 no mobile):
  
  Col 1 — Lista de Conversas (w-[320px] flex-shrink-0 border-r border-gray-200):
    Header: "Caixa de Entrada" + filtros (Todos | WhatsApp | E-mail | Não lidas)
    Campo busca (bg-gray-50 rounded-lg)
    Lista de ConversationItem:
      - Avatar do contato (iniciais coloridas)
      - Nome + canal (ícone WhatsApp/Email/etc)
      - Preview da última mensagem (truncado 1 linha)
      - Timestamp (relativo: "há 5min", "Ontem", etc)
      - Badge com contagem de não lidas (brand-500 rounded-full)
      - Item selecionado: bg-brand-50 border-l-2 border-brand-500
  
  Col 2 — Chat Ativo (flex-1 flex flex-col):
    Header: avatar + nome do contato + info (empresa, telefone) + botões ação
    Área de mensagens (flex-1 overflow-y-auto p-4 space-y-4):
      Mensagem recebida: bg-gray-100 rounded-2xl rounded-tl-none text-gray-800
      Mensagem enviada: bg-brand-500 rounded-2xl rounded-tr-none text-white
      Timestamp abaixo de cada bolha
    Input de mensagem:
      bg-white border-t border-gray-200 p-4
      Textarea com auto-resize
      Botões: Templates | Anexo | Emoji | Enviar
  
  Col 3 — Info do Contato (w-[300px] flex-shrink-0 border-l border-gray-200):
    Avatar grande + nome + empresa
    Info: email, telefone, cargo
    Leads relacionados (lista mini com etapa+valor)
    Tarefas pendentes (lista mini)
    Notas recentes
    Botão "Ver perfil completo" → navega para record detail

── DADOS ────────────────────────────────────────────────────────────────────
  Conversas: usar hooks existentes do WhatsApp:
    useWhatsappThreads() (packages/twenty-front/src/modules/whatsapp/hooks/)
  Mensagens: useWhatsappMessages(contactWindowId)
  Envio: useSendWhatsappMessage()
  SSE para tempo real: useWhatsappSSE()
  
  Info do contato: buscar via useFindOneRecord({ objectNameSingular: 'person' })

── ESTADOS ──────────────────────────────────────────────────────────────────
  Estado local com useState:
    selectedConversationId, searchTerm, activeFilter
  Auto-scroll para última mensagem com useEffect + ref

DEFINITION OF DONE:
- Layout 3 colunas funcional
- Lista de conversas carregando do WhatsApp hook
- Chat com bolhas de mensagem estilizadas
- Envio de mensagem funcional
- Painel info do contato com dados reais
- Tempo real via SSE (badge de não lidas atualiza)
- Mobile: cols 1 e 2 com navegação back
- PT-BR, zero inglês
- yarn build limpo
```

---

## PROMPT FASE T-6 — Tarefas + Calendário TailAdmin

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-5 concluídas.

OBJETIVO: reconstruir a página de Tarefas (rota '/tarefas') com visual TailAdmin
usando FullCalendar (já no template) para a view de calendário.

REFERÊNCIA: template src/pages/Calendar.tsx (usa @fullcalendar/react)

CRIAR packages/twenty-front/src/pages/tarefas/TarefasPage.tsx (substituir o existente)

── TOOLBAR ─────────────────────────────────────────────────────────────────
  "Tarefas" + contagem | Tabs: "Lista" | "Calendário"
  Botão "+ Nova Tarefa" (abre drawer do Twenty para criar task)
  Filtros: Todas | Hoje | Esta semana | Atrasadas

── VIEW LISTA ───────────────────────────────────────────────────────────────
  Agrupamento por seção (sticky header por grupo):
  
  ATRASADAS (text-error-500, nenhum collapso):
    tasks onde dueAt < hoje && status != DONE
  
  HOJE (text-warning-500):
    tasks onde dueAt = hoje
  
  ESTA SEMANA (text-brand-500):
    tasks onde dueAt nos próximos 7 dias
  
  FUTURAS (text-gray-500):
    tasks onde dueAt > 7 dias
  
  SEM PRAZO (text-gray-400):
    tasks onde dueAt = null
  
  CONCLUÍDAS (collapsível, text-success-500):
    tasks onde status = DONE
  
  Cada TaskItem:
    □ checkbox (ao checar → updateRecord status=DONE com risco no texto)
    Título da tarefa
    Ícone do objeto relacionado (company/person/opportunity)
    Chip de data (vermelho se atrasada, laranja se hoje, cinza se futura)
    Avatar do responsável (24px)
    ⋮ menu: Editar | Excluir | Reassignar
  
  Dados: useFindManyRecords({ objectNameSingular: 'task', limit: 200 })
  Ordenação local por dueAt

── VIEW CALENDÁRIO ───────────────────────────────────────────────────────────
  Usar FullCalendar (idêntico ao template src/pages/Calendar.tsx):
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]
    initialView: 'dayGridMonth'
    locale: 'pt-br' (instalar: yarn workspace twenty-front add @fullcalendar/core/locales/pt-br)
    
  Mapear tasks para eventos FullCalendar:
    { id, title, date: dueAt, color: cor por status/prioridade }
  
  Ao clicar no evento → abrir drawer de detalhes da tarefa
  Botões de toolbar: Mês | Semana | Dia | Lista (usar os do FullCalendar)

── DRAWER DE TAREFA ─────────────────────────────────────────────────────────
  Criar packages/twenty-front/src/modules/tailadmin/ui/TaskDrawer.tsx
  Slider da direita (translate-x-full → translate-x-0 com transition)
  Campos: Título, Descrição, Prazo, Status, Responsável, Relacionado
  Usar useUpdateOneRecord para salvar

DEFINITION OF DONE:
- View lista com 5 grupos visíveis, checkbox funcional
- View calendário com tarefas mapeadas para eventos
- FullCalendar com locale pt-br
- Drawer de criação/edição funcional
- PT-BR completo
- yarn build limpo
```

---

## PROMPT FASE T-7 — Analytics: Estatísticas e Relatórios

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-6 concluídas.

OBJETIVO: reconstruir a página de Estatísticas (rota '/estatisticas') com
dashboards analíticos usando ApexCharts + dados reais.

REFERÊNCIA: template src/components/ecommerce/ e src/components/charts/

CRIAR packages/twenty-front/src/pages/estatisticas/EstatisticasPage.tsx

── TABS PRINCIPAIS ─────────────────────────────────────────────────────────
  "Visão Geral" | "Funil" | "Conversão" | "Equipe" | "ROI"

── ABA VISÃO GERAL ──────────────────────────────────────────────────────────
  Linha 1 — 4 KPI cards (igual ao Dashboard T-2 mas com filtro de período):
    Leads criados | Leads ganhos | Receita total | Ticket médio
  
  Linha 2 (col-span-12):
    Gráfico de linha (react-apexcharts type='line') — Leads criados vs Ganhos
    por semana/mês (filtro de período: 7d | 30d | 3m | 12m)
    Título: "Evolução de Leads"
  
  Linha 3 (col-span-12 xl:col-span-6 cada):
    Gráfico pizza — Distribuição por etapa (type='donut')
    Gráfico de barras — Top 5 responsáveis por receita (type='bar')

── ABA FUNIL ────────────────────────────────────────────────────────────────
  Funil visual de conversão entre etapas:
  Usar ApexCharts type='bar' horizontal com dados de contagem por etapa
  Abaixo: tabela com etapa | qtd leads | qtd ganhos | taxa de conversão | valor total

── ABA CONVERSÃO ────────────────────────────────────────────────────────────
  Gráfico ganho/perda por mês (type='bar' stacked com success-500 e error-500)
  Tabela motivos de perda com contagem e %

── ABA EQUIPE ───────────────────────────────────────────────────────────────
  Ranking de responsáveis: avatar | nome | leads ativos | ganhos | receita | taxa
  Gráfico comparativo entre responsáveis (type='bar' grouped)

── ABA ROI ──────────────────────────────────────────────────────────────────
  Baseado nas queries useRoiRelatorio() existentes
  Cards: Investimento | Receita gerada | ROI (%) | Payback
  Gráfico evolução mensal

── DADOS ────────────────────────────────────────────────────────────────────
  Usar hooks existentes:
    useAnaliseGanhoPerda() — packages/twenty-front/src/modules/analytics/hooks/
    useDashboardStats()
    useRoiRelatorio()
  
  Filtro de período: useState(['startDate', 'endDate'])
  Seletor de período: "Esta semana" | "Este mês" | "Este trimestre" | "Este ano"

DEFINITION OF DONE:
- 5 abas funcionais
- Charts com dados reais ou mocks realistas se API não disponível
- Filtro de período afeta todos os gráficos
- Exportar para CSV (botão no header, window.open com CSV gerado no client)
- PT-BR, formatação R$ e DD/MM/AAAA
- yarn build limpo
```

---

## PROMPT FASE T-8 — Automações, Salesbot, Broadcast

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-7 concluídas.

OBJETIVO: reconstruir as páginas de Automações ('/automacoes'), Salesbot ('/salesbot')
e Broadcast ('/broadcast') com visual TailAdmin.

── AUTOMAÇÕES (/automacoes) ─────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/automation/AutomacoesPage.tsx

  Toolbar: "Automações" | botão "+ Nova Automação" | busca | filtro status
  
  Grid de cards (grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6):
  Cada AutomationCard:
    bg-white rounded-2xl border border-gray-200 p-6
    - Ícone + nome da automação (font-semibold)
    - Descrição (text-sm text-gray-500, 2 linhas)
    - Chips: trigger | ações (ex: "Novo Lead" → "Enviar WhatsApp")
    - Toggle on/off (Switch do tailadmin/form/) → updateRecord status
    - Stats: "Executou X vezes | Última: DD/MM/AAAA"
    - Footer: Edit | Duplicate | Delete

  Ao clicar "Nova Automação" ou "Edit":
    Modal TailAdmin (Modal do tailadmin/ui/) com:
      Tabs: "Trigger" | "Condições" | "Ações"
      Trigger: select (Novo lead criado | Lead movido | Mensagem recebida | etc)
      Condições: builder de condições (campo + operador + valor)
      Ações: lista de ações (Enviar mensagem | Criar tarefa | Mover etapa | etc)

  Dados: usar hooks existentes de packages/twenty-front/src/modules/automation/

── SALESBOT (/salesbot) ─────────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/salesbot/SalesbotPage.tsx

  Layout: lista de bots à esquerda + canvas de edição à direita (ou modal)
  
  Lista de bots (sidebar interno w-[280px]):
    Cada BotItem: nome + status ativo/inativo + toggle
    Botão "+ Novo Salesbot"
  
  Canvas de edição:
    MANTER o ReactFlow canvas existente (packages/twenty-front/src/modules/salesbot/)
    Apenas envolver com o header TailAdmin e toolbar de ações:
      Salvar | Testar | Publicar | Duplicar
    O canvas interno do ReactFlow permanece como está — não refazer o flow editor

  Dados: usar hooks existentes do módulo salesbot

── BROADCAST (/broadcast) ───────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/broadcast/BroadcastPage.tsx

  Tabs: "Campanhas" | "Criar Nova" | "Relatórios"
  
  ABA CAMPANHAS:
    Tabela DataTable (tailadmin/ui/DataTable) com colunas:
      Nome | Canal | Status | Enviados | Entregues | Taxa leitura | Data
    Status badges: Rascunho/gray | Agendada/warning | Enviando/brand | Concluída/success
    Ações: Visualizar | Duplicar | Arquivar
  
  ABA CRIAR NOVA:
    Formulário wizard em 4 etapas (stepper visual):
      Passo 1: Nome + Canal (WhatsApp/Email) + Tipo (Imediato/Agendado)
      Passo 2: Selecionar audiência (upload CSV ou filtro de contatos)
      Passo 3: Conteúdo (textarea + seletor de template + preview)
      Passo 4: Confirmação + envio
    Stepper: círculos numerados conectados, etapa ativa em brand-500
  
  ABA RELATÓRIOS:
    Gráficos ApexCharts de performance das campanhas (aberto/clicado/etc)

  Dados: usar hooks de packages/twenty-front/src/modules/broadcast/ existentes ou
    criar chamadas REST para /metadata/broadcast-campaigns

DEFINITION OF DONE:
- 3 páginas funcionais com dados reais (ou stubs realistas)
- Automações: CRUD de automações com modal de edição
- Salesbot: canvas ReactFlow preservado, shell TailAdmin ao redor
- Broadcast: fluxo completo de criação com wizard
- PT-BR, zero inglês
- yarn build limpo
```

---

## PROMPT FASE T-9 — Web Forms, Catálogo, Templates

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-8 concluídas.

OBJETIVO: reconstruir Web Forms ('/web-forms'), Catálogo ('/catalogo')
e Templates ('/templates') com visual TailAdmin.

── WEB FORMS (/web-forms) ──────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/web-forms/WebFormsPage.tsx

  Layout: lista de formulários + builder visual
  
  Lista de forms (tabela DataTable):
    Nome | Leads capturados | Ativo? | Criado em | Ações
  
  Builder (Modal fullscreen ou rota /web-forms/:id/edit):
    Painel esquerdo: campos disponíveis (arrastar para o form)
    Centro: preview do form (com os campos reais)
    Painel direito: propriedades do campo selecionado
    Header: Nome do form | Copiar link | Publicar | Cancelar
  
  Campos suportados: Texto | E-mail | Telefone | Select | Checkbox | Textarea
  Cada campo: label editável, placeholder, required toggle
  
  Geração do link: /forms/[uuid] → rota pública sem autenticação

── CATÁLOGO (/catalogo) ─────────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/catalogo/CatalogoPage.tsx

  Grid de produtos/serviços (grid-cols-2 md:grid-cols-3 xl:grid-cols-4):
  Cada ProductCard:
    bg-white rounded-2xl border overflow-hidden
    - Imagem placeholder (bg-gray-100 aspect-video)
    - Nome + categoria (badge)
    - Preço (R$ formatado)
    - Botões: Editar | Remover | Adicionar a Lead

  Filtros: por categoria (tabs) | busca | ordenar por preço/nome
  Botão "+ Novo Produto"
  
  Modal de criar/editar: Nome | Descrição | Preço | Categoria | Imagem URL
  Dados: REST /metadata/catalog (criar endpoint ou usar custom object do Twenty)

── TEMPLATES (/templates) ───────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/templates/TemplatesPage.tsx

  Templates de mensagens WhatsApp para uso no Broadcast e Salesbot
  
  Grid de cards (grid-cols-1 md:grid-cols-2 xl:grid-cols-3):
  Cada TemplateCard:
    - Nome do template (font-semibold)
    - Categoria (badge): Marketing | Utilitário | Autenticação
    - Status de aprovação Meta: Aprovado/success | Pendente/warning | Rejeitado/error
    - Preview do conteúdo (text-sm text-gray-500 line-clamp-3)
    - Variáveis usadas ({1}, {2}, etc)
    - Ações: Usar em Broadcast | Usar no Salesbot | Editar | Excluir

  Modal de criar template:
    Nome | Idioma (pt_BR/en_US) | Categoria
    Header: Texto | Imagem | Vídeo | Documento
    Corpo: textarea com suporte a variáveis (botão + para inserir {{1}})
    Rodapé: texto opcional
    Botões de chamada: máx 3 (tipo + texto + URL/tel)
    Preview ao vivo no painel direito

  Dados: usar hooks useWhatsappTemplates() existentes

DEFINITION OF DONE:
- 3 páginas funcionais
- Web Forms: builder básico com arrastar campos e preview
- Catálogo: CRUD completo de produtos
- Templates: listagem com status Meta e modal de criação
- PT-BR, zero inglês
- yarn build limpo
```

---

## PROMPT FASE T-10 — Settings Completo TailAdmin

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-9 concluídas.

OBJETIVO: reconstruir TODAS as páginas de Settings com visual TailAdmin.
Manter toda a funcionalidade existente — apenas substituir a aparência.

REFERÊNCIA: template src/pages/UserProfiles.tsx e src/components/UserProfile/

── LAYOUT BASE DE SETTINGS ──────────────────────────────────────────────────
Criar packages/twenty-front/src/modules/tailadmin/layout/SettingsTailLayout.tsx

  Layout de 2 colunas:
  - Sidebar interno (w-[240px] flex-shrink-0):
      Grupos de itens com header de seção (text-xs uppercase text-gray-400)
      Item ativo: bg-brand-50 text-brand-700 rounded-lg
      Navegação via <Link to={getSettingsPath(SettingsPath.X)}>
  
  - Conteúdo principal (flex-1 min-w-0):
      Breadcrumb no topo
      Título da página + subtítulo
      Conteúdo específico

  Itens da sidebar interna de settings (em PT-BR):
  CONTA:
    Meu perfil | Aparência | Contas conectadas
  WORKSPACE:
    Geral | Membros | Funções e permissões
  CRM:
    Equipes | Motivos de perda | Etapas do funil
  CANAIS:
    WhatsApp | E-mail | Canais conectados
  DESENVOLVEDOR:
    Chaves de API | Webhooks | Integrações
  ADMIN:
    Faturamento | Segurança | Logs

── PÁGINAS DE SETTINGS ──────────────────────────────────────────────────────
Para cada página de settings existente, criar versão TailAdmin no mesmo path.
Usar SettingsTailLayout como wrapper.

PERFIL (SettingsPath.ProfilePage):
  Estilo UserProfiles.tsx do template:
  - Banner de capa (bg-brand-500/10) + avatar grande (96px) com botão de upload
  - Grid: info pessoal (nome, email, cargo) + info de conta
  - Inputs TailAdmin (InputField) para editar nome
  - Botão Salvar brand-500

APARÊNCIA (SettingsPath.Experience):
  - Card de idioma com LocalePicker (existente, só remestilar)
  - Toggle dark/light mode
  - Seleção de fuso horário

GERAL DO WORKSPACE (SettingsPath.General):
  - Nome do workspace (input)
  - Logo (upload com dropzone)
  - Fuso horário
  - Moeda padrão (R$)

MEMBROS (SettingsPath.WorkspaceMembersPage):
  - Tabela de membros: Avatar+Nome | Email | Função | Status | Ações
  - Botão "Convidar membro" → modal com campo de email
  - Badge por função: Admin/brand | Membro/gray

EQUIPES (SettingsPath.Equipes):
  - Grid de cards de equipes (existente, remestilar com TailAdmin)

MOTIVOS DE PERDA (SettingsPath.MotivosDePerca):
  - Lista drag-drop com handles (existente, remestilar)

WHATSAPP (SettingsPath.Whatsapp):
  - Card de status da conexão (conectado/desconectado)
  - QR Code se desconectado
  - Config: número, webhook URL, token de verificação

CANAIS CONECTADOS (SettingsPath.CanaisConectados):
  - Grid de cards de canal (existente, remestilar com TailAdmin)

CHAVES API (SettingsPath.NewApiKey/ApiKeyDetail):
  - Tabela de API keys com data de expiração
  - Botão criar nova chave → modal

Em TODOS os casos:
  - Remover SettingsPageLayout do Twenty (era da Fase anterior)
  - Usar SettingsTailLayout como wrapper
  - Manter toda lógica de GraphQL/REST intacta
  - Apenas substituir os componentes visuais por TailAdmin equivalentes

DEFINITION OF DONE:
- Todas as páginas de settings renderizando com visual TailAdmin
- Sidebar interna de settings com navegação funcional
- CRUD de cada seção mantido (criar/editar/excluir membros, chaves, etc)
- PT-BR completo
- yarn build limpo
```

---

## PROMPT FASE T-11 — Auth e Onboarding TailAdmin

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-10 concluídas.

OBJETIVO: reconstruir as páginas de login, signup e onboarding com o visual TailAdmin.

REFERÊNCIA:
  template/src/pages/AuthPages/SignIn.tsx
  template/src/pages/AuthPages/SignUp.tsx
  template/src/pages/AuthPages/AuthPageLayout.tsx
  template/src/components/auth/SignInForm.tsx

── LAYOUT AUTH ─────────────────────────────────────────────────────────────
Criar packages/twenty-front/src/modules/tailadmin/layout/AuthTailLayout.tsx

  2 colunas no desktop (grid-cols-2):
  - Esquerda: painel de marca (bg-brand-500)
    Logo Voka + tagline
    Ilustração ou screenshot do produto
    Depoimentos/social proof
  
  - Direita: formulário centralizado
    max-w-md mx-auto
    Logo pequena no topo
    Título + subtítulo
    Formulário
    Link para signup/signin

── LOGIN (/sign-in) ─────────────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/auth/VokaSignInPage.tsx (substituir o existente)

  Manter a lógica de auth do Twenty (useSignInWithCredentials, Google OAuth etc)
  Substituir apenas o visual:
  - Email input (InputField TailAdmin)
  - Senha input com botão mostrar/esconder
  - "Lembrar de mim" (Checkbox TailAdmin)
  - Link "Esqueci a senha"
  - Botão "Entrar" (brand-500, full width)
  - Divider "ou"
  - Botão "Continuar com Google" (ícone Google + texto, outline)
  - Link "Não tem conta? Criar conta"

── SIGNUP (/sign-up) ─────────────────────────────────────────────────────────
Similar ao Login mas com campos:
  Nome | Email | Senha | Confirmar senha
  Checkbox aceitar termos
  Botão "Criar conta"

── ONBOARDING ───────────────────────────────────────────────────────────────
Criar VokaOnboardingPage com stepper visual TailAdmin:
  Step 1: "Bem-vindo ao Voka CRM" — nome do workspace + logo
  Step 2: "Conecte seu WhatsApp" — QR code ou token
  Step 3: "Configure seu Funil" — adicionar/renomear etapas
  Step 4: "Convide sua equipe" — campo de email + botão adicionar
  Step 5: "Pronto! 🎉" — botão "Ir para o CRM"
  
  Stepper: circles numeradas no topo com linha de conexão
  Barra de progresso: w-full bg-gray-200 rounded-full h-1.5 no topo

  Conectar ao onboarding status existente do Twenty
  (useOnboardingStatus, packages/twenty-front/src/modules/onboarding/)

── SENHA ESQUECIDA (/reset-password) ───────────────────────────────────────
  Campo email + botão "Enviar link"
  Conectar ao handler existente do Twenty (useForgotPassword)

DEFINITION OF DONE:
- Login e Signup com visual TailAdmin
- Google OAuth funcionando
- Onboarding com 5 passos e stepper visual
- Senha esquecida funcional
- PT-BR, responsivo (mobile: single column)
- yarn build limpo
```

---

## PROMPT FASE T-12 — Perfil de Record: Detail Panel TailAdmin (Avançado)

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-11 concluídas.

OBJETIVO: reconstruir as páginas de detalhe de record (lead, contato, empresa)
com visual TailAdmin. Esta é a fase mais complexa — os record detail pages do
Twenty são gerados automaticamente pelo metadata engine.

ESTRATÉGIA: criar páginas custom de detalhe que coexistem com as do Twenty.
Ao invés de substituir os componentes internos do Twenty (muito acoplados),
criar rotas alternativas:
  /leads/:id → VokaLeadDetailPage
  /contatos/:id → VokaContatoDetailPage
  /empresas/:id → VokaEmpresaDetailPage

── LEAD DETAIL (/leads/:id) ────────────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/leads/LeadDetailPage.tsx

Layout de 2 colunas:

COL ESQUERDA (flex-1):
  Card de cabeçalho:
    - Nome do lead (text-2xl font-semibold)
    - Empresa (link para /empresas/:id)
    - Valor (text-3xl font-bold brand-500)
    - Etapa: select estilo TailAdmin (ao mudar → updateRecord stage)
    - Responsável: avatar + nome
    - Botões: Editar | Converter | Ganho | Perdido
  
  Timeline de atividades:
    - Lista cronológica de activities (mensagens, notas, tarefas, mudanças de etapa)
    - Cada item: ícone do tipo + texto + timestamp
    - Input de nova nota no topo (textarea + botão Salvar)
    - Tabs: Tudo | Notas | Tarefas | Mensagens | Atividade

COL DIREITA (w-[320px]):
  Card "Informações":
    - Todos os campos do lead em pares Label:Valor
    - Campos editáveis ao clicar (inline edit)
    - Botão "Ver mais campos"
  
  Card "Contato":
    - Avatar + nome + email + telefone
    - Botão "Ver perfil"
  
  Card "Empresa":
    - Logo + nome + site
    - Botão "Ver empresa"
  
  Card "Tarefas":
    - Lista das 3 próximas tarefas
    - Botão "+ Tarefa"

Dados:
  useFindOneRecord({ objectNameSingular: 'opportunity', objectRecordId: id })
  useActivities (timeline activities via GraphQL)
  useCreateOneRecord para notas
  useUpdateOneRecord para edição de campos

── CONTATO DETAIL (/contatos/:id) ──────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/contatos/ContatoDetailPage.tsx

Similar ao Lead Detail mas organizado para um contato (pessoa):
  Cabeçalho: Avatar grande + nome + cargo + empresa
  Col esquerda: timeline + notas
  Col direita: campos (email, telefone, LinkedIn, endereço) + leads relacionados

── EMPRESA DETAIL (/empresas/:id) ──────────────────────────────────────────
CRIAR packages/twenty-front/src/pages/empresas/EmpresaDetailPage.tsx

Similar, adaptado para empresa:
  Cabeçalho: Logo + nome + site + setor + tamanho
  Col esquerda: timeline
  Col direita: info + contatos da empresa + leads

── INLINE EDIT ──────────────────────────────────────────────────────────────
Criar packages/twenty-front/src/modules/tailadmin/ui/InlineEditField.tsx
  Props: label, value, type ('text'|'select'|'date'|'currency'), onSave
  Renderiza como texto; ao clicar vira input; ESC cancela, Enter ou blur salva
  Conectar ao useUpdateOneRecord do Twenty

── ROTAS ────────────────────────────────────────────────────────────────────
Em useCreateAppRouter.tsx:
  - Adicionar rota '/leads/:id' → LeadDetailPage
  - Adicionar rota '/contatos/:id' → ContatoDetailPage
  - Adicionar rota '/empresas/:id' → EmpresaDetailPage
  As rotas /objects/:objectName/:id do Twenty continuam existindo como fallback

DEFINITION OF DONE:
- 3 páginas de detalhe funcionais
- Timeline de atividades carregando
- Inline edit funcional (atualiza banco via GraphQL)
- Criação de nota funcional
- Navegação de volta para a lista funcional
- PT-BR, zero inglês
- yarn build limpo
```

---

## PROMPT FASE T-13 — Limpeza Final: Remover Twenty Visual Legado

```
Você está no Voka CRM (C:/Users/atuhr/crm/twenty).
Fases T-0 a T-12 concluídas. O app usa TailAdmin em todos os módulos Voka.

OBJETIVO: remover ou neutralizar os componentes visuais do Twenty que não são
mais usados, e garantir que nenhuma página mostre o visual antigo.

PASSO 1 — Auditoria de rotas remanescentes do Twenty:
  Verificar quais rotas ainda apontam para componentes do Twenty core
  (as /objects/... que caem nos RecordIndexPage do Twenty).
  Para cada uma que tem uma substituta Voka, redirecionar:
    /objects/opportunities → /leads (LeadsListPage ou FunilKanbanPage)
    /objects/people → /contatos
    /objects/companies → /empresas
  Rotas /objects/:objectName/:id → redirecionar para a page Voka equivalente

PASSO 2 — Remoção de imports não usados:
  Buscar e remover:
  - Imports de VokaNavSection (substituída)
  - Imports do MainNavigationDrawer antigo
  - Imports de SettingsPageLayout do Twenty nas pages Voka
  - styled() do Linaria em todos os arquivos que criamos (Fases T-2 a T-12)

PASSO 3 — Consolidar ThemeProvider:
  Garantir que o ThemeProvider do TailAdmin (dark/light) está no topo da árvore
  e que o toggle no header funciona globalmente.
  Remover qualquer lógica de tema duplicada.

PASSO 4 — CSS cleanup:
  Em tailwind.css, verificar se há conflitos com estilos Linaria:
  - Adicionar prefixo @layer se necessário para isolar estilos Tailwind
  - Garantir que classes Tailwind não estão sendo sobrescritas por Emotion

PASSO 5 — Verificação final:
  yarn workspace twenty-front build
  yarn workspace twenty-front typecheck
  Abrir cada rota e confirmar visual TailAdmin:
    / → Dashboard Voka
    /leads → Lista leads TailAdmin
    /funil → Kanban TailAdmin
    /inbox → Inbox TailAdmin
    /contatos → Lista TailAdmin
    /empresas → Lista TailAdmin
    /tarefas → Tarefas TailAdmin
    /estatisticas → Analytics TailAdmin
    /automacoes → Automações TailAdmin
    /salesbot → Salesbot TailAdmin
    /broadcast → Broadcast TailAdmin
    /web-forms → Web Forms TailAdmin
    /catalogo → Catálogo TailAdmin
    /templates → Templates TailAdmin
    /settings/* → Settings TailAdmin
    /sign-in → Login TailAdmin

PASSO 6 — i18n final:
  Verificar todas as novas páginas por strings em inglês hardcoded.
  Se encontrar: adicionar ao pt-BR.po e rodar npx lingui compile.
  Critério: nenhuma palavra em inglês visível ao usuário.

DEFINITION OF DONE:
- Nenhuma rota mostra o visual antigo do Twenty
- yarn build e typecheck passam limpos
- Todas as 15+ rotas verificadas visualmente
- PT-BR integral
- Zero !important nos arquivos Tailwind
- Zero edições em dist/
```

---

## Ordem de execução recomendada

```
T-0  Foundation Tailwind        ← início obrigatório
T-1  Shell Sidebar + Header     ← transforma o visual imediatamente
T-2  Dashboard Home             ← impacto visual alto
T-3  Listas (Leads/Contatos/Empresas)
T-4  Funil Kanban
T-5  Inbox
T-6  Tarefas + Calendário
T-7  Analytics
T-8  Automações + Salesbot + Broadcast
T-9  Web Forms + Catálogo + Templates
T-10 Settings completo
T-11 Auth + Onboarding
T-12 Record Detail Pages        ← mais complexo
T-13 Limpeza final              ← último, depois de tudo validado
```

## Regras que valem em TODAS as fases

1. **Zero !important** — se precisou de !important, não mudou na origem correta
2. **Zero edição em dist/** — apenas arquivos src/
3. **Zero hex hardcoded** — usar sempre as classes Tailwind (`brand-500`, `gray-900`, etc)
4. **Substituir `import from "react-router"` por `import from "react-router-dom"`**
   em TODOS os arquivos copiados do template (o twenty usa react-router-dom v6)
5. **Manter todos os hooks do Twenty intactos** — apenas substituir a camada visual
6. **PT-BR integral** — nenhuma palavra em inglês visível ao usuário
7. **Uma fase por sessão** — não misturar fases, não avançar sem OK
8. **yarn build limpo** antes de declarar a fase concluída

## Localização dos arquivos fonte

- Template TailAdmin: `C:/Users/atuhr/crm/twenty/free-react-tailwind-admin-dashboard-main/free-react-tailwind-admin-dashboard-main/`
- Projeto: `C:/Users/atuhr/crm/twenty/packages/twenty-front/`
- CLAUDE.md (contrato de engenharia): `C:/Users/atuhr/crm/twenty/CLAUDE.md`
- Spec visual Kommo: `docs/design/voka-crm-kommo-clone-spec.md`
- Alvo visual: `docs/design/alvo-visual-voka.html`
