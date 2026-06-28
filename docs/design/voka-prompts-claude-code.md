# Voka CRM — Prompts para o Claude Code (produto COMPLETO, fase a fase)
### Clone do Kommo sobre o Twenty: TODAS as funcionalidades, não só 3 telas

---

## ⚠️ LEIA PRIMEIRO — o CRM NÃO são 3 telas

As 3 capturas que originaram este projeto (Pipeline Kanban, Lista, Inbox) são, nas
palavras do próprio site do Kommo, apenas **"3 visualizações customizáveis"** de **um**
módulo (o de Leads). O Kommo é *"equipado com dezenas de funcionalidades"* — um CRM
conversacional inteiro. **Este roteiro implementa o produto inteiro**, não as 3 telas.

As 3 telas estão cobertas pelas Fases 3, 4 e 9. **Todo o resto** (perfil do cliente com
feed, Contatos/Empresas/Clientes, Mail, Team chat, Tarefas/calendário, Salesbot, AI agent,
automações, broadcast, web forms, chat button, analytics, integrações/API, configurações,
permissões, mobile, onboarding…) está nas demais fases. Não pare nas 3 telas.

Use junto com:
- `voka-crm-kommo-clone-spec.md` — fonte de verdade (tokens, anatomia das 3 telas, backend).
- `alvo-visual-voka.html` — alvo visual das 3 telas em PT-BR.
- `kommo-ref-*.png` — referências originais do Kommo.

---

## PARTE A — MAPA DE PRODUTO COMPLETO (tudo que existe no Kommo)

Marque o que falta. Cada módulo vira fase(s) na Parte D. (Col. "Twenty": ✅ tem base · 🟡 parcial · ❌ não tem)

### 1. Acesso & conta
| Tela/recurso | Twenty |
|---|---|
| Login (e-mail, Google, Facebook), 2FA | 🟡 |
| Cadastro/trial, criar conta + subdomínio | 🟡 |
| Recuperar senha | ✅ |
| Onboarding (wizard de configuração inicial) | ❌ |
| Perfil do usuário / preferências pessoais | ✅ |

### 2. Shell / navegação global
| Tela/recurso | Twenty |
|---|---|
| Sidebar com TODOS os módulos (Leads, Chats, Tarefas, Listas, Mail, Estatísticas, Config.) | 🟡 |
| Busca global | 🟡 |
| Central de notificações | 🟡 |
| Seletor de idioma/conta | 🟡 |

### 3. Leads / Funil (módulo central — aqui vivem as "3 telas")
| Tela/recurso | Twenty |
|---|---|
| **Pipeline (Kanban)** — view 1 | 🟡 |
| **Lista** — view 2 | 🟡 |
| **Inbox** — view 3 | ❌ |
| Leads NÃO classificados (Incoming/Unsorted) | ❌ |
| Múltiplos funis | 🟡 |
| Etapas com cor + probabilidade | 🟡 |
| Ganho/Perdido + motivo de perda | ❌ |
| Lead scoring | ❌ |

### 4. Perfil do Lead/Cliente (client profile) — FEED unificado
| Tela/recurso | Twenty |
|---|---|
| Feed cronológico: chat + e-mail + notas + tarefas + mudanças de etapa + feedback da equipe | 🟡 |
| Campos do lead/contato/empresa, campos custom | ✅ |
| Chat embutido no perfil | ❌ |
| Campos obrigatórios por etapa | ❌ |

### 5. Listas / Catálogo
| Tela/recurso | Twenty |
|---|---|
| Contatos (lista + perfil) | ✅ |
| Empresas (lista + perfil) | ✅ |
| Clientes recorrentes (Customers — periodicidade/recompra) | ❌ |
| Catálogo de produtos/serviços (itens, preço, vincular ao lead) | ❌ |
| Importar/Exportar CSV, ações em massa, merge de duplicados | 🟡 |

### 6. Caixa de Entrada / Chats (multicanal)
| Tela/recurso | Twenty |
|---|---|
| Inbox unificada (WhatsApp, Instagram, Messenger, Telegram, e-mail, site) | ❌ |
| Múltiplos números de WhatsApp / multi-atendente | ❌ |
| Templates / respostas rápidas | ❌ |
| Roteamento/atribuição de conversas | ❌ |

