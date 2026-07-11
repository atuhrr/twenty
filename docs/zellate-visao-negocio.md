# Zellate — Visão de Negócio e Funcional

> **Público:** o fundador, futuros sócios/investidores e o primeiro time comercial.
> **Natureza:** documento vivo — preços e limites dos planos são **propostas a validar
> com os primeiros clientes pagantes**. Atualizado em 11/07/2026.

---

## 1. O que é o Zellate

O Zellate é um **CRM conversacional** para pequenas e médias empresas brasileiras que
vendem pelo WhatsApp. Ele junta em um único produto o que hoje o empresário resolve com
4 ou 5 ferramentas coladas com fita:

1. **Funil de vendas visual** (kanban estilo Kommo) — cada conversa vira lead automaticamente.
2. **Caixa de entrada do WhatsApp** dentro do CRM, em tempo real, com bot de qualificação.
3. **Cobrança integrada** — o vendedor gera Pix/cartão/boleto sem sair da conversa, e o
   pagamento move o lead para "Ganho" sozinho.
4. **Tarefas, agenda e automações** amarradas ao lead, não soltas.

**Posicionamento em uma frase:** *"Da primeira mensagem no WhatsApp ao Pix na conta — tudo
numa tela só, em português, com nota fiscal."*

### 1.1 Por que existe (a dor)

O micro e pequeno empresário brasileiro vende no WhatsApp pessoal, anota pedido em caderno
ou planilha, cobra por Pix "no talão" e perde vendas por esquecer de responder. As
alternativas ou são gringas caras e em inglês (Kommo, HubSpot), ou são "disparadores de
WhatsApp" sem CRM de verdade. O Zellate ataca exatamente esse meio: **CRM completo, 100%
PT-BR, com o dinheiro passando por dentro**.

### 1.2 Cliente-alvo

- Negócios de serviço e venda consultiva que fecham pelo WhatsApp: estética, clínicas,
  agências, consultorias, escolas/cursos, imobiliárias de bairro, prestadores B2B.
- 1 a 20 vendedores. Ticket do serviço deles: R$ 100 a R$ 10.000.
- Sinal de qualificação: já paga alguma ferramenta (RD, Kommo, ManyChat, planilha premium)
  ou perde vendas visivelmente por desorganização.

---

## 2. Mapa funcional (o produto hoje)

### ✅ Em produção (app.zellate.com)

| Módulo | O que faz |
|---|---|
| **Funil de vendas (kanban)** | Etapas Kommo (Leads recebidos → Tomada de decisão → Negociação → Decisão final → Ganho/Perdido), cartões com valor, responsável, ponto de tarefa (atrasada/hoje/sem), badge de mensagens não lidas que abre direto o chat |
| **Leads de entrada automáticos** | Toda mensagem de número novo no WhatsApp cria lead "não classificado" no topo do funil, com nome do perfil do WhatsApp e telefone internacional correto |
| **Caixa de Entrada (Inbox)** | Conversas do WhatsApp em tempo real (SSE), envio com janela de 24h respeitada, painel lateral com lead/contato/responsável/tarefas reais do CRM, marcação de lido |
| **Salesbot** | Bot de qualificação com gatilhos (sempre / palavra-chave), mensagens persistidas na conversa, pausa por contato |
| **Tarefas (kanban + calendário)** | Kanban A fazer/Em andamento/Concluído ligado a leads, modal de criação, aba Calendário de negócio |
| **Financeiro (Asaas)** | Faturas Pix/cartão/boleto, link de pagamento pelo WhatsApp, juros/multa/desconto, régua de lembretes automática (com template fora da janela 24h), assinaturas mensais, estorno em 2 cliques, links avulsos |
| **Nota fiscal (NFS-e)** | Opcional, manual ou automática ao pagar, com busca do serviço municipal e envio do PDF pelo WhatsApp |
| **Conciliação e relatórios** | Saldo Asaas, bruto × taxas × líquido, exportação CSV e OFX (importável no contador), aba Receita nas Estatísticas |
| **Automações** | Motor de gatilhos incluindo "Fatura paga" e "Fatura vencida" (ex.: fatura paga → lead vai para Ganho + notificação) |
| **Empresas, Contatos, Notas** | Cadastros clássicos de CRM (base Twenty), tudo em PT-BR |
| **Multi-workspace pronto** | Arquitetura multi-tenant do Twenty preservada — cada cliente é um workspace isolado |

