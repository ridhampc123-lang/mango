const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`mb-3 md:mb-4 w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm md:text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full px-3 md:px-4 py-2.5 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-base md:text-sm
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs md:text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
