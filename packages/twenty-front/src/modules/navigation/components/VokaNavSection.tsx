// FORK: Voka CRM — Kommo-style sidebar navigation structure
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useLeadsNaoClassificadosCount } from '@/leads/hooks/useLeadsNaoClassificadosCount';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { isNavigationSectionOpenFamilyState } from '@/ui/navigation/navigation-drawer/states/isNavigationSectionOpenFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import {
  IconBolt,
  IconBox,
  IconBuildingSkyscraper,
  IconChartBar,
  IconFileText,
  IconFlag,
  IconInbox,
  IconLayoutList,
  IconListCheck,
  IconMail,
  IconRobot,
  IconSearch,
  IconSend,
  IconSettings,
  IconTargetArrow,
  IconTrendingUp,
  IconUser,
  IconUsers,
} from 'twenty-ui/icon';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';

const LISTAS_SECTION_ID = 'voka-listas';
const AUTOMACOES_SECTION_ID = 'voka-automacoes';
const ESTATISTICAS_SECTION_ID = 'voka-estatisticas';

const StyledCountBadge = styled.span`
  /* FORK: Voka CRM — incoming leads counter badge */
  background: #7C3AED;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  min-width: 16px;
  padding: 2px 5px;
  text-align: center;
`;

const CountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <NavigationDrawerAnimatedCollapseWrapper>
      <StyledCountBadge>{count > 99 ? '99+' : count}</StyledCountBadge>
    </NavigationDrawerAnimatedCollapseWrapper>
  ) : null;

export const VokaNavSection = () => {
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  const { toggleNavigationSection: toggleListas } = useNavigationSection(LISTAS_SECTION_ID);
  const isListasOpen = useAtomFamilyStateValue(
    isNavigationSectionOpenFamilyState,
    LISTAS_SECTION_ID,
  );

  const { toggleNavigationSection: toggleAutomacoes } = useNavigationSection(AUTOMACOES_SECTION_ID);
  const isAutomacoesOpen = useAtomFamilyStateValue(
    isNavigationSectionOpenFamilyState,
    AUTOMACOES_SECTION_ID,
  );

  const { toggleNavigationSection: toggleEstatisticas } = useNavigationSection(ESTATISTICAS_SECTION_ID);
  const isEstatisticasOpen = useAtomFamilyStateValue(
    isNavigationSectionOpenFamilyState,
    ESTATISTICAS_SECTION_ID,
  );

  const unclassifiedCount = useLeadsNaoClassificadosCount();

  return (
    <>
      <NavigationDrawerSection>
        {/* FORK: Voka CRM — Fase 1: busca global */}
        <NavigationDrawerItem
          label="Buscar"
          onClick={openRecordsSearchPage}
          Icon={IconSearch}
          modifier={{ keyboard: ['⌘', 'K'] }}
        />
        <NavigationDrawerItem
          label="Funil de Vendas"
          to="/objects/opportunities"
          Icon={IconTargetArrow}
        />
        {/* FORK: Voka CRM — Fase 5: incoming leads queue */}
        <NavigationDrawerItem
          label="Leads não classificados"
          to="/leads-nao-classificados"
          Icon={IconFlag}
          rightOptions={<CountBadge count={unclassifiedCount} />}
          alwaysShowRightOptions
        />
        <NavigationDrawerItem
          label="Caixa de Entrada"
          to="/inbox"
          Icon={IconInbox}
        />
        <NavigationDrawerItem
          label="Tarefas"
          to="/tarefas"
          Icon={IconListCheck}
        />
      </NavigationDrawerSection>

      <NavigationDrawerSection>
        <NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerSectionTitle
            label="Listas"
            onClick={toggleListas}
            isOpen={isListasOpen}
          />
        </NavigationDrawerAnimatedCollapseWrapper>

        {isListasOpen && (
          <>
            <NavigationDrawerItem
              label="Contatos"
              to="/objects/people"
              Icon={IconUser}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Empresas"
              to="/objects/companies"
              Icon={IconBuildingSkyscraper}
              indentationLevel={2}
            />
            {/* FORK: Voka CRM — Fase 7: custom objects activated */}
            <NavigationDrawerItem
              label="Clientes"
              to="/clientes"
              Icon={IconUsers}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Catálogo"
              to="/catalogo"
              Icon={IconBox}
              indentationLevel={2}
            />
          </>
        )}
      </NavigationDrawerSection>

      <NavigationDrawerSection>
        <NavigationDrawerItem
          label="Formulários"
          to="/formularios"
          Icon={IconFileText}
        />

        {/* Seção colapsável Automações */}
        <NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerSectionTitle
            label="Automações"
            onClick={toggleAutomacoes}
            isOpen={isAutomacoesOpen}
          />
        </NavigationDrawerAnimatedCollapseWrapper>

        {isAutomacoesOpen && (
          <>
            <NavigationDrawerItem
              label="Salesbot"
              to="/salesbot"
              Icon={IconRobot}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Templates"
              to="/templates"
              Icon={IconLayoutList}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Fluxos"
              to="/automacoes"
              Icon={IconBolt}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Campanhas"
              to="/campanhas"
              Icon={IconSend}
              indentationLevel={2}
            />
          </>
        )}
        <NavigationDrawerItem
          label="Mail"
          to="/mail"
          Icon={IconMail}
        />
        {/* Seção colapsável Estatísticas */}
        <NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerSectionTitle
            label="Estatísticas"
            onClick={toggleEstatisticas}
            isOpen={isEstatisticasOpen}
          />
        </NavigationDrawerAnimatedCollapseWrapper>

        {isEstatisticasOpen && (
          <>
            <NavigationDrawerItem
              label="Painel"
              to="/estatisticas/dashboard"
              Icon={IconChartBar}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="ROI"
              to="/estatisticas/roi"
              Icon={IconTrendingUp}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Análise Ganho-Perda"
              to="/estatisticas/analise-ganho-perda"
              Icon={IconLayoutList}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Relatório Consolidado"
              to="/estatisticas/relatorio-consolidado"
              Icon={IconFileText}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Rel. por Atividades"
              to="/estatisticas/atividades"
              Icon={IconListCheck}
              indentationLevel={2}
              modifier="soon"
            />
            <NavigationDrawerItem
              label="Log de Atividades"
              to="/estatisticas/log"
              Icon={IconBolt}
              indentationLevel={2}
              modifier="soon"
            />
            <NavigationDrawerItem
              label="Rel. de Chamadas"
              to="/estatisticas/chamadas"
              Icon={IconInbox}
              indentationLevel={2}
              modifier="soon"
            />
            <NavigationDrawerItem
              label="Rel. de Metas"
              to="/estatisticas/metas"
              Icon={IconTargetArrow}
              indentationLevel={2}
              modifier="soon"
            />
            <NavigationDrawerItem
              label="WhatsApp Business"
              to="/estatisticas/whatsapp"
              Icon={IconUsers}
              indentationLevel={2}
              modifier="soon"
            />
          </>
        )}
        <NavigationDrawerItem
          label="Configurações"
          to="/settings"
          Icon={IconSettings}
        />
      </NavigationDrawerSection>
    </>
  );
};
