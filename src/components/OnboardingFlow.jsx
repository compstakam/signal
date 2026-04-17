import { useState, useEffect, useRef } from 'react';
import SignalLogo from './TenGenLogo';

const METRO_AREAS = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Jose, CA',
  'Austin, TX',
  'Jacksonville, FL',
  'Fort Worth, TX',
  'Columbus, OH',
  'Charlotte, NC',
  'San Francisco, CA',
  'Indianapolis, IN',
  'Seattle, WA',
  'Denver, CO',
  'Washington, DC',
  'Nashville, TN',
  'Oklahoma City, OK',
  'El Paso, TX',
  'Boston, MA',
  'Portland, OR',
  'Las Vegas, NV',
  'Memphis, TN',
  'Louisville, KY',
  'Baltimore, MD',
  'Milwaukee, WI',
  'Albuquerque, NM',
  'Tucson, AZ',
  'Fresno, CA',
  'Sacramento, CA',
  'Kansas City, MO',
  'Mesa, AZ',
  'Atlanta, GA',
  'Omaha, NE',
  'Colorado Springs, CO',
  'Raleigh, NC',
  'Long Beach, CA',
  'Virginia Beach, VA',
  'Miami, FL',
  'Oakland, CA',
  'Minneapolis, MN',
  'Tampa, FL',
  'New Orleans, LA',
  'Cleveland, OH',
  'Honolulu, HI',
  'Jersey City, NJ',
];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Legal',
  'Real Estate',
  'Retail',
  'Manufacturing',
  'Construction',
  'Transportation & Logistics',
  'Food & Beverage',
  'Hospitality',
  'Education',
  'Media & Entertainment',
  'Professional Services',
  'Insurance',
  'Telecommunications',
  'Energy & Utilities',
  'Government',
  'Nonprofit',
  'Other',
];

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isComplete = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                isActive
                  ? 'bg-cs-blue text-white ring-4 ring-cs-blue/20'
                  : isComplete
                  ? 'bg-cs-cyan text-cs-navy'
                  : 'bg-cs-navy-mid text-cs-muted'
              }`}
            >
              {isComplete ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 h-0.5 ${step < currentStep ? 'bg-cs-cyan' : 'bg-cs-navy-mid'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepSignUp({ onNext, onSkip }) {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  const canProceed = email.trim() && companyName.trim() && industry;

  return (
    <div className="animate-fadeIn">
      <div className="mb-2">
        <span className="text-xs font-semibold text-cs-cyan tracking-widest uppercase">Step 1</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
      <p className="text-cs-muted text-sm mb-8">
        Get started in 30 seconds. No credit card required for your free trial.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-cs-muted uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full bg-cs-navy-mid border border-cs-border rounded-lg px-4 py-3 text-white text-sm placeholder-cs-muted/50 focus:outline-none focus:ring-2 focus:ring-cs-blue focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-cs-muted uppercase tracking-wider mb-1.5">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Your Company Inc."
            className="w-full bg-cs-navy-mid border border-cs-border rounded-lg px-4 py-3 text-white text-sm placeholder-cs-muted/50 focus:outline-none focus:ring-2 focus:ring-cs-blue focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-cs-muted uppercase tracking-wider mb-1.5">
            Your Industry
          </label>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full bg-cs-navy-mid border border-cs-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue focus:border-transparent transition-all appearance-none"
          >
            <option value="" className="text-gray-400">Select your industry...</option>
            {INDUSTRY_OPTIONS.map(ind => (
              <option key={ind} value={ind} className="bg-cs-navy-mid">{ind}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-cs-muted hover:text-white transition-colors"
        >
          Skip setup
        </button>
        <button
          onClick={() => canProceed && onNext({ email, companyName, industry })}
          disabled={!canProceed}
          className="px-6 py-3 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepTerritory({ onNext, onSkip, onBack }) {
  const [territoryType, setTerritoryType] = useState('metro');
  const [selectedMetros, setSelectedMetros] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMetros = METRO_AREAS.filter(m =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMetro = (metro) => {
    setSelectedMetros(prev =>
      prev.includes(metro) ? prev.filter(m => m !== metro) : [...prev, metro]
    );
  };

  const canProceed = selectedMetros.length > 0;

  return (
    <div className="animate-fadeIn">
      <div className="mb-2">
        <span className="text-xs font-semibold text-cs-cyan tracking-widest uppercase">Step 2</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Set up your territory</h2>
      <p className="text-cs-muted text-sm mb-6">
        Select the metro areas where you sell. We'll focus your lead results to these markets.
      </p>

      <div className="mb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTerritoryType('metro')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              territoryType === 'metro'
                ? 'bg-cs-blue text-white'
                : 'bg-cs-navy-mid text-cs-muted hover:text-white'
            }`}
          >
            Select Metro Areas
          </button>
          <button
            onClick={() => setTerritoryType('national')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              territoryType === 'national'
                ? 'bg-cs-blue text-white'
                : 'bg-cs-navy-mid text-cs-muted hover:text-white'
            }`}
          >
            National / All Markets
          </button>
        </div>

        {territoryType === 'metro' ? (
          <>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search metro areas..."
              className="w-full bg-cs-navy-mid border border-cs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-cs-muted/50 focus:outline-none focus:ring-2 focus:ring-cs-blue focus:border-transparent transition-all mb-3"
            />

            {selectedMetros.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedMetros.map(metro => (
                  <span
                    key={metro}
                    className="inline-flex items-center gap-1 bg-cs-blue/20 text-cs-cyan text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {metro}
                    <button
                      onClick={() => toggleMetro(metro)}
                      className="hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto rounded-lg border border-cs-border bg-cs-navy-mid/50">
              {filteredMetros.map(metro => (
                <button
                  key={metro}
                  onClick={() => toggleMetro(metro)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors border-b border-cs-border/30 last:border-0 ${
                    selectedMetros.includes(metro)
                      ? 'bg-cs-blue/15 text-cs-cyan font-medium'
                      : 'text-cs-muted hover:text-white hover:bg-cs-navy-mid'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {selectedMetros.includes(metro) && (
                      <svg className="w-4 h-4 text-cs-cyan shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {metro}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-cs-navy-mid/50 border border-cs-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-cs-blue/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-cs-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-white font-medium">National Coverage</p>
            <p className="text-xs text-cs-muted mt-1">You'll see leads from all available markets.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm text-cs-muted hover:text-white transition-colors">← Back</button>
          <button onClick={onSkip} className="text-sm text-cs-muted hover:text-white transition-colors">Skip</button>
        </div>
        <button
          onClick={() => onNext({
            territoryType,
            territoryValue: territoryType === 'national' ? ['all'] : selectedMetros,
          })}
          disabled={territoryType === 'metro' && !canProceed}
          className="px-6 py-3 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepFirstSearch({ onNext, onSkip, onBack, industry, territories }) {
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const [resultCount, setResultCount] = useState(0);

  const handleSearch = () => {
    setSearching(true);
    // Simulate the search experience
    setTimeout(() => {
      setSearching(false);
      setFound(true);
      setResultCount(Math.floor(Math.random() * 150) + 50);
    }, 2000);
  };

  useEffect(() => {
    // Auto-trigger the search after a brief delay
    const t = setTimeout(handleSearch, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="animate-fadeIn">
      <div className="mb-2">
        <span className="text-xs font-semibold text-cs-cyan tracking-widest uppercase">Step 3</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Your first search</h2>
      <p className="text-cs-muted text-sm mb-8">
        We're searching for tenant leads in your territory
        {industry ? ` relevant to the ${industry} industry` : ''}.
      </p>

      <div className="bg-cs-navy-mid/50 border border-cs-border rounded-xl p-6">
        {searching && (
          <div className="text-center py-6">
            <div className="animate-spin h-10 w-10 border-4 border-cs-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-white font-medium">Searching your territory...</p>
            <p className="text-xs text-cs-muted mt-1">Analyzing lease data across {territories?.length > 0 ? territories.join(', ') : 'all markets'}</p>
          </div>
        )}

        {found && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-cs-cyan/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-cs-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-white mb-1">
              {resultCount.toLocaleString()} leads found
            </p>
            <p className="text-sm text-cs-muted mb-4">
              These are real tenant leads in your territory — including tenant names, lease details, and building information.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-cs-navy rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-cs-cyan">{Math.floor(resultCount * 0.3)}</p>
                <p className="text-[10px] uppercase text-cs-muted tracking-wider font-semibold">Expiring Soon</p>
              </div>
              <div className="bg-cs-navy rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-cs-cyan">{Math.floor(resultCount * 0.25)}</p>
                <p className="text-[10px] uppercase text-cs-muted tracking-wider font-semibold">New Leases</p>
              </div>
              <div className="bg-cs-navy rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-cs-cyan">{Math.floor(resultCount * 0.45)}</p>
                <p className="text-[10px] uppercase text-cs-muted tracking-wider font-semibold">Active Tenants</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm text-cs-muted hover:text-white transition-colors">← Back</button>
          <button onClick={onSkip} className="text-sm text-cs-muted hover:text-white transition-colors">Skip</button>
        </div>
        <button
          onClick={onNext}
          disabled={!found}
          className="px-6 py-3 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
        >
          See my leads →
        </button>
      </div>
    </div>
  );
}

function StepSaveExport({ onNext, onSkip, onBack }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="animate-fadeIn">
      <div className="mb-2">
        <span className="text-xs font-semibold text-cs-cyan tracking-widest uppercase">Step 4</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Save &amp; export your leads</h2>
      <p className="text-cs-muted text-sm mb-8">
        Organize leads into projects and export them to your CRM or outreach tool.
      </p>

      <div className="space-y-4">
        <div className="bg-cs-navy-mid/50 border border-cs-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-cs-blue/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cs-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Save to Projects</p>
              <p className="text-xs text-cs-muted mt-1">
                Select leads from your search results and save them to named projects. Track outreach status and manage your pipeline.
              </p>
              {!saved && (
                <button
                  onClick={() => setSaved(true)}
                  className="mt-3 px-4 py-2 bg-cs-blue/20 text-cs-cyan text-xs font-semibold rounded-lg hover:bg-cs-blue/30 transition-colors"
                >
                  Try it: Create "My First Project"
                </button>
              )}
              {saved && (
                <div className="mt-3 flex items-center gap-2 text-cs-cyan text-xs font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Project created! You can manage it from "My Projects"
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-cs-navy-mid/50 border border-cs-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-cs-blue/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cs-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Export to CSV</p>
              <p className="text-xs text-cs-muted mt-1">
                Export leads with full details including contact info, lease data, and building info. Your free trial includes 50 lead exports per month.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-cs-navy-mid/50 border border-cs-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-cs-blue/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cs-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Enrich with Contacts</p>
              <p className="text-xs text-cs-muted mt-1">
                Upload your own contact list or use our auto-enrichment to find company websites, phone numbers, and decision-maker contacts.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm text-cs-muted hover:text-white transition-colors">← Back</button>
          <button onClick={onSkip} className="text-sm text-cs-muted hover:text-white transition-colors">Skip</button>
        </div>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepUpgrade({ onComplete }) {
  return (
    <div className="animate-fadeIn">
      <div className="mb-2">
        <span className="text-xs font-semibold text-cs-cyan tracking-widest uppercase">You're all set!</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Start prospecting</h2>
      <p className="text-cs-muted text-sm mb-8">
        Your free trial is active with 50 lead exports per month. Upgrade anytime for more.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { name: 'Starter', price: '$100', leads: '50 exports/mo', current: true },
          { name: 'Growth', price: '$250', leads: '150 exports/mo', popular: true },
          { name: 'Pro', price: '$600', leads: '500 exports/mo' },
          { name: 'Enterprise', price: 'Contact Us', leads: 'Unlimited' },
        ].map(tier => (
          <div
            key={tier.name}
            className={`rounded-xl p-4 border transition-all ${
              tier.current
                ? 'bg-cs-blue/15 border-cs-blue'
                : tier.popular
                ? 'bg-cs-navy-mid/50 border-cs-cyan hover:border-cs-cyan/80'
                : 'bg-cs-navy-mid/50 border-cs-border hover:border-cs-muted/50'
            }`}
          >
            {tier.popular && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-cs-cyan bg-cs-cyan/10 px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            {tier.current && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-cs-blue bg-cs-blue/10 px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
            <p className="text-lg font-bold text-white mt-2">{tier.price}</p>
            <p className="text-xs text-cs-muted">{tier.name}</p>
            <p className="text-[11px] text-cs-muted/70 mt-1">{tier.leads}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onComplete}
          className="flex-1 px-6 py-3 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-all"
        >
          Start with Free Trial
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-3 border border-cs-cyan text-cs-cyan hover:bg-cs-cyan/10 rounded-lg text-sm font-semibold transition-all"
        >
          Explore Plans
        </button>
      </div>
    </div>
  );
}

export default function OnboardingFlow({ onComplete, completeStep }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    industry: '',
    territoryType: '',
    territories: [],
  });

  const handleStep1 = async (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    await completeStep(1, data);
    setStep(2);
  };

  const handleStep2 = async (data) => {
    setFormData(prev => ({
      ...prev,
      territoryType: data.territoryType,
      territories: data.territoryValue,
    }));
    await completeStep(2, data);
    setStep(3);
  };

  const handleStep3 = async () => {
    await completeStep(3);
    setStep(4);
  };

  const handleStep4 = async () => {
    await completeStep(4);
    setStep(5);
  };

  const handleComplete = async () => {
    await completeStep(5);
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="h-screen bg-cs-navy flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cs-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cs-cyan/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mx-auto px-6">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <SignalLogo className="scale-125" />
          </div>
        </div>

        <StepIndicator currentStep={step} totalSteps={5} />

        <div className="bg-cs-navy-light/50 border border-cs-border rounded-2xl p-8 backdrop-blur-sm">
          {step === 1 && (
            <StepSignUp onNext={handleStep1} onSkip={handleSkip} />
          )}
          {step === 2 && (
            <StepTerritory
              onNext={handleStep2}
              onSkip={handleSkip}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepFirstSearch
              onNext={handleStep3}
              onSkip={handleSkip}
              onBack={() => setStep(2)}
              industry={formData.industry}
              territories={formData.territories}
            />
          )}
          {step === 4 && (
            <StepSaveExport
              onNext={handleStep4}
              onSkip={handleSkip}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <StepUpgrade onComplete={handleComplete} />
          )}
        </div>

        <p className="text-center text-xs text-cs-muted/50 mt-6">
          By continuing, you agree to Signal's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
