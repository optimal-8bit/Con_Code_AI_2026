import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patient.service';
import { handleApiError } from '@/lib/utils';
import { ShoppingCart, Store, CheckCircle, CreditCard, Package, AlertCircle } from 'lucide-react';

export default function PharmacyOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const medicines = location.state?.medicines || [];

  const [step, setStep] = useState('match'); // match, select, payment, confirm
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const matchPharmacies = async () => {
    if (medicines.length === 0) {
      setError('No medicines to order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const medicineList = medicines.map(m => ({
        name: m.name || m.medicine_name,
        dosage: m.dosage,
        quantity: m.quantity || 1,
      }));

      const data = await patientService.matchPharmacies(medicineList);
      setPharmacies(data);
      setStep('select');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (pharmacy) => {
    setLoading(true);
    setError('');

    try {
      const orderData = {
        pharmacy_id: pharmacy.pharmacy_id,
        medicines: pharmacy.available_medicines.filter(m => m.available).map(m => ({
          name: m.name,
          quantity: m.quantity,
          price_per_unit: m.price_per_unit,
          inventory_id: m.inventory_id,
        })),
        total: pharmacy.total_price,
        delivery_address: 'Patient Address', // TODO: Get from user profile
        payment_method: 'stripe',
      };

      const newOrder = await patientService.createOrder(orderData);
      setOrder(newOrder);
      setSelectedPharmacy(pharmacy);
      setStep('payment');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const paymentIntent = await patientService.createPaymentIntent(order.id);
      
      // In a real app, you would use Stripe.js here to handle the payment
      // For now, we'll simulate a successful payment
      
      // Confirm payment
      await patientService.confirmPayment(order.id);
      
      setStep('confirm');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  if (step === 'match' && pharmacies.length === 0 && !loading) {
    matchPharmacies();
  }

  if (medicines.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Medicines Selected</h3>
              <p className="text-gray-600 mb-6">Please analyze a prescription first</p>
              <Button onClick={() => navigate('/ai/prescription-analyzer')}>
                Go to Prescription Analyzer
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && step === 'match') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Finding Pharmacies...</h3>
              <p className="text-gray-600">Matching your prescription with available pharmacies</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (step === 'confirm') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-green-500 border-2">
            <CardContent className="pt-6 text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
              <p className="text-gray-600 mb-6">
                Your order has been placed successfully. The pharmacy will prepare your medicines.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="font-mono font-bold text-lg">#{order?.id?.slice(-8)}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/patient/orders')}>
                  View Orders
                </Button>
                <Button variant="outline" onClick={() => navigate('/patient/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (step === 'payment') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
              <p className="text-gray-600">Complete your order payment</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pharmacy</span>
                  <span className="font-medium">{selectedPharmacy?.pharmacy_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medicines</span>
                  <span className="font-medium">{order?.medicines?.length || 0} items</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">${order?.total?.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  💳 Payment will be processed securely through Stripe
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={processPayment} disabled={loading} className="flex-1">
                  {loading ? 'Processing...' : `Pay $${order?.total?.toFixed(2)}`}
                </Button>
                <Button variant="outline" onClick={() => setStep('select')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order from Pharmacy</h2>
            <p className="text-gray-600">Select a pharmacy to order your medicines</p>
          </div>
        </div>

        {/* Medicines to Order */}
        <Card>
          <CardHeader>
            <CardTitle>Medicines to Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {medicines.map((med, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{med.name || med.medicine_name}</p>
                    <p className="text-sm text-gray-600">{med.dosage}</p>
                  </div>
                  <span className="text-sm text-gray-600">Qty: {med.quantity || 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Available Pharmacies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pharmacies.map((pharmacy, idx) => (
            <Card key={idx} className={`${pharmacy.availability_percentage === 100 ? 'border-green-500 border-2' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{pharmacy.pharmacy_name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{pharmacy.pharmacy_email}</p>
                    {pharmacy.pharmacy_phone && (
                      <p className="text-sm text-gray-600">{pharmacy.pharmacy_phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">${pharmacy.total_price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Availability Badge */}
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-2 rounded-full ${
                    pharmacy.availability_percentage === 100 ? 'bg-green-500' :
                    pharmacy.availability_percentage >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} style={{ width: `${pharmacy.availability_percentage}%` }}></div>
                  <span className="text-sm font-medium">{pharmacy.availability_percentage}%</span>
                </div>

                {/* Medicine List */}
                <div className="space-y-2">
                  {pharmacy.available_medicines.map((med, medIdx) => (
                    <div key={medIdx} className={`flex items-center justify-between p-2 rounded ${
                      med.available ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        {med.available ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">{med.name}</span>
                      </div>
                      {med.available && (
                        <span className="text-sm font-medium text-gray-700">
                          ${med.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Order Button */}
                <Button
                  onClick={() => createOrder(pharmacy)}
                  disabled={pharmacy.availability_percentage === 0 || loading}
                  className="w-full"
                >
                  {pharmacy.availability_percentage === 0 ? 'Out of Stock' : 'Order Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {pharmacies.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pharmacies Found</h3>
              <p className="text-gray-600">No pharmacies have these medicines in stock</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
