// Components/MainSite/MainSite.tsx
import React from "react";

const MainSite: React.FC = () => {
  console.log("MainSite Loaded")
  return (
    <div className="main-site-container" style={{ color: "white" }}>
      <h1>Welcome to VOXLos!</h1>
    </div>
  );
};

export default MainSite;