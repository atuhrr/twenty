import { Search } from 'lucide-react';
import ThemeToggleButton from '../common/ThemeToggleButton';
import { useSidebar } from '../context/SidebarContext';
import { MenuIcon } from './VokaAppSidebar';
import { VokaNotificationsDropdown, VokaUserDropdown } from './VokaHeaderMenus';

export const VokaAppHeader: React.FC = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 lg:hidden"
        aria-label="Abrir menu"
      >
        <MenuIcon />
      </button>

      {/* Desktop sidebar collapse toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 lg:flex"
        aria-label="Colapsar menu"
      >
        <MenuIcon />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Search affordance — ⌘K hotkey is active via useCommandMenuHotKeys in layout */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800 sm:flex">
          <Search size={14} />
          <span>Buscar</span>
          <kbd className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            ⌘K
          </kbd>
        </div>

        <ThemeToggleButton />
        {/* FORK: Voka CRM — Fase C: notificações + perfil do usuário */}
        <VokaNotificationsDropdown />
        <VokaUserDropdown />
      </div>
    </header>
  );
};
