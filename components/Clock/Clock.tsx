import React, { useEffect, useState } from "react";

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
      setDotCount((prev) => (prev + 1) % 4); 
    }, 250);
    return () => clearInterval(timerId);
  }, []);

  const clockStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "70px",
    right: "70px",
    // background: "rgba(0, 0, 0, 0.5)",
    color: "black",
    padding: "5px 10px",
    // borderRadius: "4px",
    fontFamily: '"dico-code-two", monospace',
    fontSize: "14px",
  };

  const isAM = time.getHours() < 12;
  const timeStringWithoutPeriod = time
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .replace(/AM|PM/, "")
    .trim();

  const dots = ".".repeat(dotCount);

  return (
    <div style={clockStyle}>
      {">"} {time.toLocaleDateString()} {dots}
      <br />
      {">"} {timeStringWithoutPeriod}{" "}
      <span style={{ color: isAM ? "#4AF626" : "#FF0000" }}>[AM]</span>
      <span style={{ color: "#000000" }}> / </span>
      <span style={{ color: !isAM ? "#4AF626" : "#FF0000" }}>[PM]</span>
    </div>
  );
};

export default Clock;