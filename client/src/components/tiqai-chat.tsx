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
    it: '🌅 Ciao, viaggiatore! Sono TIQai, il tuo genius loci digitale. Sussurrami i tuoi desideri di scoperta e ti guiderò verso tesori nascosti che solo il cuore autentico dell\'Italia conosce...',
    en: '🌅 Hello, traveler! I am TIQai, your digital genius loci. Whisper your desires for discovery and I will guide you to hidden treasures that only the authentic heart of Italy knows...',
    es: '🌅 ¡Hola, viajero! Soy TIQai, tu genius loci digital. Susúrrame tus deseos de descubrimiento y te guiaré hacia tesoros ocultos que solo el corazón auténtico de Italia conoce...',
    de: '🌅 Hallo, Reisender! Ich bin TIQai, dein digitaler Genius Loci. Flüstere mir deine Entdeckungswünsche zu und ich führe dich zu verborgenen Schätzen, die nur das authentische Herz Italiens kennt...',
    fr: '🌅 Bonjour, voyageur ! Je suis TIQai, votre genius loci numérique. Murmurez-moi vos désirs de découverte et je vous guiderai vers des trésors cachés que seul le cœur authentique de l\'Italie connaît...'
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Sfondo decorativo moderno */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 text-blue-300 animate-pulse">
          <Sparkles size={40} />
        </div>
        <div className="absolute bottom-10 left-10 text-orange-300 animate-bounce">
          <MapPin size={36} />
        </div>
        <div className="absolute top-1/3 left-1/4 text-purple-200 animate-bounce-soft">
          <Heart size={24} />
        </div>
      </div>
      
      {/* Header moderno */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold">TIQai</h1>
            <p className="text-sm text-blue-100">Genius Loci d'Italia</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-blue-100">
          <Bot size={18} />
          <span className="text-sm">AI Online</span>
        </div>
      </div>
      
      {/* Area messaggi */}
      <div className="flex-1 flex flex-col min-h-0 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-6 pb-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex items-start gap-4 animate-slide-up ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-orange-500 to-red-600'
                }`}>
                  {message.type === 'user' ? (
                    <User size={18} className="text-white" />
                  ) : (
                    <Sparkles size={18} className="text-white" />
                  )}
                </div>
                
                {/* Bolla messaggio */}
                <div className={`max-w-[75%] ${
                  message.type === 'user' ? 'items-end' : 'items-start'
                } flex flex-col`}>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <span className={`text-xs mt-1 px-2 ${
                    message.type === 'user' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('it-IT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Indicatore caricamento */}
            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles size={18} className="text-white animate-pulse" />
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">TIQai sta scrivendo...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input area */}
        <div className="mt-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi il tuo messaggio..."
              disabled={isLoading}
              maxLength={500}
              className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl w-12 h-12 shadow-lg"
            >
              <Send size={18} className="text-white" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Powered by TIQai - Il tuo assistente di viaggio intelligente
          </p>
        </div>
      </div>
    </div>
  );
}