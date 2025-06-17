
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  const getErrorMessage = (errorStr: string): string => {
    if (errorStr.includes('Unexpected token')) {
      return `Syntax error: ${errorStr}. Try checking for missing commas, quotes, or brackets.`;
    }
    if (errorStr.includes('Unexpected end')) {
      return 'Incomplete JSON: Missing closing brackets or quotes.';
    }
    return errorStr;
  };

  return (
    <Alert className="mt-4 border-red-400/50 bg-red-900/20">
      <AlertDescription className="text-red-200 text-sm">
        <strong>Validation Error:</strong> {getErrorMessage(error)}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
