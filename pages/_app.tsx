// pages/_app.tsx
import "../components/LoginPopup/LoginPopup.css"; 
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useState, useRef, useCallback } from "react";
import LoginPopup from "../components/LoginPopup/LoginPopup";
import MainSite from "../components/MainSite/MainSite";
// ...
export default function App({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true);
  const completedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      setLoading(false);
    }
  }, []);

  return (
    <>
      {/* ... */}
      {loading ? (
        <LoginPopup onComplete={handleComplete} />
      ) : (
        <>
          <MainSite />
          <Component {...pageProps} />
        </>
      )}
    </>
  );
}

