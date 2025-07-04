
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function TIQaiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Carica messaggi salvati e pulisce quelli vecchi
  useEffect(() => {
    loadSavedMessages();
  }, []);

  const loadSavedMessages = () => {
    try {
      const savedMessages = localStorage.getItem('tiqai-chat-messages');
      const currentTime = new Date().getTime();
      
      if (savedMessages) {
        const parsedMessages: Message[] = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Filtra messaggi più vecchi di 24 ore
        const validMessages = parsedMessages.filter(msg => {
          const messageTime = msg.timestamp.getTime();
          const timeDiff = currentTime - messageTime;
          const hoursOld = timeDiff / (1000 * 60 * 60);
          return hoursOld < 24;
        });
        
        // Se ci sono messaggi validi, caricali. Altrimenti inizia con messaggio di benvenuto
        if (validMessages.length > 0) {
          setMessages(validMessages);
        } else {
          initializeWelcomeMessage();
        }
        
        // Salva messaggi puliti se sono cambiati
        if (validMessages.length !== parsedMessages.length) {
          localStorage.setItem('tiqai-chat-messages', JSON.stringify(validMessages));
        }
      } else {
        initializeWelcomeMessage();
      }
    } catch (error) {
      console.error("Errore caricamento messaggi:", error);
      initializeWelcomeMessage();
    }
  };

  const initializeWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'ai',
      content: 'Ciao! Sono TIQai, il tuo assistente virtuale per il turismo in Italia. Come posso aiutarti oggi?',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('tiqai-chat-messages', JSON.stringify([welcomeMessage]));
  };

  // Salva messaggi ad ogni aggiornamento
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('tiqai-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        message: inputMessage.trim()
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

  const clearChat = () => {
    localStorage.removeItem('tiqai-chat-messages');
    initializeWelcomeMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Bot className="mr-2 text-blue-600" size={20} />
            TIQai - Assistente Turismo
          </div>
          <Button
            onClick={clearChat}
            size="sm"
            variant="ghost"
            className="text-gray-500 hover:text-red-600"
            title="Cancella cronologia chat"
          >
            <Trash2 size={16} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-green-100' 
                    : 'bg-blue-100'
                }`}>
                  {message.type === 'user' ? (
                    <User size={16} className="text-green-600" />
                  ) : (
                    <Bot size={16} className="text-blue-600" />
                  )}
                </div>
                
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-green-500 text-white ml-auto'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <span className={`text-xs mt-1 block ${
                    message.type === 'user' ? 'text-green-100' : 'text-gray-500'
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
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-blue-600" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chiedi a TIQai qualsiasi cosa sul turismo..."
              disabled={isLoading}
              maxLength={500}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send size={16} />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Messaggi più vecchi di 24 ore vengono eliminati automaticamente
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
