import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { patientService } from '@/services/patient.service';
import { getSeverityColor, handleApiError } from '@/lib/utils';
import { Activity, Upload, AlertCircle, CheckCircle, Calendar, User, Star, MapPin, Phone } from 'lucide-react';

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    symptom_text: '',
    patient_age: '',
    patient_gender: '',
    known_conditions: '',
    current_medications: '',
    duration_days: '',
  });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const getSpecialtyFromRecommendation = (specialistText) => {
    const text = specialistText.toLowerCase();
    
    if (text.includes('cardiolog')) return 'Cardiology';
    if (text.includes('orthoped') || text.includes('bone') || text.includes('joint')) return 'Orthopedics';
    if (text.includes('gynecolog') || text.includes('women')) return 'Gynecology';
    if (text.includes('pediatric') || text.includes('child')) return 'Pediatrics';
    if (text.includes('neurolog') || text.includes('brain') || text.includes('nerve')) return 'Neurology';
    if (text.includes('psychiatr') || text.includes('mental')) return 'Psychiatry';
    if (text.includes('ophthalmolog') || text.includes('eye')) return 'Ophthalmology';
    if (text.includes('ent') || text.includes('ear') || text.includes('nose') || text.includes('throat')) return 'ENT';
    if (text.includes('gastroenterolog') || text.includes('stomach') || text.includes('digestive')) return 'Gastroenterology';
    if (text.includes('endocrinolog') || text.includes('diabetes') || text.includes('hormone')) return 'Endocrinology';
    if (text.includes('pulmonolog') || text.includes('lung') || text.includes('respiratory')) return 'Pulmonology';
    if (text.includes('nephrolog') || text.includes('kidney')) return 'Nephrology';
    if (text.includes('rheumatolog') || text.includes('arthritis') || text.includes('joint pain')) return 'Rheumatology';
    if (text.includes('oncolog') || text.includes('cancer')) return 'Oncology';
    if (text.includes('dermatolog') || text.includes('skin')) return 'Dermatology';
    if (text.includes('urolog') || text.includes('urinary') || text.includes('bladder')) return 'Urology';
    if (text.includes('general') || text.includes('family') || text.includes('primary')) return 'General Physician';
    
    return null;
  };

  const fetchRecommendedDoctors = async (specialty) => {
    if (!specialty) return;
    
    setDoctorsLoading(true);
    try {
      const doctors = await patientService.searchDoctors(specialty);
      // Get top 3 doctors, sorted by rating if available
      const sortedDoctors = doctors
        .sort((a, b) => (b.profile?.rating || 0) - (a.profile?.rating || 0))
        .slice(0, 3);
      setRecommendedDoctors(sortedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', handleApiError(err));
      setRecommendedDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleBookWithDoctor = (doctor) => {
    const reason = `Follow-up for symptoms: ${formData.symptom_text.substring(0, 100)}${formData.symptom_text.length > 100 ? '...' : ''}`;
    
    navigate('/patient/appointments', {
      state: {
        openBooking: true,
        selectedDoctorId: doctor.id,
        reason: reason
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const data = new FormData();
    data.append('symptom_text', formData.symptom_text);
    // Only append optional fields if they have values
    if (formData.patient_age) data.append('patient_age', formData.patient_age);
    if (formData.patient_gender) data.append('patient_gender', formData.patient_gender);
    if (formData.known_conditions) data.append('known_conditions', formData.known_conditions);
    if (formData.current_medications) data.append('current_medications', formData.current_medications);
    if (formData.duration_days) data.append('duration_days', formData.duration_days);
    if (file) data.append('image_file', file);

    try {
      const response = await aiService.checkSymptoms(data);
      setResult(response);
      
      // Fetch recommended doctors if specialist is recommended
      if (response.recommended_specialist) {
        const specialty = getSpecialtyFromRecommendation(response.recommended_specialist);
        if (specialty) {
          await fetchRecommendedDoctors(specialty);
        }
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Symptom Checker</h2>
            <p className="text-gray-600">Describe your symptoms for AI-powered health insights</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Describe Your Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Symptoms *</label>
                <textarea
                  value={formData.symptom_text}
                  onChange={(e) => setFormData({ ...formData, symptom_text: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder="Describe your symptoms in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Age</label>
                  <Input
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                    placeholder="Your age"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={formData.patient_gender}
                    onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Duration (days)</label>
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  placeholder="How many days have you had these symptoms?"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Known Medical Conditions</label>
                <Input
                  value={formData.known_conditions}
                  onChange={(e) => setFormData({ ...formData, known_conditions: e.target.value })}
                  placeholder="e.g., Diabetes, Hypertension (comma-separated)"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Current Medications</label>
                <Input
                  value={formData.current_medications}
                  onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                  placeholder="e.g., Aspirin, Metformin (comma-separated)"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Upload Image (Optional)</label>
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Severity:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(result.severity)}`}>
                    {result.severity}
                  </span>
                </div>
              </div>

              {result.possible_conditions && result.possible_conditions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Possible Conditions:</h3>
                  <div className="space-y-2">
                    {result.possible_conditions.map((condition, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{condition.name}</p>
                        <p className="text-sm text-gray-600">{condition.description}</p>
                        {condition.probability && (
                          <p className="text-xs text-gray-500 mt-1">Probability: {condition.probability}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.red_flags && result.red_flags.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-900 mb-2">⚠️ Red Flags:</h3>
                  <ul className="space-y-1">
                    {result.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-700">• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.next_steps && result.next_steps.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
                  <ul className="space-y-1">
                    {result.next_steps.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.home_care_tips && result.home_care_tips.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Home Care Tips:</h3>
                  <ul className="space-y-1">
                    {result.home_care_tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommended_specialist && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Recommended Specialist:</span>
                  </div>
                  <p className="text-blue-800 mb-4">{result.recommended_specialist}</p>
                  
                  {doctorsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-blue-600">Finding available doctors...</span>
                    </div>
                  ) : recommendedDoctors.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-900 mb-3">Available Specialists:</h4>
                      {recommendedDoctors.map((doctor) => (
                        <div key={doctor.id} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-gray-900">{doctor.name}</h5>
                                {doctor.profile?.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-600">{doctor.profile.rating}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                {doctor.profile?.specialty && (
                                  <p className="font-medium text-blue-700">{doctor.profile.specialty}</p>
                                )}
                                {doctor.profile?.qualifications && (
                                  <p>{doctor.profile.qualifications}</p>
                                )}
                                {doctor.profile?.experience_years && (
                                  <p>{doctor.profile.experience_years} years experience</p>
                                )}
                                <div className="flex items-center gap-4">
                                  {doctor.profile?.city && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{doctor.profile.city}</span>
                                    </div>
                                  )}
                                  {doctor.profile?.consultation_fee && (
                                    <span className="font-medium text-green-600">
                                      ${doctor.profile.consultation_fee}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => handleBookWithDoctor(doctor)}
                              size="sm"
                              className="ml-4 bg-blue-600 hover:bg-blue-700"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Book Appointment
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-2 border-t border-blue-200">
                        <Button 
                          variant="outline"
                          onClick={() => navigate('/patient/appointments')}
                          className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          View All Doctors
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-blue-700 mb-3">No specialists found in our database.</p>
                      <Button 
                        onClick={() => navigate('/patient/appointments')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Browse All Doctors
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">{result.disclaimer}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
