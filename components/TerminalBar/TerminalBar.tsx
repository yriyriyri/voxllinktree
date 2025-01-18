import React, { useState, useEffect, useRef, createContext, useContext } from "react";

interface TerminalBarProps {
  messages: string[]; 
  onOutputToTerminal?: (message: string) => void; 
}

interface TerminalContextProps {
  outputToTerminal: (message: string) => void;
}

const TerminalBarContext = createContext<TerminalContextProps | null>(null);

export const useTerminal = () => {
  const context = useContext(TerminalBarContext);
  if (!context) {
    throw new Error("useTerminal must be used within TerminalBarContext.Provider");
  }
  return context;
};

const TerminalBar: React.FC<TerminalBarProps> = ({ messages, onOutputToTerminal }) => {
  const [lines, setLines] = useState<string[]>([]); 
  const [currentLine, setCurrentLine] = useState<string>(""); 
  const [currentCharIndex, setCurrentCharIndex] = useState(0); 
  const [currentLineIndex, setCurrentLineIndex] = useState(0); 

  const typewriterMessages = useRef<string[]>([
    `boxy@voxlshell~$ welcome to the VOXLos kernel!`,
    "   ",
    `      >wireFrameBooted <span style="color:#4AF626">✔</span>`,
    "   ",
    `      >boxyAvailable <span style="color:#4AF626">✔</span>`,
    "   ",
    `      >resourcesLocated <span style="color:#4AF626">✔</span>`,
  ]);

  const terminalStyle: React.CSSProperties = {
    position: "fixed",
    top: 50,
    left: 30,
    width: "400px",
    height: "80vh",
    backgroundColor: "#000000",
    color: "#FFFFFF",
    fontFamily: '"dico-code-two", monospace',
    fontSize: "12px",
    padding: "10px",
    overflowY: "auto",
  };

  // Typewriter effect
  useEffect(() => {
    if (currentLineIndex < typewriterMessages.current.length) {
      if (currentCharIndex < typewriterMessages.current[currentLineIndex].length) {
        const timeout = setTimeout(() => {
          setCurrentLine(
            (prev) =>
              prev + typewriterMessages.current[currentLineIndex][currentCharIndex]
          );
          setCurrentCharIndex((prev) => prev + 1);
        }, 20);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setLines((prev) => [...prev, currentLine]);
          setCurrentLine("");
          setCurrentCharIndex(0);
          setCurrentLineIndex((prev) => prev + 1);
        }, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentCharIndex, currentLineIndex, currentLine]);

  const formatLineWithStyles = (line: string) => (
    <pre style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: line }} />
  );

  const outputToTerminal = (message: string) => {
    typewriterMessages.current.push(`usr@voxlshell~$ ${message}`);
    if (currentLineIndex === typewriterMessages.current.length - 1) {
      setCurrentLineIndex(typewriterMessages.current.length - 1);
    }
    if (onOutputToTerminal) {
      onOutputToTerminal(message);
    }
  };

  return (
    <TerminalBarContext.Provider value={{ outputToTerminal }}>
      <div style={terminalStyle}>
        {lines.map((line, index) => (
          <div key={index}>{formatLineWithStyles(line)}</div>
        ))}
        {currentLine && <div>{formatLineWithStyles(currentLine)}</div>}
        {messages.map((message, index) => (
          <pre key={`message-${index}`} style={{ margin: 0 }}>
            {message}
          </pre>
        ))}
      </div>
    </TerminalBarContext.Provider>
  );
};

export default TerminalBar;