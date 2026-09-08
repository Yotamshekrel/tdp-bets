import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit3, Table, Sparkles } from 'lucide-react';
import { PromptModal } from '../components/Modal';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditConfirm = (name: string) => {
    setIsEditModalOpen(false);
    navigate(`/bet?name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Placement Season 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            TDP Placement Bets <span className="inline-block">🎯</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Predict the team allocations for all 18 TDP members and view real-time bets across the cohort.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <button
            onClick={() => navigate('/bet')}
            className="w-full group flex items-center justify-between px-6 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-600/20 transition-all transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-indigo-700/50 group-hover:bg-indigo-700 transition-colors">
                <PlusCircle className="w-6 h-6 text-indigo-200" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Enter a New Bet</div>
                <div className="text-xs text-indigo-200">Start placing predictions from scratch</div>
              </div>
            </div>
            <span className="text-indigo-200 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="w-full group flex items-center justify-between px-6 py-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-800 text-white border border-slate-700 rounded-2xl shadow-sm transition-all transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-slate-700/50 group-hover:bg-slate-700 transition-colors">
                <Edit3 className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Edit Your Bet</div>
                <div className="text-xs text-slate-400">Load and update your existing picks</div>
              </div>
            </div>
            <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={() => navigate('/results')}
            className="w-full group flex items-center justify-between px-6 py-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-800 text-white border border-slate-700 rounded-2xl shadow-sm transition-all transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-slate-700/50 group-hover:bg-slate-700 transition-colors">
                <Table className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">View Results Table</div>
                <div className="text-xs text-slate-400">Review live predictions grid</div>
              </div>
            </div>
            <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>

      <PromptModal
        isOpen={isEditModalOpen}
        title="Edit Your Bet"
        placeholder="Enter your exact bettor name..."
        submitLabel="Find Bet"
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditConfirm}
      />
    </div>
  );
};
