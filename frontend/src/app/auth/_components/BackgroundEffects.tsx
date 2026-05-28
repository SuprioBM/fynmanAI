"use client";

import { useEffect, useRef } from "react";

export default function BackgroundEffects() {
  const glowOneRef = useRef<HTMLDivElement | null>(null);
  const glowTwoRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const glowOne = glowOneRef.current;
    const glowTwo = glowTwoRef.current;
    const canvas = canvasRef.current;

    if (!glowOne || !glowTwo || !canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return undefined;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 20;
      const y = (event.clientY / window.innerHeight) * 20;

      glowOne.style.transform = `translate(${x}px, ${y}px)`;
      glowTwo.style.transform = `translate(${-x}px, ${-y}px)`;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      speed: Math.random() * 0.2 + 0.1,
    }));

    let animationId = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#bac3ff";

      particles.forEach((particle) => {
        particle.y -= particle.speed;
        if (particle.y < 0) {
          particle.y = canvas.height;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <div
        ref={glowOneRef}
        className="ambient-glow"
        style={{ top: "-10%", left: "-10%" }}
      />
      <div
        ref={glowTwoRef}
        className="ambient-glow"
        style={{ bottom: "-10%", right: "-10%" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-20"
      />
    </>
  );
}
