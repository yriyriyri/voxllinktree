// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import ThreeNodeSystem from "../components/ThreeNodeSystem/ThreeNodeSystem";
import ThreeNodeSystemMobile from "../components/ThreeNodeSystemMobile/ThreeNodeSystemMobile";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
    }
  }, []);

  if (isMobile === null) {
    return null;
  }

  // Check if the current route is /whatsnew
  const showThreeNodeSystem = router.pathname !== "/devlog";

  return (
    <>
      {showThreeNodeSystem &&
        (isMobile ? <ThreeNodeSystemMobile /> : <ThreeNodeSystem />)}
      <Component {...pageProps} />
    </>
  );
}