import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "purple" | "blue" | "emerald" | "none";
  hoverScale?: boolean;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  glowColor = "none",
  hoverScale = true,
  delay = 0
}) => {
  const glowClasses = {
    purple: "glow-purple hover:border-purple-500/30",
    blue: "glow-blue hover:border-blue-500/30",
    emerald: "glow-emerald hover:border-emerald-500/30",
    none: ""
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hoverScale ? { y: -4, scale: 1.015 } : {}}
      whileTap={{ scale: 0.985 }}
      className={`glass glass-shine-hover rounded-2xl p-6 transition-all duration-300 ${glowClasses[glowColor]} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
