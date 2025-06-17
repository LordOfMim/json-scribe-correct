
import React from 'react';
import JSONFormatter from '@/components/JSONFormatter';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            JSON Formatter & Validator
          </h1>
          <p className="text-blue-200 text-lg">
            Paste, format, validate, and auto-correct your JSON with ease
          </p>
        </div>
        <JSONFormatter />
      </div>
    </div>
  );
};

export default Index;
