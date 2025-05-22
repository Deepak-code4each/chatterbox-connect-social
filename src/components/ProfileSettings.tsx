
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LogOut, ChevronDown, User } from 'lucide-react';
import { UserStatus } from '@/types';

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile, updateStatus, signOut, loading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<UserStatus>('online');
  
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || '');
      setStatus(user.status || 'online');
    }
  }, [user]);
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    await updateProfile({
      full_name: fullName,
      username: username,
      avatar_url: avatarUrl,
    });
    
    setIsEditing(false);
  };
  
  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user) return;
    await updateStatus(newStatus);
  };
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const statusOptions = [
    { value: 'online', label: 'Online', color: 'bg-online' },
    { value: 'away', label: 'Away', color: 'bg-away' },
    { value: 'busy', label: 'Busy', color: 'bg-busy' },
    { value: 'offline', label: 'Appear Offline', color: 'bg-offline' },
  ];
  
  if (!user) return null;
  
  return (
    <div className="p-4 border-b">
      <div className="flex items-center mb-4">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={user.avatar_url} alt={user.username} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="font-medium">{user.full_name}</div>
          <div className="text-sm text-muted-foreground">@{user.username}</div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mb-4">
        <Select value={status} onValueChange={(val: UserStatus) => handleStatusChange(val)}>
          <SelectTrigger>
            <div className="flex items-center">
              <div className={`w-2.5 h-2.5 mr-2 rounded-full ${
                statusOptions.find(opt => opt.value === status)?.color
              }`} />
              <SelectValue>
                {statusOptions.find(opt => opt.value === status)?.label}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  <div className={`w-2.5 h-2.5 mr-2 rounded-full ${option.color}`} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isEditing && (
        <div className="space-y-4 mt-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar-url">Avatar URL</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
