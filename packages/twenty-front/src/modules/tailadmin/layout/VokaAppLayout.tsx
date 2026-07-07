import { CommandMenuForMobile } from '@/command-menu/components/CommandMenuForMobile';
import { useCommandMenuHotKeys } from '@/command-menu/hooks/useCommandMenuHotKeys';
import { SidePanelForDesktop } from '@/side-panel/components/SidePanelForDesktop';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import Backdrop from './Backdrop';
import { VokaAppHeader } from './VokaAppHeader';
import { VokaAppSidebar } from './VokaAppSidebar';

const VokaLayoutInner: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();
  const isMobile = useIsMobile();

  useCommandMenuHotKeys();

  return (
    <div className="h-full w-full flex bg-gray-50 dark:bg-gray-950">
      <VokaAppSidebar />
      <Backdrop />
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
        }`}
      >
        <VokaAppHeader />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <Outlet />
          </div>
          {isMobile ? <CommandMenuForMobile /> : <SidePanelForDesktop />}
        </div>
      </div>
    </div>
  );
};

export const VokaAppLayout: React.FC = () => (
  <SidebarProvider>
    <VokaLayoutInner />
  </SidebarProvider>
);
