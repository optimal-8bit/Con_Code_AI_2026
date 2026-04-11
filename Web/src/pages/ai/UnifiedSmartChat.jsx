import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { patientService } from '@/services/patient.service';
import { handleApiError } from '@/lib/utils';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Upload,
  Calendar,
  Pill,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  X,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

export default function UnifiedSmartChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          "👋 Hi! I'm your Smart Health Assistant. I can help you with:\n\n" +
          "• **Check symptoms** and recommend doctors\n" +
          "• **Book appointments** with specialists\n" +
          "• **Analyze medical reports** and explain results\n" +
          "• **Process prescriptions** and set medication reminders\n" +
          "• **Order medicines** from nearby pharmacies\n\n" +
          "Just type your question or upload a file to get started!",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e, quickMessage = null) => {
    e?.preventDefault();
    const messageText = quickMessage || input;
    if ((!messageText.trim() && !uploadedFile) || loading) return;

    // Create user message
    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      hasFile: !!uploadedFile,
      fileName: uploadedFile?.name,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setLoading(true);

    try {
      let response;

      // If file is uploaded, route to appropriate analyzer
      if (uploadedFile) {
        const formData = new FormData();
        
        // Detect file type and route accordingly
        const fileName = uploadedFile.name.toLowerCase();
        const fileType = uploadedFile.type;

        if (
          fileName.includes('prescription') ||
          messageText.toLowerCase().includes('prescription') ||
          messageText.toLowerCase().includes('medicine')
        ) {
          // Prescription analysis with schedule extraction
          formData.append('prescription_file', uploadedFile);
          formData.append('prescription_text', messageText);
          
          const prescriptionResult = await aiService.getPrescriptionSchedule(formData);
          
          // Format response
          const medicines = prescriptionResult.medicines || [];
          let responseText = `📋 **Prescription Analyzed**\n\n`;
          responseText += `I found ${medicines.length} medicine(s):\n\n`;
          
          medicines.forEach((med, idx) => {
            responseText += `**${idx + 1}. ${med.name}**\n`;
            responseText += `   • Dosage: ${med.dosage}\n`;
            responseText += `   • Frequency: ${med.times_per_day}x daily\n`;
            responseText += `   • Duration: ${med.duration_days} days\n`;
            responseText += `   • Timing: ${med.timing.join(', ')}\n`;
            if (med.instructions) {
              responseText += `   • Instructions: ${med.instructions}\n`;
            }
            responseText += `\n`;
          });

          const assistantMessage = {
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString(),
            actions: [
              {
                type: 'add_reminders',
                label: '⏰ Add Medication Reminders',
                icon: 'clock',
                data: { medicines, recordId: prescriptionResult.record_id },
              },
              {
                type: 'order_pharmacy',
                label: '🏥 Order from Pharmacy',
                icon: 'pill',
                data: { medicines },
              },
            ],
            metadata: { type: 'prescription', data: prescriptionResult },
          };
          setMessages((prev) => [...prev, assistantMessage]);
          
        } else if (
          fileName.includes('report') ||
          messageText.toLowerCase().includes('report') ||
          messageText.toLowerCase().includes('test')
        ) {
          // Report analysis
          formData.append('report_file', uploadedFile);
          formData.append('report_text', messageText);
          formData.append('question', messageText || 'Explain this medical report');
          
          const reportResult = await aiService.explainReport(formData);
          
          // Format response
          let responseText = `📊 **Medical Report Analysis**\n\n`;
          responseText += `${reportResult.plain_language_summary}\n\n`;
          
          if (reportResult.abnormalities && reportResult.abnormalities.length > 0) {
            responseText += `**⚠️ Abnormal Values:**\n`;
            reportResult.abnormalities.forEach((abn) => {
              responseText += `• ${abn}\n`;
            });
            responseText += `\n`;
          }
          
          if (reportResult.actionable_insights && reportResult.actionable_insights.length > 0) {
            responseText += `**💡 Recommendations:**\n`;
            reportResult.actionable_insights.forEach((insight) => {
              responseText += `• ${insight}\n`;
            });
          }

          const actions = [
            {
              type: 'save_report',
              label: '💾 Save to Medical Records',
              icon: 'file',
              data: { reportId: reportResult.record_id },
            },
          ];

          // Add appointment booking if specialists recommended
          if (reportResult.urgency !== 'routine') {
            actions.unshift({
              type: 'book_appointment',
              label: '📅 Book Urgent Appointment',
              icon: 'calendar',
              urgent: true,
            });
          }

          const assistantMessage = {
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString(),
            actions,
            metadata: { type: 'report', data: reportResult },
          };
          setMessages((prev) => [...prev, assistantMessage]);
          
        } else {
          // Symptom check with image
          formData.append('image_file', uploadedFile);
          formData.append('symptom_text', messageText);
          
          const symptomResult = await aiService.checkSymptoms(formData);
          
          // Format response
          let responseText = `🏥 **Symptom Analysis**\n\n`;
          
          if (symptomResult.possible_conditions && symptomResult.possible_conditions.length > 0) {
            responseText += `**Possible Conditions:**\n`;
            symptomResult.possible_conditions.slice(0, 3).forEach((cond) => {
              responseText += `• **${cond.name}** (${cond.probability} probability)\n`;
              responseText += `  ${cond.description}\n\n`;
            });
          }
          
          responseText += `**Severity:** ${symptomResult.severity.toUpperCase()}\n\n`;
          
          if (symptomResult.next_steps && symptomResult.next_steps.length > 0) {
            responseText += `**Next Steps:**\n`;
            symptomResult.next_steps.forEach((step) => {
              responseText += `• ${step}\n`;
            });
          }

          const actions = [];
          
          if (symptomResult.severity === 'high' || symptomResult.severity === 'critical') {
            actions.push({
              type: 'emergency',
              label: '🚨 Seek Immediate Medical Attention',
              icon: 'alert',
              urgent: true,
            });
          }
          
          if (symptomResult.recommended_specialist) {
            actions.push({
              type: 'book_appointment',
              label: `📅 Book ${symptomResult.recommended_specialist}`,
              icon: 'calendar',
              data: { specialty: symptomResult.recommended_specialist },
            });
          }

          const assistantMessage = {
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString(),
            actions,
            metadata: { type: 'symptom', data: symptomResult },
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }

        // Clear uploaded file
        removeFile();
        
      } else {
        // Regular chat without file
        response = await aiService.chat({
          question: messageText,
          chat_history: messages.filter((m) => m.role !== 'system'),
          session_id: sessionId,
          context_type: 'general',
        });

        setSessionId(response.session_id);

        // Parse actions from sources (if any)
        const actions = [];
        if (response.sources) {
          response.sources.forEach((source) => {
            if (source.startsWith('action:')) {
              const actionType = source.replace('action:', '');
              const actionMap = {
                book_appointment: { label: '📅 Book Appointment', icon: 'calendar' },
                upload_prescription: { label: '📋 Upload Prescription', icon: 'upload' },
                upload_report: { label: '📊 Upload Report', icon: 'upload' },
                find_pharmacies: { label: '🏥 Find Pharmacies', icon: 'map' },
                add_reminders: { label: '⏰ Set Reminders', icon: 'clock' },
              };
              if (actionMap[actionType]) {
                actions.push({
                  type: actionType,
                  ...actionMap[actionType],
                });
              }
            }
          });
        }

        const assistantMessage = {
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
          actions: actions.length > 0 ? actions : undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Add follow-up suggestions
        if (response.follow_up_questions && response.follow_up_questions.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: 'Suggested questions:',
              suggestions: response.follow_up_questions,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${handleApiError(err)}`,
        timestamp: new Date().toISOString(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    switch (action.type) {
      case 'add_reminders':
        // Navigate to medication schedule page or add reminders
        navigate('/patient/medications');
        break;
      
      case 'order_pharmacy':
        // Navigate to pharmacy order page with medicines
        navigate('/patient/pharmacy-order', { state: { medicines: action.data?.medicines } });
        break;
      
      case 'book_appointment':
        // Navigate to appointments page
        navigate('/patient/appointments');
        break;
      
      case 'upload_prescription':
      case 'upload_report':
        // Trigger file upload
        fileInputRef.current?.click();
        break;
      
      case 'find_pharmacies':
        // Navigate to pharmacy order
        navigate('/patient/pharmacy-order');
        break;
      
      case 'save_report':
        // Save report to medical records
        alert('Report saved to your medical records!');
        break;
      
      case 'emergency':
        alert('⚠️ Please seek immediate medical attention. Call emergency services if needed.');
        break;
      
      default:
        console.log('Unknown action:', action.type);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const quickActions = [
    { icon: AlertCircle, label: 'Check Symptoms', message: 'I have some symptoms I want to check' },
    { icon: Calendar, label: 'Book Appointment', message: 'I want to book an appointment with a doctor' },
    { icon: FileText, label: 'Analyze Report', message: 'I have a medical report to analyze' },
    { icon: Pill, label: 'Process Prescription', message: 'I have a prescription to process' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Smart Health Chat</h2>
              <p className="text-gray-600">Your all-in-one health assistant</p>
            </div>
          </div>
        </div>

        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, idx) => (
                <div key={idx}>
                  {message.role === 'user' && (
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.hasFile && (
                          <div className="mt-2 text-xs opacity-80 flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            {message.fileName}
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 max-w-[80%]">
                        <div className={`rounded-lg px-4 py-2 ${message.error ? 'bg-red-50 border border-red-200' : 'bg-gray-100'}`}>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        {/* Action Buttons */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.actions.map((action, i) => (
                              <Button
                                key={i}
                                onClick={() => handleAction(action)}
                                variant={action.urgent ? 'destructive' : 'outline'}
                                size="sm"
                                className="text-xs"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {message.role === 'system' && message.suggestions && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                        <Bot className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">{message.content}</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 text-center mb-4">Quick Actions:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleSend(e, action.message)}
                        className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <action.icon className="h-6 w-6 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* File Upload Preview */}
            {uploadedFile && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  {uploadPreview ? (
                    <img src={uploadPreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={removeFile} className="p-1 hover:bg-gray-200 rounded">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message or upload a file..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || (!input.trim() && !uploadedFile)}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ This AI assistant provides general health information only. Always consult a healthcare professional for medical advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
