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

  const autoCorrectJSON = (input: string): string => {
  let corrected = input.trim();

  // Step 1: Remove JS-style comments (optional)
  corrected = corrected.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

  // Step 2: Normalize Python/JS-like literals
  corrected = corrected
    .replace(/\bNone\b/g, 'null')
    .replace(/\bNULL\b/g, 'null')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false');

  // Step 3: Fix unquoted keys and keys with single quotes to double quotes
  corrected = corrected.replace(/([{,\s])'([^']*?)'\s*:/g, '$1"$2":'); // keys with single quotes
  corrected = corrected.replace(/([{,\s])([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":'); // unquoted keys

  // Step 4: Fix string values quoted with single quotes to double quotes
  corrected = corrected.replace(/:\s*'([^']*?)'(?=\s*[,}\]])/g, ': "$1"');

  // Step 5: Remove trailing commas before } or ]
  corrected = corrected.replace(/,(\s*[}\]])/g, '$1');

  // Step 6: Escape inner unescaped double quotes inside strings (optional but safer)
  // This tries to find string literals and escape any inner unescaped quotes
  // Be careful with performance on large input
  corrected = corrected.replace(/"(.*?)"/gs, (match) => {
    // Remove the surrounding quotes
    const inner = match.slice(1, -1);
    // Escape unescaped quotes inside the string value
    const escapedInner = inner.replace(/(?<!\\)"/g, '\\"');
    return `"${escapedInner}"`;
  });

  // Final trim
  return corrected.trim();
  };


  const validateAndFormat = useCallback((jsonStr: string) => {
    if (!jsonStr.trim()) {
      setFormattedJSON('');
      setIsValid(true);
      setError('');
      return;
    }

    try {
      // First try parsing as-is
      const parsed = JSON.parse(jsonStr);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedJSON(formatted);
      setIsValid(true);
      setError('');
    } catch (e) {
      // Try auto-correction
      try {
        const corrected = autoCorrectJSON(jsonStr);
        const parsed = JSON.parse(corrected);
        const formatted = JSON.stringify(parsed, null, 2);
        setFormattedJSON(formatted);
        setIsValid(true);
        setError('');
        toast({
          title: "Auto-corrected!",
          description: "Fixed common JSON formatting issues.",
        });
      } catch (correctionError) {
        setIsValid(false);
        setError(e instanceof Error ? e.message : 'Invalid JSON');
        setFormattedJSON('');
      }
    }
  }, [toast]);

  const handleInputChange = (value: string) => {
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
