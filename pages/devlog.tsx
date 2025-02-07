import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function WhatsNew() {
  const [isFullscreen, setIsFullScreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (typeof e.data?.isFullscreen === "boolean") {
        setIsFullScreen(e.data.isFullscreen);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        zIndex: isFullscreen ? 999 : 0,
        overflow: "hidden",
        background:
          "radial-gradient(circle at calc(50%) 50%, #eaeaea 0%, #d6d6d6 30%, #bfbfbf 60%) no-repeat center center fixed",
      }}
    >
      <iframe
        src="https://website-plugin-whatsnew.vercel.app/"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background:
            "radial-gradient(circle at calc(50%) 50%, #eaeaea 0%, #d6d6d6 30%, #bfbfbf 60%) no-repeat center center fixed",
        }}
        title="Dev Log"
      />
      {!isFullscreen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(10vh - 55px)",
            right: "20px",
            fontSize: "12px",
            cursor: "pointer",
            color: "#000000",
            textDecoration: isHovered ? "underline" : "none",
          }}
          onClick={() => router.push("/")}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          ./back
        </div>
      )}
    </div>
  );
}