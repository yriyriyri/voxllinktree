// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import ThreeNodeSystem from "../components/ThreeNodeSystem/ThreeNodeSystem";
import ThreeNodeSystemMobile from "../components/ThreeNodeSystemMobile/ThreeNodeSystemMobile";
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function App({ Component, pageProps }: AppProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  if (isMobile === null) {
    return null;
  }

  const showThreeNodeSystem = router.pathname !== "/devlog";

  return (
    <>
      {showThreeNodeSystem &&
        (isMobile ? (
          <ThreeNodeSystemMobile articlesData={pageProps.articlesData} />
        ) : (
          <ThreeNodeSystem articlesData={pageProps.articlesData} />
        ))}
      <Component {...pageProps} />
      <SpeedInsights />
    </>
  );
}