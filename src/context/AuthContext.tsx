import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const mockUsers: (User & { password: string })[] = [
  {
    id: "1",
    email: "user@example.com",
    name: "Nguyễn Văn A",
    password: "123456",
  },
  {
    id: "2",
    email: "test@example.com",
    name: "Trần Thị B",
    password: "123456",
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved user
    const savedUser = localStorage.getItem("beautylux_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundUser = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem(
        "beautylux_user",
        JSON.stringify(userWithoutPassword),
      );
      return true;
    }
    return false;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if email already exists
    const exists = mockUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (exists) {
      return false;
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
    };

    // Add to mock database
    mockUsers.push({ ...newUser, password });

    setUser(newUser);
    localStorage.setItem("beautylux_user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("beautylux_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
