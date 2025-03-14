import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface BackButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export function BackButton({ 
  onClick, 
  title = '返回', 
  className = ''
}: BackButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button 
        variant="ghost" 
        size="icon" 
        className={`h-7 w-7 mr-1 ${className}`}
        onClick={onClick}
        title={title}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">{title}</span>
      </Button>
    </motion.div>
  );
}

export default BackButton;