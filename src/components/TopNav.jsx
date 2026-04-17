import { useState, useRef, useEffect } from 'react';
import SignalLogo from './TenGenLogo';

const navItems = [
  { key: 'find-leads', label: 'Find Leads' },
  { key: 'lead-ai', label: 'Lead AI' },
  { key: 'projects', label: 'My Projects' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'lead-alerts', label: 'Lead Alerts' },
];

export default function TopNav({ activePage, onNavigate, subscription }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const exported = subscription?.exported ?? 0;
  const limit = subscription?.monthlyLimit ?? 50;
  const remaining = subscription?.remaining ?? 50;
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, (exported / limit) * 100);
  const isLow = !isUnlimited && remaining <= Math.ceil(limit * 0.2) && remaining > 0;
  const isOut = !isUnlimited && remaining === 0;

  return (
    <nav className="bg-cs-navy border-b border-cs-border h-14 flex items-center px-6 shrink-0">
      <button onClick={() => onNavigate('find-leads')} className="mr-8">
        <SignalLogo />
      </button>

      <div className="flex items-center gap-1">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activePage === item.key
                ? 'text-white bg-cs-navy-mid'
                : 'text-cs-muted hover:text-white hover:bg-cs-navy-mid/50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Export usage counter */}
      {subscription && (
        <div className="ml-auto mr-4 flex items-center gap-2.5">
          <div className="text-right">
            <p className={`text-[11px] font-semibold leading-tight ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-cs-muted'}`}>
              {isUnlimited ? (
                <>{exported.toLocaleString()} exported</>
              ) : (
                <>{exported.toLocaleString()} / {limit.toLocaleString()} exports</>
              )}
            </p>
            <p className="text-[10px] text-cs-muted/60 leading-tight">
              {isUnlimited ? 'Unlimited plan' : `${remaining.toLocaleString()} remaining`}
            </p>
          </div>
          {!isUnlimited && (
            <div className="w-16 h-1.5 bg-cs-navy-mid rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-cs-cyan'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Avatar with dropdown */}
      <div className={`relative ${!subscription ? 'ml-auto' : ''}`} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 rounded-full bg-cs-blue flex items-center justify-center text-white text-sm font-bold hover:bg-cs-cyan transition-colors"
        >
          A
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[10000] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">Alyssa Murrett</p>
              <p className="text-xs text-gray-500">alyssa@example.com</p>
            </div>
            <button
              onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Account Settings
            </button>
            <button
              onClick={() => { onNavigate('help'); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help Center
            </button>
            <button
              onClick={() => { onNavigate('admin'); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Dashboard
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
