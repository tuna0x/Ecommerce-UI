import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator: React.FC = () => (
    <div className="flex gap-2 mb-3 justify-start">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0 mt-auto shadow-sm">
            <span className="text-xs font-semibold text-white">B</span>
        </div>
        <div className="bg-white border border-pink-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-pink-400"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>
        </div>
    </div>
);

export default TypingIndicator;
