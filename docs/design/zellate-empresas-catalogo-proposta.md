# Proposta — Empresas, Clientes e Catálogo como CRM profissional

> **Origem:** o usuário reportou que a aba Empresas é estática, isolada, sem lógica de
> negócio, sem associação a leads/clientes, e que o Catálogo vive o mesmo cenário — e
> pediu uma proposta robusta baseada em HubSpot / grandes CRMs. Também há um bug concreto:
> preencher "Funcionários" quebra com *"unknown fields employees in objectMetadataItem company"*.
>
> **Natureza:** documento de proposta. Faseado (1 PR por fase, conforme CLAUDE.md). Nada é
> implementado sem OK explícito, exceto o hotfix da F0 se você autorizar. 12/07/2026.

---

## 1. Diagnóstico (o que investiguei no código e no banco de produção)

Hoje existem **três silos de dados que não se falam**, onde um CRM profissional teria **um
grafo de relações único**:

| Módulo | Onde os dados vivem | Problema |
|---|---|---|
| **Empresa** | Objeto nativo do Twenty (`company`), com relações reais (`people`, `opportunities`, `accountOwner`) | A UI do fork lê/escreve campos **que não existem** neste workspace: `employees` (inexistente) e `annualRecurringRevenue` (o campo real é `annualRevenue`). Daí o crash ao editar. Não usa as relações nativas. |
| **Catálogo / Produtos** | Tabela própria do fork (`produtos`, API GraphQL isolada) | Desconectado: um produto não vira item de um negócio, não alimenta o valor do lead, não vira linha de fatura. É um cadastro morto. |
| **Clientes Recorrentes** | *Outra* tabela própria do fork (`clientesRecorrentes`) | Mais um silo. Um "cliente" aqui não é a mesma entidade que a empresa ou o contato que fechou negócio. Duplicação conceitual. |

Fatos verificados no metadata de produção:

- **`opportunity`** (o lead) **já tem** as relações `company` e `pointOfContact` (contato) —
  mas **não há UI** para preenchê-las. Por isso "o lead não se consegue associar".
- **`company`** já tem `opportunities`, `people`, `accountOwner`, `address`, `annualRevenue`,
  `domainName`, `linkedinLink`, timeline, tarefas e notas — quase tudo que um "registro 360"
  precisa. O fork simplesmente não consome isso.
- Não existe objeto `produto` nem `cliente` no metadata — eles são tabelas paralelas.

**Conclusão:** o problema não é "faltam telas". É que o fork construiu silos à parte em vez de
usar o motor de relações que o Twento já oferece. A correção profissional é **consolidar tudo
no grafo nativo** e conectar Financeiro/WhatsApp por cima — o modelo do HubSpot.

---

## 2. Princípio norteador — o modelo dos grandes CRMs

HubSpot, Pipedrive, Salesforce e Zoho compartilham o mesmo grafo central:

```
Empresa (Company)
  ├── Contatos (People)          "quem trabalha lá"
  ├── Negócios (Deals/Leads)     "oportunidades com essa conta"
  │     └── Itens de negócio      produto × qtd × preço × desconto  →  valor do negócio
  │            └── gera →  Fatura / Cobrança  →  Pagamento
  ├── Ciclo de vida               Lead → Oportunidade → Cliente → Inativo
  ├── Tarefas · Notas · Timeline
  └── Conversas (WhatsApp) · Receita (LTV/MRR)
```

Três consequências de projeto que adoto na proposta:

1. **"Cliente" não é um objeto novo — é um estágio do ciclo de vida** de uma empresa/contato.
   Vira "Cliente" quem tem negócio Ganho ou fatura paga. (HubSpot: *lifecycle stage*.)
2. **"Produto" é biblioteca de preços; o que conecta é o item de negócio** (line item): a
   ligação negócio↔produto com quantidade e preço. O valor do negócio passa a ser a soma dos
   itens, e a fatura nasce desses itens.
