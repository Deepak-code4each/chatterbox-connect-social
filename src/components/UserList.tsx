
import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { UserStatusBadge } from './UserStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const UserList: React.FC = () => {
  const { users, loadingUsers, createConversation, setCurrentConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    return (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleUserClick = async (userId: string) => {
    try {
      const conversationId = await createConversation([userId]);
      
      // Find the conversation in the current context
      const chatContext = useChat();
      setTimeout(() => {
        const conversation = chatContext.conversations.find(c => c.id === conversationId);
        if (conversation) {
          setCurrentConversation(conversation);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const getLastSeenText = (lastSeen: string) => {
    try {
      return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <div className="border-l border-border h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100%-73px)]">
        <div className="p-2">
          {loadingUsers ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-2 mb-2 rounded-md space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Sheet key={user.id}>
                <SheetTrigger asChild>
                  <div
                    className="flex items-center p-2 rounded-md space-x-3 hover:bg-muted cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <UserStatusBadge status={user.status} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.full_name}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </SheetTrigger>
                
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>User Profile</SheetTitle>
                    <SheetDescription>View user details</SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-4 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <UserStatusBadge status={user.status} size="lg" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-medium">{user.full_name}</h3>
                    <p className="text-muted-foreground mb-2">@{user.username}</p>
                    
                    <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm mb-4">
                      {user.role}
                    </div>
                    
                    <div className="w-full space-y-4">
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-1">Email</h4>
                        <p className="text-sm text-muted-foreground">{user.email || 'Not available'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Status</h4>
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`w-3 h-3 rounded-full bg-${user.status}`} />
                          <span className="text-sm text-muted-foreground capitalize">{user.status}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Last seen</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.status === 'online' ? 'Online now' : getLastSeenText(user.last_seen)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleUserClick(user.id)}
                    >
                      Send Message
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
