# Voka CRM — Deploy de produção (Hetzner)

## Pré-requisitos no servidor (Ubuntu 22.04/24.04)
```bash
curl -fsSL https://get.docker.com | sh
ufw allow 22,80,443/tcp && ufw enable
```

## Deploy
```bash
git clone <repo> voka && cd voka/deploy
cp .env.prod.example .env   # preencher tudo
docker compose -f docker-compose.prod.yml build   # ~15 min na 1ª vez
docker compose -f docker-compose.prod.yml up -d
# aplicar migrations do fork:
docker compose -f docker-compose.prod.yml exec server \
  node dist/command/command.js upgrade
```

## Camadas de segurança incluídas
- TLS automático (Let's Encrypt via Traefik) + redirect HTTP→HTTPS
- Rate limit: 30 req/s geral, 5 req/s no /graphql (login/brute-force)
- CAPTCHA Turnstile nas telas de entrar/cadastro/2FA (quando configurado)
- Backup diário 03:00 UTC → Hetzner Object Storage, retenção 14 dias
- Postgres/Redis sem portas expostas (rede interna do compose)

## Recomendado além disso
- Cloudflare em frente ao domínio (WAF + esconde o IP do servidor)
- Backups Hetzner do volume (snapshot semanal) como 2º destino
