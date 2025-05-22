
import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Conversation } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, MessageSquare, Plus, Search, Users } from 'lucide-react';
import { UserStatusBadge } from './UserStatusBadge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const filteredConversations = conversations.filter(conv => {
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
    setCurrentConversation(conversation);
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant ? otherParticipant.full_name : 'Unknown User';
    }
    
    return `Group (${conversation.participants.length})`;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant?.avatar_url || '';
    }
    
    // For groups, return the first letter of the group name
    return '';
  };

  const getConversationAvatarFallback = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant ? otherParticipant.full_name.charAt(0).toUpperCase() : '?';
    }
    
    return conversation.name ? conversation.name.charAt(0).toUpperCase() : 'G';
  };

  const getOtherUserStatus = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant?.status || 'offline';
    }
    return null;
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const startNewConversation = async () => {
    try {
      // For demo purposes, create a conversation with another random user
      if (users.length > 0) {
        const randomUser = users[0];
        const conversationId = await createConversation([randomUser.id]);
        
        // Find the newly created conversation in the list
        const newConversation = conversations.find(c => c.id === conversationId);
        if (newConversation) {
          setCurrentConversation(newConversation);
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bell size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={startNewConversation}
            >
              <Plus size={20} />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8 bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex p-2 space-x-1 border-b border-sidebar-border">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <MessageSquare size={16} className="mr-1" />
          Chats
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Users size={16} className="mr-1" />
          Groups
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loadingConversations ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-2 mb-2 rounded-md space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-sidebar-foreground/60">
              <p>No conversations found</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className="mt-2"
              >
                <Plus size={16} className="mr-1" />
                New Conversation
              </Button>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = currentConversation?.id === conversation.id;
              const otherStatus = getOtherUserStatus(conversation);
              
              return (
                <div
                  key={conversation.id}
                  className={`flex items-start p-2 rounded-md cursor-pointer space-x-3 ${
                    isActive
                      ? 'bg-sidebar-accent/80'
                      : 'hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-sidebar-border">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback>{getConversationAvatarFallback(conversation)}</AvatarFallback>
                    </Avatar>
                    {otherStatus && <UserStatusBadge status={otherStatus} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">
                        {getConversationName(conversation)}
                      </p>
                      {conversation.last_message && (
                        <span className="text-xs text-sidebar-foreground/60">
                          {formatMessageDate(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm truncate text-sidebar-foreground/80">
                        {conversation.last_message
                          ? conversation.last_message.content_type === 'text'
                            ? conversation.last_message.content
                            : `[${conversation.last_message.content_type}]`
                          : "No messages yet"}
                      </p>
                      
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="bg-sidebar-primary text-sidebar-primary-foreground">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