3. **A Empresa é o registro-âncora 360°** que agrega contatos, negócios, itens, faturas,
   conversas e receita.

---

## 3. Modelo de dados alvo

Aproveitar o motor de metadata do Twenty (relações nativas, timeline, permissões, busca) em
vez de novas tabelas soltas.

**Campos novos em `company`** (via migration de campo standard — padrão do fork: registro
`STANDARD_OBJECTS` + migração para workspaces existentes):
- `employees` (NUMBER) — corrige o bug na origem, virando campo real.
- `industry` / `segmento` (SELECT) — segmento de atuação.
- `cnpj` (TEXT) — documento (útil para NFS-e/financeiro).
- `phone` (PHONES) — telefone principal da empresa.
- `lifecycleStage` (SELECT: Lead · Oportunidade · Cliente · Inativo) — o ciclo de vida.

**Itens de negócio** — ligar produto ao lead. Duas opções (§8 recomenda):
- Promover `produto` a **objeto custom** do metadata e criar `oportunidadeProduto`
  (negócio ↔ produto, `quantidade`, `precoUnitario`, `desconto`), ou
- Manter `produto` como está e criar só a tabela de itens vinculada ao `opportunityId`.

**Cliente:** **removido como silo**. A tela "Clientes" passa a ser uma **visão** de empresas
(ou contatos) com `lifecycleStage = Cliente`, mostrando LTV, MRR e próxima renovação a partir
das faturas do Financeiro. O que hoje é `clientesRecorrentes` migra para assinaturas do
Financeiro (já existe `assinatura`).

---

## 4. Módulo Empresa 360° (o registro-âncora)

Reconstruir a página de detalhe da empresa como um verdadeiro registro 360, consumindo as
relações nativas:

- **Cabeçalho:** nome, logo, site, segmento, dono (accountOwner), badge de ciclo de vida.
- **Métricas no topo:** valor em negociação (soma dos negócios abertos), total ganho (LTV),
  MRR (assinaturas ativas), última interação.
- **Contatos:** lista das pessoas da empresa + **associar/criar contato** ali mesmo.
- **Negócios:** lista dos leads da empresa com etapa e valor + **criar negócio** já vinculado.
- **Faturas:** cobranças da empresa (via Financeiro) com status Pix/cartão.
- **Conversas:** conversas de WhatsApp dos contatos da empresa.
- **Tarefas · Notas · Timeline:** já nativos, só exibir.
- **Informações editáveis** sem crash (campos reais).

**Lista de Empresas:** colunas úteis (segmento, dono, nº de negócios abertos, receita/LTV,
ciclo de vida), filtros por segmento/estágio/dono, busca — deixa de ser estática.

**Associação lead↔empresa↔contato:** expor no detalhe do **lead** os seletores de Empresa e
Contato (as relações já existem no banco), fechando a queixa "o lead não se associa".

---

## 5. Cliente como ciclo de vida (não como silo)

- Adicionar `lifecycleStage` à empresa e ao contato.
- **Automação:** negócio movido para Ganho **ou** fatura paga → estágio vira "Cliente"
  (reaproveita os gatilhos que já existem: `fatura.paga`, e o Ganho do funil).
- **Tela "Clientes":** visão filtrada por `lifecycleStage = Cliente`, com LTV, MRR, últimas
  faturas e próxima renovação — dados vindos do Financeiro, não de uma tabela paralela.
- Migração dos `clientesRecorrentes` existentes para assinaturas do Financeiro (sem perda).

---

## 6. Catálogo → Itens de negócio → Fatura (o elo que falta)

É a peça que transforma o Catálogo de "cadastro morto" em motor de receita — o fluxo
**HubSpot Products → Line Items → Quote → Invoice**:

1. **Catálogo** continua sendo a biblioteca de preços (produto, preço, unidade, SKU, categoria).
2. **No detalhe do negócio (lead):** seção **"Itens"** — adicionar produtos do catálogo, com
   quantidade, preço (default do catálogo, editável) e desconto. O **valor do negócio passa a
   ser calculado** pela soma dos itens (some hoje é digitado à mão).