### 🚧 Construído, aguardando destrave externo

- **Teste ponta a ponta do Financeiro** — aguarda chave sandbox do Asaas.
- **Envio ativo de WhatsApp** — aguarda aprovação do nome de exibição na Meta (erro 131037).

### 🗺️ Roadmap (do mapa de 22 fases + spec financeira)

| Horizonte | Item | Valor de negócio |
|---|---|---|
| Curto | Toggle de criação automática de leads; broadcast (disparo em massa segmentado); web forms; chat widget para site | Captação além do inbound puro |
| Médio | Multicanal (Instagram DM, Messenger, e-mail no inbox); AI agent (resposta sugerida/atendimento) ; analytics avançado | Sobe ticket e retenção |
| Longo | **Zellate Pay (F5)** — subcontas white-label Asaas criadas de dentro do CRM + **split automático**: o Zellate fica com uma taxa por transação | Muda o modelo: de SaaS puro para **SaaS + take rate sobre o GMV** dos clientes. Pré-requisito: PJ do fundador + habilitação white-label no Asaas |

---

## 3. Modelo de receita

### 3.1 Estrutura

1. **Assinatura mensal por usuário** (os três planos abaixo) — receita previsível.
2. **Futuro (Zellate Pay):** taxa por transação sobre os pagamentos processados pelos
   clientes dentro do CRM. É o multiplicador do negócio: o cliente que cresce paga mais
   sem sentir, e trocar de CRM passa a significar trocar de banco.

### 3.2 Custos transparentes de cobrança (repassados, hoje)

Enquanto cada cliente conecta a **própria** conta Asaas, as taxas são entre ele e o Asaas
e ficam **claras na tela de Configurações → Financeiro** (princípio do produto: custo por
Pix explícito — ex.: Pix R$ 1,99, promocional R$ 0,99, cartão e boleto conforme tabela
Asaas). O Zellate não fica no meio do dinheiro — ainda.

---

## 4. Planos

> Preços em R$/usuário/mês, cobrança mensal (anual com 2 meses grátis).
> **Valores de lançamento — validar nos 10 primeiros clientes.**
> Referência competitiva: Kommo cobra US$ 15/25/45 por usuário/mês, em dólar e em inglês.

### 🟦 Standard — "saia do caderno" — **R$ 79/usuário/mês**

Para quem hoje vende no WhatsApp e anota em planilha.

- Funil de vendas kanban + lista (leads ilimitados)
- WhatsApp conectado: caixa de entrada em tempo real + leads de entrada automáticos
- Contatos, Empresas, Notas
- Tarefas (kanban + calendário)
- 1 funil · até 3 usuários · 1 número de WhatsApp
- Suporte por e-mail

### 🟩 Growth — "venda e receba no automático" — **R$ 149/usuário/mês**

Para quem já tem fluxo e quer que o CRM **trabalhe sozinho**. É o plano-herói (o que
queremos que a maioria compre).

Tudo do Standard, mais:

- **Financeiro completo**: faturas Pix/cartão/boleto pelo WhatsApp, régua de lembretes
  automática, assinaturas recorrentes, estorno, links avulsos
- **Nota fiscal (NFS-e)** automática ao pagar
- **Conciliação e exportações** (CSV/OFX para o contador) + aba Receita
- **Salesbot** de qualificação
- **Automações** (incl. gatilhos "Fatura paga"/"Fatura vencida")
- Broadcast e web forms (quando lançarem, entram aqui sem custo extra)
- Funis ilimitados · usuários ilimitados (cobrados por assento) · até 3 números de WhatsApp
- Suporte por WhatsApp

