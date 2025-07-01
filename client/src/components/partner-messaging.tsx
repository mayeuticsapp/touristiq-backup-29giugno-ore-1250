import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Eye, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Conversation {
  id: string;
  touristCode: string;
  touristName: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  isReadByPartner: boolean;
  status?: string;
  requestMessage?: string;
}

interface Message {
  id: string;
  content: string;
  senderRole: "tourist" | "partner";
  createdAt: string;
  isRead: boolean;
}

export function PartnerMessaging() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  // Query per le conversazioni del partner
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/messages/conversations"],
    refetchInterval: 5000, // Aggiorna ogni 5 secondi
  });

  // Query per i messaggi della conversazione selezionata
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages/conversation", selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: 3000, // Aggiorna ogni 3 secondi
  });

  // Mutation per inviare un messaggio
  const sendMessageMutation = useMutation({
    mutationFn: (data: { conversationId: string; content: string }) =>
      apiRequest("POST", "/api/messages/send", data),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  // Mutation per segnare messaggi come letti
  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: string) =>
      apiRequest("POST", `/api/messages/mark-read/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  // Mutation per accettare richiesta di chat
  const acceptRequestMutation = useMutation({
    mutationFn: (conversationId: string) =>
      apiRequest("POST", `/api/messages/accept-request/${conversationId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  // Mutation per rifiutare richiesta di chat
  const rejectRequestMutation = useMutation({
    mutationFn: (conversationId: string) =>
      apiRequest("POST", `/api/messages/reject-request/${conversationId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setSelectedConversation(null);
    },
  });

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    markAsReadMutation.mutate(conversationId);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        content: newMessage.trim(),
      });
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Caricamento conversazioni...</p>
      </div>
    );
  }

  const conversationsList = conversations?.conversations || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Lista conversazioni */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversazioni ({conversationsList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {conversationsList.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="mx-auto h-8 w-8 mb-2 text-gray-400" />
              <p>Nessuna conversazione</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {conversationsList.map((conversation: any) => (
                <div
                  key={conversation.conversation.id}
                  className={`p-3 border-b ${
                    conversation.conversation.status === 'pending' ? "bg-yellow-50" : "hover:bg-gray-50"
                  } ${
                    selectedConversation === conversation.conversation.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm truncate">
                          {conversation.conversation.touristName || conversation.conversation.touristCode}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        {conversation.conversation.status === 'pending' && (
                          <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                            Richiesta
                          </Badge>
                        )}
                      </div>
                      
                      {conversation.conversation.status === 'pending' ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600">
                            {conversation.conversation.requestMessage || "Vuole chattare con te"}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptRequestMutation.mutate(conversation.conversation.id);
                              }}
                              disabled={acceptRequestMutation.isPending}
                              className="text-xs px-2 py-1 h-6"
                            >
                              ✓ Accetta
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectRequestMutation.mutate(conversation.conversation.id);
                              }}
                              disabled={rejectRequestMutation.isPending}
                              className="text-xs px-2 py-1 h-6"
                            >
                              ✗ Rifiuta
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleConversationSelect(conversation.conversation.id)}
                          className="cursor-pointer"
                        >
                          <p className="text-xs text-gray-600 truncate">
                            Ultima attività: {new Date(conversation.conversation.lastMessageAt).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedConversation ? (
              <>
                <MessageCircle className="w-5 h-5" />
                Chat con {conversationsList.find((c: Conversation) => c.id === selectedConversation)?.touristName || "Turista"}
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                Seleziona una conversazione
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedConversation ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Seleziona una conversazione per iniziare a chattare</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Area messaggi */}
              <div className="border rounded-lg p-4 h-[350px] overflow-y-auto bg-gray-50">
                {isLoadingMessages ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Caricamento messaggi...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages?.messages?.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderRole === "partner" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.senderRole === "partner"
                              ? "bg-blue-500 text-white"
                              : "bg-white border"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className={`text-xs ${
                              message.senderRole === "partner" ? "text-blue-100" : "text-gray-500"
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {message.senderRole === "partner" && (
                              <Eye className={`w-3 h-3 ${
                                message.isRead ? "text-blue-200" : "text-blue-300"
                              }`} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form invio messaggio */}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrivi il tuo messaggio..."
                  rows={2}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}