import { AppErrorBoundary } from '@/error-handler/components/AppErrorBoundary';
import { AppFullScreenErrorFallback } from '@/error-handler/components/AppFullScreenErrorFallback';
import { AppPageErrorFallback } from '@/error-handler/components/AppPageErrorFallback';
import { FileUploadProvider } from '@/file-upload/components/FileUploadProvider';
import { InformationBannerIsImpersonating } from '@/information-banner/components/impersonate/InformationBannerIsImpersonating';
// FORK: persistent WhatsApp disconnection banner
import { InformationBannerWhatsappDisconnected } from '@/settings/whatsapp/components/InformationBannerWhatsappDisconnected';
import { KeyboardShortcutMenu } from '@/keyboard-shortcut-menu/components/KeyboardShortcutMenu';
import { LayoutCustomizationBar } from '@/layout-customization/components/LayoutCustomizationBar';
import { PageDragDropProvider } from '@/navigation-menu-item/display/dnd/providers/PageDragDropProvider';
import { useShowAuthModal } from '@/ui/layout/hooks/useShowAuthModal';
import { styled } from '@linaria/react';
import { Outlet } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';
const StyledLayout = styled.div`
  background: ${themeCssVariables.grayScale.gray3};
  display: flex;
  flex-direction: column;
  height: 100dvh;
  position: relative;
  scrollbar-color: ${themeCssVariables.border.color.medium} transparent;
  scrollbar-width: 4px;
  width: 100%;

  *::-webkit-scrollbar-thumb {
    border-radius: ${themeCssVariables.border.radius.sm};
  }
`;

const StyledPageContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  min-height: 0;
  min-width: 0;
`;

const StyledMainContainer = styled.div`
  display: flex;
  flex: 0 1 100%;
  min-width: 0;
  overflow: hidden;
`;

export const DefaultLayout = () => {
  const showAuthModal = useShowAuthModal();

  return (
    <>
      <FileUploadProvider>
        <StyledLayout>
          <AppErrorBoundary FallbackComponent={AppFullScreenErrorFallback}>
            <InformationBannerIsImpersonating />
            {/* FORK: WhatsApp disconnection banner */}
            <InformationBannerWhatsappDisconnected />
            <LayoutCustomizationBar />
            <StyledPageContainer>
              <PageDragDropProvider>
                {/* FORK: Voka CRM — T-13: auth renderiza fullscreen no
                    AuthTailLayout; o mock de fundo do Twenty (em inglês) e o
                    AuthModal foram removidos. */}
                {!showAuthModal && <KeyboardShortcutMenu />}
                <StyledMainContainer>
                  <AppErrorBoundary FallbackComponent={AppPageErrorFallback}>
                    <Outlet />
                  </AppErrorBoundary>
                </StyledMainContainer>
              </PageDragDropProvider>
            </StyledPageContainer>

          </AppErrorBoundary>
        </StyledLayout>
      </FileUploadProvider>
    </>
  );
};
