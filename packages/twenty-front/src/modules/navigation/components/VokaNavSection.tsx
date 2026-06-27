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
  IconBox,
  IconBuildingSkyscraper,
  IconChartBar,
  IconFlag,
  IconInbox,
  IconListCheck,
  IconMail,
  IconSettings,
  IconTargetArrow,
  IconUser,
  IconUsers,
} from 'twenty-ui/icon';

const LISTAS_SECTION_ID = 'voka-listas';

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
  const { toggleNavigationSection } = useNavigationSection(LISTAS_SECTION_ID);
  const isNavigationSectionOpen = useAtomFamilyStateValue(
    isNavigationSectionOpenFamilyState,
    LISTAS_SECTION_ID,
  );

  const unclassifiedCount = useLeadsNaoClassificadosCount();

  return (
    <>
      <NavigationDrawerSection>
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
          to="/objects/tasks"
          Icon={IconListCheck}
        />
      </NavigationDrawerSection>

      <NavigationDrawerSection>
        <NavigationDrawerAnimatedCollapseWrapper>
          <NavigationDrawerSectionTitle
            label="Listas"
            onClick={toggleNavigationSection}
            isOpen={isNavigationSectionOpen}
          />
        </NavigationDrawerAnimatedCollapseWrapper>

        {isNavigationSectionOpen && (
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
              to="/objects/clientes"
              Icon={IconUsers}
              indentationLevel={2}
            />
            <NavigationDrawerItem
              label="Catálogo"
              to="/objects/produtos"
              Icon={IconBox}
              indentationLevel={2}
            />
          </>
        )}
      </NavigationDrawerSection>

      <NavigationDrawerSection>
        <NavigationDrawerItem
          label="Mail"
          to="/mail"
          Icon={IconMail}
        />
        <NavigationDrawerItem
          label="Estatísticas"
          to="/objects/dashboards"
          Icon={IconChartBar}
        />
        <NavigationDrawerItem
          label="Configurações"
          to="/settings"
          Icon={IconSettings}
        />
      </NavigationDrawerSection>
    </>
  );
};
