import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Receipt, CalendarDays,
  Bot,
  Building2,
  ChevronDown,
  FileText,
  Flag,
  Inbox,
  LayoutDashboard,
  LayoutList,
  ListChecks,
  Mail,
  Package,
  Send,
  Settings,
  TrendingUp,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { VokaBrand } from '@/tailadmin/ui/VokaBrand';

interface NavItem {
  label: string;
  to: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'MENU PRINCIPAL',
    defaultOpen: true,
    items: [
      { label: 'Funil de Vendas', to: '/funil', Icon: TrendingUp },
      { label: 'Caixa de Entrada', to: '/inbox', Icon: Inbox },
      { label: 'Tarefas', to: '/tarefas', Icon: ListChecks },
      { label: 'Calendário', to: '/calendario', Icon: CalendarDays },
      { label: 'Faturas', to: '/faturas', Icon: Receipt },
      {
        label: 'Leads não classificados',
        to: '/leads-nao-classificados',
        Icon: Flag,
      },
    ],
  },
  {
    title: 'LISTAS',
    defaultOpen: false,
    items: [
      { label: 'Contatos', to: '/contatos', Icon: User },
      { label: 'Empresas', to: '/empresas', Icon: Building2 },
      { label: 'Clientes', to: '/clientes', Icon: Users },
      { label: 'Catálogo', to: '/catalogo', Icon: Package },
    ],
  },
  {
    title: 'AUTOMAÇÕES',
    defaultOpen: false,
    items: [
      { label: 'Salesbot', to: '/salesbot', Icon: Bot },
      { label: 'Templates', to: '/templates', Icon: LayoutList },
      { label: 'Fluxos', to: '/automacoes', Icon: Zap },
      { label: 'Campanhas', to: '/campanhas', Icon: Send },
      { label: 'Formulários', to: '/formularios', Icon: FileText },
      { label: 'Mail', to: '/mail', Icon: Mail },
    ],
  },
  {
    title: 'ESTATÍSTICAS',
    defaultOpen: false,
    items: [
      // FORK: Voka CRM — T-7: página unificada substitui Painel/ROI/Ganho-Perda
      { label: 'Estatísticas', to: '/estatisticas', Icon: LayoutDashboard },
      {
        label: 'Relatório Consolidado',
        to: '/estatisticas/relatorio-consolidado',
        Icon: LayoutList,
      },
    ],
  },
];

const ICON_SIZE = 20;

const MenuIcon = () => (
  <svg
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const VokaAppSidebar: React.FC = () => {
  const {
    isExpanded,
    isHovered,
    isMobileOpen,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const { pathname } = useLocation();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(NAV_GROUPS.map((g) => [g.title, g.defaultOpen])),
  );

  const isVisible = isExpanded || isHovered;

  const isActive = (to: string) =>
    to === '/'
      ? pathname === '/'
      : pathname === to || pathname.startsWith(to + '/');

  const toggleGroup = (title: string) => {
    if (!isVisible) return;
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${
        isVisible ? 'w-[290px]' : 'w-[90px]'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`h-16 flex items-center shrink-0 border-b border-gray-200 dark:border-gray-800 ${
          isVisible ? 'px-5' : 'justify-center'
        }`}
      >
        {isVisible ? (
          <VokaBrand className="text-lg text-gray-900 dark:text-white truncate" size={28} />
        ) : (
          <span className="text-lg font-bold text-brand-500">V</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.title];
          return (
            <div key={group.title} className="mb-2">
              {isVisible && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {group.title}
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                  />
                </button>
              )}

              <div
                className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${
                  !isVisible || isOpen ? 'max-h-[500px]' : 'max-h-0'
                }`}
              >
                {group.items.map((item) => {
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={isMobileOpen ? toggleMobileSidebar : undefined}
                      title={!isVisible ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 mb-0.5 ${
                        active
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                      } ${!isVisible ? 'justify-center' : ''}`}
                    >
                      <item.Icon size={ICON_SIZE} className="shrink-0" />
                      {isVisible && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Settings pinned at bottom */}
      <div className="shrink-0 px-2 py-3 border-t border-gray-200 dark:border-gray-800">
        <Link
          to="/settings"
          title={!isVisible ? 'Configurações' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            isActive('/settings')
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          } ${!isVisible ? 'justify-center' : ''}`}
        >
          <Settings size={ICON_SIZE} className="shrink-0" />
          {isVisible && <span className="truncate">Configurações</span>}
        </Link>
      </div>
    </aside>
  );
};

export { MenuIcon };