### 🟨 Personalizado — "do seu jeito" — **sob consulta** (piso sugerido R$ 990/mês)

Para operações maiores ou com necessidade específica. Vendido por conversa, não por página
de preço.

Tudo do Growth, mais:

- Onboarding assistido (migração de planilha/CRM anterior, configuração de funil, bot e
  templates Meta feitos por nós)
- Automações e integrações sob medida (API/webhooks com sistemas do cliente)
- Números de WhatsApp e workspaces adicionais
- SLA de suporte com canal dedicado
- Prioridade no roadmap (o que esse cliente pedir e fizer sentido, sobe na fila)
- **Futuro:** condições especiais no Zellate Pay (split negociado)

### 4.1 Regras comerciais sugeridas

- **Teste grátis de 14 dias** no Growth (o plano-herói é o padrão do trial — quem prova
  cobrança automática não volta para planilha).
- **Downgrade sempre permitido**; dados nunca são apagados por downgrade, apenas
  funcionalidades ficam somente-leitura.
- **Âncora de venda:** "o plano Growth se paga com **uma** fatura que você deixaria de
  esquecer de cobrar no mês."

---

## 5. Diferenciais competitivos

| Contra | Nosso argumento |
|---|---|
| **Kommo** | Preço em dólar, suporte em inglês, financeiro não é nativo (integrações). Zellate: PT-BR de ponta a ponta, Pix/NFS-e nativos, preço em real |
| **RD Station CRM** | Forte em marketing, fraco em WhatsApp operacional e cobrança. Zellate: o WhatsApp É o centro, e o dinheiro passa por dentro |
| **"Disparadores" (ManyChat etc.)** | Não são CRM: sem funil de verdade, sem financeiro, sem tarefas. Zellate: o disparo é uma feature, não o produto |
| **Planilha + WhatsApp pessoal** | Nosso verdadeiro concorrente. Argumento: leads que se criam sozinhos + cobrança que se lembra sozinha = vendas que deixavam de acontecer |

**Fosso (moat) de longo prazo:** quando o Zellate Pay existir, o CRM vira também a conta
que recebe — churn despenca, e cada venda do cliente gera receita para nós.

---

## 6. Métricas que importam (acompanhar desde o cliente nº 1)

- **Ativação:** % de workspaces que conectam o WhatsApp na 1ª semana (é o "aha moment").
- **North star:** nº de conversas que viram lead **e recebem resposta em < 1h**.
- **Para o Pay:** GMV faturado via módulo Financeiro por workspace/mês (é o teto da futura
  receita por take rate).
- MRR, churn mensal, NPS pós-onboarding.

---

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Dependência da Meta (WhatsApp Cloud API) | Seguir as políticas à risca (janela 24h, templates aprovados — já implementado); multicanal no roadmap reduz concentração |
| Dependência do Asaas | Camada `FinanceiroProvider` já abstrai o provedor — trocar/adicionar (ex.: Pagar.me) é implementar a interface |
| Upstream Twenty divergir | Regra de engenharia do fork: mudanças isoladas com `// FORK:`, upstream-friendly (CLAUDE.md) |
| Concorrente copiar | Velocidade + PT-BR + Pay. A combinação inteira é difícil de copiar rápido |
| Fundador sem PJ (bloqueia o Pay) | F5 já especificada e desenhada para ligar quando a PJ existir (`docs/design/zellate-financeiro-spec.md`) |

---

## 8. Documentos irmãos

- `docs/manual-operacao-producao.md` — operação, deploy e troubleshooting da produção
- `docs/design/zellate-financeiro-spec.md` — spec completa do módulo financeiro (F1–F5)
- `docs/design/voka-prompts-claude-code.md` — mapa de produto completo (22 fases)
- `CLAUDE.md` — contrato de engenharia do fork
