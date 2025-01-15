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

    // Initialize canvas size
    htmlCanvas.width = window.innerWidth;
    htmlCanvas.height = window.innerHeight;

    // Variables and settings
    const sizeFactor = 80;
    const lineOpacityFactor = 2.5;
    let sizeMultiplier = Math.min(htmlCanvas.width, htmlCanvas.height) / sizeFactor;
    let lineOpacityMultiplier = htmlCanvas.width / lineOpacityFactor;

    let nodes: Node[] = [];
    let textArray = ["Trailer", "Instagram", "X", "Discord", "Facebook", "Youtube", "About Us", "Contact"];
    const numNodes = 7;
    let hoveredNodeIndex = -1;

    function generateRandomHex(length: number): string {
      let result = "";
      const characters = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/~`-=";
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }

    function createNodes() {
      nodes = [];
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          x: Math.random() * htmlCanvas.width,
          y: Math.random() * htmlCanvas.height,
          z: Math.random() * (70 - 10),
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          boundingBox: { left: 0, right: 0, top: 0, bottom: 0 },
        });
      }

      nodes.push({
        x: htmlCanvas.width / 2,
        y: htmlCanvas.height / 2,
        z: 0.1,
        dx: 0,
        dy: 0,
        boundingBox: { left: 0, right: 0, top: 0, bottom: 0 },
      });
    }

    function drawWireframe() {
      ctx.clearRect(0, 0, htmlCanvas.width, htmlCanvas.height);
      ctx.lineWidth = 3;

      // Draw lines between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const z1 = nodes[i].z;
          const z2 = nodes[j].z;

          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const lineOpacity = Math.max(0, 1 - distance / lineOpacityMultiplier);
          const opacity1 = Math.max(0.2, 1 - z1 / 100);
          const opacity2 = Math.max(0.2, 1 - z2 / 100);
          const finalOpacity1 = Math.min(lineOpacity, opacity1);
          const finalOpacity2 = Math.min(lineOpacity, opacity2);

          const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity1})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${finalOpacity2})`);
          ctx.strokeStyle = gradient;

          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      // Draw nodes with text
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const text = textArray[i] || "";
        const size = Math.max(5 * sizeMultiplier * (1 - node.z / 100), 1);
        const height = size;
        ctx.font = `${height}px "Courier New"`;
        const textWidth = ctx.measureText(text).width;
        const width = textWidth + 10;

        let boxColor = "rgb(3, 10, 16)";
        let textColor = `rgba(255, 255, 255, ${Math.max(0.2, 1 - node.z / 100)})`;
        let borderOpacity = Math.max(0.2, 1 - node.z / 100);

        if (i === hoveredNodeIndex) {
          boxColor = "white";
          textColor = "rgb(3, 10, 16)";
          borderOpacity = 1;
        }

        ctx.fillStyle = boxColor;
        ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height);
        ctx.strokeStyle = `rgba(255, 255, 255, ${borderOpacity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(node.x - width / 2, node.y - height / 2, width, height);
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, node.x, node.y);

        node.boundingBox = {
          left: node.x - width / 2,
          right: node.x + width / 2,
          top: node.y - height / 2,
          bottom: node.y + height / 2,
          width,
          height,
        };
      }
    }

    function updateNodes() {
      const maxSpeed = 2;
      const restitution = 1;
      const passes = 2;
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
        if (node.x < 150) node.dx += edgeRepulsionStrength;
        else if (node.x > htmlCanvas.width - 50) node.dx -= edgeRepulsionStrength;
        if (node.y < 100) node.dy += edgeRepulsionStrength;
        else if (node.y > htmlCanvas.height - 50) node.dy -= edgeRepulsionStrength;

        const speed = Math.sqrt(node.dx * node.dx + node.dy * node.dy);
        if (speed > maxSpeed) {
          node.dx = (node.dx / speed) * maxSpeed;
          node.dy = (node.dy / speed) * maxSpeed;
        }
      }

      for (let pass = 0; pass < passes; pass++) {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          ctx.font = `${Math.max(5 * sizeMultiplier * (1 - node.z / 100), 1)}px "Courier New"`;
          const textWidth = ctx.measureText(textArray[i] || "").width;
          const nodeWidth = textWidth + 10;
          const nodeHeight = Math.max(5 * sizeMultiplier * (1 - node.z / 100), 1);

          const nodeBounds = {
            left: node.x - nodeWidth / 2,
            right: node.x + nodeWidth / 2,
            top: node.y - nodeHeight / 2,
            bottom: node.y + nodeHeight / 2,
          };

          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const otherNode = nodes[j];

            ctx.font = `${Math.max(5 * sizeMultiplier * (1 - otherNode.z / 100), 1)}px "Courier New"`;
            const otherTextWidth = ctx.measureText(textArray[j] || "").width;
            const otherNodeWidth = otherTextWidth + 10;
            const otherNodeHeight = Math.max(5 * sizeMultiplier * (1 - otherNode.z / 100), 1);

            const otherNodeBounds = {
              left: otherNode.x - otherNodeWidth / 2,
              right: otherNode.x + otherNodeWidth / 2,
              top: otherNode.y - otherNodeHeight / 2,
              bottom: otherNode.y + otherNodeHeight / 2,
            };

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
                const j = -(1 + restitution) * dotProduct / 2;
                node.dx += j * nx;
                node.dy += j * ny;
                otherNode.dx -= j * nx;
                otherNode.dy -= j * ny;
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
      htmlCanvas.width = window.innerWidth;
      htmlCanvas.height = window.innerHeight;
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