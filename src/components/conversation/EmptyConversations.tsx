
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyConversationsProps {
  onNewConversation: () => void;
}

export const EmptyConversations: React.FC<EmptyConversationsProps> = ({
  onNewConversation,
}) => {
  return (
    <div className="text-center py-8 text-sidebar-foreground/60">
      <p>No conversations found</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onNewConversation}
        className="mt-2"
      >
        <Plus size={16} className="mr-1" />
        New Conversation
      </Button>
    </div>
  );
};
