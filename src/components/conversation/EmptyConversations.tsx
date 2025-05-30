
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyConversationsProps {
  onNewConversation: () => void;
  activeTab?: 'chats' | 'groups';
}

export const EmptyConversations: React.FC<EmptyConversationsProps> = ({
  onNewConversation,
  activeTab = 'chats',
}) => {
  const getMessage = () => {
    if (activeTab === 'groups') {
      return 'No groups found';
    }
    return 'No conversations found';
  };

  const getButtonText = () => {
    if (activeTab === 'groups') {
      return 'New Group';
    }
    return 'New Conversation';
  };

  return (
    <div className="text-center py-8 text-sidebar-foreground/60">
      <p>{getMessage()}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onNewConversation}
        className="mt-2"
      >
        <Plus size={16} className="mr-1" />
        {getButtonText()}
      </Button>
    </div>
  );
};
