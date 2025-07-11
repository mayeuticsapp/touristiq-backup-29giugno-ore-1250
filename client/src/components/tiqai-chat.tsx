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

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <Card className="h-[500px] flex flex-col relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 border-0 shadow-2xl">
      {/* Sfondo calabrese animato */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 text-orange-300 animate-pulse">
          <Sunset size={32} />
        </div>
        <div className="absolute bottom-4 left-4 text-blue-300 animate-bounce">
          <Waves size={28} />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-200">
          <Heart size={60} className="animate-pulse" />
        </div>
      </div>
      
      <CardHeader className="pb-3 relative z-10 bg-gradient-to-r from-orange-400 via-amber-400 to-red-400 text-white">
        <CardTitle className="flex items-center text-lg font-bold">
          <div className="relative mr-3">
            <Sparkles className="text-yellow-200 animate-spin-slow" size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
          TIQai - Genius Loci d'Italia
          <MapPin className="ml-2 text-red-200 animate-bounce" size={18} />
        </CardTitle>
        <p className="text-orange-100 text-xs italic mt-1">
          "L'anima autentica d'Italia che sussurra segreti"
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 relative z-10 min-h-0">
        <ScrollArea className="flex-1 px-4 bg-gradient-to-b from-transparent to-orange-25" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-emerald-200' 
                    : 'bg-gradient-to-br from-orange-400 to-red-500 border-2 border-orange-200'
                }`}>
                  {message.type === 'user' ? (
                    <User size={18} className="text-white" />
                  ) : (
                    <Sparkles size={18} className="text-white animate-pulse" />
                  )}
                </div>
                
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg transform transition-all hover:scale-105 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ml-auto'
                    : 'bg-gradient-to-br from-white to-orange-50 text-gray-800 border border-orange-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                  <span className={`text-xs mt-2 block font-medium ${
                    message.type === 'user' ? 'text-emerald-100' : 'text-orange-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('it-IT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 border-2 border-orange-200 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles size={18} className="text-white animate-pulse" />
                </div>
                <div className="bg-gradient-to-br from-white to-orange-50 border border-orange-200 p-4 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span className="text-sm text-orange-600 italic">TIQai sta sussurrando la risposta...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="✨ Sussurra i tuoi desideri di scoperta italiana..."
              disabled={isLoading}
              maxLength={500}
              className="border-orange-200 focus:border-orange-400 bg-white/80 backdrop-blur-sm placeholder:text-orange-400 placeholder:italic"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 shadow-lg transform transition-all hover:scale-110"
            >
              <Send size={16} className="text-white" />
            </Button>
          </div>
          <p className="text-xs text-orange-500 mt-2 italic text-center">
            💫 Ogni domanda è un invito alla meraviglia italiana
          </p>
        </div>
      </CardContent>
    </Card>
  );
}