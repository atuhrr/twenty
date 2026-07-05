interface TextAreaProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  disabled = false,
  error = false,
  hint,
  className = '',
}) => (
  <div>
    {label && (
      <label
        htmlFor={id}
        className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
    )}
    <textarea
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 resize-none ${
        error
          ? 'border-error-500 focus:ring-error-500/20'
          : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-transparent'} ${className}`}
    />
    {hint && (
      <p
        className={`mt-1.5 text-xs ${error ? 'text-error-500' : 'text-gray-500'}`}
      >
        {hint}
      </p>
    )}
  </div>
);

export default TextArea;
