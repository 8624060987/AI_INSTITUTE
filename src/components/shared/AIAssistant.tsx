'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Mic, Volume2, Sparkles, Brain, Award, GraduationCap } from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi, I'm AI Assistant! 👋 How can I help you today? I can guide you on courses, placement info, career roadmaps, or explain complex AI concepts!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { text: 'Suggest Courses', icon: GraduationCap },
    { text: 'Career Roadmaps', icon: Brain },
    { text: 'Placement Stats', icon: Award },
    { text: 'Explain Transformers', icon: Sparkles },
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          // Pass the last 10 messages for context, excluding the welcome message
          history: messages.filter(m => m.id !== 'welcome').slice(-10)
        }),
      });

      const data = await response.json();

      let replyText = "Sorry, I couldn't process that.";
      if (response.ok && data.reply) {
        replyText = data.reply;
      } else if (data.error) {
        replyText = `Error: ${data.error}. Please ensure your API key is configured.`;
      }

      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat API Error:', error);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-ai-error`,
        sender: 'ai',
        text: 'Network error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceMode = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      // Simulate listening and typing a voice response
      setTimeout(() => {
        setIsVoiceActive(false);
        handleSendMessage('Suggest Courses');
      }, 3000);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-violet-500 hover:from-blue-700 hover:to-violet-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all hover:scale-105 relative animate-bounce"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-96 h-[500px] rounded-3xl bg-white dark:bg-[#0f1420] border border-[#e2e8f0] dark:border-[#1e293b] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[10px] text-blue-100 font-medium">Online & Ready to Help</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/15 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Quick Prompts Panel */}
          <div className="bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5 border-b border-slate-100 dark:border-slate-900 flex gap-2 overflow-x-auto scrollbar-none">
            {quickPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.text}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-[#080d1a] border border-[#e2e8f0] dark:border-[#1e293b] text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full text-[10px] font-semibold hover:border-blue-500 hover:text-blue-500 transition-all cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                  {prompt.text}
                </button>
              );
            })}
          </div>

          {/* Message List Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fdfeff] dark:bg-[#080d1a]/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-[#0f1420] text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800/40 rounded-bl-none'
                  }`}
                >
                  {/* Handle newlines in markdown/replies */}
                  <div className="whitespace-pre-line">
                    {msg.text}
                  </div>
                  <span className={`text-[8px] mt-1.5 block text-right ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-[#0f1420] text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Controls */}
          <div className="p-3 bg-white dark:bg-[#0f1420] border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
            <button
              onClick={toggleVoiceMode}
              className={`p-2 rounded-xl transition-all ${
                isVoiceActive
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Voice chat support (24x7)"
            >
              {isVoiceActive ? <Volume2 className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
            </button>
            <input
              type="text"
              placeholder={isVoiceActive ? "Listening..." : "Ask me anything..."}
              value={inputMessage}
              disabled={isVoiceActive}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
              className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500 dark:text-white"
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isVoiceActive || isLoading}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
