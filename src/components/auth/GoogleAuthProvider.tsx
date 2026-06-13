import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!GOOGLE_CLIENT_ID) {
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
};

export default GoogleAuthProvider;
