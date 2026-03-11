import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  Children,
} from "react";
import { loginApi, registerApi } from "../service/authService";
import type { IApiResponse } from "../types/api.type";
import type {
  ILoginPayload,
  ILoginResponse,
  IRegister,
} from "../types/auth.type";

interface User {
  id: number;
  name: string;
  email: string;
  role: {
    name: string;
  };
}

interface AuthContectType {
  user: User | null;
  login: (login: ILoginPayload) => Promise<boolean>;
  register: (register: IRegister) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContectType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    const token = localStorage.getItem("access_token");

    if (token) {
      setIsAuthenticated(true);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (login: ILoginPayload): Promise<boolean> => {
    try {
      const res = await loginApi(login);

      const token = res.data?.access_token;
      const userData = res.data?.user;

      if (!token || !userData) {
        return false;
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const register = async (register: IRegister): Promise<boolean> => {
    try {
      const res = await registerApi(register);

      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

// export interface User {
//   id: string;
//   email: string;
//   name: string;
//   avatar?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<boolean>;
//   register: (name: string, email: string, password: string) => Promise<boolean>;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Mock users database
// const mockUsers: (User & { password: string })[] = [
//   {
//     id: "1",
//     email: "user@example.com",
//     name: "Nguyễn Văn A",
//     password: "123456",
//   },
//   {
//     id: "2",
//     email: "test@example.com",
//     name: "Trần Thị B",
//     password: "123456",
//   },
// ];

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Check localStorage for saved user
//     const savedUser = localStorage.getItem("beautylux_user");
//     if (savedUser) {
//       setUser(JSON.parse(savedUser));
//     }
//     setIsLoading(false);
//   }, []);

//   const login = async (email: string, password: string): Promise<boolean> => {
//     // Simulate API delay
//     await new Promise((resolve) => setTimeout(resolve, 500));

//     const foundUser = mockUsers.find(
//       (u) =>
//         u.email.toLowerCase() === email.toLowerCase() &&
//         u.password === password,
//     );

//     if (foundUser) {
//       const { password: _, ...userWithoutPassword } = foundUser;
//       setUser(userWithoutPassword);
//       localStorage.setItem(
//         "beautylux_user",
//         JSON.stringify(userWithoutPassword),
//       );
//       return true;
//     }
//     return false;
//   };

//   const register = async (
//     name: string,
//     email: string,
//     password: string,
//   ): Promise<boolean> => {
//     // Simulate API delay
//     await new Promise((resolve) => setTimeout(resolve, 500));

//     // Check if email already exists
//     const exists = mockUsers.some(
//       (u) => u.email.toLowerCase() === email.toLowerCase(),
//     );
//     if (exists) {
//       return false;
//     }

//     // Create new user
//     const newUser: User = {
//       id: Date.now().toString(),
//       email,
//       name,
//     };

//     // Add to mock database
//     mockUsers.push({ ...newUser, password });

//     setUser(newUser);
//     localStorage.setItem("beautylux_user", JSON.stringify(newUser));
//     return true;
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem("beautylux_user");
//   };

//   return (
//     <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };
