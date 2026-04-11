import { useState, useEffect } from 'react';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { pharmacyService } from '@/services/pharmacy.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

export default function PharmacyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await pharmacyService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await pharmacyService.updateOrderStatus(id, status);
      loadOrders();
    } catch (err) {
      alert(handleApiError(err));
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

  return (
    <PharmacyLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
           <ShoppingBag className="h-6 w-6 text-emerald-400" />
           <h2 className="text-2xl font-bold text-white">Orders</h2>
        </div>

        <div className="grid gap-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <BorderGlow key={order.id} glowColor="120 40 40">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="font-medium text-white text-lg">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-400 mt-1">{formatDateTime(order.created_at)}</p>
                      <p className="text-xl font-bold text-emerald-400 mt-2">${order.total}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {order.medicines && order.medicines.map((med, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition">
                        <span className="text-gray-300">
                          <span className="font-medium text-white">{med.medicine_name}</span> 
                          <span className="text-emerald-400 mx-2">x{med.quantity}</span>
                        </span>
                        <span className="text-white font-medium">${(med.price_per_unit * med.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    {order.status === 'pending' && (
                      <Button onClick={() => handleUpdateStatus(order.id, 'confirmed')} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto">
                        Confirm Order
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto">
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button onClick={() => handleUpdateStatus(order.id, 'ready')} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto">
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto">
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </BorderGlow>
            ))
          ) : (
            <BorderGlow glowColor="0 0 50">
              <div className="py-16 text-center">
                <ShoppingBag className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No orders yet</p>
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </PharmacyLayout>
  );
}
