import { useState } from 'react';

export default function UpgradePrompt({ searchCount, onUpgrade, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onDismiss}>
      <div
        className="bg-cs-navy border border-cs-border rounded-2xl w-[480px] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-cs-blue via-cs-cyan to-cs-blue" />

        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-cs-cyan/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-cs-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            You've completed {searchCount} searches!
          </h2>
          <p className="text-sm text-cs-muted leading-relaxed mb-6">
            You're finding great leads in your territory. Upgrade your plan to unlock more exports and keep your pipeline growing.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl p-4 bg-cs-navy-mid/50 border border-cs-border text-left">
              <p className="text-sm font-bold text-white">Growth</p>
              <p className="text-lg font-bold text-cs-cyan mt-1">$250<span className="text-xs text-cs-muted font-normal">/mo</span></p>
              <p className="text-[11px] text-cs-muted mt-1">150 exports/month</p>
              <p className="text-[11px] text-cs-muted">3× more leads</p>
            </div>
            <div className="rounded-xl p-4 bg-cs-navy-mid/50 border border-cs-cyan text-left relative">
              <span className="absolute -top-2 right-3 text-[9px] font-bold uppercase tracking-widest text-cs-navy bg-cs-cyan px-2 py-0.5 rounded-full">
                Best Value
              </span>
              <p className="text-sm font-bold text-white">Pro</p>
              <p className="text-lg font-bold text-cs-cyan mt-1">$600<span className="text-xs text-cs-muted font-normal">/mo</span></p>
              <p className="text-[11px] text-cs-muted mt-1">500 exports/month</p>
              <p className="text-[11px] text-cs-muted">10× more leads</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onUpgrade}
              className="flex-1 px-6 py-3 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-all"
            >
              Upgrade Now
            </button>
            <button
              onClick={onDismiss}
              className="px-6 py-3 text-cs-muted hover:text-white text-sm font-medium transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
