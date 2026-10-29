"use client";

import { TypeAnimation } from "react-type-animation";

export default function TypingHeading() {
  return (
    <div className="min-h-[70px] sm:min-h-[90px]">
      <TypeAnimation
        sequence={[
          "Career Path",
          2500,
          "JEE Coaching",
          2000,
          "Dance Classes",
          2000,
          "NEET Coaching",
          2000,
          "Music Classes",
          2000,
          "UPSC Coaching",
          2000,
          "Swimming Classes",
          2000,
          "CAT Coaching",
          2000,
          "Guitar Classes",
          2000,
          "CUET Coaching",
          2000,
          "Cricket Academy",
          2000,
          "CLAT Coaching",
          2000,
          "Martial Arts",
          2000,
          "Class 10 & 12 Tuition",
          2000,
          "Drawing & Painting",
          2000,
        ]}
        wrapper="span"
        speed={40}
        repeat={Infinity}
        className="
          block
          text-amber-400
        "
      />
    </div>
  );
}