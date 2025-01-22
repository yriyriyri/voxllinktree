import React, {
 
  useLayoutEffect,
  useRef,

} from "react";
import { Section } from "../TerminalBar/TerminalBar"; 



interface MainSiteProps {
  addLine: (id: string, content: Section[]) => void;
}

interface Node {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  boundingBox: { left: number; right: number; top: number; bottom: number; width?: number; height?: number };
  nextChange?: number;
}



const MainSite: React.FC<MainSiteProps> = ({ addLine }) => {
  const wireframeCanvasRef = useRef<HTMLCanvasElement>(null);

  const spawnZone = useRef({
    spawnWidth: 0,
    spawnHeight: 0,
    spawnXStart: 0,
    spawnYStart: 0,
    spawnXEnd: 0,
    spawnYEnd: 0,
  });

  useLayoutEffect(() => {
    const htmlCanvas = wireframeCanvasRef.current!;
    if (!htmlCanvas) return;

    const ctx = htmlCanvas.getContext("2d", { willReadFrequently: true })!;
    if (!ctx) return;

    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      htmlCanvas.width = window.innerWidth * dpr;
      htmlCanvas.height = window.innerHeight * dpr;
      htmlCanvas.style.width = `${window.innerWidth}px`;
      htmlCanvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
  
      const spawnWidth = window.innerWidth * 0.6;
      const spawnHeight = window.innerHeight * 0.6;
      const spawnXStart = (window.innerWidth - spawnWidth) / 2 + window.innerHeight * 0.1;
      const spawnYStart = (window.innerHeight - spawnHeight) / 2;
      const spawnXEnd = spawnXStart + spawnWidth;
      const spawnYEnd = spawnYStart + spawnHeight;
  
      spawnZone.current = { spawnWidth, spawnHeight, spawnXStart, spawnYStart, spawnXEnd, spawnYEnd };
    };

    setCanvasSize();

    const lineOpacityFactor = 18;
    let lineOpacityMultiplier = (htmlCanvas.width / lineOpacityFactor) + 100;

    let nodes: Node[] = [];
    let textArray = ["./trailer", "./instagram", "./X", "./discord", "./steam", "./youtube", "./about-us", "./contact","l","./TimeUntilRelease"];
    let linkArray = ["placeholderlink","https://www.instagram.com/voxl.online/","https://x.com/voxldev","placeholderlink","placeholderlink","https://www.youtube.com/channel/UCgCwjJJ7qHF0QV27CzHSZnw",null,null,null,null]
    let functionArray = [null,null,null,null,null,null,"1","2",null,null]
    const numNodes = 8;
    const svgIcons = {
      "./instagram": {
        img: new Image(),
        color: "#0000FF", 
      },
      "./X": {
        img: new Image(),
        color: "#729FCF", 
      },
      "./youtube": {
        img: new Image(),
        color: "#CC0000", 
      },
    };
    
    svgIcons["./instagram"].img.src = "/images/icons/instagram.svg";
    svgIcons["./X"].img.src = "/images/icons/x.svg";
    svgIcons["./youtube"].img.src = "/images/icons/youtube.svg";

    let hoveredNodeIndex: number | null = null;

    const createNodes = () => {
      nodes = [];
      for (let i = 0; i < numNodes; i++) {
        const { spawnWidth, spawnHeight, spawnXStart, spawnYStart } = spawnZone.current;
        const x = Math.random() * (spawnWidth - 20) + spawnXStart + 10;
        const y = Math.random() * (spawnHeight - 20) + spawnYStart + 10;
  
        nodes.push({
          x,
          y,
          z: Math.random() * (70 - 10),
          dx: (Math.random() - 0.5) * 1,
          dy: (Math.random() - 0.5) * 1,
          boundingBox: { left: 0, right: 0, top: 0, bottom: 0 },
        });
      }
  
      nodes.push({
        x: window.innerWidth - 450,
        y: spawnZone.current.spawnYStart,
        z: Math.random() * (70 - 10),
        dx: 0,
        dy: 0,
        boundingBox: { left: 0, right: 0, top: 0, bottom: 0 },
      });
  
      nodes.push({
        x: spawnZone.current.spawnXEnd - 280,
        y: spawnZone.current.spawnYStart - 50,
        z: Math.random() * (70 - 10),
        dx: 0,
        dy: 0,
        boundingBox: { left: 0, right: 0, top: 0, bottom: 0 },
      });
    };

    function drawWireframe() {
      ctx.clearRect(0, 0, htmlCanvas.width, htmlCanvas.height);
      ctx.fillStyle = "#FFFFFF"; 
      ctx.fillRect(0, 0, htmlCanvas.width, htmlCanvas.height); 
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = "source-over";
    
      const defaultFontSize = 16;
      const smallFontSize = 10;
      ctx.fillStyle = "#000000"; //
      const lineWidth = defaultFontSize / 12;
    
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = "#000000"; //
    
      function drawSVG(img: HTMLImageElement, x: number, y: number, width: number, height: number) {
        if (img.complete) {
          ctx.drawImage(img, x, y, width, height); 
        } else {
          return
        }
      }
    
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const fontSize = i >= nodes.length - 2 ? smallFontSize : defaultFontSize;
      
        for (let j = i + 1; j < nodes.length; j++) {
          const targetNode = nodes[j];
          const targetFontSize = j >= nodes.length - 2 ? smallFontSize : defaultFontSize;
          const charWidth = fontSize * 0.6;
          const targetCharWidth = targetFontSize * 0.6;
          const boxWidth = (textArray[i]?.length + 4 || 0) * charWidth;
          const targetBoxWidth = (textArray[j]?.length + 4 || 0) * targetCharWidth;
          const endX = targetNode.x - targetBoxWidth / 2;
          const endY = targetNode.y;
          const dx = endX - node.x;
          const dy = endY - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
      
          let lineOpacity;
          
          if ((i === numNodes && j === numNodes + 1) || (i === numNodes + 1 && j === numNodes)) {
            lineOpacity = Math.max(0.5, 1 - distance / lineOpacityMultiplier);
          } else {
            lineOpacity = Math.max(0, 1 - distance / lineOpacityMultiplier);
          }
      
          if (lineOpacity > 0) {
            const whiteRatio = Math.max(1, Math.round(10 * lineOpacity)); //
            const blackRatio = Math.max(1, Math.round(10 * (1 - lineOpacity))); //
            ctx.setLineDash([whiteRatio, blackRatio]);
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isSpecialNode = i > numNodes -1; 
        const fontSize = isSpecialNode
          ? i === numNodes + 1 
            ? 12 
            : 16 
          : i >= nodes.length - 4
          ? smallFontSize
          : defaultFontSize;
        ctx.font = `${fontSize}px "dico-code-two", monospace`;
      
        ctx.textBaseline = "top";
      
        const charWidth = fontSize * 0.6;
        let boxWidth = (textArray[i]?.length + 4 || 0) * charWidth;
        const boxHeight = fontSize * 3;
      
        let x = node.x - boxWidth / 2;
        let y = node.y - boxHeight / 2;
      
        if (isSpecialNode) {
          if (i === numNodes) {
            let baseHorizontalPadding = 0;
            let baseVerticalPadding = 16;

            let effectiveHorizontalPadding = baseHorizontalPadding;
            let effectiveVerticalPadding = baseVerticalPadding;

            if (i === hoveredNodeIndex) {
              effectiveHorizontalPadding += 10;
              effectiveVerticalPadding += 10;
            }

            const cornerArmX = 5;
            const cornerArmY = 5;
            const leftWall = "  ";
            const loadingBar = "█████▓▓▓▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░";
            const statsLeft = " [";
            const statsMiddle = "???";
            const statsRight = "/304]";
            const rightWall = "  ";
            const combinedText = leftWall + loadingBar + statsLeft + statsMiddle + statsRight + rightWall;
            const textWidth = ctx.measureText(combinedText).width;

            const boxWidth = textWidth + effectiveHorizontalPadding;
            const boxHeight = fontSize + effectiveVerticalPadding;
            let x = node.x - boxWidth / 2;
            let y = node.y - boxHeight / 2;

            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = lineWidth;
            ctx.beginPath();

            // Top-left
            ctx.moveTo(x, y);
            ctx.lineTo(x + cornerArmX, y);
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cornerArmY);

            // Top-right
            ctx.moveTo(x + boxWidth, y);
            ctx.lineTo(x + boxWidth - cornerArmX, y);
            ctx.moveTo(x + boxWidth, y);
            ctx.lineTo(x + boxWidth, y + cornerArmY);

            // Bottom-left
            ctx.moveTo(x, y + boxHeight);
            ctx.lineTo(x + cornerArmX, y + boxHeight);
            ctx.moveTo(x, y + boxHeight);
            ctx.lineTo(x, y + boxHeight - cornerArmY);

            // Bottom-right
            ctx.moveTo(x + boxWidth, y + boxHeight);
            ctx.lineTo(x + boxWidth - cornerArmX, y + boxHeight);
            ctx.moveTo(x + boxWidth, y + boxHeight);
            ctx.lineTo(x + boxWidth, y + boxHeight - cornerArmY);

            ctx.stroke();
            ctx.restore();

            const highlightX = x + effectiveHorizontalPadding / 2;
            const highlightY = y + effectiveVerticalPadding / 2;
            const highlightWidth = textWidth;
            const highlightHeight = fontSize;

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(highlightX, highlightY, highlightWidth, highlightHeight);

            const leftWallWidth = ctx.measureText(leftWall).width;
            const loadingBarWidth = ctx.measureText(loadingBar).width;
            const statsLeftWidth = ctx.measureText(statsLeft).width;
            const statsMiddleWidth = ctx.measureText(statsMiddle).width;
            const statsRightWidth = ctx.measureText(statsRight).width;

            let currentX = highlightX;

            ctx.fillStyle = "#000000";
            ctx.fillText(leftWall, currentX, highlightY);
            currentX += leftWallWidth;

            ctx.fillStyle = "red";
            ctx.fillRect(currentX, highlightY, loadingBarWidth, fontSize);
            ctx.fillStyle = "purple";
            ctx.fillText(loadingBar, currentX, highlightY);
            currentX += loadingBarWidth;

            ctx.fillStyle = "#4AF626";
            ctx.fillText(statsLeft, currentX, highlightY);
            currentX += statsLeftWidth;

            ctx.fillStyle = "#FF0000";
            ctx.fillText(statsMiddle, currentX, highlightY);
            currentX += statsMiddleWidth;

            ctx.fillStyle = "#4AF626";
            ctx.fillText(statsRight, currentX, highlightY);
            currentX += statsRightWidth;

            ctx.fillStyle = "#000000";
            ctx.fillText(rightWall, currentX, highlightY);

            node.boundingBox = {
              left: x,
              right: x + boxWidth,
              top: y,
              bottom: y + boxHeight,
              width: boxWidth,
              height: boxHeight,
            };

          } else if (i === numNodes + 1) {
            let baseHorizontalPadding = 0;
            let baseVerticalPadding = 16;

            if (i === hoveredNodeIndex) {
              baseHorizontalPadding += 10;
              baseVerticalPadding += 10;
            }

            const cornerArmX = 5;
            const cornerArmY = 5;
            const fontSize = 12;
            ctx.font = `${fontSize}px "dico-code-two", monospace`;

            const paddedText = `  ${textArray[i] || ""}  `;
            const returnValue = `[UNDEFINED]`;
            const rightWall = `  `;
            const displayedText = paddedText + returnValue + rightWall;

            const textWidth = ctx.measureText(displayedText).width;
            const boxWidth = textWidth + baseHorizontalPadding;
            const boxHeight = fontSize + baseVerticalPadding;
            let x = node.x - boxWidth / 2;
            let y = node.y - boxHeight / 2;

            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = lineWidth;
            ctx.beginPath();

            // Top-left
            ctx.moveTo(x, y);
            ctx.lineTo(x + cornerArmX, y);
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cornerArmY);

            // Top-right
            ctx.moveTo(x + boxWidth, y);
            ctx.lineTo(x + boxWidth - cornerArmX, y);
            ctx.moveTo(x + boxWidth, y);
            ctx.lineTo(x + boxWidth, y + cornerArmY);

            // Bottom-left
            ctx.moveTo(x, y + boxHeight);
            ctx.lineTo(x + cornerArmX, y + boxHeight);
            ctx.moveTo(x, y + boxHeight);
            ctx.lineTo(x, y + boxHeight - cornerArmY);

            // Bottom-right
            ctx.moveTo(x + boxWidth, y + boxHeight);
            ctx.lineTo(x + boxWidth - cornerArmX, y + boxHeight);
            ctx.moveTo(x + boxWidth, y + boxHeight);
            ctx.lineTo(x + boxWidth, y + boxHeight - cornerArmY);

            ctx.stroke();
            ctx.restore();

            const baseHighlightX = x + baseHorizontalPadding / 2;
            const baseHighlightY = y + baseVerticalPadding / 2;
            const baseHighlightWidth = textWidth;
            const baseHighlightHeight = fontSize;

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(baseHighlightX, baseHighlightY, baseHighlightWidth, baseHighlightHeight);

            const paddedTextWidth = ctx.measureText(paddedText).width;
            const returnValueWidth = ctx.measureText(returnValue).width;

            ctx.fillStyle = "#0000FF";
            ctx.fillRect(
              baseHighlightX + paddedTextWidth,
              baseHighlightY,
              returnValueWidth,
              fontSize
            );

            ctx.fillStyle = "#000000";
            ctx.fillText(paddedText, baseHighlightX, baseHighlightY);
            ctx.fillStyle = "#FF0000";
            ctx.fillText(returnValue, baseHighlightX + paddedTextWidth, baseHighlightY);
            ctx.fillStyle = "#000000";
            ctx.fillText(
              rightWall,
              baseHighlightX + paddedTextWidth + returnValueWidth,
              baseHighlightY
            );

            if (i === hoveredNodeIndex) {
              const underlineY = baseHighlightY + fontSize + 1;
              const underlineWidth = ctx.measureText(textArray[i] || "").width;
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(baseHighlightX + ctx.measureText("--").width, underlineY);
              ctx.lineTo(baseHighlightX + ctx.measureText("--").width + underlineWidth, underlineY);
              ctx.stroke();
            }

            node.boundingBox = {
              left: x,
              right: x + boxWidth,
              top: y,
              bottom: y + boxHeight,
              width: boxWidth,
              height: boxHeight,
            };
          }
        } else if (Object.keys(svgIcons).includes(textArray[i])) {
          let baseHorizontalPadding = 0;
          let baseVerticalPadding = 16;

          if (i === hoveredNodeIndex) {
            baseHorizontalPadding += 10;
            baseVerticalPadding += 10;
          }

          const cornerArmX = 5;
          const cornerArmY = 5;
          const svgEntry = svgIcons[textArray[i] as keyof typeof svgIcons];
          const svgColor = svgEntry.color || "#000000";
          const textBeforeBrackets = `  ${textArray[i] || ""} `;
          const brackets = "[  ]";
          const rightWall = "  ";
          const measurementString = `${textBeforeBrackets}${brackets} ${rightWall}`;
          const measuredTextWidth = ctx.measureText(measurementString).width;
          const boxWidth = measuredTextWidth + baseHorizontalPadding;
          const boxHeight = fontSize + baseVerticalPadding;
          let x = node.x - boxWidth / 2;
          let y = node.y - boxHeight / 2;

          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = lineWidth;
          ctx.beginPath();

          // Top-left
          ctx.moveTo(x, y);
          ctx.lineTo(x + cornerArmX, y);
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cornerArmY);

          // Top-right
          ctx.moveTo(x + boxWidth, y);
          ctx.lineTo(x + boxWidth - cornerArmX, y);
          ctx.moveTo(x + boxWidth, y);
          ctx.lineTo(x + boxWidth, y + cornerArmY);

          // Bottom-left
          ctx.moveTo(x, y + boxHeight);
          ctx.lineTo(x + cornerArmX, y + boxHeight);
          ctx.moveTo(x, y + boxHeight);
          ctx.lineTo(x, y + boxHeight - cornerArmY);

          // Bottom-right
          ctx.moveTo(x + boxWidth, y + boxHeight);
          ctx.lineTo(x + boxWidth - cornerArmX, y + boxHeight);
          ctx.moveTo(x + boxWidth, y + boxHeight);
          ctx.lineTo(x + boxWidth, y + boxHeight - cornerArmY);

          ctx.stroke();
          ctx.restore();

          const highlightX = x + baseHorizontalPadding / 2;
          const highlightY = y + baseVerticalPadding / 2;
          const highlightWidth = measuredTextWidth;
          const highlightHeight = fontSize;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(highlightX, highlightY, highlightWidth, highlightHeight);

          ctx.fillStyle = "#000000";
          ctx.fillText(textBeforeBrackets, highlightX, highlightY);

          const bracketsX = highlightX + ctx.measureText(textBeforeBrackets).width;
          ctx.fillStyle = svgColor;
          ctx.fillText(brackets, bracketsX, highlightY);

          const svgWidth = 19.2;
          const svgHeight = 19.2;
          const svgIconX = bracketsX + ctx.measureText("-").width;
          drawSVG(svgEntry.img, svgIconX, highlightY - 3.2, svgWidth, svgHeight);

          ctx.fillStyle = "#000000";
          const rightWallX =
            bracketsX + ctx.measureText(brackets).width + ctx.measureText(" ").width;
          ctx.fillText(rightWall, rightWallX, highlightY);

          if (i === hoveredNodeIndex) {
            const underlineY = highlightY + fontSize + 1;
            const tWidth = ctx.measureText(textArray[i] || "").width;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(highlightX + ctx.measureText("--").width, underlineY);
            ctx.lineTo(highlightX + ctx.measureText("--").width + tWidth, underlineY);
            ctx.stroke();
          }

          node.boundingBox = {
            left: x,
            right: x + boxWidth,
            top: y,
            bottom: y + boxHeight,
            width: boxWidth,
            height: boxHeight,
          };
        } else {
          let baseHorizontalPadding = 0;
          let baseVerticalPadding = 16;

          let effectiveHorizontalPadding = baseHorizontalPadding;
          let effectiveVerticalPadding = baseVerticalPadding;

          if (i === hoveredNodeIndex) {
            effectiveHorizontalPadding += 10;
            effectiveVerticalPadding += 10;
          }

          const cornerArmX = 5;
          const cornerArmY = 5;
          const displayedText = `  ${textArray[i] || ""}  `;
          const textWidth = ctx.measureText(displayedText).width;

          const boxWidth = textWidth + effectiveHorizontalPadding;
          const boxHeight = fontSize + effectiveVerticalPadding;

          let x = node.x - boxWidth / 2;
          let y = node.y - boxHeight / 2;

          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = lineWidth;
          ctx.beginPath();

          // Top-left
          ctx.moveTo(x, y);
          ctx.lineTo(x + cornerArmX, y);
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cornerArmY);

          // Top-right
          ctx.moveTo(x + boxWidth, y);
          ctx.lineTo(x + boxWidth - cornerArmX, y);
          ctx.moveTo(x + boxWidth, y);
          ctx.lineTo(x + boxWidth, y + cornerArmY);

          // Bottom-left
          ctx.moveTo(x, y + boxHeight);
          ctx.lineTo(x + cornerArmX, y + boxHeight);
          ctx.moveTo(x, y + boxHeight);
          ctx.lineTo(x, y + boxHeight - cornerArmY);

          // Bottom-right
          ctx.moveTo(x + boxWidth, y + boxHeight);
          ctx.lineTo(x + boxWidth - cornerArmX, y + boxHeight);
          ctx.moveTo(x + boxWidth, y + boxHeight);
          ctx.lineTo(x + boxWidth, y + boxHeight - cornerArmY);

          ctx.stroke();
          ctx.restore();

          const textFillX = x + effectiveHorizontalPadding / 2;
          const textFillY = y + effectiveVerticalPadding / 2;
          const textFillWidth = ctx.measureText(displayedText).width;
          const textFillHeight = fontSize;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(textFillX, textFillY, textFillWidth, textFillHeight);

          ctx.fillStyle = "#000000";
          ctx.fillText(displayedText, textFillX, textFillY);

          if (i === hoveredNodeIndex) {
            const underlineY = textFillY + fontSize + 1;
            const actualTextWidth = ctx.measureText(textArray[i] || "").width;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(textFillX + ctx.measureText("--").width, underlineY);
            ctx.lineTo(textFillX + ctx.measureText("--").width + actualTextWidth, underlineY);
            ctx.stroke();
          }

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

      // ctx.strokeStyle = "red"; 
      // ctx.lineWidth = 2; 

      // const { spawnXStart, spawnXEnd, spawnYStart, spawnYEnd } = spawnZone.current;
      // const debugWidth = spawnXEnd - spawnXStart;
      // const debugHeight = spawnYEnd - spawnYStart;

      // ctx.strokeRect(spawnXStart, spawnYStart, debugWidth, debugHeight);
    }

    function updateNodes() {
      const { spawnXStart, spawnXEnd, spawnYStart, spawnYEnd } = spawnZone.current;
      const maxSpeed = 2;
      const restitution = 1;
      const passes = 2;
      const edgeRepulsionStrength = 0.02;
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
    
        if (i < numNodes) {
          if (node.x < spawnXStart) node.dx += edgeRepulsionStrength;
          else if (node.x > spawnXEnd) node.dx -= edgeRepulsionStrength;
          if (node.y < spawnYStart) node.dy += edgeRepulsionStrength;
          else if (node.y > spawnYEnd) node.dy -= edgeRepulsionStrength;
        } else {
          const { left, right, top, bottom } = node.boundingBox;
          if (left < 0) node.dx += edgeRepulsionStrength;
          else if (right > window.innerWidth) node.dx -= edgeRepulsionStrength;
          if (top < 0) node.dy += edgeRepulsionStrength;
          else if (bottom > window.innerHeight) node.dy -= edgeRepulsionStrength;
        }
    
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

    htmlCanvas.addEventListener("mousemove", (event) => {
      const rect = htmlCanvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      hoveredNodeIndex = null;
      for (let i = 0; i < nodes.length; i++) {
        const bb = nodes[i].boundingBox;
        if (
          mouseX >= bb.left &&
          mouseX <= bb.right &&
          mouseY >= bb.top &&
          mouseY <= bb.bottom
        ) {
          hoveredNodeIndex = i;
          break;
        }
      }
    });

    htmlCanvas.addEventListener("click", (event) => {
      if (hoveredNodeIndex !== null && hoveredNodeIndex < nodes.length) {
        const link = linkArray[hoveredNodeIndex];
        const text = textArray[hoveredNodeIndex];
        const func = functionArray[hoveredNodeIndex];
    
        if (func !== null) {
          if (func === "1") {
            addLine("aboutusOutput", [
              { text: text, color: "#34E2E2" },
            ]);
            addLine("aboutusOutput1", [
              { text: "          >", color: "#3465A4" },
              { text: " VOXL is an innovative social building game that pushes the boundaries of creativity and immersive gameplay. ", color: "#000000" }, //
            ]);
            addLine("padding", [
              { text: "   ", color: "#3465A4" },
            ]);
            addLine("aboutusOutput2", [
              { text: "          >", color: "#3465A4" },
              { text: " Unleash your imagination, build connections, and shape your own adventure in this stunningly crafted universe—where the only limit is your creativity. ", color: "#000000" }, //
            ]);
            addLine("padding", [
              { text: "   ", color: "#3465A4" },
            ]);
          }else{
            addLine("contactOutput", [
              { text: text, color: "#34E2E2" },
            ]);
            addLine("contactOutput1", [
              { text: "          >", color: "#3465A4" },
              { text: " dickheadtest@gmail.com", color : "#000000"}, //
            ]);
            addLine("padding", [
              { text: "   ", color: "#3465A4" },
            ]);
          } 
        } else if (link === null) {
        } else if (link === "placeholderlink") {
          addLine("noLinkNode", [
            { text: text, color: "#AD7FA8" },
            { text: " no linked node", color: "#000000" }, //
          ]);
        } else {
          window.open(link, "_blank");
        }
      } else {
        console.log("No node clicked");
      }
    });

    const handleResize = () => {
      setCanvasSize(); 
      let lineOpacityMultiplier = (htmlCanvas.width / lineOpacityFactor) + 100;
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