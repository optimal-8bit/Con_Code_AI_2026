import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { handleApiError } from '@/lib/utils';
import { MessageSquare, Send, Bot, User } from 'lucide-react';

export default function SmartChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat({
        question: input,
        chat_history: messages,
        session_id: sessionId,
        context_type: 'general',
      });

      setSessionId(response.session_id);
      const assistantMessage = { role: 'assistant', content: response.answer };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.follow_up_questions && response.follow_up_questions.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: 'Suggested questions:',
            suggestions: response.follow_up_questions,
          },
        ]);
      }
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

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Health Chat</h2>
            <p className="text-gray-600">Ask me anything about your health</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Start a conversation by asking a health-related question</p>
                  <div className="mt-6 space-y-2">
                    <p className="text-sm text-gray-500">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        'What are the symptoms of diabetes?',
                        'How can I improve my sleep?',
                        'What foods are good for heart health?',
                      ].map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(suggestion)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message, idx) => (
                <div key={idx}>
                  {message.role === 'user' && (
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  )}

                  {message.role === 'system' && message.suggestions && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Bot className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">{message.content}</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50"
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
                  <div className="p-2 bg-purple-100 rounded-full">
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

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a health question..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !input.trim()}>
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
