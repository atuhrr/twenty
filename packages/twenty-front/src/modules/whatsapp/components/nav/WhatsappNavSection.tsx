/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';

import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { isNavigationSectionOpenFamilyState } from '@/ui/navigation/navigation-drawer/states/isNavigationSectionOpenFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useWhatsappUnreadCount } from '@/whatsapp/hooks/useWhatsappUnreadCount';
import { IconBroadcast, IconMail, IconMessage } from 'twenty-ui/icon';

const WA_GREEN = '#25d366';

const StyledBadge = styled.div`
  background: ${WA_GREEN};
  border-radius: 10px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  min-width: 18px;
  padding: 2px 6px;
  text-align: center;
`;

const SECTION_ID = 'WhatsApp';

export const WhatsappNavSection = () => {
  const { toggleNavigationSection } = useNavigationSection(SECTION_ID);
  const isNavigationSectionOpen = useAtomFamilyStateValue(
    isNavigationSectionOpenFamilyState,
    SECTION_ID,
  );
  const unreadCount = useWhatsappUnreadCount();

  return (
    <NavigationDrawerSection>
      <NavigationDrawerAnimatedCollapseWrapper>
        <NavigationDrawerSectionTitle
          label="WhatsApp"
          onClick={() => toggleNavigationSection()}
          isOpen={isNavigationSectionOpen}
        />
      </NavigationDrawerAnimatedCollapseWrapper>

      {isNavigationSectionOpen && (
        <>
          <NavigationDrawerItem
            label="Conversas"
            to="/whatsapp/conversations"
            Icon={IconMessage}
            rightOptions={
              unreadCount > 0 ? (
                <StyledBadge>{unreadCount}</StyledBadge>
              ) : undefined
            }
            alwaysShowRightOptions={unreadCount > 0}
          />
          <NavigationDrawerItem
            label="Campanhas"
            Icon={IconMail}
            modifier="soon"
            onClick={() => {}}
          />
          <NavigationDrawerItem
            label="Disparos"
            Icon={IconBroadcast}
            modifier="soon"
            onClick={() => {}}
          />
        </>
      )}
    </NavigationDrawerSection>
  );
};
