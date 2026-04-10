import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen text-foreground p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">AI Theme Engine</h1>
          <p className="text-muted">Glassmorphism Design System</p>
        </div>

        <div className="glass p-8 hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-2xl font-semibold mb-2">Card Example</h2>
          <p className="text-muted mb-6">
            This is how text and surfaces will look inside the glass effect.
          </p>

          <button className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Initialize System
          </button>
        </div>
        
        <div className="glass-strong p-6 mt-6">
           <h3 className="font-medium text-lg mb-1">Strong Glass</h3>
           <p className="text-muted text-sm">A stronger blur applied for modal or prominent elements.</p>
        </div>
      </div>
    </div>
  );
}
