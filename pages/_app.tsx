// pages/_app.tsx
import "../components/LoginPopup/LoginPopup.css"; 
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useState } from "react";
import LoginPopup from "../components/LoginPopup/LoginPopup";
import MainSite from "../components/MainSite/MainSite";

export default function App({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {/* ... Head ... */}
      {loading ? (
        <LoginPopup onComplete={() => setLoading(false)} />
      ) : (
        <>
          <MainSite />
          <Component {...pageProps} />
        </>
      )}
    </>
  );
}
