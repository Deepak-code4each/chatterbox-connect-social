
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users } from 'lucide-react';

interface ConversationTabsProps {
  activeTab: 'chats' | 'groups';
  onTabChange: (tab: 'chats' | 'groups') => void;
}

export const ConversationTabs: React.FC<ConversationTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex p-2 space-x-1 border-b border-sidebar-border">
      <Button 
        variant={activeTab === 'chats' ? 'default' : 'ghost'}
        size="sm" 
        className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => onTabChange('chats')}
      >
        <MessageSquare size={16} className="mr-1" />
        Chats
      </Button>
      <Button 
        variant={activeTab === 'groups' ? 'default' : 'ghost'}
        size="sm" 
        className="flex-1 text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => onTabChange('groups')}
      >
        <Users size={16} className="mr-1" />
        Groups
      </Button>
    </div>
  );
};
