'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  username: string | null;
  login: (name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}


const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const savedName = localStorage.getItem('chinese_vocab_user');
    if (savedName) {
      setUsername(savedName);
    }
    setLoading(false);
  }, []);

  const login = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      // Ensure user exists in DB
      const res = await fetch(`/api/user?username=${encodeURIComponent(trimmedName)}`);
      if (res.ok) {
        setUsername(trimmedName);
        localStorage.setItem('chinese_vocab_user', trimmedName);
      } else {
        console.error("Failed to initialize user in DB");
      }
    } catch (e) {
      console.error("Login error", e);
    }
  };

  const logout = () => {
    setUsername(null);
    localStorage.removeItem('chinese_vocab_user');
  };

  return (
    <UserContext.Provider value={{ username, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
