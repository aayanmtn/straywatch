import React from 'react';
import { Plus } from 'lucide-react';

export default function FloatingReportButton() {
  return (
    <a
      href="/map"
      className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
      title="Add Report"
    >
      <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 blur-lg transition-opacity"></div>
      <Plus className="w-7 h-7 relative z-10" />
    </a>
  );
}
