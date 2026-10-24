"use client";

import { useState, useEffect } from "react";

export default function AnimatedCounter({
  value,
  decimals = 0,
  suffix = "",
  format,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  format?: "indianCompact" | "standard";
}) {
  let targetValue = value;
  let finalDecimals = decimals;
  let finalSuffix = suffix;

  if (format === "indianCompact") {
    if (value >= 10000000) {
      targetValue = value / 10000000;
      finalDecimals = 1;
      finalSuffix = "Cr+";
    } else if (value >= 100000) {
      targetValue = value / 100000;
      finalDecimals = 1;
      finalSuffix = "L+";
    } else if (value >= 1000) {
      targetValue = value / 1000;
      finalDecimals = 1;
      finalSuffix = "K+";
    }
  }

  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500; // 1.5 seconds animation
    const steps = 60;
    const increment = targetValue / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetValue) {
        setCount(targetValue);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [targetValue]);

  return (
    <span>
      {count.toFixed(finalDecimals)}
      {finalSuffix}
    </span>
  );
}