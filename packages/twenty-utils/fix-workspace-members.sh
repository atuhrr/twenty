#!/bin/bash
# =============================================================================
# fix-workspace-members.sh
# =============================================================================
# Garante que todos os usuários do core.userWorkspace têm um registro
# correspondente em workspaceMember no schema do workspace ativo.
# Também limpa o cache Redis ao final.
#
# Uso: bash packages/twenty-utils/fix-workspace-members.sh
# =============================================================================
set -euo pipefail

info()  { echo "=> $*"; }
ok()    { echo "   OK: $*"; }
fail()  { echo "   ERRO: $*" >&2; exit 1; }

PSQL="docker exec twenty-dev-db-1 psql -U postgres -d default"
REDIS="docker exec twenty-dev-redis-1 redis-cli"

# ---------------------------------------------------------------------------
# 1. Verificar containers
# ---------------------------------------------------------------------------
info "Verificando containers..."
docker inspect twenty-dev-db-1    --format '{{.State.Status}}' 2>/dev/null | grep -q running \
  || fail "Container twenty-dev-db-1 não está rodando. Execute: bash packages/twenty-utils/setup-dev-env.sh"
docker inspect twenty-dev-redis-1 --format '{{.State.Status}}' 2>/dev/null | grep -q running \
  || fail "Container twenty-dev-redis-1 não está rodando."
ok "Containers rodando"

# ---------------------------------------------------------------------------
# 2. Descobrir workspace ativo e schema name
# ---------------------------------------------------------------------------
info "Buscando workspace ativo..."
WORKSPACE_ID=$($PSQL -t -c "SELECT id FROM core.workspace WHERE \"activationStatus\" = 'ACTIVE' LIMIT 1;" | xargs)
SCHEMA=$($PSQL -t -c "SELECT \"databaseSchema\" FROM core.workspace WHERE \"activationStatus\" = 'ACTIVE' LIMIT 1;" | xargs)

if [ -z "$WORKSPACE_ID" ] || [ -z "$SCHEMA" ]; then
  fail "Nenhum workspace ACTIVE encontrado. Rode: npx nx database:reset twenty-server"
fi
ok "Workspace: $WORKSPACE_ID"
ok "Schema:    $SCHEMA"

# ---------------------------------------------------------------------------
# 3. Contar membros existentes
# ---------------------------------------------------------------------------
MEMBER_COUNT=$($PSQL -t -c "SELECT COUNT(*) FROM ${SCHEMA}.\"workspaceMember\" WHERE \"deletedAt\" IS NULL;" | xargs)
info "workspaceMember existentes: $MEMBER_COUNT"

if [ "$MEMBER_COUNT" -gt "0" ]; then
  info "Tabela já tem membros. Verificando usuários sem membro..."
fi

# ---------------------------------------------------------------------------
# 4. Inserir os 5 usuários seed fixos (IDs determinísticos)
# ---------------------------------------------------------------------------
info "Inserindo usuários seed fixos..."
$PSQL -c "
INSERT INTO ${SCHEMA}.\"workspaceMember\"
  (id, \"nameFirstName\", \"nameLastName\", locale, \"colorScheme\", \"userEmail\", \"userId\")
VALUES
  ('20202020-0687-4c41-b707-ed1bfca972a7','Tim','Apple','en','Light','tim@apple.dev','20202020-9e3b-46d4-a556-88b9ddc2b034'),
  ('20202020-77d5-4cb6-b60a-f4a835a85d61','Jony','Ive','en','Light','jony.ive@apple.dev','20202020-3957-4908-9c36-2929a23f8357'),
  ('20202020-1553-45c6-a028-5a9064cce07f','Phil','Schiler','en','Light','phil.schiler@apple.dev','20202020-7169-42cf-bc47-1cfef15264b8'),
  ('20202020-463f-435b-828c-107e007a2711','Jane','Austen','en','Light','jane.austen@apple.dev','20202020-e6b5-4680-8a32-b8209737156b'),
  ('20202020-1111-4a01-8001-000000000003','Scott','Forstall','en','Light','scott.forstall@apple.dev','20202020-1111-4a01-8001-000000000001')
ON CONFLICT (id) DO NOTHING;" > /dev/null
ok "Usuários seed fixos OK"

# ---------------------------------------------------------------------------
# 5. Inserir usuários do core.userWorkspace que ainda não têm workspaceMember
# ---------------------------------------------------------------------------
info "Sincronizando demais usuários do core.userWorkspace..."
INSERTED=$($PSQL -t -c "
INSERT INTO ${SCHEMA}.\"workspaceMember\"
  (id, \"nameFirstName\", \"nameLastName\", locale, \"colorScheme\", \"userEmail\", \"userId\")
SELECT
  gen_random_uuid(),
  u.\"firstName\",
  u.\"lastName\",
  'en',
  'System',
  u.email,
  u.id
FROM core.\"userWorkspace\" uw
JOIN core.\"user\" u ON u.id = uw.\"userId\"
WHERE uw.\"workspaceId\" = '${WORKSPACE_ID}'
  AND NOT EXISTS (
    SELECT 1 FROM ${SCHEMA}.\"workspaceMember\" wm
    WHERE wm.\"userId\" = u.id AND wm.\"deletedAt\" IS NULL
  );
SELECT ROW_COUNT();" 2>/dev/null || echo "0")

# Contar o que foi inserido de forma compatível
AFTER=$($PSQL -t -c "SELECT COUNT(*) FROM ${SCHEMA}.\"workspaceMember\" WHERE \"deletedAt\" IS NULL;" | xargs)
ok "Total de workspace members agora: $AFTER"

# ---------------------------------------------------------------------------
# 6. Limpar cache Redis
# ---------------------------------------------------------------------------
info "Limpando cache Redis..."
$REDIS FLUSHALL > /dev/null
ok "Cache Redis limpo"

# ---------------------------------------------------------------------------
# 7. Resumo
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  Fix concluido!"
echo "  Workspace members: $AFTER"
echo "  Cache Redis: limpo"
echo ""
echo "  Login: tim@apple.dev"
echo "  Senha: prefilled no UI (clique em 'Continue with Email')"
echo "============================================================"
