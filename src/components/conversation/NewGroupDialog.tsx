
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { User } from '@/types';
import { useChat } from '@/context/ChatContext';

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewGroupDialog: React.FC<NewGroupDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { users, createConversation, setCurrentConversation, conversations } = useChat();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = users.filter(user => 
    (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !selectedUsers.some(selected => selected.id === user.id)
  );

  const handleAddUser = (user: User) => {
    setSelectedUsers(prev => [...prev, user]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      return;
    }

    setIsCreating(true);
    try {
      const participantIds = selectedUsers.map(user => user.id);
      const conversationId = await createConversation(participantIds, groupName, 'group');
      
      // Find the newly created conversation and set it as current
      const newConversation = conversations.find(c => c.id === conversationId);
      if (newConversation) {
        setCurrentConversation(newConversation);
      }
      
      // Reset form and close dialog
      setGroupName('');
      setSelectedUsers([]);
      setSearchQuery('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userSearch">Search Users</Label>
            <Input
              id="userSearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or name..."
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Users ({selectedUsers.length})</Label>
              <ScrollArea className="h-24 border rounded-lg p-2">
                <div className="space-y-1">
                  {selectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-1 rounded bg-muted">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.full_name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                        className="h-6 w-6 p-0"
                      >
                        <UserMinus size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-2">
            <Label>Available Users</Label>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddUser(user)}
                    >
                      <UserPlus size={16} />
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    {searchQuery ? 'No users found' : 'No more users available'}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