### 7. Mail (e-mail)
| Tela/recurso | Twenty |
|---|---|
| Caixa de e-mail por usuário, vinculada ao lead/contato | 🟡 |

### 8. Team chat (chat interno)
| Tela/recurso | Twenty |
|---|---|
| Chat privado/grupo entre colegas e dentro do perfil do cliente | ❌ |

### 9. Tarefas
| Tela/recurso | Twenty |
|---|---|
| Lista de tarefas + **calendário** + tipos (ligar/reunião/e-mail) + lembretes | 🟡 |

### 10. Automação & IA
| Tela/recurso | Twenty |
|---|---|
| Digital Pipeline / automações por etapa | 🟡 |
| **Salesbot** (builder de bot no-code) | ❌ |
| **AI agent** (FAQ, recomenda, fecha venda 24/7) | ❌ |
| Broadcast / campanhas de mensagem (WhatsApp em massa) | ❌ |

### 11. Captura de leads
| Tela/recurso | Twenty |
|---|---|
| Web forms (construtor) | ❌ |
| Chat button / widget multicanal pro site | ❌ |

### 12. Analytics / Estatísticas
| Tela/recurso | Twenty |
|---|---|
| Relatórios em tempo real, dashboards customizáveis | 🟡 |
| Funil de conversão, tempo de resposta, ranking de vendedores | ❌ |
| Metas (goals) + previsão (forecast) | ❌ |
| Análise de chamadas/atividades | ❌ |

### 13. Integrações / Extensibilidade
| Tela/recurso | Twenty |
|---|---|
| API pública + Webhooks | ✅ |
| Marketplace de apps / catálogo de integrações | ❌ |

### 14. Configurações
| Tela/recurso | Twenty |
|---|---|
| Usuários & **permissões/papéis** + equipes | 🟡 |
| Funis & etapas (cor, probabilidade, campos obrigatórios) | 🟡 |
| Campos customizados, tags, fontes, motivos de perda | 🟡 |
| Templates/respostas rápidas | ❌ |
| Canais conectados (WhatsApp/IG/…) | ❌ |
| Faturamento / assinatura / planos | ❌ |
| Segurança, idioma/moeda, import/export | 🟡 |

### 15. Mobile & notificações
| Tela/recurso | Twenty |
|---|---|
| App/PWA responsivo + push | 🟡 |

---

## PARTE B — Organização dos arquivos (já está pronta)

Os arquivos de referência **já estão** em `docs/design/` do repo:
```
docs/design/
├─ alvo-visual-voka.html          (alvo visual das 3 telas — o Claude Code LÊ o CSS)
├─ kommo-ref-1-funil-kanban.png   (referência de layout do Kommo)
├─ kommo-ref-2-funil-lista.png
├─ kommo-ref-3-inbox.png
├─ voka-crm-kommo-clone-spec.md   (tokens, anatomia das 3 telas, backend)
└─ voka-prompts-claude-code.md    (este arquivo: mapa de produto + fases)
```
O **contrato do projeto** é o `CLAUDE.md` na **raiz** do repo (`/CLAUDE.md`) — arquivo separado e
detalhado, lido automaticamente em toda sessão. Ele aponta para `docs/design/` como fontes de
verdade. **Não existe CLAUDE.md embutido aqui** (para não haver duas versões em conflito): a única
versão válida é a da raiz.

> Fluxo: **uma fase por sessão** (`/clear` entre fases). Cole o prompt, revise o PR, só então avance.
> Em todo PR que mexe em tema/i18n/metadata, o Claude Code deve primeiro mostrar o parágrafo
> "onde está a fonte de verdade" (exigência do `CLAUDE.md`), antes do diff.

---

## PARTE D — Prompts fase a fase (cobrindo o produto inteiro)

> Cole **um por vez**. Blocos: **I** fundação · **II** núcleo de vendas · **III** comunicação ·
> **IV** automação/IA · **V** captura/extensão · **VI** gestão/dados/mobile.

---

### BLOCO I — FUNDAÇÃO

