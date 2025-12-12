const StatCard = ({ icon: Icon, label, value, subtitle, color = 'primary', trend }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover-card border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} ring-4 ring-opacity-20 ${color === 'primary' ? 'ring-primary-100' : 'ring-gray-100'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${trend > 0 ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-red-50 text-red-700 ring-1 ring-red-100'
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
