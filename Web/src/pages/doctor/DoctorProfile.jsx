import { useState } from 'react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { handleApiError } from '@/lib/utils';
import { User, Mail, Phone, Save } from 'lucide-react';

export default function DoctorProfile() {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updated = await authService.updateProfile(formData);
      updateUser(updated);
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DoctorLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
           <User className="h-6 w-6 text-blue-400" />
           <h2 className="text-2xl font-bold text-white">My Profile</h2>
        </div>

        <BorderGlow glowColor="210 60 40">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Personal Information</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {message && (
                <div className={`p-4 rounded-xl border backdrop-blur-sm text-sm font-medium ${
                  message.includes('success') 
                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {message}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    value={user?.email || ''}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-gray-400 cursor-not-allowed rounded-xl"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email address cannot be changed.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-300">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl"
                    placeholder="e.g., +1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-white/10 flex justify-end">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-xl text-base w-full sm:w-auto">
                  <Save className="h-5 w-5 mr-2" />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </BorderGlow>
      </div>
    </DoctorLayout>
  );
}
