"use client";

import { useEffect, useRef } from "react";

interface DiagonalSquaresProps {
  squareSize?: number;
  borderColor?: string;
  hoverColor?: string;
  transitionSpeed?: number;
}

export function DiagonalSquares({
  squareSize = 60,
  borderColor = "rgba(156, 163, 175, 0.15)", // gray-400 with opacity
  hoverColor = "rgba(59, 130, 246, 0.1)", // blue-500 with opacity
  transitionSpeed = 300,
}: DiagonalSquaresProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createSquares = () => {
      const rect = container.getBoundingClientRect();
      const rows = Math.ceil(rect.height / squareSize) + 2;
      const cols = Math.ceil(rect.width / squareSize) + 2;

      // Clear existing squares
      container.innerHTML = "";

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const square = document.createElement("div");
          square.className = "diagonal-square";
          
          // Calculate diagonal offset
          const offset = (i + j) % 2 === 0 ? 0 : squareSize / 2;
          
          square.style.cssText = `
            position: absolute;
            width: ${squareSize}px;
            height: ${squareSize}px;
            left: ${j * squareSize - offset}px;
            top: ${i * squareSize}px;
            border: 1px solid ${borderColor};
            transform: rotate(45deg);
            transition: all ${transitionSpeed}ms ease;
            cursor: pointer;
          `;

          // Add hover effect
          square.addEventListener("mouseenter", () => {
            square.style.backgroundColor = hoverColor;
            square.style.borderColor = borderColor.replace(/[\d.]+\)$/, "0.3)");
            square.style.transform = "rotate(45deg) scale(1.1)";
          });

          square.addEventListener("mouseleave", () => {
            square.style.backgroundColor = "transparent";
            square.style.borderColor = borderColor;
            square.style.transform = "rotate(45deg) scale(1)";
          });

          container.appendChild(square);
        }
      }
    };

    createSquares();

    // Recreate squares on resize
    const handleResize = () => {
      setTimeout(createSquares, 100);
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [squareSize, borderColor, hoverColor, transitionSpeed]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto"
      style={{ zIndex: 1 }}
    />
  );
}
