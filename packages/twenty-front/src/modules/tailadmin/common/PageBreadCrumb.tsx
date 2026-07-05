import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadCrumbProps {
  items: BreadcrumbItem[];
}

const PageBreadCrumb: React.FC<PageBreadCrumbProps> = ({ items }) => (
  <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-4">
    {items.map((item, index) => (
      <span key={index} className="flex items-center gap-1.5">
        {index > 0 && <ChevronRight size={14} className="text-gray-400" />}
        {item.href ? (
          <Link
            to={item.href}
            className="hover:text-brand-500 transition-colors"
          >
            {item.label}
          </Link>
        ) : (
          <span className="text-gray-800 dark:text-white/90 font-medium">
            {item.label}
          </span>
        )}
      </span>
    ))}
  </nav>
);

export default PageBreadCrumb;
