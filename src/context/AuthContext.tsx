import React, {
  createContext,
  useContext,
  useState,
} from "react";
import { loginApi, registerApi, socialLoginApi } from "../service/authService";
import type {
  ILoginPayload,
  IRegister,
} from "../types/auth.type";

interface User {
  id: number;
  name: string;
  email: string;
  image?: string;
  age?: number;
  gender?: string;
  role: {
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (login: ILoginPayload) => Promise<boolean>;
  socialLogin: (idToken: string) => Promise<boolean>;
  register: (register: IRegister) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getInitialUser = (): User | null => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Failed to parse stored user", error);
      localStorage.removeItem("user");
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const loading = false; // Always false since we initialize from localStorage

  const login = async (loginData: ILoginPayload): Promise<boolean> => {
    try {
      const res = await loginApi(loginData);
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
      console.error("Login error", error);
      return false;
    }
  };

  const socialLogin = async (idToken: string): Promise<boolean> => {
    try {
      const res = await socialLoginApi(idToken);
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
      console.error("Social login error", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const register = async (registerData: IRegister): Promise<boolean> => {
    try {
      const res = await registerApi(registerData);
      const token = res.data?.access_token;
      const userData = res.data?.user;

      if (token && userData) {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }
      return true;
    } catch (error) {
      console.error("Register error", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        socialLogin,
        logout,
        register,
        setUser,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
