import { useState, useEffect } from 'react';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pharmacyService } from '@/services/pharmacy.service';
import { handleApiError } from '@/lib/utils';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';

export default function PharmacyInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    medicine_name: '',
    generic_name: '',
    category: 'general',
    quantity: 0,
    unit: 'tablets',
    price_per_unit: 0,
    reorder_level: 50,
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await pharmacyService.getInventory();
      setInventory(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await pharmacyService.addInventoryItem(formData);
      setShowAdd(false);
      setFormData({
        medicine_name: '',
        generic_name: '',
        category: 'general',
        quantity: 0,
        unit: 'tablets',
        price_per_unit: 0,
        reorder_level: 50,
      });
      loadInventory();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleUpdateQuantity = async (itemId, delta) => {
    try {
      await pharmacyService.updateStockQuantity(itemId, delta);
      loadInventory();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-400" />
            Inventory
          </h2>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {showAdd && (
          <BorderGlow glowColor="120 80 80">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Inventory Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Medicine Name</label>
                    <Input
                      value={formData.medicine_name}
                      onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Generic Name</label>
                    <Input
                      value={formData.generic_name}
                      onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Quantity</label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Unit</label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Price per Unit</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Reorder Level</label>
                    <Input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">Add Item</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </BorderGlow>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-white/5 border-white/20 text-white placeholder:text-gray-500 h-14 rounded-2xl focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-lg"
          />
        </div>

        <div className="grid gap-4">
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <BorderGlow key={item.id} glowColor={item.is_low_stock ? "0 80 80" : "120 40 40"} edgeSensitivity={item.is_low_stock ? 50 : 30}>
                <div className={`p-6 ${item.is_low_stock ? 'bg-rose-500/5' : ''}`}>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-[250px]">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{item.medicine_name}</h3>
                        {item.is_low_stock && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-full border border-rose-500/30">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Low Stock
                          </div>
                        )}
                      </div>
                      {item.generic_name && (
                        <p className="text-sm text-gray-400 mb-3">Generic: {item.generic_name}</p>
                      )}
                      <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-4 text-sm bg-white/5 border border-white/10 rounded-lg p-3 inline-flex">
                        <div className="flex flex-col">
                           <span className="text-gray-500 text-xs uppercase tracking-wider">Stock</span>
                           <span className={`font-semibold ${item.is_low_stock ? 'text-rose-400' : 'text-white'}`}>{item.quantity} {item.unit}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                        <div className="flex flex-col">
                           <span className="text-gray-500 text-xs uppercase tracking-wider">Price</span>
                           <span className="font-semibold text-emerald-400">${item.price_per_unit}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                        <div className="flex flex-col">
                           <span className="text-gray-500 text-xs uppercase tracking-wider">Reorder at</span>
                           <span className="font-semibold text-gray-300">{item.reorder_level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-center bg-white/5 p-1.5 rounded-xl border border-white/10">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={() => handleUpdateQuantity(item.id, -10)}
                        title="Reduce stock by 10"
                      >
                        -10
                      </Button>
                      <div className="h-6 w-px bg-white/20"></div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/20 rounded-lg"
                        onClick={() => handleUpdateQuantity(item.id, 10)}
                        title="Increase stock by 10"
                      >
                        +10
                      </Button>
                    </div>
                  </div>
                </div>
              </BorderGlow>
            ))
          ) : (
            <BorderGlow glowColor="0 0 50">
              <div className="py-16 text-center">
                <Package className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No inventory items found matching your search</p>
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </PharmacyLayout>
  );
}
