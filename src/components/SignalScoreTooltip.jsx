import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const grades = [
  { grade: 'A', range: '80-100', label: 'Hot Lead', color: 'bg-red-50 text-red-700 border-red-200' },
  { grade: 'B', range: '65-79', label: 'Warm Lead', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { grade: 'C', range: '45-64', label: 'Moderate', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { grade: 'D', range: '25-44', label: 'Low Signal', color: 'bg-gray-50 text-gray-500 border-gray-200' },
  { grade: 'F', range: '0-24', label: 'Cold', color: 'bg-gray-50 text-gray-400 border-gray-200' },
];

export default function SignalScoreTooltip({ signalScore, isProTier, children }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, position: 'bottom' });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const closeTimer = useRef(null);

  const TOOLTIP_HEIGHT = signalScore ? 320 : 180;
  const TOOLTIP_WIDTH = 300;

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const handleOpen = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const showAbove = spaceBelow < TOOLTIP_HEIGHT + 8 && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + TOOLTIP_WIDTH > window.innerWidth - 16) {
      left = window.innerWidth - TOOLTIP_WIDTH - 16;
    }
    if (left < 16) left = 16;

    setCoords({
      top: showAbove ? rect.top - 8 : rect.bottom + 8,
      left,
      position: showAbove ? 'top' : 'bottom',
    });
  }, [open, TOOLTIP_HEIGHT]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (tooltipRef.current?.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const ss = signalScore;

  const tooltip = open ? createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: coords.position === 'top' ? undefined : coords.top,
        bottom: coords.position === 'top' ? (window.innerHeight - coords.top) : undefined,
        left: coords.left,
        width: TOOLTIP_WIDTH,
        zIndex: 99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl normal-case tracking-normal font-normal text-left"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-cs-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-xs font-bold text-gray-900">Signal Score</h3>
          {ss && (
            <span className="ml-auto text-sm font-bold text-cs-blue">{ss.score}/100</span>
          )}
        </div>

        <p className="text-[11px] text-gray-500 mb-2.5 leading-snug">
          Ranks how likely a tenant is in a buying window based on three weighted factors.
        </p>

        {/* Score breakdown */}
        {ss && ss.factors && (
          <div className="space-y-1.5 mb-2.5">
            {[
              { label: 'Lease Timing', value: ss.factors.expiration, max: 45, color: 'bg-red-400' },
              { label: 'Lease Size', value: ss.factors.spaceSize, max: 35, color: 'bg-blue-400' },
              { label: 'Industry Match', value: ss.factors.industry, max: 20, color: 'bg-purple-400' },
            ].map(f => (
              <div key={f.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-gray-600 font-medium">{f.label}</span>
                  <span className="text-gray-900 font-semibold">{f.value}/{f.max}</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.color}`}
                    style={{ width: `${(f.value / f.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grade scale */}
        <div className={ss && ss.factors ? 'border-t border-gray-100 pt-2' : ''}>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Grade Scale</p>
          <div className="flex gap-1">
            {grades.map(g => (
              <div
                key={g.grade}
                className={`flex-1 text-center py-0.5 rounded border text-[9px] font-bold ${g.color} ${
                  ss?.grade === g.grade ? 'ring-2 ring-cs-blue ring-offset-1' : ''
                }`}
                title={`${g.grade}: ${g.label} (${g.range})`}
              >
                {g.grade}
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-0.5">
            {grades.map(g => (
              <div key={g.grade} className="flex-1 text-center text-[7px] text-gray-400">
                {g.range}
              </div>
            ))}
          </div>
        </div>

        {!isProTier && (
          <div className="mt-2 p-1.5 bg-cs-blue/5 rounded-lg border border-cs-blue/10">
            <p className="text-[10px] text-cs-blue font-medium leading-snug">
              Upgrade to Pro for full numeric scores and detailed breakdowns.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleOpen}
        onMouseLeave={scheduleClose}
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); cancelClose(); }}
        className="cursor-help"
      >
        {children}
      </div>
      {tooltip}
    </>
  );
}

export function SignalScoreInfoButton({ isProTier }) {
  return (
    <SignalScoreTooltip signalScore={null} isProTier={isProTier}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-gray-400 hover:text-cs-blue hover:border-cs-blue text-[9px] font-bold transition-colors cursor-help">
        ?
      </span>
    </SignalScoreTooltip>
  );
}