#### FASE 0 — Tema (apagar o Twenty) + i18n pt-BR
```
Objetivo: provar que "sumiu o Twenty" e ligar pt-BR antes de qualquer feature.
1. Sobrescreva os tokens do tema na raiz (ui/theme): cores, fonte (Plus Jakarta Sans +
   Inter só em tabela densa), densidade, raios, sombras — conforme spec Seção 2.
2. Crie src/brand/brand.config.ts {mode:'kommo-faithful', primary:'#7C3AED', accent:'#D4AF37'};
   chrome (botões primários, foco) lê dele.
3. Unifique ícones: lucide-react + simple-icons; wrappers <Icon/> e <ChannelIcon/>
   (whatsapp/instagram/messenger/telegram/google/email). Remova Tabler das telas-âncora.
4. i18n Lingui pt-BR padrão; moeda BRL, datas DD/MM/AAAA; catálogo com glossário do spec (Seção 3).
5. Aplique a UMA tela existente p/ demonstrar a virada.
Pronto quando: a tela demo não parece Twenty (fonte/cores/ícones/PT-BR) e o build passa.
```

#### FASE 1 — Shell de navegação global + busca + notificações
```
Objetivo: a casca do app com TODOS os módulos visíveis (deixa claro que não são 3 telas).
1. Sidebar/topbar global com itens: Leads, Chats (Inbox), Tarefas, Listas (Contatos/Empresas/
   Clientes/Catálogo), Mail, Estatísticas, Configurações. Ícones unificados, PT-BR.
2. Busca global (leads, contatos, empresas, conversas).
3. Central de notificações (tarefas vencendo, novas mensagens, menções).
4. Seletor de conta/idioma e menu do usuário.
Use rotas placeholder para módulos ainda não implementados (tela "em construção").
Pronto quando: navego por todos os módulos pela sidebar, com busca e notificações funcionando.
```

#### FASE 2 — Modelo de dados / paridade de CRM (objetos)
```
Objetivo: remodelar o domínio do Twento para o do Kommo (spec 5.1 + Parte A do roteiro).
1. Opportunity -> Lead (titulo, valor:BRL, etapaId, funilId, responsavelId, contatoPrincipalId,
   empresaId, fonte, status[aberto|ganho|perdido], motivoPerdaId, tags[], score, criadoEm).
2. Funil (Pipeline) + Etapa (nome, cor, ordem, probabilidade); MÚLTIPLOS funis.
3. Leads não classificados (Unsorted) com aceitar/recusar.
4. Reusar Contato/Empresa; criar Cliente recorrente (Customer), Catálogo de produtos,
   Tag colorida, Fonte, MotivoPerda, CampoCustom.
5. Tarefa (tipo, prazo, responsavel, relacionadoA, status). Thread/Mensagem (p/ Inbox).
6. Tudo via GraphQL + metadata engine. Seed de demonstração (funil "Vendas" + 4 etapas/cores).
Migrations reversíveis, sem perder dados.
Pronto quando: crio/edito todos esses objetos via API e eles aparecem no metadata.
```

---

### BLOCO II — NÚCLEO DE VENDAS

#### FASE 3 — Funil Kanban (VIEW 1 / alvo visual TELA 1)
```
Objetivo: Kanban idêntico a alvo-visual-voka.html (TELA 1) + kommo-ref-1. Re-skine RecordBoard.
Visual (ler o CSS do alvo): header de coluna CAPS + FAIXA 4px com cor da etapa; card com avatar+
BADGE de canal, nome, data DD/MM, título azul #2E90FA, valor R$ + tags, rodapé com status da
próxima tarefa + PONTINHO (#F04438 atrasada / #12B76A hoje / #F79009 sem tarefa).
Top bar: VOKA, toggle Kanban/Lista, "Buscar e filtrar", "48 leads: R$ 32.000", "Automatizar"
(raio dourado), "Novo Lead" (azul).
Funcional: drag&drop persiste etapa; contador+somatório por coluna; seletor de FUNIL; filtro/busca.
Pronto quando: visualmente equivalente ao alvo e arrastar muda a etapa de verdade.
```

