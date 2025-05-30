
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Conversation } from '@/types';
import { GroupManagementDialog } from './GroupManagementDialog';

interface ConversationItemActionsProps {
  conversation: Conversation;
}

export const ConversationItemActions: React.FC<ConversationItemActionsProps> = ({
  conversation,
}) => {
  const [showGroupDialog, setShowGroupDialog] = useState(false);

  const isGroup = conversation.type === 'group' || conversation.type === 'community';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isGroup && (
            <DropdownMenuItem onClick={() => setShowGroupDialog(true)}>
              <Users size={16} className="mr-2" />
              Group Settings
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            <Edit size={16} className="mr-2" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isGroup && (
        <GroupManagementDialog
          open={showGroupDialog}
          onOpenChange={setShowGroupDialog}
          conversation={conversation}
        />
      )}
    </>
  );
};
