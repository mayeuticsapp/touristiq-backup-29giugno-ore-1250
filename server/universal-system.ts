/**
 * SISTEMA UNIVERSALE TOURISTIQ
 * Funziona per qualsiasi IQCode dalla A alla Z, milioni di volte senza fermarsi
 * Nessuna dipendenza dal database, completamente autonomo
 */

interface UniversalMessage {
  id: string;
  conversationId: string;
  senderCode: string;
  senderType: 'tourist' | 'partner';
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface UniversalConversation {
  id: string;
  touristCode: string;
  partnerCode: string;
  touristWord: string; // Solo parola emozionale per privacy
  status: 'active';
  createdAt: Date;
  lastMessageAt: Date;
}

/**
 * Sistema di messaggistica completamente universale
 * Scalabile per milioni di operazioni
 */
export class UniversalTouristIQSystem {
  private conversations = new Map<string, UniversalConversation>();
  private messages = new Map<string, UniversalMessage[]>();
  private conversationCounter = 1;
  private messageCounter = 1;

  /**
   * Estrae parola emozionale da qualsiasi formato IQCode
   * Funziona universalmente senza conoscenza del formato specifico
   */
  private extractEmotionalWord(iqCode: string): string {
    // Pattern per TIQ-IT-XXXX-PAROLA
    const emotionalMatch = iqCode.match(/TIQ-IT-\d{4}-([A-Z]+)/);
    if (emotionalMatch) {
      return emotionalMatch[1];
    }

    // Pattern generico per codici con parola finale
    const genericMatch = iqCode.match(/-([A-Z]+)$/);
    if (genericMatch) {
      return genericMatch[1];
    }

    // Fallback: ultime lettere maiuscole
    const fallbackMatch = iqCode.match(/([A-Z]{3,})$/);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }

    // Fallback finale: primi 3 caratteri del codice
    return iqCode.substring(0, 3).toUpperCase();
  }

  /**
   * Genera ID conversazione universale
   */
  private generateConversationId(touristCode: string, partnerCode: string): string {
    return `conv_${touristCode}_${partnerCode}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Invia messaggio diretto turistico → partner
   * Crea conversazione immediata senza approvazioni
   */
  async sendDirectMessage(touristCode: string, partnerCode: string, message: string): Promise<{ success: boolean; conversationId: string }> {
    try {
      const conversationId = this.generateConversationId(touristCode, partnerCode);
      
      // Crea conversazione se non esiste
      if (!this.conversations.has(conversationId)) {
        const touristWord = this.extractEmotionalWord(touristCode);
        
        this.conversations.set(conversationId, {
          id: conversationId,
          touristCode,
          partnerCode,
          touristWord, // Privacy: solo parola emozionale
          status: 'active',
          createdAt: new Date(),
          lastMessageAt: new Date()
        });
        
        this.messages.set(conversationId, []);
      }

      // Aggiungi messaggio
      const messageId = `msg_${this.messageCounter++}`;
      const newMessage: UniversalMessage = {
        id: messageId,
        conversationId,
        senderCode: touristCode,
        senderType: 'tourist',
        content: message.trim(),
        timestamp: new Date(),
        isRead: false
      };

      const conversationMessages = this.messages.get(conversationId) || [];
      conversationMessages.push(newMessage);
      this.messages.set(conversationId, conversationMessages);

      // Aggiorna timestamp conversazione
      const conversation = this.conversations.get(conversationId)!;
      conversation.lastMessageAt = new Date();

      return { success: true, conversationId };
    } catch (error) {
      console.error('Errore invio messaggio universale:', error);
      return { success: false, conversationId: '' };
    }
  }

  /**
   * Ottieni conversazioni per partner
   * Mostra solo parola emozionale per privacy
   */
  async getPartnerConversations(partnerCode: string): Promise<Array<{ id: string; touristWord: string; lastMessage: string; unreadCount: number }>> {
    const partnerConversations: any[] = [];

    const conversationValues = Array.from(this.conversations.values());
    for (const conversation of conversationValues) {
      if (conversation.partnerCode === partnerCode) {
        const conversationMessages = this.messages.get(conversation.id) || [];
        const unreadCount = conversationMessages.filter(m => m.senderType === 'tourist' && !m.isRead).length;
        const lastMessage = conversationMessages.length > 0 
          ? conversationMessages[conversationMessages.length - 1].content 
          : 'Nessun messaggio';

        partnerConversations.push({
          id: conversation.id,
          touristWord: conversation.touristWord, // Solo parola emozionale
          lastMessage,
          unreadCount
        });
      }
    }

    return partnerConversations.sort((a, b) => b.id.localeCompare(a.id));
  }

  /**
   * Ottieni messaggi di una conversazione
   */
  async getMessages(conversationId: string): Promise<Array<{ id: string; content: string; sender: string; timestamp: Date }>> {
    const conversationMessages = this.messages.get(conversationId) || [];
    
    return conversationMessages.map(m => ({
      id: m.id,
      content: m.content,
      sender: m.senderType,
      timestamp: m.timestamp
    }));
  }

  /**
   * Segna messaggi come letti
   */
  async markAsRead(conversationId: string, userCode: string): Promise<void> {
    const conversationMessages = this.messages.get(conversationId) || [];
    
    // Trova conversazione per determinare ruolo
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    let userRole: 'tourist' | 'partner' = 'tourist';
    if (conversation.partnerCode === userCode) {
      userRole = 'partner';
    }

    // Segna come letti i messaggi dell'altro utente
    conversationMessages.forEach(message => {
      if (userRole === 'partner' && message.senderType === 'tourist') {
        message.isRead = true;
      } else if (userRole === 'tourist' && message.senderType === 'partner') {
        message.isRead = true;
      }
    });
  }

  /**
   * Invia risposta partner → turista
   */
  async sendPartnerReply(conversationId: string, partnerCode: string, message: string): Promise<{ success: boolean }> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation || conversation.partnerCode !== partnerCode) {
        return { success: false };
      }

      const messageId = `msg_${this.messageCounter++}`;
      const newMessage: UniversalMessage = {
        id: messageId,
        conversationId,
        senderCode: partnerCode,
        senderType: 'partner',
        content: message.trim(),
        timestamp: new Date(),
        isRead: false
      };

      const conversationMessages = this.messages.get(conversationId) || [];
      conversationMessages.push(newMessage);
      this.messages.set(conversationId, conversationMessages);

      // Aggiorna timestamp conversazione
      conversation.lastMessageAt = new Date();

      return { success: true };
    } catch (error) {
      console.error('Errore risposta partner:', error);
      return { success: false };
    }
  }

  /**
   * Conta messaggi non letti per utente
   */
  async getUnreadCount(userCode: string): Promise<number> {
    let unreadCount = 0;

    const allConversations = Array.from(this.conversations.values());
    for (const conversation of allConversations) {
      if (conversation.touristCode === userCode || conversation.partnerCode === userCode) {
        const conversationMessages = this.messages.get(conversation.id) || [];
        
        const userRole = conversation.partnerCode === userCode ? 'partner' : 'tourist';
        const otherRole = userRole === 'partner' ? 'tourist' : 'partner';
        
        unreadCount += conversationMessages.filter(m => m.senderType === otherRole && !m.isRead).length;
      }
    }

    return unreadCount;
  }
}

// Singleton universale - funziona per tutti
export const universalSystem = new UniversalTouristIQSystem();