3. **Gerar fatura a partir dos itens:** o botão de cobrança do Financeiro passa a herdar a
   descrição e o valor dos itens do negócio — nota fiscal e cobrança saem coerentes.
4. **(Opcional) Orçamento/Proposta:** PDF dos itens enviado por WhatsApp antes do fechamento.

Resultado: Catálogo → Funil → Financeiro → NFS-e viram **um fluxo só**, com o produto
carregando preço e descrição de ponta a ponta.

---

## 7. Fiação entre módulos (o "ecossistema")

Depois das fases, o grafo fica assim, todo navegável na UI:

- Empresa ↔ Contatos ↔ Negócios (associáveis nos dois sentidos).
- Negócio → Itens (produtos) → valor → Fatura → Pagamento → vira Cliente → LTV/MRR na empresa.
- Conversa de WhatsApp aparece no contato, na empresa e no negócio.
- Tudo registrado na timeline nativa.

---

## 8. Decisões que preciso de você

1. **Produto: objeto custom (recomendado) ou manter tabela do fork?**
   Promovê-lo a objeto do metadata dá relações, busca e timeline de graça e casa com o resto;
   manter a tabela é menos trabalho agora, mas segue meio isolado. **Recomendo promover.** - **Resposta do minha: remover e seguir com o objeto custom**
2. **Migrar `clientesRecorrentes` para assinaturas do Financeiro** (recomendado) ou manter os
   dois por ora?  **Resposta: faca o Recomendo.**
3. **Escopo do primeiro PR:** só o hotfix do crash, ou hotfix + Empresa 360 (F1)?

---

## 9. Faseamento (1 PR por fase)

| Fase | Entrega | Tamanho |
|---|---|---|
| **F0 — Hotfix** | Parar o crash: alinhar a página de Empresa aos campos reais (`annualRevenue`; `employees` some ou vira campo real). Pequeno, seguro, deploy imediato. | XS |
| **F1 — Empresa 360** | Campos standard novos (employees, segmento, cnpj, phone, lifecycleStage) via migration; detalhe 360 (contatos, negócios com valor, faturas, conversas, métricas); associação lead↔empresa↔contato; lista real. | M |
| **F2 — Cliente = ciclo de vida** | lifecycleStage + automação (Ganho/fatura paga → Cliente); tela Clientes como visão com LTV/MRR/renovação; migrar clientesRecorrentes p/ assinaturas. | M |
| **F3 — Catálogo + Itens de negócio** | Produto como objeto; itens no negócio; valor do negócio = soma dos itens; fatura a partir dos itens. | M/L |
| **F4 — Proposta/Orçamento** | PDF de orçamento pelos itens, enviado por WhatsApp; analytics de produto. | M |

## 10. Riscos e cuidados

- **Migrations reversíveis** e sem quebrar dados (CLAUDE.md); campo standard novo exige o
  registro em `STANDARD_OBJECTS` + migração para o workspace existente + `cache:flush`.
- **Build do front** hoje é o gargalo operacional (commit do Windows saturado pelo Docker
  Desktop); cada fase precisa do ritual de build/deploy já documentado.
- **Upstream-friendly:** manter as mudanças isoladas com `// FORK:` para não travar merges.
- Promover `produto` a objeto exige migrar os produtos existentes do silo para o metadata
  (script de seed) — reversível, mas é a parte mais delicada da F3.

## 11. O bug imediato (independente das fases)

`EmpresaDetailPage` escreve `employees` (inexistente) e lê `annualRecurringRevenue` (o certo é
`annualRevenue`). Hotfix mínimo: remover a edição de `employees` (ou adicioná-lo como campo
real) e corrigir o nome do campo de receita. Sem isso, a tela de empresa quebra a cada edição.
