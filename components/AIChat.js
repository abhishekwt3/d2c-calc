// components/AIChat.js
'use client';

import { useState, useRef, useEffect } from 'react';

export default function AIChat({ metrics }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initial greeting when chat opens for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm your D2C metrics advisor. Ask me anything about your numbers:\n\n• \"What is Safe Max CPA?\"\n• \"What should my Cost Per Order be?\"\n• \"How much can I scale?\"\n• \"What if I increase ad spend to ₹15L?\""
        }
      ]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          messages: newMessages
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.' }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      ]);
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

  // Suggested questions
  const suggestedQuestions = [
    "What is Safe Max CPA?",
    "What should my Cost Per Order be?",
    "How much can I scale?",
    "Why is my EBITDA negative?",
    "What if I increase ad spend to ₹15L?",
    "What's a good MER?"
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
      <div 
        className={`w-full transition-all duration-300 ease-in-out ${
          isOpen ? 'max-w-xl' : 'max-w-xl'
        }`}
      >
        {/* Chat Container */}
        <div 
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            backgroundClip: 'padding-box',
            position: 'relative'
          }}
        >
          {/* Gradient border effect */}
          <div 
            className="absolute inset-0 rounded-2xl -z-10"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #a855f7, #ec4899)',
              margin: '-2px'
            }}
          />

          {/* Messages Panel - Shows when open */}
          {isOpen && (
            <div
              className="overflow-y-auto"
              style={{ 
                maxHeight: '500px',
                background: 'var(--bg)'
              }}
            >
              {/* Header */}
              <div
                className="sticky top-0 z-10 p-4 flex justify-between items-center"
                style={{ 
                  background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                  color: '#ffffff'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <div>
                    <h3 className="font-bold text-sm">AI Metrics Advisor</h3>
                    <p className="text-xs opacity-90">Ask anything about your business</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xl hover:opacity-70 transition"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'rounded-br-none'
                          : 'rounded-bl-none'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { 
                              background: 'linear-gradient(135deg, #3b82f6, #a855f7)', 
                              color: '#ffffff' 
                            }
                          : { 
                              background: 'var(--surface)', 
                              color: 'var(--text)', 
                              border: '1px solid var(--border)' 
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className="p-3 rounded-xl text-sm"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions - Only show if no conversation yet */}
              {messages.length <= 1 && (
                <div
                  className="px-4 pb-4 space-y-2"
                  style={{ background: 'var(--bg)' }}
                >
                  <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
                    Try asking:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(q)}
                        className="text-xs px-3 py-2 rounded-lg transition hover:opacity-80 text-left"
                        style={{ 
                          background: 'var(--surface)', 
                          color: 'var(--text)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Bar - Always visible at bottom */}
          <div
            className="p-3 md:p-4"
            style={{ 
              background: 'var(--bg)',
              borderTop: isOpen ? '1px solid var(--border)' : 'none'
            }}
          >
            <div className="flex items-center gap-2 md:gap-3">
              {/* Icon / Toggle Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex-shrink-0 text-2xl hover:scale-110 transition-transform"
                title={isOpen ? 'Close chat' : 'Open chat'}
              >
                💬
              </button>

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onClick={() => !isOpen && setIsOpen(true)}
                placeholder="Ask AI about my business metrics, strategies, or scenarios..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm md:text-base focus:outline-none disabled:opacity-50"
                style={{ color: 'var(--text)' }}
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                  color: '#ffffff'
                }}
              >
                {isLoading ? 'Asking...' : 'Ask AI'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}