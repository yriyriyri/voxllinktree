import React, { useState, useEffect, createContext, useContext } from "react";

interface TerminalBarProps {
    messages: string[];
    children: (addLine: (id: string, content: string) => void) => React.ReactNode;
  }

interface TerminalContextProps {
  addLine: (id: string, content: string) => void;
  updateLine: (id: string, content: string) => void;
}

interface Line {
  id: string;
  content: string;
  typed: boolean;
}

const TerminalBarContext = createContext<TerminalContextProps | null>(null);

export const useTerminal = () => {
  const context = useContext(TerminalBarContext);
  if (!context) {
    throw new Error("useTerminal must be used within TerminalBarContext.Provider");
  }
  return context;
};

const TerminalBar: React.FC<TerminalBarProps> = ({ messages, children }) => {
    const [lines, setLines] = useState<Line[]>([
    { id: "welcome", content: `boxy@voxlshell~$ welcome to the VOXLos kernel!`, typed: false },
    { id: "spacer1", content: "   ", typed: false },
    { id: "boot", content: `      >wireFrameBooted <span style="color:#4AF626">✔</span>`, typed: false },
    { id: "spacer2", content: "   ", typed: false },
    { id: "available", content: `      >boxyAvailable <span style="color:#4AF626">✔</span>`, typed: false },
    { id: "spacer3", content: "   ", typed: false },
    { id: "resources", content: `      >resourcesLocated <span style="color:#4AF626">✔</span>`, typed: false },
  ]);

  const [currentLine, setCurrentLine] = useState<string>("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentAnimatingLineId, setCurrentAnimatingLineId] = useState<string | null>(null);

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

  useEffect(() => {
    let lineToAnimate = lines.find(line => !line.typed && line.id !== currentAnimatingLineId);

    if (!currentAnimatingLineId && lineToAnimate) {
      setCurrentAnimatingLineId(lineToAnimate.id);
      setCurrentLine("");
      setCurrentCharIndex(0);
    }

    if (currentAnimatingLineId) {
      const animatingLine = lines.find(line => line.id === currentAnimatingLineId);
      if (!animatingLine) return;

      if (currentCharIndex < animatingLine.content.length) {
        const timeout = setTimeout(() => {
          setCurrentLine(prev => prev + animatingLine.content[currentCharIndex]);
          setCurrentCharIndex(prev => prev + 1);
        }, 20);
        return () => clearTimeout(timeout);
      } else {
        setLines(prev =>
          prev.map(line =>
            line.id === currentAnimatingLineId ? { ...line, typed: true } : line
          )
        );
        setCurrentAnimatingLineId(null);
      }
    }
  }, [lines, currentCharIndex, currentAnimatingLineId]);

  const formatLineWithStyles = (line: string) => (
    <pre style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: line }} />
  );

  const addLine = (id: string, content: string) => {
    setLines(prevLines => {
      const newLines = [...prevLines];
  
      newLines.push({ id: id + "_blank", content: "   ", typed: false });
  
      let finalId = id;
      let counter = 1;
      while (newLines.find(line => line.id === finalId)) {
        finalId = id + counter;
        counter++;
      }
  
      newLines.push({ id: finalId, content: `usr@voxlshell~$ ${content}`, typed: false });
  
      return newLines;
    });
  };

  const updateLine = (id: string, content: string) => {
    setLines(prevLines =>
      prevLines.map(line =>
        line.id === id ? { ...line, content } : line
      )
    );
  };

  return (
    <>
      <div style={terminalStyle}>
        {lines.map(line =>
          line.typed ? (
            <div key={line.id}>{formatLineWithStyles(line.content)}</div>
          ) : null
        )}
        {currentAnimatingLineId && formatLineWithStyles(currentLine)}
        {messages.map((message, index) => (
          <pre key={`message-${index}`} style={{ margin: 0 }}>
            {message}
          </pre>
        ))}
      </div>
      {children(addLine)}
    </>
  );
};

export { TerminalBarContext };
export default TerminalBar;