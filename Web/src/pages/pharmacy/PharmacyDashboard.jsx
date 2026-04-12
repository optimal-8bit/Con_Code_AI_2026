import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { pharmacyService } from '@/services/pharmacy.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { ShoppingBag, FileText, Package, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PharmacyDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await pharmacyService.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const metrics = dashboard?.metrics || {};

  return (
    <BackgroundWrapper>
      <DashboardLayout>
        <div className="space-y-6 py-6 px-4 md:px-6">
          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassmorphCard
              title="Pending Orders"
              value={metrics.pending_orders || 0}
              Icon={ShoppingBag}
              bgColor="from-yellow-500 to-yellow-400"
              iconBg="bg-yellow-100"
              iconColor="text-yellow-600"
            />

            <GlassmorphCard
              title="Total Revenue"
              value={`$${metrics.total_revenue || 0}`}
              Icon={DollarSign}
              bgColor="from-green-500 to-emerald-400"
              iconBg="bg-green-100"
              iconColor="text-green-600"
            />

            <GlassmorphCard
              title="Inventory Items"
              value={metrics.total_inventory_items || 0}
              Icon={Package}
              bgColor="from-blue-500 to-cyan-400"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />

            <GlassmorphCard
              title="Low Stock Alerts"
              value={metrics.low_stock_alerts || 0}
              Icon={AlertTriangle}
              bgColor="from-red-500 to-red-400"
              iconBg="bg-red-100"
              iconColor="text-red-600"
            />
          </div>

        {dashboard?.ai_inventory_summary && (
          <GlassmorphCard className="col-span-full">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-slate-100">AI Inventory Summary</h3>
            </div>
            <p className="text-slate-300 mb-4">{dashboard.ai_inventory_summary}</p>
            {dashboard.ai_recommendations && dashboard.ai_recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400">Recommendations:</p>
                <ul className="space-y-1">
                  {dashboard.ai_recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <span className="text-blue-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassmorphCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassmorphCard>
            <div className="flex flex-row items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-100">Pending Orders</h3>
              <Link to="/pharmacy/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  View All
                </Button>
              </Link>
            </div>
            {dashboard?.pending_orders && dashboard.pending_orders.length > 0 ? (
              <div className="space-y-3">
                {dashboard.pending_orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg 
                               border border-slate-700 hover:border-slate-600 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-slate-400">{formatDateTime(order.created_at)}</p>
                      <p className="text-sm font-medium text-slate-100 mt-1">${order.total}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No pending orders</p>
            )}
          </GlassmorphCard>

          <GlassmorphCard>
            <div className="flex flex-row items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-100">Low Stock Alerts</h3>
              <Link to="/pharmacy/inventory">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  View All
                </Button>
              </Link>
            </div>
            {dashboard?.low_stock_alerts && dashboard.low_stock_alerts.length > 0 ? (
              <div className="space-y-3">
                {dashboard.low_stock_alerts.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-red-950/30 rounded-lg 
                               border border-red-800/40 hover:border-red-700/60 hover:bg-red-950/40 transition-all"
                  >
                    <div>
                      <p className="font-medium text-slate-100">{item.medicine_name}</p>
                      <p className="text-sm text-slate-400">
                        Stock: {item.quantity} {item.unit}
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No low stock alerts</p>
            )}
          </GlassmorphCard>
        </div>
        </div>
      </DashboardLayout>
    </BackgroundWrapper>
  );
}

/**
 * GlassmorphCard Component
 * 
 * Reusable card component with glassmorphism effect.
 * Features dark background with blur effect and subtle borders.
 */
function GlassmorphCard({
  title,
  value,
  Icon,
  bgColor,
  iconBg,
  iconColor,
  children,
  className,
}) {
  if (children) {
    return (
      <div
        className={`card-glow rounded-lg p-6 ${className || ''}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="card-glow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 ${iconBg} rounded-full`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}
