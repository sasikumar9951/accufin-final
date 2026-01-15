"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Type alias for animation direction
type Direction = "up" | "down" | "left" | "right";

// Helper functions to calculate animation offsets
const getYOffset = (direction: Direction, amount: number): number => {
  if (direction === "up") return amount;
  if (direction === "down") return -amount;
  return 0;
};

const getXOffset = (direction: Direction, amount: number): number => {
  if (direction === "left") return amount;
  if (direction === "right") return -amount;
  return 0;
};

const getYOffsetString = (direction: Direction): string | number => {
  if (direction === "up") return "100%";
  if (direction === "down") return "-100%";
  return 0;
};

const getXOffsetString = (direction: Direction): string | number => {
  if (direction === "left") return "100%";
  if (direction === "right") return "-100%";
  return 0;
};

export function PageWrapper({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export const fadeIn = (
  direction: Direction,
  delay = 0
) => {
  return {
    hidden: {
      y: getYOffset(direction, 80),
      x: getXOffset(direction, 80),
      opacity: 0,
    },
    show: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: "tween",
        duration: 1.2,
        delay: delay,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  };
};

export const staggerContainer = (
  staggerChildren: number,
  delayChildren = 0
) => {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
};

export const flyIn = (
  direction: Direction,
  delay = 0
) => {
  return {
    hidden: {
      y: getYOffset(direction, 100),
      x: getXOffset(direction, 100),
      opacity: 0,
    },
    show: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        duration: 1.5,
        delay: delay,
      },
    },
  };
};

export const zoomIn = (delay = 0, duration = 1) => {
  return {
    hidden: {
      scale: 0.5,
      opacity: 0,
    },
    show: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "tween",
        ease: "easeOut",
        duration,
        delay,
      },
    },
  };
};

export const slideIn = (
  direction: Direction,
  delay = 0,
  duration = 1
) => {
  return {
    hidden: {
      y: getYOffsetString(direction),
      x: getXOffsetString(direction),
      opacity: 0,
    },
    show: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration,
        delay,
      },
    },
  };
};

export const textVariant = (delay = 0) => {
  return {
    hidden: {
      y: 50,
      opacity: 0,
    },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: 1.25,
        delay,
      },
    },
  };
};

export const textContainer = {
  hidden: {
    opacity: 0,
  },
  show: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: i * 0.1 },
  }),
};

export const textVariant2 = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      ease: "easeIn",
    },
  },
};

export const cardVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: "easeOut",
    },
  }),
};

export const cardHoverVariants = {
  hover: {
    y: -15,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const buttonHoverVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

export const MotionSection = motion.section;
export const MotionDiv = motion.div;
export const MotionH1 = motion.h1;
export const MotionH2 = motion.h2;
export const MotionH3 = motion.h3;
export const MotionP = motion.p;
export const MotionSpan = motion.span;
export const MotionButton = motion.button;
export const MotionImg = motion.img;
export const MotionA = motion.a;
