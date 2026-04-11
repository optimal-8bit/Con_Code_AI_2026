import { useState, useEffect } from 'react';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { pharmacyService } from '@/services/pharmacy.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { ShoppingBag, Package, AlertTriangle, DollarSign, Activity } from 'lucide-react';
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
      <PharmacyLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
        </div>
      </PharmacyLayout>
    );
  }

  const metrics = dashboard?.metrics || {};

  return (
    <PharmacyLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Top 4 Metrics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BorderGlow glowColor="40 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Pending Orders</p>
                  <p className="text-3xl font-bold text-white mt-1">{metrics.pending_orders || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <ShoppingBag className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="120 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-white mt-1">${metrics.total_revenue || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="200 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Inventory Items</p>
                  <p className="text-3xl font-bold text-white mt-1">{metrics.total_inventory_items || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <Package className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="0 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Low Stock Alerts</p>
                  <p className="text-3xl font-bold text-white mt-1">{metrics.low_stock_alerts || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <AlertTriangle className="h-6 w-6 text-rose-400" />
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* AI Inventory Summary */}
        {dashboard?.ai_inventory_summary && (
          <BorderGlow glowColor="280 80 80" className="w-full">
            <div className="p-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
                <Activity className="h-5 w-5 text-emerald-400" />
                AI Inventory Summary
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">{dashboard.ai_inventory_summary}</p>
              {dashboard.ai_recommendations && dashboard.ai_recommendations.length > 0 && (
                <div className="space-y-2 mt-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Recommendations</p>
                  <ul className="space-y-2">
                    {dashboard.ai_recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </BorderGlow>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BorderGlow glowColor="200 60 40">
            <div className="p-6 h-full flex flex-col">
              <div className="flex flex-row items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Pending Orders</h3>
                <Link to="/pharmacy/orders">
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">View All</Button>
                </Link>
              </div>
              <div className="flex-1">
                {dashboard?.pending_orders && dashboard.pending_orders.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.pending_orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-start justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(order.created_at)}</p>
                          <p className="text-sm font-semibold text-emerald-400 mt-2">${order.total}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <p className="text-gray-400">No pending orders</p>
                  </div>
                )}
              </div>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="0 60 40">
            <div className="p-6 h-full flex flex-col">
              <div className="flex flex-row items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Low Stock Alerts</h3>
                <Link to="/pharmacy/inventory">
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">View All</Button>
                </Link>
              </div>
              <div className="flex-1">
                {dashboard?.low_stock_alerts && dashboard.low_stock_alerts.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.low_stock_alerts.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition">
                        <div>
                          <p className="font-medium text-white">{item.medicine_name}</p>
                          <p className="text-xs text-gray-400 mt-1">Stock: <span className="text-rose-400 font-semibold">{item.quantity}</span> {item.unit}</p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-rose-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                     <p className="text-gray-400">No low stock alerts</p>
                  </div>
                )}
              </div>
            </div>
          </BorderGlow>
        </div>
      </div>
    </PharmacyLayout>
  );
}
