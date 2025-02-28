// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps, AppContext } from "next/app";
import App from "next/app";
import React, { useEffect, useState } from "react";
import ThreeNodeSystem from "../components/ThreeNodeSystem/ThreeNodeSystem";
import ThreeNodeSystemMobile from "../components/ThreeNodeSystemMobile/ThreeNodeSystemMobile";
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next";

export interface ArticleData {
  title: string;
  date: string;
  author: string;
  slug: string;
  preview: string;  
}

interface MyAppProps extends AppProps {
  articlesData: ArticleData[];
}

function MyApp({ Component, pageProps, articlesData }: MyAppProps) {
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
    <div style={{ cursor: 'url(/favicon.cur) 16 16, auto' }}>
      {showThreeNodeSystem &&
        (isMobile ? (
          <ThreeNodeSystemMobile />
        ) : (
          <ThreeNodeSystem articlesData={articlesData} />
        ))}
      <Component {...pageProps} />
      <SpeedInsights />
    </div>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  let articlesData: ArticleData[] = [];

  try {
    let response;
    if (appContext.ctx.req) {
      const protocol = appContext.ctx.req.headers["x-forwarded-proto"] || "http";
      const host = appContext.ctx.req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      response = await fetch(`${baseUrl}/api/articles`);
    } else {
      response = await fetch("/api/articles");
    }

    if (response.ok) {
      articlesData = await response.json();
    }
  } catch (error) {
    console.error("Error fetching articles:", error);
  }

  return { ...appProps, articlesData };
};

export default MyApp;