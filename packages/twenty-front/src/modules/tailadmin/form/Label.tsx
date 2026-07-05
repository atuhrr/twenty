interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({
  htmlFor,
  children,
  className = '',
  required,
}) => (
  <label
    htmlFor={htmlFor}
    className={`block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
  >
    {children}
    {required && <span className="text-error-500 ml-0.5">*</span>}
  </label>
);

export default Label;
