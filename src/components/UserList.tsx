
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
  const { users, loadingUsers, createConversation, setCurrentConversation, conversations, searchUsers } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(users);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    const results = await searchUsers(query);
    setSearchResults(results);
    setIsSearching(false);
  };
  
  const filteredUsers = searchResults.filter(user => {
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
      
      // Wait a bit for conversations to update via subscription
      setTimeout(() => {
        const conversation = conversations.find(c => c.id === conversationId);
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Find user
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Find a user</SheetTitle>
          <SheetDescription>
            Start a new conversation with another user.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-4">
              {loadingUsers || isSearching ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No users found.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="flex w-full items-center justify-between"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <p className="text-sm font-medium leading-none">
                            {user.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserStatusBadge status={user.status} />
                        <p className="text-xs text-muted-foreground">
                          Last seen {getLastSeenText(user.last_seen)}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
