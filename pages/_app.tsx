// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import ThreeNodeSystem from "../components/ThreeNodeSystem/ThreeNodeSystem";
import ThreeNodeSystemMobile from "../components/ThreeNodeSystemMobile/ThreeNodeSystemMobile";

export default function App({ Component, pageProps }: AppProps) {
  // `null` means we haven't decided if it's mobile or desktop yet
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Do your width check here
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
    }
  }, []);

  // If we still don't know if it's mobile or not, render nothing or a tiny loader
  if (isMobile === null) {
    return null;
  }

  // Once isMobile is set, render the correct component
  return (
    <>
      {isMobile ? <ThreeNodeSystemMobile /> : <ThreeNodeSystem />}
      {/* If you need <Component {...pageProps} />, place it here as well */}
    </>
  );
}