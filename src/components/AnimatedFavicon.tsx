"use client";

import { useEffect } from "react";

export default function AnimatedFavicon() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const img = new Image();
    img.src = "/icon-192.png";
    img.crossOrigin = "anonymous";

    let intervalId: ReturnType<typeof setInterval> | null = null;

    img.onload = () => {
      const size = 32;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const totalFrames = 16;
      const frames: string[] = [];

      // Pre-render 16 smooth frames of rocket hovering, bobbing, and thrusting
      for (let i = 0; i < totalFrames; i++) {
        const progress = (i / totalFrames) * Math.PI * 2;
        ctx.clearRect(0, 0, size, size);

        // Rocket flight motion along ↗️ diagonal
        const thrust = Math.sin(progress);
        const offsetX = thrust * 2.2;
        const offsetY = -thrust * 2.2;
        const tilt = Math.sin(progress * 2) * 0.06; // subtle aerodynamic wobble
        const scale = 0.94 + ((thrust + 1) / 2) * 0.08; // scale pulse

        ctx.save();
        ctx.translate(size / 2 + offsetX, size / 2 + offsetY);
        ctx.rotate(tilt);
        ctx.scale(scale, scale);

        // Draw the rocket icon
        const iconSize = 27;
        ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);

        // Animated rocket exhaust / thruster spark particles behind the bottom-left
        if (thrust > -0.2) {
          const flamePower = (thrust + 0.2) / 1.2;
          const flameSize = 2 + flamePower * 2;
          const flameOffset = 11 + flamePower * 2.5;

          ctx.beginPath();
          ctx.arc(-flameOffset, flameOffset, flameSize, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? "#f59e0b" : "#ef4444";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 4;
          ctx.fill();

          // Inner white-hot core
          ctx.beginPath();
          ctx.arc(-flameOffset + 1, flameOffset - 1, flameSize * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = "#fef08a";
          ctx.fill();
        }

        ctx.restore();

        frames.push(canvas.toDataURL("image/png"));
      }

      // Initialize dynamic favicon link tag
      let link = document.querySelector<HTMLLinkElement>("link#dynamic-favicon");
      if (!link) {
        // Disable default static favicon links to let dynamic favicon take full precedence
        const existingLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
        existingLinks.forEach((el) => {
          el.removeAttribute("rel");
        });

        link = document.createElement("link");
        link.id = "dynamic-favicon";
        link.rel = "icon";
        link.type = "image/png";
        document.head.appendChild(link);
      }

      let currentFrame = 0;

      const tick = () => {
        if (!link || frames.length === 0) return;
        currentFrame = (currentFrame + 1) % frames.length;
        link.href = frames[currentFrame];
      };

      // 100ms interval = ~10 FPS for a smooth, battery-friendly loop
      intervalId = setInterval(tick, 100);
    };

    // Animated Title: Scrolling Marquee with Color-Changing Orbs
    const colorOrbs = ["🟡", "🟠", "🔴", "🟣", "🔵", "🟢"];
    const baseText = "🚀 DeeDevIOT  •  HTML Show ✨  •  ";
    let textOffset = 0;
    let orbIndex = 0;

    const titleIntervalId = setInterval(() => {
      textOffset = (textOffset + 1) % baseText.length;
      orbIndex = (orbIndex + 1) % colorOrbs.length;
      const scrolledText = baseText.slice(textOffset) + baseText.slice(0, textOffset);
      document.title = `${colorOrbs[orbIndex]} ${scrolledText}`;
    }, 320);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (titleIntervalId) clearInterval(titleIntervalId);
    };
  }, []);

  return null;
}
