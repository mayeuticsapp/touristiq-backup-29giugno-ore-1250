import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function TIQaiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Ciao! Sono TIQai, il tuo assistente virtuale per il turismo in Italia. Come posso aiutarti oggi?',
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Bot className="mr-2 text-blue-600" size={20} />
          TIQai - Assistente Turismo
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
        </div>
      </CardContent>
    </Card>
  );
}