
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { NewGroupDialog } from './NewGroupDialog';

interface EmptyConversationsProps {
  onNewConversation: () => void;
  activeTab?: 'chats' | 'groups';
}

export const EmptyConversations: React.FC<EmptyConversationsProps> = ({
  onNewConversation,
  activeTab = 'chats',
}) => {
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);

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

  const handleButtonClick = () => {
    if (activeTab === 'groups') {
      setShowNewGroupDialog(true);
    } else {
      onNewConversation();
    }
  };

  return (
    <>
      <div className="text-center py-8 text-sidebar-foreground/60">
        <p>{getMessage()}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          className="mt-2"
        >
          {activeTab === 'groups' ? (
            <Users size={16} className="mr-1" />
          ) : (
            <Plus size={16} className="mr-1" />
          )}
          {getButtonText()}
        </Button>
      </div>

      <NewGroupDialog
        open={showNewGroupDialog}
        onOpenChange={setShowNewGroupDialog}
      />
    </>
  );
};
