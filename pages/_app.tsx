// pages/_app.tsx
import "../components/LoginPopup/LoginPopup.css"; 
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useState, useRef, useCallback } from "react";
import LoginPopup from "../components/LoginPopup/LoginPopup";
import MainSite from "../components/MainSite/MainSite";
import Clock from "../components/Clock/Clock";
import TerminalBar from "@/components/TerminalBar/TerminalBar";

let hasRunLoginPopup = false;

export default function App({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(!hasRunLoginPopup);
  const completedRef = useRef(false);

  const [terminalMessages, setTerminalMessages] = useState<string[]>([]);

  const handleComplete = useCallback(() => {
    console.log("handleComplete called");
    if (!completedRef.current) {
      completedRef.current = true;
      hasRunLoginPopup = true; 
      setLoading(false);
    }
  }, []);

  const outputToTerminal = (message: string) => {
    setTerminalMessages((prevMessages) => [...prevMessages, message]);
  };

  return (
    <>
      {loading ? (
        <LoginPopup onComplete={handleComplete} />
      ) : (
        <>
          {/* Shared TerminalBar */}
          <TerminalBar messages={terminalMessages} />
          
          <MainSite onOutputToTerminal={outputToTerminal} />
          
          <Component {...pageProps} />
          <Clock />
        </>
      )}
    </>
  );
}