export default function IntegrationsPage() {
  const integrations = [
    { name: 'Contact Data', description: 'Connect a contact database to auto-enrich tenant leads with decision-maker names, emails, and direct phone numbers.', status: 'coming_soon' },
    { name: 'CRM Export', description: 'Push leads and projects directly to Salesforce, HubSpot, or other CRMs to streamline your sales pipeline.', status: 'coming_soon' },
    { name: 'Email Outreach', description: 'Connect email tools like Outreach, Apollo, or Mailchimp to launch campaigns directly from your prospect lists.', status: 'coming_soon' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h1>
        <p className="text-gray-500 mb-8">Connect external data sources and tools to enhance your prospecting workflow.</p>

        <div className="grid gap-4">
          {integrations.map(int => (
            <div key={int.name} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{int.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{int.description}</p>
              </div>
              <span className="shrink-0 ml-4 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-400 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
