
import React, { createContext, useContext, useState } from 'react';
import { Conversation, Message, User } from '../types';
import { useAuth } from './AuthContext';
import { useConversations } from '@/hooks/chat/useConversations';
import { useMessages } from '@/hooks/chat/useMessages';
import { useUsers } from '@/hooks/chat/useUsers';
import { useMessageActions } from '@/hooks/chat/useMessageActions';
import { useConversationActions } from '@/hooks/chat/useConversationActions';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  users: User[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  loadingUsers: boolean;
  userTyping: { userId: string; username: string } | null;
  sendMessage: (content: string, contentType: 'text' | 'image' | 'file' | 'emoji', replyToMessageId?: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  markMessageAsSeen: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  createConversation: (participantIds: string[], name?: string, type?: 'direct' | 'group' | 'community') => Promise<string>;
  setUserTyping: (isTyping: boolean) => void;
  searchUsers: (query: string) => Promise<User[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  
  const { conversations, loadingConversations } = useConversations(user?.id);
  const { messages, loadingMessages, userTyping } = useMessages(currentConversation, user?.id);
  const { users, loadingUsers, searchUsers } = useUsers(user?.id);
  const { sendMessage, deleteMessage, editMessage, markMessageAsSeen, addReaction, removeReaction } = useMessageActions(user?.id);
  const { createConversation, handleUserTyping } = useConversationActions(user?.id);

  const handleSendMessage = async (
    content: string, 
    contentType: 'text' | 'image' | 'file' | 'emoji' = 'text',
    replyToMessageId?: string
  ) => {
    if (currentConversation) {
      await sendMessage(currentConversation.id, content, contentType, replyToMessageId);
    }
  };

  const handleSetUserTyping = (isTyping: boolean) => {
    if (currentConversation && user) {
      handleUserTyping(isTyping, currentConversation.id, user.username);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        users,
        loadingConversations,
        loadingMessages,
        loadingUsers,
        userTyping,
        sendMessage: handleSendMessage,
        setCurrentConversation,
        deleteMessage,
        editMessage,
        markMessageAsSeen,
        addReaction,
        removeReaction,
        createConversation,
        setUserTyping: handleSetUserTyping,
        searchUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};
