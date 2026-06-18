import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  loading = false,
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-950/40',
      icon: 'text-primary-500',
      trend: 'text-primary-500',
    },
    accent: {
      bg: 'bg-accent-50 dark:bg-accent-950/40',
      icon: 'text-accent-500',
      trend: 'text-accent-500',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      icon: 'text-amber-500',
      trend: 'text-amber-500',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      icon: 'text-red-500',
      trend: 'text-red-500',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-20 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
          <div className="skeleton w-12 h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-100 mt-1 tracking-tight">
            {value}
          </p>
          {(subtitle || trendValue) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${
                  trend === 'up' ? 'text-accent-500' : trend === 'down' ? 'text-danger-500' : 'text-surface-400'
                }`}>
                  {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-surface-400">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon size={22} className={colors.icon} />
          </div>
        )}
      </div>
    </div>
  );
}
