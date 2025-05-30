
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewGroupDialog } from './NewGroupDialog';

interface ConversationHeaderProps {
  onNewConversation: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  onNewConversation,
}) => {
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);

  return (
    <>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Plus size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onNewConversation}>
                New Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNewGroupDialog(true)}>
                <Users size={16} className="mr-2" />
                New Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <NewGroupDialog
        open={showNewGroupDialog}
        onOpenChange={setShowNewGroupDialog}
      />
    </>
  );
};
