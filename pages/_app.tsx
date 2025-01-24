// pages/_app.tsx
import "../components/LoginPopup/LoginPopup.css"; 
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useState, useRef, useCallback } from "react";
import LoginPopup from "../components/LoginPopup/LoginPopup";
// import MainSite from "../components/MainSite/MainSite";
// import Clock from "../components/Clock/Clock";
// import TerminalBar from "@/components/TerminalBar/TerminalBar";
import ThreeNodeSystem from "../components/ThreeNodeSystem/ThreeNodeSystem";

// let hasRunLoginPopup = false; // Commented out to disable login tracking

export default function App({ Component, pageProps }: AppProps) {
  // const [loading, setLoading] = useState(!hasRunLoginPopup); // Disabled
  // const completedRef = useRef(false); // Disabled
  // const [terminalMessages, setTerminalMessages] = useState<string[]>([]);

  // const handleComplete = useCallback(() => {
  //   if (!completedRef.current) {
  //     completedRef.current = true;
  //     hasRunLoginPopup = true; 
  //     setLoading(false);
  //   }
  // }, []);

  return (
    <>
      {/* {loading ? (
        <LoginPopup onComplete={handleComplete} />
      ) : ( */}
      {/* <TerminalBar messages={terminalMessages}> */}
        {/* {(addLine) => ( */}
          <>
            {/* <MainSite addLine={addLine} /> */}
            <ThreeNodeSystem />
            {/* <Component {...pageProps} /> */}
            {/* <Clock /> */}
          </>
        {/* )} */}
      {/* </TerminalBar> */}
      {/* )} */}
    </>
  );
}