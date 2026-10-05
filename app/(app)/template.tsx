"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { pageVariants } from "@/lib/motion";

/** Re-mounts on every navigation — gives each page a short, calm entrance. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter">
      {children}
    </motion.div>
  );
}
