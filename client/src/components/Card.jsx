const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm w-full p-4 md:p-5 lg:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-base md:text-lg lg:text-xl font-medium text-gray-700 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
