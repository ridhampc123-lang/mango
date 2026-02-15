const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  fullWidth = false,
  className = '',
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation active:scale-95';
  
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-300 shadow-sm',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 disabled:bg-gray-300 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 disabled:bg-green-300 shadow-sm',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 disabled:bg-yellow-300 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 shadow-sm',
    outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 disabled:border-emerald-300 disabled:text-emerald-300 bg-white',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px] md:px-3 md:py-1.5 md:text-xs md:min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px] md:px-4 md:py-2 md:text-sm md:min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px] md:px-5 md:py-2.5 md:text-base md:min-h-[44px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-md'}
        ${className}
      `}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
