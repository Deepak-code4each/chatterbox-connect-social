
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Plus } from 'lucide-react';

interface ConversationHeaderProps {
  onNewConversation: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  onNewConversation,
}) => {
  return (
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
          onClick={onNewConversation}
        >
          <Plus size={20} />
        </Button>
      </div>
    </div>
  );
};
