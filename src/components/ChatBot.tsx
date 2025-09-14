import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyCmm-f6kmbzSBqFMeqWLgvPTaAEewzZcLk';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

// Predefined FAQs
const FAQ_RESPONSES: Record<string, string> = {
  'hello': 'Hello! 👋 I\'m your AI assistant. How can I help you today?',
  'hi': 'Hi there! 👋 I\'m here to help. What can I do for you?',
  'how are you': 'I\'m doing great! Thanks for asking. How can I assist you today?',
  'what can you do': 'I can help answer your questions, have conversations, and provide information on various topics. Just ask me anything!',
  'pricing': 'For pricing information, please contact our sales team or check our pricing page.',
  'support': 'For technical support, you can reach our support team at support@company.com or through our help center.',
  'hours': 'Our customer service hours are Monday-Friday, 9 AM to 6 PM EST.',
  'contact': 'You can contact us at info@company.com or call us at (555) 123-4567.',
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initial greeting
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: 'Hello! 👋 Welcome to our AI chatbot. I\'m here to help answer your questions and have a conversation with you. Feel free to ask me anything!',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for FAQ responses
  const getFAQResponse = (input: string): string | null => {
    const normalizedInput = input.toLowerCase().trim();
    
    for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
      if (normalizedInput.includes(key)) {
        return response;
      }
    }
    return null;
  };

  // Call Gemini API
  const callGeminiAPI = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful AI assistant. Please respond in a friendly, conversational manner. Keep responses concise and helpful. User message: ${userMessage}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Check for FAQ first
      const faqResponse = getFAQResponse(inputValue);
      let botResponseText: string;

      if (faqResponse) {
        botResponseText = faqResponse;
        // Add a small delay to simulate thinking
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Use Gemini API for more complex queries
        botResponseText = await callGeminiAPI(inputValue);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Sorry, I encountered an error. Please try again.',
        variant: 'destructive',
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-chat-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-border shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex items-start gap-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.isUser 
                  ? 'bg-chat-user-bubble' 
                  : 'bg-white border border-border'
              }`}>
                {message.isUser ? (
                  <User className="w-4 h-4 text-chat-user-text" />
                ) : (
                  <Bot className="w-4 h-4 text-chat-bot-text" />
                )}
              </div>
              <Card className={`p-3 shadow-sm ${
                message.isUser
                  ? 'bg-chat-user-bubble text-chat-user-text border-0'
                  : 'bg-chat-bot-bubble text-chat-bot-text'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 opacity-70 ${
                  message.isUser ? 'text-chat-user-text' : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </Card>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-chat-bot-text" />
              </div>
              <Card className="p-3 bg-chat-bot-bubble">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-chat-input-background border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Powered by Gemini 2.0 Flash • Press Enter to send
        </p>
      </div>
    </div>
  );
};