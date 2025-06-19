import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSONInput from './JSONInput';
import JSONOutput from './JSONOutput';
import ErrorDisplay from './ErrorDisplay';

const JSONFormatter = () => {
  const [inputJSON, setInputJSON] = useState('');
  const [formattedJSON, setFormattedJSON] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const escapeForJSON = (str) => {
    return str
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/"/g, '\\"')    // Escape double quotes
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '\\r')   // Escape carriage returns
      .replace(/\t/g, '\\t')   // Escape tabs
      .replace(/\f/g, '\\f');  // Escape form feeds
  };

  const fixQuotesRobust = (str) => {
    const result = [];
    let i = 0;
    const len = str.length;
    
    while (i < len) {
      const char = str[i];
      
      if (char === "'" || char === '"') {
        const quote = char;
        const startPos = i;
        i++; // Skip opening quote
        
        // Find the matching closing quote, handling escapes
        let stringContent = '';
        let escaped = false;
        
        while (i < len) {
          const currentChar = str[i];
          
          if (escaped) {
            stringContent += currentChar;
            escaped = false;
          } else if (currentChar === '\\') {
            stringContent += currentChar;
            escaped = true;
          } else if (currentChar === quote) {
            // Found closing quote
            break;
          } else {
            stringContent += currentChar;
          }
          i++;
        }
        
        // Check if this looks like a key (followed by colon)
        const afterQuote = str.slice(i + 1).match(/^\s*:/);
        const beforeQuote = str.slice(0, startPos).match(/[{,]\s*$/);
        const isKey = afterQuote && beforeQuote;
        
        // Always use double quotes and properly escape content
        const escapedContent = escapeForJSON(stringContent);
        result.push('"' + escapedContent + '"');
        
        i++; // Skip closing quote
      } else if (/[a-zA-Z_$]/.test(char)) {
        // Potential unquoted key
        const keyStart = i;
        while (i < len && /[a-zA-Z0-9_$]/.test(str[i])) {
          i++;
        }
        
        const key = str.slice(keyStart, i);
        const afterKey = str.slice(i).match(/^\s*:/);
        
        if (afterKey) {
          // This is an unquoted key
          result.push('"' + key + '"');
        } else {
          // Not a key, keep as is (might be a value like true/false/null)
          result.push(key);
        }
      } else {
        result.push(char);
        i++;
      }
    }
    
    return result.join('');
  };

  const fixBrackets = (str) => {
    // Simple bracket balancing - count and try to fix obvious issues
    const opens = (str.match(/[{[]/g) || []).length;
    const closes = (str.match(/[}\]]/g) || []).length;
    
    if (opens > closes) {
      // Add missing closing brackets
      const diff = opens - closes;
      const lastChar = str.trim().slice(-1);
      for (let i = 0; i < diff; i++) {
        if (lastChar === '[' || str.includes('[')) {
          str += ']';
        } else {
          str += '}';
        }
      }
    }
    
    return str;
  };

  const autoCorrectJSON = (input) => {
    let corrected = input.trim();
    
    // Step 1: Remove JS-style comments
    corrected = corrected.replace(/\/\/.*$/gm, ''); // single line comments
    corrected = corrected.replace(/\/\*[\s\S]*?\*\//g, ''); // multi-line comments
    
    // Step 2: Normalize Python/JS-like literals
    corrected = corrected
      .replace(/\bNone\b/g, 'null')
      .replace(/\bNULL\b/g, 'null')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bundefined\b/g, 'null');
    
    // Step 3: Fix quotes more carefully using a tokenizer approach
    corrected = fixQuotesRobust(corrected);
    
    // Step 4: Remove trailing commas before } or ]
    corrected = corrected.replace(/,(\s*[}\]])/g, '$1');
    
    // Step 5: Fix common spacing issues
    corrected = corrected.replace(/([{,])\s*([}\]])/g, '$1$2'); // empty objects/arrays
    
    return corrected.trim();
  };

  const getHelpfulErrorMessage = (error) => {
    const message = error.message || 'Invalid JSON';
    
    if (message.includes('Unexpected token')) {
      return `${message}. Common fixes: check for unquoted keys, trailing commas, or mixed quote types.`;
    } else if (message.includes('Unexpected end')) {
      return `${message}. Check for missing closing brackets or quotes.`;
    } else if (message.includes('Unexpected string')) {
      return `${message}. Check for missing commas between properties.`;
    }
    
    return message;
  };

  // Enhanced validation function that provides better error messages
  const validateAndFormatEnhanced = (jsonStr, toast) => {
    if (!jsonStr.trim()) {
      return { formatted: '', isValid: true, error: '' };
    }

    try {
      // First try parsing as-is
      const parsed = JSON.parse(jsonStr);
      const formatted = JSON.stringify(parsed, null, 2);
      return { formatted, isValid: true, error: '' };
    } catch (e) {
      // Try auto-correction with multiple attempts
      const attempts = [
        () => autoCorrectJSON(jsonStr),
        () => autoCorrectJSON(jsonStr.replace(/'/g, '"')), // Simple quote replacement as fallback
        () => fixBrackets(autoCorrectJSON(jsonStr)), // Try fixing bracket issues
      ];

      for (let i = 0; i < attempts.length; i++) {
        try {
          const corrected = attempts[i]();
          const parsed = JSON.parse(corrected);
          const formatted = JSON.stringify(parsed, null, 2);
          
          toast?.({
            title: "Auto-corrected!",
            description: `Fixed JSON formatting issues (attempt ${i + 1}).`,
          });
          
          return { formatted, isValid: true, error: '' };
        } catch (correctionError) {
          // Continue to next attempt
          continue;
        }
      }
      
      // All attempts failed
      return {
        formatted: '',
        isValid: false,
        error: getHelpfulErrorMessage(e)
      };
    }
  };

  const validateAndFormat = useCallback((jsonStr) => {
    const result = validateAndFormatEnhanced(jsonStr, toast);
    setFormattedJSON(result.formatted);
    setIsValid(result.isValid);
    setError(result.error);
  }, [toast]);

  const handleInputChange = (value) => {
    setInputJSON(value);
    validateAndFormat(value);
  };

  const handleFormat = () => {
    validateAndFormat(inputJSON);
  };

  const handleCopy = async () => {
    if (formattedJSON) {
      await navigator.clipboard.writeText(formattedJSON);
      toast({
        title: "Copied!",
        description: "Formatted JSON copied to clipboard.",
      });
    }
  };

  const handleClear = () => {
    setInputJSON('');
    setFormattedJSON('');
    setIsValid(true);
    setError('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-blue-200/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              Input JSON
            </h2>
            <div className="flex gap-2">
              <Button 
                onClick={handleFormat}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Format
              </Button>
              <Button 
                onClick={handleClear}
                variant="outline"
                size="sm"
                className="border-blue-200/50 text-blue-100 hover:bg-blue-600/20"
              >
                Clear
              </Button>
            </div>
          </div>
          <JSONInput 
            value={inputJSON}
            onChange={handleInputChange}
            isValid={isValid}
          />
          {error && <ErrorDisplay error={error} />}
        </Card>

        <Card className="p-6 bg-white/10 backdrop-blur-sm border-green-200/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Check className="w-5 h-5" />
              Formatted Output
            </h2>
            <Button 
              onClick={handleCopy}
              disabled={!formattedJSON}
              size="sm"
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              Copy
            </Button>
          </div>
          <JSONOutput 
            json={formattedJSON}
            isValid={isValid}
          />
        </Card>
      </div>
      
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-4 text-blue-200 text-sm">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Auto-correction enabled
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            Real-time validation
          </span>
        </div>
      </div>
    </div>
  );
};

export default JSONFormatter;