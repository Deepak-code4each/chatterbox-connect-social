
import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Conversation } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationHeader } from './conversation/ConversationHeader';
import { ConversationSearch } from './conversation/ConversationSearch';
import { ConversationTabs } from './conversation/ConversationTabs';
import { ConversationList } from './conversation/ConversationList';

export const ConversationSidebar: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation, 
    loadingConversations,
    users,
    createConversation
  } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');

  const filteredConversations = conversations.filter(conv => {
    // First filter by tab type
    if (activeTab === 'chats' && conv.type !== 'direct') {
      return false;
    }
    if (activeTab === 'groups' && conv.type === 'direct') {
      return false;
    }
    
    // Then filter by search query
    if (!searchQuery) return true;
    
    // Search in conversation name
    if (conv.name && conv.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    
    // Search in participant names
    return conv.participants.some(p => 
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleConversationClick = (conversation: Conversation) => {
    console.log('Conversation clicked:', conversation.id, conversation.type, conversation.name);
    setCurrentConversation(conversation);
  };

  const startNewConversation = async () => {
    try {
      if (activeTab === 'chats') {
        // For direct chats, create a conversation with another random user
        if (users.length > 0) {
          const randomUser = users[0];
          const conversationId = await createConversation([randomUser.id]);
          
          // Find the newly created conversation in the list
          const newConversation = conversations.find(c => c.id === conversationId);
          if (newConversation) {
            setCurrentConversation(newConversation);
          }
        }
      } else {
        // For groups, create a group conversation
        if (users.length >= 2) {
          const groupUsers = users.slice(0, 2); // Get first 2 users for demo
          const conversationId = await createConversation(
            groupUsers.map(u => u.id), 
            'New Group', 
            'group'
          );
          
          // Find the newly created conversation in the list
          const newConversation = conversations.find(c => c.id === conversationId);
          if (newConversation) {
            setCurrentConversation(newConversation);
          }
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleTabChange = (tab: 'chats' | 'groups') => {
    console.log('Tab changed to:', tab);
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-full border-r bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <ConversationHeader onNewConversation={startNewConversation} />
        <ConversationSearch 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      
      <ConversationTabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <ScrollArea className="flex-1">
        <ConversationList
          conversations={filteredConversations}
          currentConversation={currentConversation}
          loading={loadingConversations}
          onConversationClick={handleConversationClick}
          onNewConversation={startNewConversation}
          activeTab={activeTab}
        />
      </ScrollArea>
    </div>
  );
};
