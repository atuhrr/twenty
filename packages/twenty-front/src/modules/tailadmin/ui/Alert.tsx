import { Link } from 'react-router-dom';

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  showLink?: boolean;
  linkHref?: string;
  linkText?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  showLink = false,
  linkHref = '#',
  linkText = 'Saiba mais',
}) => {
  const variantClasses = {
    success: {
      container:
        'border-success-500 bg-success-50 dark:border-success-500/30 dark:bg-success-500/15',
      icon: 'text-success-500',
    },
    error: {
      container:
        'border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15',
      icon: 'text-error-500',
    },
    warning: {
      container:
        'border-warning-500 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/15',
      icon: 'text-warning-500',
    },
    info: {
      container:
        'border-blue-light-500 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/15',
      icon: 'text-blue-light-500',
    },
  };

  const iconMap = {
    success: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.707 7.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 111.414-1.414L11 13.586l4.293-4.293a1 1 0 011.414 0z"
        />
      </svg>
    ),
    error: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 13a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v5a1 1 0 102 0V7a1 1 0 00-1-1z"
        />
      </svg>
    ),
    warning: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 5a1 1 0 10-2 0v5a1 1 0 102 0V7zm-1 9a1 1 0 110-2 1 1 0 010 2z"
        />
      </svg>
    ),
    info: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 5a1 1 0 10-2 0 1 1 0 012 0zm-1 3a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`rounded-xl border p-4 ${variantClasses[variant].container}`}
    >
      <div className="flex items-start gap-3">
        <div className={`-mt-0.5 ${variantClasses[variant].icon}`}>
          {iconMap[variant]}
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
          {showLink && (
            <Link
              to={linkHref}
              className="inline-block mt-3 text-sm font-medium text-gray-500 underline dark:text-gray-400"
            >
              {linkText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;