#### FASE 4 — Funil Lista (VIEW 2 / alvo visual TELA 2) + massa/import/export
```
Objetivo: Lista idêntica a alvo-visual-voka.html (TELA 2) + kommo-ref-2. Re-skine RecordTable.
Visual: colunas Título do lead (azul), Contato principal (sublinhado), Empresa, Etapa (PILL
colorido — cores spec 2.2), Valor (R$) à direita; tabela arejada.
Funcional: edição inline; seleção múltipla com AÇÕES EM MASSA (atribuir, mover etapa, ganho/
perdido, excluir, tag); importar/exportar CSV; filtros salvos por funil; ordenação.
Pronto quando: bate com o alvo, edita em massa e importa/exporta CSV.
```

#### FASE 5 — Leads não classificados (Incoming)
```
Objetivo: a caixa de leads crus (de canais/forms) antes do funil — recurso central do Kommo.
- Tela de leads não classificados com origem/canal, prévia da 1ª mensagem, ações ACEITAR
  (vira Lead no funil escolhido) / RECUSAR (lixeira/spam).
- Contador no shell; criação automática quando chega mensagem/sem lead vinculado (liga na Fase 10).
Pronto quando: leads crus aparecem, consigo aceitar (entra no funil) ou recusar.
```

#### FASE 6 — Perfil do Lead/Cliente + FEED unificado [coração do CRM]
```
Objetivo: a tela de detalhe estilo Kommo, com feed unificado (spec Fase 4 antiga).
- Cabeçalho: nome/título, valor R$ editável, etapa (dropdown que move no funil), responsável,
  tags, fonte, botões Ganho/Perdido (perdido exige motivo).
- Painel de campos (contato, empresa, telefone, e-mail, campos custom; produtos do catálogo).
- FEED cronológico: notas + tarefas (criar/concluir inline) + mudanças de etapa (log automático)
  + e-mails + MENSAGENS de chat (placeholder; liga na Fase 10) + feedback da equipe (Team chat).
- Campos obrigatórios por etapa: bloqueia avanço se faltar.
Pronto quando: abro um lead, vejo histórico unificado, crio nota/tarefa pelo feed, movo etapa
e o movimento fica logado.
```

#### FASE 7 — Listas: Contatos, Empresas, Clientes, Catálogo
```
Objetivo: os módulos de cadastro do Kommo (não fazem parte das 3 telas).
- Contatos: lista + perfil (com feed e leads vinculados).
- Empresas: lista + perfil (contatos e leads vinculados).
- Clientes recorrentes (Customers): periodicidade/recompra, próximo contato, valor recorrente.
- Catálogo de produtos/serviços: itens com preço; vincular a leads e somar valor.
- Em todos: importar/exportar CSV, ações em massa, detecção e MERGE de duplicados.
Pronto quando: navego Contatos/Empresas/Clientes/Catálogo, abro perfis, mesclo duplicados.
```

---

### BLOCO III — COMUNICAÇÃO

#### FASE 8 — Inbox / Chats UI (VIEW 3 / alvo visual TELA 3, com mock)
```
Objetivo: Inbox de 3 painéis idêntica a alvo-visual-voka.html (TELA 3) + kommo-ref-3 (mock).
- Painel 1 (claro): busca, "CAIXA DE ENTRADA" + contador, Filtrar; conversas com avatar+BADGE
  de canal, nome, prévia, hora, estrela; ativo #437EDD; "MENÇÕES E CHAT DA EQUIPE".
- Painel 2 (ESCURO #203D49): cartão do contato — nome, +tags, "Funil: <etapa>" (dropdown),
  abas Principal/Estatísticas/Configuração, Responsável, Valor R$, telefone, e-mail, cargo.
- Painel 3: conversa — balões enviado (azul #2E90FA dir.) / recebido (cinza esq.) + hora;
  cards de tarefa inline; "digitando…"; compositor "Chat com <colega>", emoji, anexo, Enviar/Cancelar.
Pronto quando: pixel-equivalente ao alvo, navegável (mock), PT-BR.
```

