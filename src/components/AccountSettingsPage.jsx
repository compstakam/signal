import { useState, useEffect } from 'react';
import { AVAILABLE_INDUSTRIES } from '../utils/signalScore';

export default function AccountSettingsPage({ subscription, onChangeTier, preferences, onSavePreferences }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [changingTier, setChangingTier] = useState(null);

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'signal', label: 'Signal Score' },
    { key: 'plan', label: 'Plan & Usage' },
    { key: 'billing', label: 'Billing' },
    { key: 'receipts', label: 'Receipts' },
  ];

  const handleChangeTier = async (tier) => {
    setChangingTier(tier);
    try {
      await onChangeTier(tier);
    } finally {
      setChangingTier(null);
    }
  };

  const currentTier = subscription?.tier || 'starter';
  const tiers = subscription?.tiers || [];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-cs-blue border-b-2 border-cs-blue'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue="Alyssa Murrett"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                defaultValue="alyssa@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                defaultValue=""
                placeholder="Your company name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                defaultValue=""
                placeholder="e.g. Sales Rep, Account Executive"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
              />
            </div>
            <button className="px-4 py-2 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-colors">
              Save Changes
            </button>
          </div>
        )}

        {/* Signal Score Preferences */}
        {activeTab === 'signal' && (
          <SignalScorePreferences preferences={preferences} onSave={onSavePreferences} />
        )}

        {/* Plan & Usage */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            {/* Current Usage */}
            {subscription && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Export Usage</h3>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {subscription.exported.toLocaleString()} of {subscription.monthlyLimit === -1 ? '∞' : subscription.monthlyLimit.toLocaleString()} exports used
                      </span>
                      <span className="font-semibold text-gray-900">
                        {subscription.monthlyLimit === -1 ? 'Unlimited' : `${subscription.remaining.toLocaleString()} remaining`}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      {subscription.monthlyLimit !== -1 && (
                        <div
                          className={`h-full rounded-full transition-all ${
                            subscription.remaining === 0 ? 'bg-red-400' :
                            subscription.remaining <= Math.ceil(subscription.monthlyLimit * 0.2) ? 'bg-amber-400' :
                            'bg-cs-blue'
                          }`}
                          style={{ width: `${Math.min(100, (subscription.exported / subscription.monthlyLimit) * 100)}%` }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Resets at the beginning of each calendar month</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tiers */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tiers.map(tier => {
                  const isCurrent = tier.key === currentTier;
                  return (
                    <div
                      key={tier.key}
                      className={`border rounded-xl p-5 transition-all ${
                        isCurrent
                          ? 'border-cs-blue bg-blue-50/50 ring-2 ring-cs-blue/20'
                          : 'border-gray-200 bg-white hover:border-cs-blue/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{tier.label}</h4>
                          {isCurrent && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-cs-blue text-white rounded-full uppercase">
                              Current Plan
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {tier.price ? (
                            <>
                              <p className="text-2xl font-bold text-gray-900">${tier.price}</p>
                              <p className="text-xs text-gray-500">/month</p>
                            </>
                          ) : (
                            <p className="text-lg font-semibold text-gray-500">Custom</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {tier.limit === -1
                          ? 'Unlimited lead exports per month'
                          : `${tier.limit.toLocaleString()} lead exports per month`}
                      </p>
                      {tier.key === 'enterprise' ? (
                        <button
                          className="w-full py-2.5 border border-cs-blue text-cs-blue hover:bg-cs-blue hover:text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Contact Sales
                        </button>
                      ) : isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-semibold cursor-not-allowed"
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleChangeTier(tier.key)}
                          disabled={changingTier === tier.key}
                          className="w-full py-2.5 bg-cs-blue hover:bg-cs-cyan disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          {changingTier === tier.key ? 'Switching...' : (
                            tiers.findIndex(t => t.key === currentTier) < tiers.findIndex(t => t.key === tier.key)
                              ? 'Upgrade'
                              : 'Switch Plan'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Billing */}
        {activeTab === 'billing' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Current Plan</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">{subscription?.tierLabel || 'Starter'} Plan</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {subscription?.monthlyLimit === -1
                      ? 'Unlimited lead exports'
                      : `${subscription?.monthlyLimit || 50} lead exports per month`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-cs-blue">
                  {tiers.find(t => t.key === currentTier)?.price
                    ? `$${tiers.find(t => t.key === currentTier).price}/mo`
                    : 'Custom'}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Payment Method</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-10 h-6 bg-cs-navy rounded flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                <span className="text-sm text-gray-700">**** **** **** 4242</span>
                <button className="ml-auto text-xs text-cs-blue hover:text-cs-cyan font-medium">Update</button>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Next Billing Date</h3>
              <p className="text-sm text-gray-500">April 19, 2026</p>
            </div>
          </div>
        )}

        {/* Receipts */}
        {activeTab === 'receipts' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: 'Mar 19, 2026', desc: `${subscription?.tierLabel || 'Starter'} Plan - Monthly`, amount: `$${tiers.find(t => t.key === currentTier)?.price || 100}.00`, status: 'Paid' },
                  { date: 'Feb 19, 2026', desc: `${subscription?.tierLabel || 'Starter'} Plan - Monthly`, amount: `$${tiers.find(t => t.key === currentTier)?.price || 100}.00`, status: 'Paid' },
                  { date: 'Jan 19, 2026', desc: `${subscription?.tierLabel || 'Starter'} Plan - Monthly`, amount: `$${tiers.find(t => t.key === currentTier)?.price || 100}.00`, status: 'Paid' },
                ].map((receipt, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-5 py-3 text-gray-900">{receipt.date}</td>
                    <td className="px-5 py-3 text-gray-600">{receipt.desc}</td>
                    <td className="px-5 py-3 text-gray-900 font-medium">{receipt.amount}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">{receipt.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-xs text-cs-blue hover:text-cs-cyan font-medium">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

function SignalScorePreferences({ preferences, onSave }) {
  const [sqftMin, setSqftMin] = useState(5000);
  const [sqftMax, setSqftMax] = useState(25000);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preferences) {
      setSqftMin(preferences.sqftMin || 5000);
      setSqftMax(preferences.sqftMax || 25000);
      setSelectedIndustries(preferences.preferredIndustries || []);
    }
  }, [preferences]);

  const toggleIndustry = (industry) => {
    setSelectedIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setError(null);
    if (sqftMin >= sqftMax) {
      setError('Min sqft must be less than max sqft');
      return;
    }
    try {
      await onSave({ sqftMin, sqftMax, preferredIndustries: selectedIndustries });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save preferences');
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-cs-blue shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Customize Your Signal Score</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Signal Score ranks leads by how well they match your prospecting criteria. Set your ideal lease size and target industries below — leads matching your preferences will score higher and surface first.
            </p>
            <div className="flex gap-6 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-cs-blue">45%</div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Lease Timing</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cs-blue">35%</div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Lease Size</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cs-blue">20%</div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Industry</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ideal Lease Size */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Ideal Lease Size</h3>
        <p className="text-sm text-gray-500 mb-4">
          Leads within your ideal square footage range score highest. Leads further from this range score progressively lower.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Minimum Sq Ft</label>
            <input
              type="number"
              value={sqftMin}
              onChange={e => { setSqftMin(Number(e.target.value)); setSaved(false); }}
              min={0}
              step={1000}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
            />
          </div>
          <span className="text-gray-400 font-medium mt-5">—</span>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Maximum Sq Ft</label>
            <input
              type="number"
              value={sqftMax}
              onChange={e => { setSqftMax(Number(e.target.value)); setSaved(false); }}
              min={0}
              step={1000}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Current range: {sqftMin.toLocaleString()} – {sqftMax.toLocaleString()} sq ft
        </p>
      </div>

      {/* Preferred Industries */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Target Industries</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select the industries you target most. Leads in these industries will get the maximum industry score. Leave all unchecked to use default industry rankings.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {AVAILABLE_INDUSTRIES.map(industry => (
            <label
              key={industry}
              className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedIndustries.includes(industry)}
                onChange={() => toggleIndustry(industry)}
                className="w-4 h-4 rounded border-gray-300 text-cs-blue focus:ring-cs-blue accent-cs-blue"
              />
              <span className={`text-sm transition-colors ${
                selectedIndustries.includes(industry) ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'
              }`}>
                {industry}
              </span>
            </label>
          ))}
        </div>
        {selectedIndustries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {selectedIndustries.length} industr{selectedIndustries.length === 1 ? 'y' : 'ies'} selected
            </p>
            <button
              onClick={() => { setSelectedIndustries([]); setSaved(false); }}
              className="text-xs text-cs-blue hover:text-cs-cyan font-medium"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Save Preferences
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Preferences saved — scores updated
          </span>
        )}
        {error && (
          <span className="text-sm text-red-500 font-medium">{error}</span>
        )}
      </div>
    </div>
  );
}
