import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, User, Minimize2, 
  Maximize2, Loader2, Sparkles, RefreshCw 
} from 'lucide-react';

const ChatBot = ({ 
  apiEndpoint = 'http://localhost:8000/api/v1/chat/', // Zenith RAG API endpoint
  title = 'MLRIT Assistant',
  subtitle = 'Ask me anything about academics!',
  position = 'bottom-right', // 'bottom-right' or 'bottom-left'
  primaryColor = 'primary' // Tailwind color name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! 👋 I'm the MLRIT Academic Assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Send message to Python backend
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setConnectionError(false);

    try {
      // Build conversation history for Zenith RAG
      const conversationHistory = messages
        .slice(1) // Skip the initial welcome message
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
      
      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage.text
      });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.text,
          conversation_history: conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.answer || "I'm sorry, I couldn't process that request.",
        sources: data.sources || [],
        images: data.images || [],
        category: data.category,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setConnectionError(true);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting right now. Please make sure the chatbot server is running and try again.",
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        text: "Chat cleared! How can I help you?",
        timestamp: new Date()
      }
    ]);
  };

  // Quick action buttons for common queries
  const quickActions = [
    { label: 'Exam Schedule', query: 'What is my exam schedule?' },
    { label: 'Career Guidance', query: 'Give me career guidance' },
    { label: 'Placement Info', query: 'Tell me about placement opportunities' },
    { label: 'Help', query: 'What can you help me with?' },
  ];

  const handleQuickAction = (query) => {
    setInputValue(query);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  // Position classes
  const positionClasses = position === 'bottom-left' 
    ? 'left-4 sm:left-6' 
    : 'right-4 sm:right-6';

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50 group`}
          aria-label="Open chat"
        >
          <div className="relative">
            {/* Pulse animation */}
            <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-25"></div>
            
            {/* Main button */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 group-hover:from-primary-600 group-hover:to-primary-800">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Chat with us!
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
            isMinimized 
              ? 'w-72 sm:w-80 h-16' 
              : 'w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-8rem)] sm:h-[600px] max-h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className={isMinimized ? 'hidden sm:block' : ''}>
                <h3 className="font-semibold text-white text-sm sm:text-base">{title}</h3>
                {!isMinimized && (
                  <p className="text-primary-100 text-xs">{subtitle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={clearChat}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear chat"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-white" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-white" />
                )}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Chat Content - Hidden when minimized */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[90%] ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-primary-100' 
                          : message.isError 
                            ? 'bg-red-100' 
                            : 'bg-gradient-to-br from-primary-500 to-primary-700'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-primary-600" />
                        ) : (
                          <Bot className={`w-4 h-4 ${message.isError ? 'text-red-600' : 'text-white'}`} />
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`rounded-2xl px-4 py-2.5 break-words ${
                        message.type === 'user'
                          ? 'bg-primary-600 text-white rounded-tr-md'
                          : message.isError
                            ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-md'
                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-md'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-primary-200' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions - Only show at start */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                  <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.query)}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 p-3 sm:p-4 bg-white flex-shrink-0">
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows="1"
                      className="w-full px-4 py-2.5 bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm max-h-24"
                      style={{ minHeight: '42px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-primary-600 rounded-xl flex items-center justify-center text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Connection error banner */}
                {connectionError && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Make sure your Python chatbot server is running
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;