#### FASE 9 — Backend omnicanal + WhatsApp Cloud API + tempo real
```
Objetivo: ligar a Inbox a mensagens reais. Módulo NestJS "messaging-omni" (spec 5.2/5.3).
- Thread + Mensagem (direcao, corpo, anexos, canal, idExterno, status entregue/lido), ligadas
  a Contato e Lead. ADAPTER por canal: ChannelAdapter{send,receiveWebhook,normalize}.
- WhatsAppAdapter (Cloud API/Meta): webhook entrada, envio, status. Stubs p/ IG/Messenger/Tg/Email.
- Idempotência/dedupe por idExterno. Envio confiável via OUTBOX (persistir->worker->retry).
- Tempo real (WebSocket/SSE). Toda msg entra no FEED do lead. Substituir mocks da Fase 8.
- Mensagem sem lead vinculado -> cria "lead não classificado" (Fase 5).
Pronto quando: recebo/respondo WhatsApp real, status atualiza, aparece na Inbox e no feed.
```

#### FASE 10 — Demais canais + Mail + Team chat
```
Objetivo: completar a comunicação multicanal.
- Implementar adapters: Instagram (DM/stories/comments), Messenger, Telegram.
- MAIL: caixa de e-mail por usuário (IMAP/SMTP ou API) vinculada a lead/contato, no feed.
- TEAM CHAT: chat interno entre colegas (privado, grupo) e DENTRO do perfil do cliente
  (feedback da equipe), separado das conversas com cliente.
Pronto quando: recebo/respondo IG, Messenger, Telegram e e-mail no app; converso com colegas
no team chat e dentro de um lead.
```

#### FASE 11 — Multi-número/multi-atendente + templates + roteamento
```
Objetivo: operação de equipe (spec 5.3/5.4).
- WhatsAppPhoneNumber: vários números (1 phone_number_id/linha) ligados a funil/equipe;
  vários atendentes no mesmo número.
- Roteamento/atribuição de Thread (responsável, round-robin, por etapa); reatribuir.
- Templates aprovados (HSM) p/ janela 24h; respostas rápidas com variáveis {{nome}} {{valor}},
  tipos texto/imagem/video/doc, atalho "/" no compositor.
Pronto quando: dois atendentes operam um número, atribuo conversas, uso template e resposta rápida.
```

#### FASE 12 — Broadcast / campanhas de mensagem
```
Objetivo: disparo em massa (Kommo "messaging campaigns").
- Criar campanha: segmento (filtro de leads/contatos), canal (WhatsApp em massa via template),
  agendamento, variáveis, controle de janela/opt-out.
- Relatório de entrega/leitura/resposta; integração com Salesbot (Fase 14).
Pronto quando: disparo um broadcast segmentado por WhatsApp e vejo o relatório.
```

---

### BLOCO IV — AUTOMAÇÃO & IA

#### FASE 13 — Digital Pipeline / Automações
```
Objetivo: automações por etapa (spec 5.5).
- Motor event-driven: GATILHO (muda etapa | msg recebida | tarefa vence | lead criado |
  lead não classificado) + CONDIÇÕES + AÇÕES (criar tarefa | enviar template | mover etapa |
  atribuir | webhook | disparar bot). UI de regras por funil.
Pronto quando: crio regra (ex.: lead novo de WhatsApp -> tarefa + template) e ela dispara.
```

#### FASE 14 — Salesbot (no-code) + AI agent
```
Objetivo: bots (spec 5.6).
- SALESBOT: builder no-code (gatilho -> nós: mensagem, condição, coletar dado, ação, handoff).
  Saudação, qualificação, follow-up, agendamento.
- AI AGENT: nó/agente IA via Anthropic SDK — responde FAQ, recomenda produtos do catálogo,
  conduz à compra 24/7; handoff p/ humano em baixa confiança ou pedido explícito.
Pronto quando: um Salesbot qualifica e um AI agent responde FAQ/recomenda e faz handoff.
```

---

### BLOCO V — CAPTURA & EXTENSÃO

#### FASE 15 — Web forms + Chat button/widget
```
Objetivo: entrada de leads (spec Fase 9 antiga).
- Construtor de FORMULÁRIO WEB (campos configuráveis) + embed/iframe; submissão cria lead
  não classificado no funil escolhido, com fonte rastreada.
- CHAT BUTTON / widget multicanal pro site (snippet JS): abre conversa -> Inbox (canal "site")
  + cria lead não classificado.
- Rastreio de fonte/origem em todo lead.
Pronto quando: form e widget geram leads não classificados com a fonte correta.
```

