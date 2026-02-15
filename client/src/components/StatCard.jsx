const StatCard = ({ title, value, icon, color = 'emerald', trend, loading = false }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 animate-pulse w-full">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-3 md:h-4 bg-gray-200 rounded w-20 md:w-24 mb-3"></div>
            <div className="h-6 md:h-8 bg-gray-200 rounded w-24 md:w-32"></div>
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 hover:shadow-md transition-all duration-200 w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 break-words">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 md:p-3 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
