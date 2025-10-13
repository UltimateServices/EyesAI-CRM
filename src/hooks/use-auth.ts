import { useStore } from '@/lib/store';
import { User } from '@/lib/types';

export function useAuth() {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const users = useStore((state) => state.users);

  const login = (email: string, password: string) => {
    // Simple mock authentication
    const user = users.find((u) => u.email === email);
    
    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }
    
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const hasRole = (roles: string | string[]) => {
    if (!currentUser) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(currentUser.role);
  };

  return {
    user: currentUser,
    login,
    logout,
    hasRole,
    isAuthenticated: !!currentUser,
  };
}