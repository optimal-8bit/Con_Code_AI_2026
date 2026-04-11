import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import TrueFocus from '@/components/ui/TrueFocus';
import { Button } from '@/components/ui/button';
import { doctorService } from '@/services/doctor.service';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { Calendar, FileText, Users, Bell, Activity, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await doctorService.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <TrueFocus
            sentence={`Hello, ${user?.name || 'Doctor'}`}
            manualMode={false}
            blurAmount={5}
            borderColor="#3b82f6"
            glowColor="rgba(59, 130, 246, 0.5)"
            animationDuration={0.6}
            pauseBetweenAnimations={0.5}
          />
        </div>
      </DoctorLayout>
    );
  }

  const metrics = dashboard?.metrics || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <DoctorLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Top 4 Metrics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants} className="h-full">
            <BorderGlow glowColor="210 80 80">
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
          </motion.div>

          <motion.div variants={itemVariants} className="h-full">
            <BorderGlow glowColor="230 80 80">
              <div className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Today's Appointments</p>
                    <p className="text-3xl font-bold text-white mt-1">{metrics.todays_appointments || 0}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>
            </BorderGlow>
          </motion.div>

          <motion.div variants={itemVariants} className="h-full">
            <BorderGlow glowColor="190 80 80">
              <div className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Pending Requests</p>
                    <p className="text-3xl font-bold text-white mt-1">{metrics.pending_appointments || 0}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                    <Bell className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>
            </BorderGlow>
          </motion.div>

          <motion.div variants={itemVariants} className="h-full">
            <BorderGlow glowColor="250 80 80">
              <div className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Prescriptions Issued</p>
                    <p className="text-3xl font-bold text-white mt-1">{metrics.total_prescriptions || 0}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </div>

        {/* AI Workload Summary */}
        {dashboard?.ai_workload_summary && (
          <motion.div variants={itemVariants}>
            <BorderGlow glowColor="210 80 80" className="w-full">
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
                  <Activity className="h-5 w-5 text-blue-400" />
                  AI Workload Summary
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">{dashboard.ai_workload_summary}</p>
                {dashboard.ai_recommendations && dashboard.ai_recommendations.length > 0 && (
                  <div className="space-y-2 mt-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">Recommendations</p>
                    <ul className="space-y-2">
                      {dashboard.ai_recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </BorderGlow>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="h-full">
            <BorderGlow glowColor="200 60 40">
              <div className="p-6 h-full flex flex-col">
                <div className="flex flex-row items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Today's Appointments</h3>
                  <Link to="/doctor/appointments">
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">View All</Button>
                  </Link>
                </div>
                <div className="flex-1">
                  {dashboard?.todays_appointments && dashboard.todays_appointments.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.todays_appointments.map((appt) => (
                        <div key={appt.id} className="flex items-start justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{formatDateTime(appt.scheduled_at)}</p>
                            <p className="text-xs text-gray-400 mt-1">{appt.reason || 'General Consultation'}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appt.status)}`}>
                            {appt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-8">
                      <p className="text-gray-400">No appointments today</p>
                    </div>
                  )}
                </div>
              </div>
            </BorderGlow>
          </motion.div>

          <motion.div variants={itemVariants} className="h-full">
            <BorderGlow glowColor="240 60 40">
              <div className="p-6 h-full flex flex-col">
                <div className="flex flex-row items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Pending Appointments</h3>
                  <Link to="/doctor/appointments">
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">View All</Button>
                  </Link>
                </div>
                <div className="flex-1">
                  {dashboard?.pending_appointments && dashboard.pending_appointments.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.pending_appointments.map((appt) => (
                        <div key={appt.id} className="flex items-start justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{formatDateTime(appt.scheduled_at)}</p>
                            <p className="text-xs text-gray-400 mt-1">{appt.reason || 'General Consultation'}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appt.status)}`}>
                            {appt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-8">
                      <p className="text-gray-400">No pending appointments</p>
                    </div>
                  )}
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </div>
      </motion.div>
    </DoctorLayout>
  );
}
