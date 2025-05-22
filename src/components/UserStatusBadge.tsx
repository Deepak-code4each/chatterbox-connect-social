
import { UserStatus } from '@/types';

interface UserStatusBadgeProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ 
  status, 
  size = 'sm' 
}) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };
  
  return (
    <span 
      className={`status-indicator ${status} ${sizeClasses[size]}`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
};
