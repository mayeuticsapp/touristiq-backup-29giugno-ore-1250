import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles, Heart, MapPin, Sunset, Waves } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function TIQaiChat() {
  const { i18n } = useTranslation();
  
  // Messaggi di benvenuto multilingue
  const welcomeMessages = {
    it: '👋 Ciao! Sono TIQai, il tuo assistente turistico AI. Dimmi cosa stai cercando e ti aiuterò a scoprire i migliori partner e offerte della zona per un\'esperienza autentica!',
    en: '👋 Hi! I am TIQai, your AI tourism assistant. Tell me what you are looking for and I will help you discover the best partners and offers in the area for an authentic experience!',
    es: '👋 ¡Hola! Soy TIQai, tu asistente turístico AI. ¡Dime qué buscas y te ayudaré a descubrir los mejores socios y ofertas de la zona para una experiencia auténtica!',
    de: '👋 Hallo! Ich bin TIQai, dein AI-Tourismusassistent. Sag mir, was du suchst und ich helfe dir die besten Partner und Angebote in der Gegend für ein authentisches Erlebnis zu entdecken!',
    fr: '👋 Salut ! Je suis TIQai, votre assistant touristique IA. Dites-moi ce que vous cherchez et je vous aiderai à découvrir les meilleurs partenaires et offres de la région pour une expérience authentique !'
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: welcomeMessages[i18n.language as keyof typeof welcomeMessages] || welcomeMessages.it,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input all'apertura della chat
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Aggiorna il messaggio di benvenuto quando cambia la lingua
  useEffect(() => {
    setMessages(prev => {
      const updatedMessages = [...prev];
      if (updatedMessages[0]?.id === '1') {
        updatedMessages[0] = {
          ...updatedMessages[0],
          content: welcomeMessages[i18n.language as keyof typeof welcomeMessages] || welcomeMessages.it
        };
      }
      return updatedMessages;
    });
  }, [i18n.language]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/chat/tiqai", {
        message: inputMessage.trim(),
        language: i18n.language
      });
      
      const data = await response.json();
      
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Errore chat:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative overflow-hidden">
      {/* Header stile centro assistenza */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {/* Avatar umano professionale */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                <span className="text-xl sm:text-2xl">👨‍💼</span>
              </div>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">TIQai</h1>
            <p className="text-xs sm:text-sm text-emerald-100">Assistente Turistico AI</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-emerald-100">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm">Online</span>
        </div>
      </div>
      
      {/* Area messaggi stile WhatsApp */}
      <div className="flex-1 flex flex-col min-h-0 p-2 sm:p-4 bg-gray-50">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 animate-slide-up ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Avatar (solo per AI, mobile ottimizzato) */}
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0 mb-1">
                    <span className="text-sm">👨‍💼</span>
                  </div>
                )}
                
                {/* Bolla messaggio stile WhatsApp */}
                <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${
                  message.type === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className={`flex items-center justify-end mt-1 space-x-1 ${
                      message.type === 'user' ? 'text-emerald-100' : 'text-gray-400'
                    }`}>
                      <span className="text-xs">
                        {message.timestamp.toLocaleTimeString('it-IT', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.type === 'user' && (
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-emerald-200 rounded-full"></div>
                          <div className="w-1 h-1 bg-emerald-200 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicatore di scrittura */}
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-1">
                  <span className="text-sm">👨‍💼</span>
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input area stile WhatsApp */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-2 sm:px-4 sm:py-3">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              disabled={isLoading}
              maxLength={500}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-gray-500"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className={`rounded-full w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200 ${
                inputMessage.trim() 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-100' 
                  : 'bg-gray-300 text-gray-500 scale-90'
              }`}
            >
              <Send size={16} className={inputMessage.trim() ? 'text-white' : 'text-gray-500'} />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            TIQai • Assistente Turistico AI
          </p>
        </div>
      </div>
    </div>
  );
}