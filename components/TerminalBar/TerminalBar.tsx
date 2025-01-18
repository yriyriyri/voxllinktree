import React, { useState, useEffect, createContext, useContext } from "react";

export interface Section {
  text: string;
  color: string;
}

interface Line {
  id: string;
  content: Section[];
  typed: boolean;
}

interface TerminalBarProps {
  messages: string[];
  children: (addLine: (id: string, content: Section[]) => void) => React.ReactNode;
}

interface TerminalContextProps {
  addLine: (id: string, content: Section[]) => void;
  updateLine: (id: string, content: Section[]) => void;
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
    {
        id: "welcome",
        content: [
          { text: "boxy@voxlshell", color: "#8AE234" },
          { text: "~", color: "#729FCF" },
          { text: "$", color: "#3465A4" },
          { text: " welcome to the VOXLos kernel!", color: "#FFFFFF" }
        ],
        typed: false,
      },
      { id: "spacer1", content: [{ text: "   ", color: "#FFFFFF" }], typed: false },
      {
        id: "boot",
        content: [
          { text: "      ", color: "#FFFFFF" },
          { text: ">", color: "#3465A4" },
          { text: " wireFrameBooted ", color: "#FFFFFF" },
          { text: "✔", color: "#4AF626" },
        ],
        typed: false,
      },
      { id: "spacer2", content: [{ text: "   ", color: "#FFFFFF" }], typed: false },
      {
        id: "available",
        content: [
          { text: "      ", color: "#FFFFFF" },
          { text: ">", color: "#3465A4" },
          { text: " boxyAvailable ", color: "#FFFFFF" },
          { text: "✔", color: "#4AF626" },
        ],
        typed: false,
      },
      { id: "spacer3", content: [{ text: "   ", color: "#FFFFFF" }], typed: false },
      {
        id: "resources",
        content: [
          { text: "      ", color: "#FFFFFF" },
          { text: ">", color: "#3465A4" },
          { text: " resourcesLocated ", color: "#FFFFFF" },
          { text: "✔", color: "#4AF626" },
        ],
        typed: false,
      },
  ]);

  const [currentLine, setCurrentLine] = useState<Section[]>([]);
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
      setCurrentLine([]);
      setCurrentCharIndex(0);
    }

    if (currentAnimatingLineId) {
      const animatingLine = lines.find(line => line.id === currentAnimatingLineId);
      if (!animatingLine) return;

      const totalChars = animatingLine.content.reduce((acc, section) => acc + section.text.length, 0);

      if (currentCharIndex < totalChars) {
        const timeout = setTimeout(() => {
          let charsToRender = currentCharIndex + 1;
          const newLine: Section[] = [];
          animatingLine.content.forEach(section => {
            if (charsToRender > 0) {
              const visibleText = section.text.slice(0, Math.min(charsToRender, section.text.length));
              newLine.push({ text: visibleText, color: section.color });
              charsToRender -= section.text.length;
            }
          });
          setCurrentLine(newLine);
          setCurrentCharIndex(prev => prev + 1);
        }, 10);
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

  const formatLineWithStyles = (sections: Section[]) => (
    <pre style={{ margin: 0 }}>
      {sections.map((section, index) => (
        <span key={index} style={{ color: section.color }}>
          {section.text}
        </span>
      ))}
    </pre>
  );

  const addLine = (id: string, content: Section[]) => {
    setLines(prevLines => {
      const newLines = [...prevLines];
      newLines.push({ id: id + "_blank", content: [{ text: "   ", color: "#FFFFFF" }], typed: false });
  
      let finalId = id;
      let counter = 1;
      while (newLines.find(line => line.id === finalId)) {
        finalId = id + counter;
        counter++;
      }
  
      let prefixedContent;
  
      if (content.length > 0 && content[0].color === "#34E2E2") {
        const fileSection = content[0];
        const remainingContent = content.slice(1); 
  
        prefixedContent = [
          { text: "usr@voxlshell", color: "#8AE234" },
          { text: "~", color: "#729FCF" },
          fileSection, 
          { text: "$", color: "#3465A4" },
          ...remainingContent 
        ];
      } else {
        prefixedContent = [
          { text: "usr@voxlshell", color: "#8AE234" },
          { text: "~", color: "#729FCF" },
          { text: "$", color: "#3465A4" },
          ...content
        ];
      }
  
      newLines.push({ id: finalId, content: prefixedContent, typed: false });
      return newLines;
    });
  };

  const updateLine = (id: string, content: Section[]) => {
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