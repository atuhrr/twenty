import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import Backdrop from './Backdrop';

// AppHeader and AppSidebar are provided by the consuming app (VokaAppSidebar, VokaAppHeader)
// This base layout just wires the sidebar context + content offset.
// Sidebar and Header are injected via props to keep this file layout-only.

interface AppLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
}

const LayoutContent: React.FC<AppLayoutProps> = ({ sidebar, header }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        {sidebar}
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        {header}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = (props) => (
  <SidebarProvider>
    <LayoutContent {...props} />
  </SidebarProvider>
);

export default AppLayout;
