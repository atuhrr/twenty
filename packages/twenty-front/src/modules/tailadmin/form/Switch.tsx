interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
}) => (
  <label
    htmlFor={id}
    className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`block h-6 w-11 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}
      />
      <div
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </div>
    {label && (
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    )}
  </label>
);

export default Switch;
