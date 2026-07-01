'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the main game with SSR disabled to prevent Three.js WebGL canvas mismatch issues on the server
const GameController = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-blue-900 tracking-wide animate-pulse">
        3D Number Matching Adventure
      </h2>
      <p className="text-sm text-slate-400 mt-1">
        Loading Egyptian Educational Game Collection...
      </p>
    </div>
  )
});

export default function GamePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50">
      <GameController />
    </div>
  );
}
