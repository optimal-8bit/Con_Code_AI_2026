import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { handleApiError } from '@/lib/utils';
import { MessageSquare, Send, Bot, User, Upload, FileText, Activity, X, Mic, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

export default function SmartChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [uploadIntent, setUploadIntent] = useState('none');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadMenuRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close upload menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle upload button click
  const handleUploadClick = (intent) => {
    setUploadIntent(intent);
    setShowUploadMenu(false);
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview({
        url: event.target.result,
        type: file.type,
        name: file.name,
        intent: uploadIntent,
      });
    };
    reader.readAsDataURL(file);
  };

  // Clear file
  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadIntent('none');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle action button clicks
  const handleAction = (action) => {
    switch (action) {
      case 'book_appointment':
        navigate('/appointments');
        break;
      case 'view_history':
        navigate('/records');
        break;
      case 'set_reminders':
        navigate('/medications');
        break;
      case 'find_pharmacy':
        alert('Pharmacy finder coming soon!');
        break;
      case 'order_medicines':
        alert('Medicine ordering coming soon!');
        break;
      case 'save_record':
        navigate('/records');
        break;
      case 'share_doctor':
        alert('Share feature coming soon!');
        break;
      default:
        break;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || loading) return;

    // Build user message content
    let userContent = input.trim();
    if (selectedFile && userContent) {
      userContent = `${userContent}\n📎 ${selectedFile.name}`;
    } else if (selectedFile && !userContent) {
      userContent = `📎 ${selectedFile.name}`;
    }

    const userMessage = { 
      role: 'user', 
      content: userContent,
      hasFile: !!selectedFile 
    };
    setMessages((prev) => [...prev, userMessage]);
    
    const currentInput = input.trim();
    const currentFile = selectedFile;
    const currentIntent = uploadIntent;
    
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chatOrchestrator({
        message: currentInput,
        upload_intent: currentIntent,
        file: currentFile,
        chat_history: messages.map(m => ({ role: m.role, content: m.content })),
        session_id: sessionId,
      });

      setSessionId(response.session_id);
      
      const assistantMessage = { 
        role: 'assistant', 
        content: response.answer,
        agent_used: response.agent_used,
        supports_actions: response.supports_actions,
        suggested_actions: response.suggested_actions || [],
        disclaimer: response.disclaimer,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Clear file after sending
      clearFile();
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${handleApiError(err)}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getIntentLabel = (intent) => {
    const labels = {
      symptom: '🩺 Symptom Photo',
      prescription: '💊 Prescription',
      report: '📊 Medical Report',
    };
    return labels[intent] || 'File';
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Smart Health Chat
            </h2>
            <p className="text-gray-600 text-sm">Your intelligent health assistant with specialized analysis</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col min-h-0 shadow-2xl border-0 bg-white/40 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gradient-to-b from-white/30 to-white/20 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="inline-flex p-4 bg-white/60 backdrop-blur-md rounded-3xl mb-6 shadow-lg">
                    <Bot className="h-16 w-16 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    👋 Hello! I'm your Smart Health Assistant
                  </h3>
                  <p className="text-gray-800 mb-8 max-w-2xl mx-auto font-medium">
                    I'm here to help you understand your health better. Ask me anything or upload medical documents for analysis.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    <div className="group p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-blue-200/50 hover:border-blue-400/70 hover:shadow-xl hover:bg-white/80 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100/80 backdrop-blur-sm rounded-2xl group-hover:bg-blue-200/80 transition-colors">
                          <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 mb-1">Symptom Analysis</h4>
                          <p className="text-sm text-gray-800">Upload photos or describe your symptoms for AI-powered insights</p>
                        </div>
                      </div>
                    </div>

                    <div className="group p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-green-200/50 hover:border-green-400/70 hover:shadow-xl hover:bg-white/80 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100/80 backdrop-blur-sm rounded-2xl group-hover:bg-green-200/80 transition-colors">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 mb-1">Prescription Help</h4>
                          <p className="text-sm text-gray-800">Analyze prescriptions and get medication schedules</p>
                        </div>
                      </div>
                    </div>

                    <div className="group p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-purple-200/50 hover:border-purple-400/70 hover:shadow-xl hover:bg-white/80 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100/80 backdrop-blur-sm rounded-2xl group-hover:bg-purple-200/80 transition-colors">
                          <Upload className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 mb-1">Report Explainer</h4>
                          <p className="text-sm text-gray-800">Understand your lab results in simple language</p>
                        </div>
                      </div>
                    </div>

                    <div className="group p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-pink-200/50 hover:border-pink-400/70 hover:shadow-xl hover:bg-white/80 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-pink-100/80 backdrop-blur-sm rounded-2xl group-hover:bg-pink-200/80 transition-colors">
                          <MessageSquare className="h-6 w-6 text-pink-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 mb-1">General Questions</h4>
                          <p className="text-sm text-gray-800">Ask anything about health, wellness, and medical topics</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mt-8 flex items-center justify-center gap-2 font-medium">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Ready to help • Click the + button to upload files or just start typing
                  </p>
                </div>
              )}

              {messages.map((message, idx) => (
                <div key={idx} className="animate-fadeIn">
                  {message.role === 'user' && (
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl rounded-tr-md px-5 py-3 max-w-[75%] shadow-lg backdrop-blur-sm">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex-shrink-0 shadow-md">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex-shrink-0 shadow-md">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 max-w-[85%]">
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl rounded-tl-md px-5 py-4 shadow-lg border border-white/50">
                          <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4 prose-li:text-gray-800 prose-li:my-1">
                            <ReactMarkdown
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 mt-3 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1" {...props} />,
                                p: ({node, ...props}) => <p className="text-gray-800 leading-relaxed mb-2" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="text-gray-800" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                                code: ({node, inline, ...props}) => 
                                  inline ? (
                                    <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-sm font-mono font-semibold" {...props} />
                                  ) : (
                                    <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-2" {...props} />
                                  ),
                                blockquote: ({node, ...props}) => (
                                  <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-700 my-2 bg-purple-50 py-2 rounded-r" {...props} />
                                ),
                                a: ({node, ...props}) => (
                                  <a className="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        
                        {message.disclaimer && (
                          <div className="mt-3 bg-gradient-to-r from-yellow-50/90 to-orange-50/90 backdrop-blur-sm border-l-4 border-yellow-400 px-4 py-3 rounded-r-2xl shadow-sm">
                            <p className="text-xs text-yellow-900 leading-relaxed font-medium">{message.disclaimer}</p>
                          </div>
                        )}
                        
                        {message.supports_actions && message.suggested_actions?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {message.suggested_actions.map((action, i) => (
                              <button
                                key={i}
                                onClick={() => handleAction(action.action)}
                                className="px-4 py-2 text-xs font-semibold bg-white/80 backdrop-blur-sm border-2 border-purple-200/70 text-purple-700 rounded-full hover:bg-white hover:border-purple-400 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3 animate-fadeIn">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-md">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl rounded-tl-md px-5 py-4 border border-white/50 shadow-lg">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File Preview */}
            {filePreview && (
              <div className="border-t border-white/30 bg-gradient-to-r from-blue-50/60 to-purple-50/60 backdrop-blur-md p-4 animate-slideDown">
                <div className="p-4 bg-white/70 backdrop-blur-md border border-blue-200/50 rounded-2xl flex items-center gap-4 shadow-lg">
                  {filePreview.type.startsWith('image/') ? (
                    <img src={filePreview.url} alt="Preview" className="w-14 h-14 object-cover rounded-xl shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100/80 to-blue-200/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
                      <FileText className="h-7 w-7 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{getIntentLabel(filePreview.intent)}</div>
                    <div className="text-xs text-gray-700 truncate mt-0.5">{filePreview.name}</div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 hover:bg-red-50/80 backdrop-blur-sm rounded-xl transition-colors group"
                  >
                    <X className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-white/30 p-5 bg-white/50 backdrop-blur-xl">
              <form onSubmit={handleSend} className="flex gap-3 items-end">
                {/* Upload Menu Button */}
                <div className="relative" ref={uploadMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                    className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-2xl transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105"
                    disabled={loading}
                  >
                    <Plus className="h-5 w-5 text-white" />
                  </button>

                  {/* Upload Options Dropdown */}
                  {showUploadMenu && (
                    <div className="absolute bottom-full left-0 mb-3 w-64 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 py-2 z-50 animate-slideUp">
                      <div className="px-3 py-2 border-b border-gray-200/50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upload Options</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleUploadClick('symptom')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/80 backdrop-blur-sm transition-colors text-left group rounded-2xl mx-1"
                      >
                        <div className="p-2 bg-blue-100/80 backdrop-blur-sm rounded-xl group-hover:bg-blue-200/80 transition-colors">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Symptom Photo</div>
                          <div className="text-xs text-gray-600">Upload symptom images</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUploadClick('prescription')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50/80 backdrop-blur-sm transition-colors text-left group rounded-2xl mx-1"
                      >
                        <div className="p-2 bg-green-100/80 backdrop-blur-sm rounded-xl group-hover:bg-green-200/80 transition-colors">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Prescription</div>
                          <div className="text-xs text-gray-600">Analyze prescriptions</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUploadClick('report')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50/80 backdrop-blur-sm transition-colors text-left group rounded-2xl mx-1"
                      >
                        <div className="p-2 bg-purple-100/80 backdrop-blur-sm rounded-xl group-hover:bg-purple-200/80 transition-colors">
                          <Upload className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Medical Report</div>
                          <div className="text-xs text-gray-600">Lab results & reports</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1 h-12 rounded-2xl border-2 border-white/50 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200 focus:bg-white/90 transition-all"
                />
                <Button 
                  type="submit" 
                  disabled={loading || (!input.trim() && !selectedFile)} 
                  className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
              <p className="text-xs text-gray-700 mt-3 flex items-center gap-2 font-medium">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100/80 backdrop-blur-sm rounded-full flex-shrink-0">
                  ⚠️
                </span>
                <span>This AI assistant provides general health information only. Always consult a healthcare professional for medical advice.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }

        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3));
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(147, 51, 234, 0.5), rgba(59, 130, 246, 0.5));
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(147, 51, 234, 0.3) transparent;
        }
      `}</style>
    </DashboardLayout>
  );
}
