
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { UserStatusBadge } from '../UserStatusBadge';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (conversation: Conversation) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const { user } = useAuth();

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant ? otherParticipant.full_name : 'Unknown User';
    }
    
    if (conversation.type === 'group') {
      return `Group (${conversation.participants.length} members)`;
    }
    
    if (conversation.type === 'community') {
      return `Community (${conversation.participants.length} members)`;
    }
    
    return `Conversation (${conversation.participants.length})`;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant?.avatar_url || '';
    }
    
    return '';
  };

  const getConversationAvatarFallback = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant ? otherParticipant.full_name.charAt(0).toUpperCase() : '?';
    }
    
    if (conversation.name) {
      return conversation.name.charAt(0).toUpperCase();
    }
    
    return conversation.type === 'group' ? 'G' : conversation.type === 'community' ? 'C' : 'T';
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

  const otherStatus = getOtherUserStatus(conversation);

  return (
    <div
      className={`flex items-start p-2 rounded-md cursor-pointer space-x-3 transition-colors ${
        isActive
          ? 'bg-sidebar-accent/80'
          : 'hover:bg-sidebar-accent/50'
      }`}
      onClick={() => onClick(conversation)}
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
};
