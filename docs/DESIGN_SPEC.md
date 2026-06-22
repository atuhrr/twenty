# DESIGN SPEC — CRM WhatsApp (referência visual para Epics 4 e 5)

> Salve como `docs/DESIGN_SPEC.md`. Valores são **alvos** extraídos do mockup; ajuste finos com conta-gotas no PNG. Onde houver token equivalente no `twenty-ui`, **use o token** em vez do hex cru; só caia para Linaria custom quando não existir equivalente. Nada de Tailwind.

## 0. Princípio de adaptação
O Twenty já tem sidebar, board (kanban) e right drawer nativos. **Reaproveite a estrutura nativa e re-tematize**, não reconstrua do zero. O visual-alvo é: sidebar dark, board claro denso, drawer = clone de WhatsApp Web. Onde o componente nativo divergir muito, sobrescreva via `styled` apenas o necessário.

---

## 1. TOKENS GLOBAIS

### Cores base
| Token | Hex alvo | Uso |
|---|---|---|
| `--wa-green` | `#25D366` | Ação primária WhatsApp, ícones, botão enviar |
| `--wa-green-dark` | `#1DAA52` | Hover/estado ativo verde |
| `--brand-purple` | `#7C5CFC` | Botões primários ("Novo Negócio"), destaques |
| `--brand-purple-dark` | `#6D49E0` | Hover roxo |
| `--sidebar-bg` | `#16162A` | Fundo da sidebar (azul-roxo quase preto) |
| `--sidebar-bg-2` | `#1E1E36` | Card do rodapé da sidebar |
| `--board-bg` | `#F4F5F8` | Fundo da área central |
| `--surface` | `#FFFFFF` | Cards, drawer, colunas |
| `--text-strong` | `#1A1A2E` | Títulos, nomes |
| `--text-muted` | `#8B8B9A` | Preview, metadados |
| `--border` | `#E8E9EF` | Bordas sutis, divisores |
| `--chat-bg` | `#ECE5DD` | Fundo do painel de chat (estilo WhatsApp) |
| `--bubble-in` | `#FFFFFF` | Balão recebido |
| `--bubble-out` | `#D9FDD3` | Balão enviado (verde-água claro) |

### Tags de origem / status (chip = bg claro + texto saturado)
| Tag | bg | texto |
|---|---|---|
| Tráfego Pago | `#E3EDFF` | `#2563EB` |
| Revendedor | `#FFF0DF` | `#EA8C00` |
| Compra | `#E2F6E8` | `#1DAA52` |
| Interesse | `#FFF6DA` | `#B7891A` |
| Proposta Enviada | `#EFE7FF` | `#7C5CFC` |
| Ganho | `#E2F6E8` | `#1DAA52` |
| Qualificado (badge no header do chat) | `#FFF1C9` | `#B7891A` |

### Tipografia (fonte: Inter — já usada pelo Twenty)
| Papel | Tamanho / peso |
|---|---|
| Título de seção ("Funil de Vendas") | 20px / 700 |
| Header de coluna | 14px / 600 |
| Nome no card | 14px / 600 |
| Preview de mensagem | 13px / 400, cor `--text-muted` |
| Metadado (tempo, contagem) | 11px / 500, cor `--text-muted` |
| Texto de balão | 14px / 400 |
| Timestamp do balão | 11px / 400 |

### Espaçamento e raio
- Escala base: 4px. Padding de card: 12px. Gap entre cards: 10px. Gap entre colunas: 14px.
- Raio: cards/chips 8px, balões 10px, avatares circulares, botões 8px.
- Sombra de card: `0 1px 2px rgba(20,20,40,.06)`.

---

## 2. SIDEBAR (Epic 4)
- Largura ~240px, `background: var(--sidebar-bg)`, altura total.
- Topo: logo redondo verde com ícone WhatsApp + label "CRM Ultimate" (texto claro). Substituir pelo nome real do projeto.
- Itens de menu: ícone (20px) + label, texto `#C9C9D6`, padding vertical 10px, radius 8px no hover.
  - **Item ativo**: texto `--wa-green`, fundo `rgba(37,211,102,.12)`, barra/realce à esquerda.
  - Item com badge (ex.: "Conversas 23"): pill verde `--wa-green` à direita, texto branco, 11px.
- **Rodapé — badge de conexão (liga ao Epic 4):** card `--sidebar-bg-2`, radius 10px, ícone WhatsApp + "Conectado com WhatsApp Business" + linha de status com bolinha verde + "Conectado". Estado desconectado: bolinha cinza + "Desconectado". O estado vem de `whatsappConnectionStatus`.

---

## 3. BOARD HEADER (Epic 5)
- Linha única: título "Funil de Vendas" (esquerda) · filtro "Período: 7 dias" (dropdown pill com borda) · busca "Buscar cliente ou conversa..." (input com ícone de lupa, fundo `--surface`, borda `--border`) · botão "+ Novo Negócio" (`--brand-purple`, texto branco, radius 8px).

