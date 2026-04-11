import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { patientService } from '@/services/patient.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { Calendar, Plus, Search, Clock, MapPin, User, X, Timer } from 'lucide-react';

export default function PatientAppointments() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    doctor_id: '',
    scheduled_at: '',
    reason: '',
    notes: '',
  });

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper function to get doctor name by ID
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : `Doctor ID: ${doctorId}`;
  };

  // Helper function to get doctor details by ID
  const getDoctorDetails = (doctorId) => {
    return doctors.find(d => d.id === doctorId);
  };

  // Calculate countdown for upcoming appointments
  const getCountdown = (scheduledAt) => {
    const appointmentTime = new Date(scheduledAt);
    const diff = appointmentTime - currentTime;

    if (diff <= 0) {
      return { text: 'Appointment time has passed', isPast: true, isUrgent: false };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const isUrgent = diff < 24 * 60 * 60 * 1000; // Less than 24 hours

    if (days > 0) {
      return { 
        text: `${days}d ${hours}h ${minutes}m`, 
        isPast: false, 
        isUrgent: false,
        fullText: `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`
      };
    } else if (hours > 0) {
      return { 
        text: `${hours}h ${minutes}m ${seconds}s`, 
        isPast: false, 
        isUrgent,
        fullText: `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}, ${seconds} second${seconds > 1 ? 's' : ''}`
      };
    } else if (minutes > 0) {
      return { 
        text: `${minutes}m ${seconds}s`, 
        isPast: false, 
        isUrgent: true,
        fullText: `${minutes} minute${minutes > 1 ? 's' : ''}, ${seconds} second${seconds > 1 ? 's' : ''}`
      };
    } else {
      return { 
        text: `${seconds}s`, 
        isPast: false, 
        isUrgent: true,
        fullText: `${seconds} second${seconds > 1 ? 's' : ''}`
      };
    }
  };

  useEffect(() => {
    loadData();
    
    // Check if we should open booking form from navigation state
    if (location.state?.openBooking) {
      setShowBooking(true);
      
      // Pre-fill form data from navigation state
      const newFormData = { ...formData };
      if (location.state.reason) {
        newFormData.reason = location.state.reason;
      }
      if (location.state.selectedDoctorId) {
        newFormData.doctor_id = location.state.selectedDoctorId;
      }
      setFormData(newFormData);
    }
  }, [location.state]);

  useEffect(() => {
    // Filter doctors by specialty if specified, but only if no specific doctor is selected
    if (location.state?.filterSpecialty && !location.state?.selectedDoctorId && doctors.length > 0) {
      const filtered = doctors.filter(doc => 
        doc.profile?.specialty === location.state.filterSpecialty
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [doctors, location.state?.filterSpecialty, location.state?.selectedDoctorId]);

  const loadData = async () => {
    try {
      const [appts, docs] = await Promise.all([
        patientService.getAppointments(),
        patientService.searchDoctors(),
      ]);
      setAppointments(appts);
      setDoctors(docs);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await patientService.bookAppointment(formData);
      setShowBooking(false);
      setFormData({ doctor_id: '', scheduled_at: '', reason: '', notes: '' });
      
      // Clear navigation state after successful booking
      if (location.state) {
        window.history.replaceState({}, document.title);
      }
      
      loadData();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await patientService.cancelAppointment(id);
      loadData();
    } catch (err) {
      alert(handleApiError(err));
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <Button onClick={() => setShowBooking(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </div>

        {showBooking && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Book New Appointment</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBooking(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Select Doctor</label>
                  {location.state?.selectedDoctorId && (
                    <p className="text-xs text-green-600 mb-1">
                      Doctor pre-selected from symptom analysis
                    </p>
                  )}
                  {location.state?.filterSpecialty && !location.state?.selectedDoctorId && (
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-blue-600">
                        Showing {location.state.filterSpecialty} specialists (recommended for your symptoms)
                      </p>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setFilteredDoctors(doctors);
                          window.history.replaceState({}, document.title);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Show All Doctors
                      </Button>
                    </div>
                  )}
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Choose a doctor</option>
                    {filteredDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} {doc.profile?.specialty ? `- ${doc.profile.specialty}` : ''}
                        {doc.profile?.consultation_fee ? ` ($${doc.profile.consultation_fee})` : ''}
                      </option>
                    ))}
                  </select>
                  {location.state?.filterSpecialty && filteredDoctors.length === 0 && doctors.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No {location.state.filterSpecialty} specialists found. Showing all doctors below:
                    </p>
                  )}
                  {location.state?.filterSpecialty && filteredDoctors.length === 0 && (
                    <select
                      value={formData.doctor_id}
                      onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Choose any doctor</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} {doc.profile?.specialty ? `- ${doc.profile.specialty}` : ''}
                          {doc.profile?.consultation_fee ? ` ($${doc.profile.consultation_fee})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reason</label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Regular checkup, Follow-up"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                    placeholder="Any additional information"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Book Appointment</Button>
                  <Button type="button" variant="outline" onClick={() => setShowBooking(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {appointments.length > 0 ? (
            appointments.map((appt) => {
              const countdown = appt.status === 'pending' || appt.status === 'confirmed' 
                ? getCountdown(appt.scheduled_at) 
                : null;
              const doctor = getDoctorDetails(appt.doctor_id);

              return (
                <Card key={appt.id} className={countdown?.isUrgent ? 'border-2 border-orange-400' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {formatDateTime(appt.scheduled_at)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appt.status)}`}>
                            {appt.status}
                          </span>
                        </div>

                        {/* Live Countdown */}
                        {countdown && !countdown.isPast && (
                          <div className={`flex items-center gap-2 p-3 rounded-lg ${
                            countdown.isUrgent 
                              ? 'bg-orange-50 border border-orange-200' 
                              : 'bg-blue-50 border border-blue-200'
                          }`}>
                            <Timer className={`h-5 w-5 ${countdown.isUrgent ? 'text-orange-600' : 'text-blue-600'}`} />
                            <div>
                              <p className={`text-sm font-semibold ${countdown.isUrgent ? 'text-orange-900' : 'text-blue-900'}`}>
                                {countdown.isUrgent ? '⏰ Upcoming Soon!' : 'Time Until Appointment:'}
                              </p>
                              <p className={`text-lg font-bold ${countdown.isUrgent ? 'text-orange-700' : 'text-blue-700'} font-mono`}>
                                {countdown.text}
                              </p>
                              <p className={`text-xs ${countdown.isUrgent ? 'text-orange-600' : 'text-blue-600'}`}>
                                {countdown.fullText}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Doctor Information */}
                        <div className="flex items-start gap-2 text-gray-700">
                          <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">{getDoctorName(appt.doctor_id)}</p>
                            {doctor?.profile?.specialty && (
                              <p className="text-sm text-blue-600">{doctor.profile.specialty}</p>
                            )}
                            {doctor?.profile?.qualifications && (
                              <p className="text-sm text-gray-600">{doctor.profile.qualifications}</p>
                            )}
                            {doctor?.profile?.city && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-gray-500" />
                                <span className="text-sm text-gray-600">{doctor.profile.city}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {appt.reason && (
                          <p className="text-gray-700">
                            <span className="font-medium">Reason:</span> {appt.reason}
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Notes:</span> {appt.notes}
                          </p>
                        )}
                      </div>
                      {appt.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(appt.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments yet</p>
                <Button onClick={() => setShowBooking(true)} className="mt-4">
                  Book Your First Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
