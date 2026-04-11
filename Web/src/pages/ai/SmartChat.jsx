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
        // TODO: Implement pharmacy finder
        alert('Pharmacy finder coming soon!');
        break;
      case 'order_medicines':
        // TODO: Implement medicine ordering
        alert('Medicine ordering coming soon!');
        break;
      case 'save_record':
        navigate('/records');
        break;
      case 'share_doctor':
        // TODO: Implement sharing
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
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Health Chat</h2>
            <p className="text-gray-600">Your intelligent health assistant with specialized analysis</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">👋 Hello! I'm your Smart Health Assistant.</p>
                  <div className="text-left max-w-2xl mx-auto space-y-3 text-gray-700">
                    <p className="font-medium">I can help you with:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-xl">🩺</span>
                        <span><strong>Symptoms</strong> - Upload a photo or describe how you're feeling</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-xl">💊</span>
                        <span><strong>Prescriptions</strong> - Upload and analyze your prescription</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-xl">📊</span>
                        <span><strong>Medical Reports</strong> - Understand your lab results</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-xl">💬</span>
                        <span><strong>General Questions</strong> - Ask anything about health</span>
                      </li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-4">Use the upload buttons below to attach files, or just type your question!</p>
                  </div>
                </div>
              )}

              {messages.map((message, idx) => (
                <div key={idx}>
                  {message.role === 'user' && (
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg px-4 py-3 max-w-[80%] shadow-sm">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                      <div className="flex-1 max-w-[85%]">
                        <div className="bg-gray-50 rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                          <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4 prose-li:text-gray-700 prose-li:my-1">
                            <ReactMarkdown
                              components={{
                                // Headings
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 mt-3 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1" {...props} />,
                                
                                // Paragraphs
                                p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-2" {...props} />,
                                
                                // Lists
                                ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                                
                                // Emphasis
                                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                                
                                // Code
                                code: ({node, inline, ...props}) => 
                                  inline ? (
                                    <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                  ) : (
                                    <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-2" {...props} />
                                  ),
                                
                                // Blockquote
                                blockquote: ({node, ...props}) => (
                                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-2" {...props} />
                                ),
                                
                                // Links
                                a: ({node, ...props}) => (
                                  <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        
                        {message.disclaimer && (
                          <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 rounded">
                            <p className="text-xs text-yellow-800">{message.disclaimer}</p>
                          </div>
                        )}
                        
                        {message.supports_actions && message.suggested_actions?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggested_actions.map((action, i) => (
                              <button
                                key={i}
                                onClick={() => handleAction(action.action)}
                                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all"
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
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Upload Buttons Section - Removed, now integrated into input area */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File Preview */}
            {filePreview && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-center gap-3">
                  {filePreview.type.startsWith('image/') ? (
                    <img src={filePreview.url} alt="Preview" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{getIntentLabel(filePreview.intent)}</div>
                    <div className="text-xs text-gray-500 truncate">{filePreview.name}</div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSend} className="flex gap-2 items-end">
                {/* Upload Menu Button */}
                <div className="relative" ref={uploadMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    disabled={loading}
                  >
                    <Plus className="h-5 w-5 text-gray-600" />
                  </button>

                  {/* Upload Options Dropdown */}
                  {showUploadMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                      <button
                        type="button"
                        onClick={() => handleUploadClick('symptom')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                      >
                        <Activity className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Upload Symptom</div>
                          <div className="text-xs text-gray-500">Photo of symptoms</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUploadClick('prescription')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left"
                      >
                        <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Upload Prescription</div>
                          <div className="text-xs text-gray-500">Prescription image</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUploadClick('report')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 transition-colors text-left"
                      >
                        <Upload className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Upload Report</div>
                          <div className="text-xs text-gray-500">Lab/medical report</div>
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
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || (!input.trim() && !selectedFile)} className="px-6">
                  <Send className="h-4 w-4" />
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
