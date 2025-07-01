// SISTEMA MESSAGGISTICA UNIVERSALE SCALABILE
// Funziona per qualsiasi IQCode dalla A alla Z, milioni di volte

export interface MessageSystem {
  sendDirectMessage(touristCode: string, partnerCode: string, message: string): Promise<{ success: boolean; conversationId: number }>;
  getPartnerConversations(partnerCode: string): Promise<Array<{ id: number; touristWord: string; lastMessage: string; unreadCount: number }>>;
  getMessages(conversationId: number): Promise<Array<{ id: number; content: string; sender: string; timestamp: Date }>>;
  markAsRead(conversationId: number, userCode: string): Promise<void>;
}

// Implementazione universale che funziona sempre
export class UniversalMessageSystem implements MessageSystem {
  private conversations = new Map<string, any>();
  private messages = new Map<number, any[]>();
  private conversationId = 1;
  private messageId = 1;

  // Estrae parola emozionale da qualsiasi IQCode
  private extractEmotionalWord(iqCode: string): string {
    const parts = iqCode.split('-');
    return parts[parts.length - 1] || iqCode; // Ultima parte
  }

  async sendDirectMessage(touristCode: string, partnerCode: string, message: string): Promise<{ success: boolean; conversationId: number }> {
    const conversationKey = `${touristCode}-${partnerCode}`;
    
    let conversation = this.conversations.get(conversationKey);
    
    if (!conversation) {
      // Crea nuova conversazione
      conversation = {
        id: this.conversationId++,
        touristCode,
        partnerCode,
        touristWord: this.extractEmotionalWord(touristCode),
        status: 'active',
        createdAt: new Date(),
        lastMessageAt: new Date()
      };
      this.conversations.set(conversationKey, conversation);
      this.messages.set(conversation.id, []);
    }

    // Aggiungi messaggio
    const newMessage = {
      id: this.messageId++,
      conversationId: conversation.id,
      content: message,
      sender: 'tourist',
      senderCode: touristCode,
      timestamp: new Date(),
      isRead: false
    };

    const conversationMessages = this.messages.get(conversation.id) || [];
    conversationMessages.push(newMessage);
    this.messages.set(conversation.id, conversationMessages);

    // Aggiorna timestamp conversazione
    conversation.lastMessageAt = new Date();
    this.conversations.set(conversationKey, conversation);

    return { success: true, conversationId: conversation.id };
  }

  async getPartnerConversations(partnerCode: string): Promise<Array<{ id: number; touristWord: string; lastMessage: string; unreadCount: number }>> {
    const partnerConversations: any[] = [];

    for (const [key, conversation] of this.conversations) {
      if (conversation.partnerCode === partnerCode) {
        const messages = this.messages.get(conversation.id) || [];
        const unreadCount = messages.filter(m => m.sender === 'tourist' && !m.isRead).length;
        const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : 'Nessun messaggio';

        partnerConversations.push({
          id: conversation.id,
          touristWord: conversation.touristWord,
          lastMessage,
          unreadCount
        });
      }
    }

    return partnerConversations.sort((a, b) => b.id - a.id);
  }

  async getMessages(conversationId: number): Promise<Array<{ id: number; content: string; sender: string; timestamp: Date }>> {
    const messages = this.messages.get(conversationId) || [];
    return messages.map(m => ({
      id: m.id,
      content: m.content,
      sender: m.sender,
      timestamp: m.timestamp
    }));
  }

  async markAsRead(conversationId: number, userCode: string): Promise<void> {
    const messages = this.messages.get(conversationId) || [];
    
    // Trova la conversazione per determinare il ruolo
    let userRole = 'tourist';
    for (const conversation of this.conversations.values()) {
      if (conversation.id === conversationId) {
        if (conversation.partnerCode === userCode) {
          userRole = 'partner';
        }
        break;
      }
    }

    // Segna come letti i messaggi dell'altro utente
    messages.forEach(message => {
      if (userRole === 'partner' && message.sender === 'tourist') {
        message.isRead = true;
      } else if (userRole === 'tourist' && message.sender === 'partner') {
        message.isRead = true;
      }
    });

    this.messages.set(conversationId, messages);
  }
}

// Sistema singleton universale
export const messageSystem = new UniversalMessageSystem();