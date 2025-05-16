"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Folder, FolderOpen, FolderClosed } from "lucide-react"
import { cn } from '@/lib/utils'

interface FolderIconProps {
  isOpen: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  size?: number;
}

const FolderIcon: React.FC<FolderIconProps> = ({ 
  isOpen, 
  onClick, 
  className,
  size = 20
}) => {
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "relative cursor-pointer transition-colors",
        isOpen ? "text-primary" : "text-muted-foreground hover:text-primary/80",
        className
      )}
    >
      <motion.div
        animate={{ opacity: isOpen ? 0 : 1 }}
        initial={{ opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <FolderClosed size={size} />
      </motion.div>
      <motion.div
        animate={{ opacity: isOpen ? 1 : 0 }}
        initial={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <FolderOpen size={size} />
      </motion.div>
    </div>
  );
};

export default FolderIcon; 