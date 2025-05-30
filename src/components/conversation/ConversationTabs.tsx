
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users } from 'lucide-react';

export const ConversationTabs: React.FC = () => {
  return (
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
  );
};