---

## 4. COLUNA DO KANBAN (Epic 5)
- Cada coluna: largura ~240px, fundo `--board-bg` (levemente mais claro que o gap), header sticky.
- **Header da coluna**: índice + nome (ex.: "1. Novo Lead") em 14px/600; abaixo, contagem ("48 leads") e, quando houver, valor monetário ("R$ 12.350") em 11px `--text-muted`. Cor de acento por estágio (barra fina no topo ou no texto do título):
  - Novo Lead = azul `#2563EB` · Em Atendimento = âmbar `#EA8C00` · Qualificado = verde `#1DAA52` · Proposta = roxo `#7C5CFC` · Fechado = verde `#1DAA52`.
- **Footer da coluna**: link discreto "+ N leads" centralizado, `--text-muted`.

---

## 5. CARD DO KANBAN (Epic 5) — anatomia
Ordem vertical dentro do card (`--surface`, radius 8px, padding 12px, sombra leve):
1. **Linha topo:** avatar circular 28px + nome (14px/600). Ícone WhatsApp verde 16px alinhado à direita.
2. **Preview:** "Mensagem: <texto>" truncado em 2 linhas, 13px `--text-muted` (vem de `lastWhatsappMessage`).
3. **Linha base:** tempo decorrido relativo à esquerda ("Agora", "2 min", "10 min") 11px `--text-muted`; chip de tag de origem à direita (cores da tabela §1).
- Estados: hover eleva sombra; card em drag com opacidade 0.8.

---

## 6. RIGHT DRAWER — CHAT (Epic 5)
Largura ~380px, fundo `--surface`, sombra à esquerda.

### 6.1 Header do drawer
- Avatar 36px + nome (Camila Rocha, 15px/600) + número (`+55 11 98765-4321`, 12px `--text-muted`) + badge de status ("Qualificado", chip §1).
- Ícones à direita: telefone, vídeo, "⋮" (menu). 18px, `--text-muted`.

### 6.2 Tabs
- "Chat" | "Detalhes". Aba ativa: texto `--text-strong` + underline `--wa-green` (2px). Inativa: `--text-muted`. Usar o padrão de tabs do `twenty-ui` re-tematizado.

### 6.3 Banner de origem (topo da conversa)
- Faixa clara arredondada com ícone: "Lead veio do Instagram Ads" + 2ª linha "Campanha: Maio/2024 | Conjunto: Produto 01", 12px. Fundo `#FFF6DA`/neutro.

### 6.4 Área de mensagens
- Fundo `--chat-bg`. Scroll vertical. Espaçamento entre balões 6px.
- **Balão recebido (INBOUND):** alinhado à esquerda, `--bubble-in`, radius 10px (canto superior-esquerdo menor), max-width 75%, sombra leve. Timestamp 11px `--text-muted` no rodapé interno direito.
- **Balão enviado (OUTBOUND):** alinhado à direita, `--bubble-out`. Timestamp + **checkmark de status**: ✓ enviado, ✓✓ entregue, ✓✓ azul lido (`status` da mensagem).
- **Anexo (mídia/documento):** dentro do balão, ícone do tipo + nome do arquivo ("Catalogo_Produtos.pdf") + tamanho ("2.4 MB"); imagem renderiza thumbnail. `mediaUrl` do backend.

### 6.5 Input
- Barra inferior: ícone emoji + ícone anexar (clipe) à esquerda, input "Digite uma mensagem..." (radius 20px, fundo `#F4F5F8`), botão circular verde `--wa-green` com ícone de envio à direita. Enter envia → mutation `sendWhatsappMessage`. Render otimista do balão antes da confirmação.
- **Regra da janela de 24h:** se a janela estiver fechada, o input livre fica desabilitado com aviso "Fora da janela de 24h — envie um template" e abre seletor de template aprovado (liga ao Epic 6).

---

## 7. ESTADOS E VAZIOS
- Coluna sem cards: placeholder discreto "Nenhum lead aqui".
- Chat sem histórico: ilustração/linha "Nenhuma mensagem ainda".
- Carregando mensagens: skeleton de balões, não spinner cheio.
- Erro de envio: balão com ícone vermelho de retry.

## 8. CHECKLIST DE FIDELIDADE (use no DoD visual dos Epics 4–5)
- [ ] Sidebar dark com item ativo verde e badge de contagem.
- [ ] Badge de conexão no rodapé reflete status real.
- [ ] Header da coluna com acento de cor por estágio + contagem/valor.
- [ ] Card mostra avatar, preview, tempo relativo e chip de origem.
- [ ] Drawer com tabs Chat/Detalhes e banner de origem.
- [ ] Balões in/out com cores corretas, timestamp e checkmark de status.
- [ ] Anexos renderizam nome+tamanho (e thumbnail p/ imagem).
- [ ] Input com emoji/anexo/enviar e bloqueio fora da janela de 24h.
