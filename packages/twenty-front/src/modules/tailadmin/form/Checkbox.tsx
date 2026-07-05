interface CheckboxProps {
  id?: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}) => (
  <label
    htmlFor={id}
    className={`flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked
            ? 'bg-brand-500 border-brand-500'
            : 'bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-600'
        }`}
      >
        {checked && (
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            className="text-white"
          >
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
    {label && (
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    )}
  </label>
);

export default Checkbox;
