import { IconMoon, IconSun } from 'twenty-ui/icon';
import { useTheme } from '../context/ThemeContext';

const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  );
};

export default ThemeToggleButton;
