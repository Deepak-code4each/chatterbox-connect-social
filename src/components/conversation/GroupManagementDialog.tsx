
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Users, Edit, Image, UserPlus, UserMinus } from 'lucide-react';
import { Conversation, User as UserType } from '@/types';
import { useChat } from '@/context/ChatContext';

interface GroupManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}

export const GroupManagementDialog: React.FC<GroupManagementDialogProps> = ({
  open,
  onOpenChange,
  conversation,
}) => {
  const { users, searchUsers } = useChat();
  const [groupName, setGroupName] = useState(conversation.name || '');
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchUsers(query);
        // Filter out users already in the conversation
        const participantIds = conversation.participants.map(p => p.id);
        const filtered = results.filter(user => !participantIds.includes(user.id));
        setAvailableUsers(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setAvailableUsers([]);
    }
  };

  const handleUpdateGroupName = async () => {
    // TODO: Implement group name update API call
    console.log('Updating group name to:', groupName);
  };

  const handleAddUser = async (userId: string) => {
    // TODO: Implement add user to group API call
    console.log('Adding user to group:', userId);
  };

  const handleRemoveUser = async (userId: string) => {
    // TODO: Implement remove user from group API call
    console.log('Removing user from group:', userId);
  };

  const handleUpdateGroupPhoto = async () => {
    // TODO: Implement group photo update functionality
    console.log('Update group photo');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Group Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="add">Add Users</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={conversation.participants[0]?.avatar_url} />
                <AvatarFallback>
                  <Users size={32} />
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={handleUpdateGroupPhoto}>
                <Image size={16} className="mr-2" />
                Change Photo
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <div className="flex space-x-2">
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
                <Button onClick={handleUpdateGroupName} size="sm">
                  <Edit size={16} />
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(conversation.created_at).toLocaleDateString()}</p>
              <p>Members: {conversation.participants.length}</p>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {conversation.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.avatar_url} />
                        <AvatarFallback>
                          {participant.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{participant.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{participant.username}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveUser(participant.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userSearch">Search Users</Label>
              <Input
                id="userSearch"
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Search by username or name..."
              />
            </div>

            <ScrollArea className="h-60">
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg border">
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
                      onClick={() => handleAddUser(user.id)}
                    >
                      <UserPlus size={16} />
                    </Button>
                  </div>
                ))}
                {searchQuery && availableUsers.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No users found
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
