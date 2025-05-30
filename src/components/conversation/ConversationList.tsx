
import React from 'react';
import { Conversation, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationItem } from './ConversationItem';
import { EmptyConversations } from './EmptyConversations';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  onConversationClick: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  loading,
  onConversationClick,
  onNewConversation,
}) => {
  if (loading) {
    return (
      <div className="p-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center p-2 mb-2 rounded-md space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return <EmptyConversations onNewConversation={onNewConversation} />;
  }

  return (
    <div className="p-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={currentConversation?.id === conversation.id}
          onClick={onConversationClick}
        />
      ))}
    </div>
  );
};
