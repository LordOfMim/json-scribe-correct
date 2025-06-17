
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface JSONInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
}

const JSONInput = ({ value, onChange, isValid }: JSONInputProps) => {
  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Paste your JSON here...'
        className={`min-h-[400px] font-mono text-sm resize-none bg-slate-800/50 border-2 transition-colors duration-200 text-white placeholder:text-slate-400 ${
          isValid 
            ? 'border-blue-300/30 focus:border-blue-400' 
            : 'border-red-400/50 focus:border-red-400'
        }`}
      />
      <div className="absolute bottom-3 right-3 text-xs text-slate-400">
        {value.length} characters
      </div>
    </div>
  );
};

export default JSONInput;
