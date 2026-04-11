import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pharmacyService } from '@/services/pharmacy.service';
import { handleApiError } from '@/lib/utils';
import { Package, Plus, Search, AlertTriangle, X } from 'lucide-react';

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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {showAdd && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Medicine Name</label>
                    <Input
                      value={formData.medicine_name}
                      onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Generic Name</label>
                    <Input
                      value={formData.generic_name}
                      onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Unit</label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price per Unit</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reorder Level</label>
                    <Input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Item</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <Card key={item.id} className={item.is_low_stock ? 'border-red-300' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{item.medicine_name}</h3>
                        {item.is_low_stock && (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      {item.generic_name && (
                        <p className="text-sm text-gray-600">Generic: {item.generic_name}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-gray-700">Stock: {item.quantity} {item.unit}</span>
                        <span className="text-gray-700">Price: ${item.price_per_unit}</span>
                        <span className="text-gray-600">Reorder at: {item.reorder_level}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuantity(item.id, -10)}
                      >
                        -10
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, 10)}
                      >
                        +10
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inventory items found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