#### FASE 16 — Integrações / Marketplace / API
```
Objetivo: extensibilidade estilo Kommo.
- Expor/garantir API pública + WEBHOOKS de eventos (lead, mensagem, tarefa).
- Estrutura de MARKETPLACE/integrações: catálogo de apps, OAuth de terceiros, chaves/API tokens
  na config. (Implementar o framework + 1-2 integrações exemplo.)
Pronto quando: um app externo se autentica, recebe webhooks e usa a API; catálogo visível na config.
```

---

### BLOCO VI — GESTÃO, DADOS & MOBILE

#### FASE 17 — Tarefas (lista + calendário)
```
Objetivo: módulo de tarefas completo (spec 5.7).
- Visão LISTA + CALENDÁRIO; tipos (ligar/reunião/e-mail/outro); lembretes; "minhas tarefas".
- Status da próxima tarefa alimenta o PONTINHO do card/lista (Fases 3/4).
Pronto quando: vejo tarefas no calendário, crio com tipo/prazo, e os pontinhos refletem o status.
```

#### FASE 18 — Permissões/papéis + equipes + duplicados
```
Objetivo: governança.
- PAPÉIS (admin/gerente/vendedor) + permissões por funil e por recurso (relatórios/automações);
  "ver só os próprios leads".
- EQUIPES e atribuição por equipe (gerente vê a equipe; vendedor vê o seu).
- Detecção/merge de DUPLICADOS (lead/contato por telefone/e-mail) preservando feed.
Pronto quando: papéis limitam o que cada um vê; merge não perde histórico.
```

#### FASE 19 — Configurações (centro de administração)
```
Objetivo: todas as telas de configuração do Kommo.
- Funis & etapas (cor, probabilidade, campos obrigatórios), campos customizados, tags, fontes,
  motivos de perda, templates/respostas rápidas.
- Canais conectados (WhatsApp/IG/Messenger/Telegram/Mail) — conectar/desconectar.
- Usuários, FATURAMENTO/assinatura/planos, segurança (2FA), idioma/moeda, import/export.
Pronto quando: administro tudo isso pela área de Configurações.
```

#### FASE 20 — Analytics / Estatísticas / Metas
```
Objetivo: relatórios nível Kommo (spec 5.8).
- Dashboards customizáveis em tempo real: funil de conversão por etapa, TEMPO DE RESPOSTA
  (1ª/médio), volume de vendas, ranking de vendedores, leads por canal/fonte, valor em pipeline,
  motivos de perda, análise de atividades/chamadas.
- METAS por vendedor/equipe + PREVISÃO ponderada pela probabilidade. Exportação.
Pronto quando: vejo conversão, tempo de resposta, ranking e forecast filtrando por período/funil/canal.
```

#### FASE 21 — Onboarding + Acesso (login social/2FA/trial)
```
Objetivo: jornada de entrada do produto comercial.
- Login e-mail + Google + Facebook + 2FA; cadastro/trial; criar conta + subdomínio (multi-tenant).
- WIZARD de onboarding: criar 1º funil, conectar 1º canal (WhatsApp), convidar equipe.
Pronto quando: um novo cliente cria conta, faz onboarding e chega num CRM já utilizável.
```

#### FASE 22 — Mobile (responsivo/PWA) + push
```
Objetivo: uso no celular (o Kommo tem apps iOS/Android).
- Tornar as telas responsivas / PWA instalável; navegação mobile.
- Notificações push (nova mensagem, tarefa, menção).
Pronto quando: opero leads e respondo chats pelo celular, recebendo push.
```

---

## Resumo da cobertura
**Fundação** (0–2) · **Núcleo de vendas + as 3 views** (3–7) · **Comunicação multicanal** (8–12)
· **Automação & IA** (13–14) · **Captura & API** (15–16) · **Gestão, dados & mobile** (17–22).

> As 3 telas que começaram tudo são as Fases 3, 4 e 8. Há **mais 19 fases** porque um CRM
> conversacional é um produto inteiro — e é isso que estamos clonando.
