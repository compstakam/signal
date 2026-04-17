export default function LeadAlertsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Alerts</h1>
        <p className="text-gray-500 mb-8">Configure how and when you get notified about new leads and project activity.</p>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-1">
          {[
            { label: 'New Lead Alerts', desc: 'Get notified when new leads match your saved project criteria', defaultOn: true },
            { label: 'Weekly Digest', desc: 'A summary of new leads and project activity each week', defaultOn: true },
            { label: 'Product Updates', desc: 'News about new features, integrations, and improvements', defaultOn: false },
          ].map((pref, i) => (
            <label key={i} className="flex items-start justify-between p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={pref.defaultOn}
                className="mt-1 accent-cs-blue w-4 h-4"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Alert Frequency</h2>
          <div className="space-y-3">
            {[
              { value: 'realtime', label: 'Real-time', desc: 'Get notified immediately when new leads are detected' },
              { value: 'daily', label: 'Daily Digest', desc: 'Receive a summary once per day' },
              { value: 'weekly', label: 'Weekly Digest', desc: 'Receive a summary once per week' },
            ].map(opt => (
              <label key={opt.value} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="frequency"
                  value={opt.value}
                  defaultChecked={opt.value === 'daily'}
                  className="mt-1 accent-cs-blue"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button className="px-4 py-2 bg-cs-blue hover:bg-cs-cyan text-white rounded-lg text-sm font-semibold transition-colors">
            Save Alert Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
