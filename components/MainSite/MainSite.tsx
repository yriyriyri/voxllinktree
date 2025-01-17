import React, { useLayoutEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  boundingBox: { left: number; right: number; top: number; bottom: number; width?: number; height?: number };
  nextChange?: number;
}

const MainSite: React.FC = () => {
  const wireframeCanvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const htmlCanvas = wireframeCanvasRef.current!;
    if (!htmlCanvas) return;

    const ctx = htmlCanvas.getContext("2d", { willReadFrequently: true })!;
    if (!ctx) return;

    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1; 
      htmlCanvas.width = window.innerWidth * dpr; 
      htmlCanvas.height = window.innerHeight * dpr; 
      htmlCanvas.style.width = `${window.innerWidth}px`; 
      htmlCanvas.style.height = `${window.innerHeight}px`; 
      ctx.scale(dpr, dpr); 
    };

    setCanvasSize();

    const sizeFactor = 80;
    const lineOpacityFactor = 12;
    let sizeMultiplier = Math.min(htmlCanvas.width, htmlCanvas.height) / sizeFactor;
    let lineOpacityMultiplier = htmlCanvas.width / lineOpacityFactor;

    const spawnWidth = window.innerWidth * 0.5;
    const spawnHeight = window.innerHeight * 0.6;
    const spawnXStart = (window.innerWidth - spawnWidth) / 2;
    const spawnYStart = (window.innerHeight - spawnHeight) / 2;
    const spawnXEnd = spawnXStart + spawnWidth;
    const spawnYEnd = spawnYStart + spawnHeight;

    let nodes: Node[] = [];
    let textArray = ["./trailer", "./instagram", "./X", "./discord", "./facebook", "./youtube", "./about us", "./contact"];
    const numNodes = 7;
    const svgIcons = {
      "./instagram": {
        img: new Image(),
        color: "#0000FF", 
      },
      "./X": {
        img: new Image(),
        color: "#1DA1F2", 
      },
      "./youtube": {
        img: new Image(),
        color: "#FF0000", 
      },
    };
    
    svgIcons["./instagram"].img.src = "/images/icons/instagram.svg";
    // svgIcons["./X"].src = "/images/icons/x.svg";
    // svgIcons["./youtube"].src = "/images/icons/youtube.svg";

    function createNodes() {
      nodes = [];
      for (let i = 0; i < numNodes; i++) {
        const x = Math.random() * (spawnWidth - 20) + spawnXStart + 10; 
        const y = Math.random() * (spawnHeight - 20) + spawnYStart + 10; 
    
        nodes.push({
          x: x,
          y: y,
          z: Math.random() * (70 - 10), 
          dx: (Math.random() - 0.5) * 2, 
          dy: (Math.random() - 0.5) * 2, 
          boundingBox: { left: 0, right: 0, top: 0, bottom: 0 }, 
        });
      }
    
      nodes.push({
        x: (spawnXStart + spawnXEnd) / 2,
        y: (spawnYStart + spawnYEnd) / 2,
        z: 0.1,
        dx: 0,
        dy: 0,
        boundingBox: { left: 0, right: 0, top: 0, bottom: 0 },
      });
    }

    function drawWireframe() {
      ctx.clearRect(0, 0, htmlCanvas.width, htmlCanvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = "source-over";
    
      const defaultFontSize = 16;
      const smallFontSize = 10;
      ctx.fillStyle = "#FFFFFF";
      const lineWidth = defaultFontSize / 12;
    
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = "#FFFFFF";
    
      function drawSVG(img: HTMLImageElement, x: number, y: number, width: number, height: number) {
        if (img.complete) {
          ctx.drawImage(img, x, y, width, height); 
        } else {
          console.log("svg not ready yet");
        }
      }
    
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const fontSize = i >= nodes.length - 2 ? smallFontSize : defaultFontSize;
        const charWidth = fontSize * 0.6;
        const boxWidth = (textArray[i]?.length + 4 || 0) * charWidth;
        const boxHeight = fontSize * 3;
    
        const x = node.x - boxWidth / 2;
        const y = node.y - boxHeight / 2;
    
        for (let j = i + 1; j < nodes.length; j++) {
          const targetNode = nodes[j];
          const targetFontSize = j >= nodes.length - 2 ? smallFontSize : defaultFontSize;
          const targetCharWidth = targetFontSize * 0.6;
          const targetBoxWidth = (textArray[j]?.length + 4 || 0) * targetCharWidth;
          const endX = targetNode.x - targetBoxWidth / 2;
          const endY = targetNode.y;
    
          const dx = endX - node.x;
          const dy = endY - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
    
          const lineOpacity = Math.max(0, 1 - distance / lineOpacityMultiplier);
          if (lineOpacity > 0) {
            const whiteRatio = Math.max(1, Math.round(10 * lineOpacity));
            const blackRatio = Math.max(1, Math.round(10 * (1 - lineOpacity)));
    
            ctx.setLineDash([whiteRatio, blackRatio]);
            ctx.globalAlpha = 1;
    
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
    
            ctx.setLineDash([]);
          }
        }

        if (Object.keys(svgIcons).includes(textArray[i])) {
          const svgEntry = svgIcons[textArray[i] as keyof typeof svgIcons]; 
          const svgColor = svgEntry.color || "#FFFFFF"; 
        
          const topBorderStr = `+${"-".repeat(textArray[i]?.length + 7 || 0)}+`;
          const bottomBorderStr = topBorderStr;
          const textBeforeBrackets = `| ${textArray[i] || ""} `;
          const brackets = "[  ]";
          const rightWall = "|";
        
          ctx.font = `${fontSize}px "dico-code-two", monospace`;
          ctx.textBaseline = "top";
        
          const measurementString = `${textBeforeBrackets}${brackets} ${rightWall}`;
          const measuredWidth = ctx.measureText(measurementString).width;
          
          const boxHeight = fontSize * 3; 
          const x = node.x - measuredWidth / 2;
          const y = node.y - boxHeight / 2;
        
          ctx.fillStyle = "#000000"; 
          ctx.fillRect(x, y, measuredWidth, boxHeight);
        
          ctx.fillStyle = "#FFFFFF"; 
          ctx.fillText(topBorderStr, x, y);
          ctx.fillText(bottomBorderStr, x, y + fontSize * 2);
        
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(textBeforeBrackets, x, y + fontSize); 
        
          ctx.fillStyle = svgColor; 
          const bracketsX = x + ctx.measureText(textBeforeBrackets).width;
          ctx.fillText(brackets, bracketsX, y + fontSize); 
        
          ctx.fillStyle = "#FFFFFF"; 
          const rightWallX = bracketsX + ctx.measureText(brackets).width + ctx.measureText(" ").width;
          ctx.fillText(rightWall, rightWallX, y + fontSize); 
        
          node.boundingBox = {
            left: x,
            right: x + measuredWidth,
            top: y,
            bottom: y + boxHeight,
            width: measuredWidth,
            height: boxHeight,
          };
      
        } else {
          const topBorder = `+${"-".repeat(textArray[i]?.length + 2 || 0)}+`;
          const bottomBorder = topBorder;
          const paddedText = `| ${textArray[i] || ""} |`;

          ctx.fillStyle = "#000000";
          ctx.fillRect(x, y, boxWidth, boxHeight);
        
          ctx.font = `${fontSize}px "dico-code-two", monospace`;
          ctx.textBaseline = "top";
          ctx.fillStyle = "#FFFFFF";

          ctx.fillText(topBorder, x, y);
          ctx.fillText(paddedText, x, y + fontSize);
          ctx.fillText(bottomBorder, x, y + fontSize * 2);
        
          node.boundingBox = {
            left: x,
            right: x + boxWidth,
            top: y,
            bottom: y + boxHeight,
            width: boxWidth,
            height: boxHeight,
          };

        }
      }
    
      const svgX = 100;
      const svgY = 100;
      const svgWidth = 19.2;
      const svgHeight = 19.2;

      ctx.strokeStyle = "red";
      ctx.strokeRect(svgX, svgY, svgWidth, svgHeight);

      drawSVG(svgIcons["./youtube"].img,svgX, svgY, svgWidth, svgHeight);
    }

    function updateNodes() {
      const maxSpeed = 2;
      const restitution = 1;
      const passes = 2;
      const fontSize = 20;
      const now = performance.now();
    
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.nextChange === undefined) {
          node.nextChange = now + Math.random() * 3000 + 1000;
        }
        if (now > node.nextChange) {
          node.dx += (Math.random() - 0.5) * 0.3;
          node.dy += (Math.random() - 0.5) * 0.3;
          node.nextChange = now + Math.random() * 3000 + 1000;
        }
    
        const edgeRepulsionStrength = 0.02;
        if (node.x < spawnXStart) node.dx += edgeRepulsionStrength;
        else if (node.x > spawnXEnd) node.dx -= edgeRepulsionStrength;
        if (node.y < spawnYStart) node.dy += edgeRepulsionStrength;
        else if (node.y > spawnYEnd) node.dy -= edgeRepulsionStrength;
    
        const speed = Math.sqrt(node.dx * node.dx + node.dy * node.dy);
        if (speed > maxSpeed) {
          node.dx = (node.dx / speed) * maxSpeed;
          node.dy = (node.dy / speed) * maxSpeed;
        }
      }
    
      for (let pass = 0; pass < passes; pass++) {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const nodeBounds = node.boundingBox; 
          if (!nodeBounds) continue; 
    
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const otherNode = nodes[j];
            const otherNodeBounds = otherNode.boundingBox; 
            if (!otherNodeBounds) continue;
    
            if (
              nodeBounds.left < otherNodeBounds.right &&
              nodeBounds.right > otherNodeBounds.left &&
              nodeBounds.top < otherNodeBounds.bottom &&
              nodeBounds.bottom > otherNodeBounds.top
            ) {
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    
              const nx = dx / distance;
              const ny = dy / distance;
    
              const dvx = node.dx - otherNode.dx;
              const dvy = node.dy - otherNode.dy;
              const dotProduct = dvx * nx + dvy * ny;
    
              if (dotProduct < 0) {
                const impulse = -(1 + restitution) * dotProduct / 2;
                node.dx += impulse * nx;
                node.dy += impulse * ny;
                otherNode.dx -= impulse * nx;
                otherNode.dy -= impulse * ny;
              }
    
              const overlap = Math.min(
                nodeBounds.right - otherNodeBounds.left,
                otherNodeBounds.right - nodeBounds.left,
                nodeBounds.bottom - otherNodeBounds.top,
                otherNodeBounds.bottom - nodeBounds.top
              );
    
              node.x += (nx * overlap) / 2;
              node.y += (ny * overlap) / 2;
              otherNode.x -= (nx * overlap) / 2;
              otherNode.y -= (ny * overlap) / 2;
            }
          }
        }
      }
    
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.dx;
        node.y += node.dy;
        node.dx *= 0.99;
        node.dy *= 0.99;
      }
    }

    function animate() {
      updateNodes();
      drawWireframe();
      requestAnimationFrame(animate);
    }

    createNodes();
    animate();

    const handleResize = () => {
      setCanvasSize(); 
      sizeMultiplier = Math.min(htmlCanvas.width, htmlCanvas.height) / sizeFactor;
      lineOpacityMultiplier = htmlCanvas.width / lineOpacityFactor;
      createNodes();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div>
      <canvas
        ref={wireframeCanvasRef}
        id="wireframeCanvas"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
};

export default MainSite;