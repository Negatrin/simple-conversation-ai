import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Plus, 
  Clock, 
  Briefcase, 
  Lightbulb, 
  BookOpen,
  Search,
  Settings,
  Heart,
  Bookmark
} from 'lucide-react';
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

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
      active 
        ? 'bg-sidebar-item-hover text-sidebar-text' 
        : 'text-sidebar-text-muted hover:bg-sidebar-item-hover hover:text-sidebar-text'
    }`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

interface ExploreCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

const ExploreCard: React.FC<ExploreCardProps> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-4 bg-sidebar-item rounded-xl text-left hover:bg-sidebar-item-hover transition-all duration-200 group"
  >
    <div className="flex items-start gap-3">
      <div className="text-sidebar-text-muted group-hover:text-sidebar-text transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-sidebar-text mb-1">{title}</h3>
        <p className="text-xs text-sidebar-text-muted line-clamp-2">{description}</p>
      </div>
    </div>
  </button>
);

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeChat, setActiveChat] = useState('new-chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initial greeting
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: 'Hello! 👋 I\'m your AI assistant. How can I help you today?',
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

  const handleExploreClick = (title: string) => {
    setInputValue(`Tell me about ${title.toLowerCase()}`);
  };

  const handleNewChat = () => {
    setMessages([{
      id: '1',
      text: 'Hello! 👋 I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    }]);
    setActiveChat('new-chat');
    setInputValue('');
  };

  return (
    <div className="flex h-screen bg-chat-background text-foreground">
      {/* Sidebar */}
      <div className="w-80 bg-chat-sidebar border-r border-border p-4 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-sidebar-text">Good morning,</h1>
              <h2 className="text-lg font-semibold text-sidebar-text">Alexa</h2>
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-sidebar-text-muted hover:text-sidebar-text">
                <Heart className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-sidebar-text-muted hover:text-sidebar-text">
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            className="w-full bg-white text-black hover:bg-gray-100 rounded-xl font-medium"
            onClick={handleNewChat}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-sidebar-text mb-3">Chat history</h3>
          <div className="space-y-1">
            <SidebarItem
              icon={<Clock className="w-4 h-4" />}
              label="How About US"
              active={activeChat === 'how-about-us'}
              onClick={() => setActiveChat('how-about-us')}
            />
            <SidebarItem
              icon={<MessageSquare className="w-4 h-4" />}
              label="Add me as Instagram"
              onClick={() => setActiveChat('instagram')}
            />
          </div>
        </div>

        {/* Explore More */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-sidebar-text mb-3">Explore more</h3>
          <div className="space-y-3">
            <ExploreCard
              icon={<Briefcase className="w-5 h-5" />}
              title="Business"
              description="Enhance operational efficiency through AI-driven strategic planning for optimal growth..."
              onClick={() => handleExploreClick('business strategies')}
            />
            <ExploreCard
              icon={<Lightbulb className="w-5 h-5" />}
              title="Writing"
              description="Enhance your writing with our advanced AI tools designed to improve clarity..."
              onClick={() => handleExploreClick('writing assistance')}
            />
          </div>
        </div>

        {/* Prompt Library */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-sidebar-text mb-3">Prompt library</h3>
          <div className="space-y-1">
            <SidebarItem
              icon={<Search className="w-4 h-4" />}
              label="SEO"
              onClick={() => handleExploreClick('SEO optimization')}
            />
            <SidebarItem
              icon={<BookOpen className="w-4 h-4" />}
              label="Marketing"
              onClick={() => handleExploreClick('marketing strategies')}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="mt-auto pt-4 border-t border-border">
          <SidebarItem
            icon={<Settings className="w-4 h-4" />}
            label="Settings"
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex items-start gap-3 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isUser 
                      ? 'bg-chat-user-bubble' 
                      : 'bg-chat-bot-bubble border border-border'
                  }`}>
                    {message.isUser ? (
                      <User className="w-4 h-4 text-chat-user-text" />
                    ) : (
                      <Bot className="w-4 h-4 text-chat-bot-text" />
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl max-w-lg ${
                    message.isUser
                      ? 'bg-chat-user-bubble text-chat-user-text ml-auto'
                      : 'bg-chat-bot-bubble text-chat-bot-text border border-border'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-2 opacity-70 ${
                      message.isUser ? 'text-chat-user-text' : 'text-chat-bot-text'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-chat-bot-bubble border border-border flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-chat-bot-text" />
                  </div>
                  <div className="p-4 rounded-2xl bg-chat-bot-bubble border border-border">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-chat-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-chat-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-chat-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                disabled={isLoading}
                className="flex-1 bg-chat-input-background border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-chat-accent focus:border-transparent"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-chat-accent hover:bg-opacity-90 text-white rounded-xl px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};