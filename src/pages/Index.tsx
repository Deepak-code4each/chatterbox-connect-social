
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { ChatUI } from '@/components/ChatUI';
import { UserList } from '@/components/UserList';
import { ProfileSettings } from '@/components/ProfileSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = React.useState('messages');

  // Need to update document title
  useEffect(() => {
    document.title = 'Chat Application';
  }, []);
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <ProfileSettings />
            <TabsList className="w-full justify-around">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="messages" className="flex-1 m-0 p-0 h-full">
            <ConversationSidebar />
          </TabsContent>
          
          <TabsContent value="chat" className="flex-1 m-0 p-0 h-full">
            <ChatUI />
          </TabsContent>
          
          <TabsContent value="users" className="flex-1 m-0 p-0 h-full">
            <UserList />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex">
      <div className="w-80 h-full flex flex-col">
        <ProfileSettings />
        <div className="flex-1 overflow-hidden">
          <ConversationSidebar />
        </div>
      </div>
      
      <div className="flex-1">
        <ChatUI />
      </div>
      
      <div className="w-64 h-full hidden lg:block">
        <UserList />
      </div>
    </div>
  );
};

export default Index;
