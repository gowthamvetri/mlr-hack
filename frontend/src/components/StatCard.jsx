const StatCard = ({ icon: Icon, label, value, subtitle, color = 'primary', trend }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    orange: 'bg-accent-50 text-accent-600',
    green: 'bg-success-50 text-success-600',
    red: 'bg-primary-50 text-primary-600',
    // Legacy support
    purple: 'bg-primary-50 text-primary-600',
    blue: 'bg-primary-50 text-primary-600',
    yellow: 'bg-accent-50 text-accent-600',
  };

  const ringClasses = {
    primary: 'ring-primary-100',
    accent: 'ring-accent-100',
    success: 'ring-success-100',
    orange: 'ring-accent-100',
    green: 'ring-success-100',
    red: 'ring-primary-100',
    purple: 'ring-primary-100',
    blue: 'ring-primary-100',
    yellow: 'ring-accent-100',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover-card border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.primary} ring-4 ring-opacity-30 ${ringClasses[color] || ringClasses.primary}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${trend > 0 ? 'bg-success-50 text-success-700 ring-1 ring-success-100' : 'bg-primary-50 text-primary-700 ring-1 ring-primary-100'
            }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-gray-500 text-sm font-medium mt-1">{label}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
