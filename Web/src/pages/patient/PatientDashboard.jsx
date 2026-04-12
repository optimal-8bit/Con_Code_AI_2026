import { useState, useEffect } from 'react';
import PatientLayout from '@/components/layout/PatientLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import Shuffle from '@/components/ui/Shuffle';
import { patientService } from '@/services/patient.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import {
  Calendar,
  FileText,
  Pill,
  Bell,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await patientService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Shuffle
            text="LOADING"
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={false}
            triggerOnHover={false}
            respectReducedMotion={true}
            loop={true}
            loopDelay={0.5}
            style={{ 
              color: '#60a5fa',
              fontSize: '3rem',
              fontWeight: '700',
              letterSpacing: '0.1em'
            }}
          />
        </div>
      </PatientLayout>
    );
  }

  if (error) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
            <p className="text-gray-300">{error}</p>
            <Button onClick={loadDashboard} className="mt-4 bg-blue-500 hover:bg-blue-600">
              Retry
            </Button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  const metrics = dashboard?.metrics || {};

  return (
    <PatientLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BorderGlow glowColor="220 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Appointments</p>
                  <p className="text-3xl font-bold text-white mt-1">{metrics.total_appointments || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="160 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Prescriptions</p>
                  <p className="text-3xl font-bold text-white mt-1">{metrics.total_prescriptions || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <FileText className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="280 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Medications</p>
                  <p className="text-3xl font-bold text-white mt-1">{metrics.active_medications || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <Pill className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="45 80 80">
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Notifications</p>
                  <p className="text-3xl font-bold text-white mt-1">{metrics.unread_notifications || 0}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                  <Bell className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* AI Health Summary */}
        {dashboard?.ai_health_summary && (
          <BorderGlow glowColor="200 80 80" className="w-full">
            <div className="p-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
                <Activity className="h-5 w-5 text-blue-400" />
                AI Health Summary
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">{dashboard.ai_health_summary}</p>
              {dashboard.ai_recommendations && dashboard.ai_recommendations.length > 0 && (
                <div className="space-y-2 mt-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">Recommendations</p>
                  <ul className="space-y-2">
                    {dashboard.ai_recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
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
          {/* Upcoming Appointments */}
          <BorderGlow glowColor="220 60 40">
            <div className="p-6 h-full flex flex-col">
              <div className="flex flex-row items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Upcoming Appointments</h3>
                <Link to="/patient/appointments">
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">View All</Button>
                </Link>
              </div>
              <div className="flex-1">
                {dashboard?.upcoming_appointments && dashboard.upcoming_appointments.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.upcoming_appointments.map((appt) => (
                      <div key={appt.id} className="flex items-start justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-white">
                              {formatDateTime(appt.scheduled_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{appt.reason || 'General Consultation'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <p className="text-gray-400">No upcoming appointments</p>
                  </div>
                )}
              </div>
            </div>
          </BorderGlow>

          {/* Active Medications */}
          <BorderGlow glowColor="280 60 40">
            <div className="p-6 h-full flex flex-col">
              <div className="flex flex-row items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Active Medications</h3>
                <Link to="/patient/medications">
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">View All</Button>
                </Link>
              </div>
              <div className="flex-1">
                {dashboard?.active_medications && dashboard.active_medications.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.active_medications.slice(0, 5).map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                        <div>
                          <p className="font-medium text-white">{med.medicine_name}</p>
                          <p className="text-sm text-gray-300">{med.dosage} - {med.frequency}</p>
                        </div>
                        <Pill className="h-5 w-5 text-purple-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <p className="text-gray-400">No active medications</p>
                  </div>
                )}
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* Recent Prescriptions */}
        <BorderGlow glowColor="160 60 40">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Prescriptions</h3>
              <Link to="/patient/prescriptions">
                <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">View All</Button>
              </Link>
            </div>
            {dashboard?.recent_prescriptions && dashboard.recent_prescriptions.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recent_prescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {rx.medicines?.length || 0} medicine(s)
                      </p>
                      <p className="text-sm text-gray-300">Issued: {formatDateTime(rx.issued_at)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rx.status)}`}>
                      {rx.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-gray-400">No prescriptions yet</p>
              </div>
            )}
          </div>
        </BorderGlow>
      </div>
    </PatientLayout>
  );
}
