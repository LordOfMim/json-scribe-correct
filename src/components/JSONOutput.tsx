import React from 'react';

interface JSONOutputProps {
  json: string;
  isValid: boolean;
}

const JSONOutput = ({ json, isValid }: JSONOutputProps) => {
  const highlightJSON = (jsonStr: string): string => {
    if (!jsonStr) return '';
    
    return jsonStr
      .replace(/(".*?")\s*:/g, '<span class="text-blue-300">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="text-green-300">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-300">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-yellow-300">$1</span>')
      .replace(/([{}[\]])/g, '<span class="text-gray-300">$1</span>')
  };

  const processLinesWithIndentation = (jsonStr: string): string => {
    if (!jsonStr) return '';
    
    const lines = jsonStr.split('\n');
    const processedLines = lines.map(line => {
      // Count leading spaces to determine indentation level
      const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
      const indentLevel = leadingSpaces.length;
      
      // Create a hanging indent style for this line
      const hangingIndentStyle = `padding-left: ${indentLevel * 0.5}rem; text-indent: -${indentLevel * 0.5}rem; margin-left: ${indentLevel * 0.5}rem;`;
      
      return `<div style="${hangingIndentStyle}" class="leading-relaxed">${highlightJSON(line.trim())}</div>`;
    });
    
    return processedLines.join('');
  };

  if (!json && isValid) {
    return (
      <div className="min-h-[400px] bg-slate-800/50 border-2 border-green-300/30 rounded-md p-4 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="w-16 h-16 mx-auto mb-4 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm7 1l3 3-3 3-1-1 2-2-2-2 1-1zm-4 3l1 1-2 2 2 2-1 1-3-3 3-3z"/>
            </svg>
          </div>
          <p>Formatted JSON will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="min-h-[400px] bg-slate-800/50 border-2 border-green-300/30 rounded-md p-4 overflow-auto font-mono text-sm">
        <div className="text-gray-300" 
          dangerouslySetInnerHTML={{ 
            __html: processLinesWithIndentation(json) 
          }}
        />
      </div>
      {json && (
        <div className="absolute bottom-3 right-3 text-xs text-slate-400">
          {json.split('\n').length} lines
        </div>
      )}
    </div>
  );
};

export default JSONOutput;