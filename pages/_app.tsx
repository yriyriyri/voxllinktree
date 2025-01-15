// pages/_app.tsx
import "../components/LoginPopup/LoginPopup.css"; 
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useState, useRef } from "react";
import LoginPopup from "../components/LoginPopup/LoginPopup";
import MainSite from "../components/MainSite/MainSite";

export default function App({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true);
  const completedRef = useRef(false); // Ref to track if onComplete has been handled

  const handleComplete = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      setLoading(false);
    }
  };

  return (
    <>
      {/* ... Head ... */}
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
