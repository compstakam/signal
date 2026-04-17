import { useState, useEffect, useRef, useCallback } from 'react';

const SECTIONS = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'signal-score', title: 'Signal Score' },
  { id: 'projects', title: 'Projects' },
  { id: 'lead-enrichment', title: 'Lead Enrichment' },
  { id: 'outreach-tracking', title: 'Outreach Tracking' },
  { id: 'exporting-data', title: 'Exporting Data' },
  { id: 'faq', title: 'FAQ' },
];

const FAQ_ITEMS = [
  {
    question: 'What is Signal Score?',
    answer:
      'Signal Score is an AI-powered lead scoring system that rates every lead from 0 to 100 based on three weighted factors: lease timing (45%), lease size match (35%), and industry match (20%). You can customize your ideal lease size range and target industries in Account Settings to personalize your scores.',
  },
  {
    question: 'How often is lead data updated?',
    answer:
      'Lead data is refreshed on a rolling basis. Core lease records are updated as new filings become available, typically within a few business days of public disclosure. Enrichment data such as contact information and company details is refreshed weekly. You can also trigger a manual enrichment refresh from any lead detail view.',
  },
  {
    question: 'Can I integrate with my CRM?',
    answer:
      'Direct CRM integrations with Salesforce, HubSpot, and other platforms are on our roadmap and coming soon. In the meantime, you can export your leads and projects as CSV files and import them into your CRM. Visit the Integrations page to see the latest status of upcoming connectors.',
  },
  {
    question: "What's included in each pricing tier?",
    answer:
      'Signal offers four plans: Starter ($100/mo) includes basic search, 50 exports/month, and letter-grade Signal Scores. Growth ($250/mo) adds multiple projects, lead enrichment, outreach tracking, and 150 exports/month. Pro ($600/mo) unlocks full numeric Signal Scores, Lead AI, bulk outreach, advanced filters, priority enrichment, and 500 exports/month. Enterprise (custom pricing) provides unlimited exports, SSO, dedicated support, API access, and custom integrations. All plans include territory setup, map view, and CSV exports.',
  },
  {
    question: 'How do I upgrade my plan?',
    answer:
      'Navigate to Account Settings from your avatar menu, then select the Billing tab. You can upgrade between Starter, Growth, and Pro tiers instantly. Your new export limits, Signal Score features, and other plan benefits will be available immediately. For Enterprise pricing, contact our sales team through the Account Settings page.',
  },
  {
    question: 'Can I share projects with my team?',
    answer:
      'Team collaboration features are coming soon. Currently, projects are private to your account. Once team sharing launches, you will be able to invite teammates, assign leads, and collaborate on outreach within shared projects.',
  },
];

const GRADE_CARDS = [
  { grade: 'A', label: 'Hot Lead', range: '80 - 100', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', bar: 'bg-red-500' },
  { grade: 'B', label: 'Warm Lead', range: '65 - 79', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', bar: 'bg-orange-500' },
  { grade: 'C', label: 'Moderate', range: '45 - 64', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', bar: 'bg-amber-500' },
  { grade: 'D', label: 'Low Signal', range: '25 - 44', bg: 'bg-gray-50', text: 'text-gray-500', ring: 'ring-gray-200', bar: 'bg-gray-400' },
  { grade: 'F', label: 'Cold', range: '0 - 24', bg: 'bg-gray-50', text: 'text-gray-400', ring: 'ring-gray-100', bar: 'bg-gray-300' },
];

export default function HelpCenterPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

  // Scroll spy via IntersectionObserver
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { root, rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [searchQuery]);

  const registerRef = useCallback((id, el) => {
    if (el) sectionRefs.current[id] = el;
  }, []);

  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Determine which sections / FAQ items match the search query
  const q = searchQuery.toLowerCase().trim();

  const sectionMatchesSearch = (id) => {
    if (!q) return true;
    const section = SECTIONS.find((s) => s.id === id);
    if (section && section.title.toLowerCase().includes(q)) return true;
    // Check content keywords per section
    const keywords = SECTION_KEYWORDS[id] || [];
    return keywords.some((kw) => kw.includes(q));
  };

  const filteredFaq = q
    ? FAQ_ITEMS.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      )
    : FAQ_ITEMS;

  const visibleSections = SECTIONS.filter((s) => {
    if (s.id === 'faq') return filteredFaq.length > 0 || !q;
    return sectionMatchesSearch(s.id);
  });

  return (
    <div className="flex-1 overflow-hidden bg-white flex">
      {/* Sidebar TOC */}
      <nav className="hidden lg:flex flex-col w-56 shrink-0 border-r border-gray-200 py-8 pl-6 pr-4 overflow-y-auto">
        <span className="text-xs font-semibold text-cs-muted uppercase tracking-wider mb-4">
          Contents
        </span>
        {SECTIONS.map(({ id, title }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`text-left text-sm py-1.5 px-3 rounded-md mb-0.5 transition-colors ${
              activeSection === id
                ? 'bg-cs-blue-light text-cs-blue font-semibold'
                : 'text-gray-600 hover:text-cs-blue hover:bg-gray-50'
            }`}
          >
            {title}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
            <p className="text-cs-muted text-base">
              Everything you need to know about using Signal for commercial real estate prospecting.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-10">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cs-blue/30 focus:border-cs-blue transition"
            />
          </div>

          {visibleSections.length === 0 && (
            <p className="text-center text-cs-muted py-16 text-sm">
              No results found for &ldquo;{searchQuery}&rdquo;. Try a different search term.
            </p>
          )}

          {/* ───── Getting Started ───── */}
          {sectionMatchesSearch('getting-started') && (
            <section
              id="getting-started"
              ref={(el) => registerRef('getting-started', el)}
              className="mb-14 scroll-mt-6"
            >
              <SectionHeader>Getting Started</SectionHeader>
              <p className="text-gray-600 text-sm mb-6">
                Signal helps you discover and prioritize commercial real estate leads based on
                lease data, industry trends, and AI-powered scoring. Here is how to get up and
                running quickly.
              </p>

              <Subsection title="Setting up your territory">
                <p>
                  Start by defining the geographic area you want to prospect. Use the map view
                  to draw a custom boundary around your target market, or search by city, zip
                  code, or address. Your territory determines which leads appear in your search
                  results and can be adjusted at any time from the filter panel.
                </p>
              </Subsection>

              <Subsection title="Running your first search">
                <p>
                  Once your territory is set, use the filter panel to refine results by industry,
                  square footage range, lease expiration window, and more. Click
                  <strong> Search</strong> to load matching leads into the table and map views.
                  Results are sorted by Signal Score by default so the hottest leads surface first.
                </p>
              </Subsection>

              <Subsection title="Understanding your results">
                <p>
                  Each lead card shows the tenant name, address, leased square footage, lease
                  dates, industry, and Signal Score. Click any row to expand the lead detail
                  panel where you can view enrichment data, save the lead to a project, mark it
                  for outreach, or export it. The map view pins leads geographically so you can
                  spot clusters in your territory.
                </p>
              </Subsection>
            </section>
          )}

          {/* ───── Signal Score ───── */}
          {sectionMatchesSearch('signal-score') && (
            <section
              id="signal-score"
              ref={(el) => registerRef('signal-score', el)}
              className="mb-14 scroll-mt-6"
            >
              <SectionHeader>Signal Score</SectionHeader>
              <p className="text-gray-600 text-sm mb-6">
                Signal Score is an AI-powered lead scoring system that helps you focus on the
                prospects most likely to be in an active buying or leasing window.
              </p>

              <Subsection title="What is Signal Score?">
                <p>
                  Every lead in Signal receives a score from 0 to 100, calculated automatically
                  using multiple data points. The score quantifies how actionable a lead is right
                  now, so you can prioritize outreach to the prospects most likely to convert.
                </p>
              </Subsection>

              <Subsection title="How is it calculated?">
                <p className="mb-4">
                  Signal Score is the sum of three weighted components, capped at 100. You can customize the lease size and industry factors in Account Settings.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mb-2">
                  <FactorCard
                    title="Lease Timing"
                    points="0 - 45 pts (45%)"
                    description="Leads with leases expiring soon score highest. Expired or within 3 months = 45 pts, 3-6 months = 39, 6-12 months = 32, 1-2 years = 20, 2-3 years = 9, 3+ years = 2."
                  />
                  <FactorCard
                    title="Lease Size Match"
                    points="0 - 35 pts (35%)"
                    description="Leads matching your ideal square footage range get the full 35 points. Score decreases the further a lead's size is from your target range. Set your ideal range in Account Settings."
                  />
                  <FactorCard
                    title="Industry Match"
                    points="0 - 20 pts (20%)"
                    description="If you've selected target industries in Account Settings, leads in those industries get 20 points. Others get a baseline score. Without preferences, default industry rankings apply."
                  />
                </div>
              </Subsection>

              <Subsection title="What do the grades mean?">
                <p className="mb-4">
                  Each numeric score maps to a letter grade with a descriptive label:
                </p>
                <div className="grid sm:grid-cols-5 gap-3">
                  {GRADE_CARDS.map((g) => (
                    <div
                      key={g.grade}
                      className={`rounded-xl p-4 ring-1 ${g.bg} ${g.ring} text-center`}
                    >
                      <div className={`text-2xl font-bold ${g.text}`}>{g.grade}</div>
                      <div className={`text-xs font-semibold ${g.text} mt-1`}>{g.label}</div>
                      <div className="text-[11px] text-gray-500 mt-1">{g.range}</div>
                      <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${g.bar}`}
                          style={{ width: `${parseInt(g.range) || 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Subsection>

              <Subsection title="How to use Signal Scores in your workflow">
                <p>
                  Sort your lead table by Signal Score to surface the best opportunities first.
                  Focus outreach on A and B leads for the highest conversion rates. Use C leads
                  as a nurture pipeline and revisit D and F leads periodically as their lease
                  expirations approach and scores naturally increase.
                </p>
              </Subsection>

              <Subsection title="Pro tier scoring">
                <p>
                  Free-tier users see letter grades (A through F) for every lead. Pro-tier users
                  unlock the full numeric score (0 - 100) alongside the grade label, giving you
                  finer-grained prioritization within each tier. Upgrade from Account Settings to
                  access numeric scores.
                </p>
              </Subsection>
            </section>
          )}

          {/* ───── Projects ───── */}
          {sectionMatchesSearch('projects') && (
            <section
              id="projects"
              ref={(el) => registerRef('projects', el)}
              className="mb-14 scroll-mt-6"
            >
              <SectionHeader>Projects</SectionHeader>
              <p className="text-gray-600 text-sm mb-6">
                Projects let you organize leads into focused prospecting lists so you can manage
                campaigns, track progress, and export targeted datasets.
              </p>

              <Subsection title="Creating projects">
                <p>
                  Navigate to the Projects page and click <strong>New Project</strong>. Give your
                  project a descriptive name (e.g., &ldquo;Q2 Midtown Expiring Leases&rdquo;).
                  Projects are listed in the sidebar for quick access and can be renamed or
                  deleted at any time.
                </p>
              </Subsection>

              <Subsection title="Saving leads to projects">
                <p>
                  From the lead table, select one or more leads using the checkboxes, then click
                  <strong> Save to Project</strong>. You can also save a single lead from its
                  detail view. A lead can belong to multiple projects simultaneously.
                </p>
              </Subsection>

              <Subsection title="Filtering by project criteria">
                <p>
                  Inside a project, use the same filter controls available on the main search
                  page to narrow your project leads by industry, square footage, expiration
                  window, or Signal Score grade. This is useful for segmenting large projects
                  into targeted outreach batches.
                </p>
              </Subsection>

              <Subsection title="Exporting project data">
                <p>
                  Click the <strong>Export CSV</strong> button within any project to download all
                  project leads as a spreadsheet. The export includes all visible columns plus
                  enrichment data and Signal Scores. Export limits are based on your plan tier.
                </p>
              </Subsection>
            </section>
          )}

          {/* ───── Lead Enrichment ───── */}
          {sectionMatchesSearch('lead-enrichment') && (
            <section
              id="lead-enrichment"
              ref={(el) => registerRef('lead-enrichment', el)}
              className="mb-14 scroll-mt-6"
            >
              <SectionHeader>Lead Enrichment</SectionHeader>
              <p className="text-gray-600 text-sm mb-6">
                Enrichment adds decision-maker contact information to your leads, giving you the
                data you need to start outreach immediately.
              </p>

              <Subsection title="How enrichment works">
                <p>
                  Click the <strong>Enrich</strong> button on any lead to pull contact data from
                  connected data sources. Enrichment looks up the tenant company and returns key
                  contacts, email addresses, phone numbers, and company website when available.
                  Enriched data is cached and displayed inline in the lead table.
                </p>
              </Subsection>

              <Subsection title="Uploading your own contacts">
                <p>
                  Already have contact info for certain tenants? Use the
                  <strong> Upload Contacts</strong> feature to import a CSV of your own contacts.
                  Uploaded contacts are matched to leads by tenant name and supplement any
                  automatically enriched data.
                </p>
              </Subsection>

              <Subsection title="Contact fields available">
                <p>The following fields are supported for enrichment:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 text-sm">
                  <li><strong>Contact Name</strong> - Primary decision-maker or key contact</li>
                  <li><strong>Email</strong> - Business email address</li>
                  <li><strong>Phone</strong> - Direct or main office phone number</li>
                  <li><strong>Website</strong> - Company website URL</li>
                </ul>
              </Subsection>
            </section>
          )}

          {/* ───── Outreach Tracking ───── */}
          {sectionMatchesSearch('outreach-tracking') && (
            <section
              id="outreach-tracking"
              ref={(el) => registerRef('outreach-tracking', el)}
              className="mb-14 scroll-mt-6"
            >
              <SectionHeader>Outreach Tracking</SectionHeader>
              <p className="text-gray-600 text-sm mb-6">
                Keep track of which leads you have contacted and which are queued for outreach,
                all without leaving Signal.
              </p>

              <Subsection title="Marking leads for outreach">
                <p>
                  Toggle the <strong>Send Outreach</strong> checkbox on any lead to flag it for
                  your next outreach campaign. This makes it easy to build a call list or email
                  batch directly from your search results.
                </p>
              </Subsection>

              <Subsection title="Tracking contacted status">
                <p>
                  After you have reached out, toggle the <strong>Contacted</strong> checkbox to
                  mark the lead as contacted. Contacted leads are visually distinguished in the
                  table so you can quickly see which prospects still need follow-up.
                </p>
              </Subsection>

              <Subsection title="Bulk updates">
                <p>
                  Select multiple leads using the checkboxes in the lead table, then use the bulk
                  action bar to mark all selected leads as contacted or flagged for outreach in a
                  single click. This is especially useful after completing a batch of calls or
                  emails.
                </p>
              </Subsection>
            </section>
          )}

          {/* ───── Exporting Data ───── */}
          {sectionMatchesSearch('exporting-data') && (
            <section
              id="exporting-data"
              ref={(el) => registerRef('exporting-data', el)}
              className="mb-14 scroll-mt-6"
            >
              <SectionHeader>Exporting Data</SectionHeader>
              <p className="text-gray-600 text-sm mb-6">
                Export your leads as CSV files for use in spreadsheets, CRMs, or email platforms.
              </p>

              <Subsection title="CSV export format">
                <p>
                  Exports are delivered as standard CSV files compatible with Excel, Google
                  Sheets, and all major CRM import tools. Each row represents a single lead, and
                  columns include tenant name, address, industry, square footage, lease dates,
                  Signal Score, grade, contact info, and outreach status.
                </p>
              </Subsection>

              <Subsection title="Export limits by plan tier">
                <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Plan</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Price</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Monthly Export Limit</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Signal Score</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-700">Key Features</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-gray-900">Starter</td>
                        <td className="px-4 py-2.5 text-gray-600">$100/mo</td>
                        <td className="px-4 py-2.5 text-gray-600">50 leads</td>
                        <td className="px-4 py-2.5 text-gray-600">Letter grade only</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">Basic search, territory setup, single project</td>
                      </tr>
                      <tr className="bg-blue-50/30">
                        <td className="px-4 py-2.5 font-medium text-gray-900">Growth</td>
                        <td className="px-4 py-2.5 text-gray-600">$250/mo</td>
                        <td className="px-4 py-2.5 text-gray-600">150 leads</td>
                        <td className="px-4 py-2.5 text-gray-600">Letter grade only</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">Multiple projects, lead enrichment, outreach tracking</td>
                      </tr>
                      <tr className="bg-blue-50/50">
                        <td className="px-4 py-2.5 font-medium text-cs-blue">Pro</td>
                        <td className="px-4 py-2.5 text-gray-600">$600/mo</td>
                        <td className="px-4 py-2.5 text-gray-600">500 leads</td>
                        <td className="px-4 py-2.5 text-gray-600">Full numeric score + grade</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">Lead AI, bulk outreach, advanced filters, priority enrichment</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-gray-900">Enterprise</td>
                        <td className="px-4 py-2.5 text-gray-600">Custom</td>
                        <td className="px-4 py-2.5 text-gray-600">Unlimited</td>
                        <td className="px-4 py-2.5 text-gray-600">Full numeric score + grade</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">SSO, dedicated support, API access, custom integrations</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Subsection>

              <Subsection title="What's included in exports">
                <p>Every export includes the following data for each lead:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 text-sm">
                  <li>Tenant name and industry</li>
                  <li>Street address</li>
                  <li>Leased square footage</li>
                  <li>Lease commencement and expiration dates</li>
                  <li>Signal Score and grade</li>
                  <li>Contact name, email, phone, and website (if enriched)</li>
                  <li>Outreach and contacted status</li>
                </ul>
              </Subsection>
            </section>
          )}

          {/* ───── FAQ ───── */}
          {(filteredFaq.length > 0 || !q) && (
            <section
              id="faq"
              ref={(el) => registerRef('faq', el)}
              className="mb-14 scroll-mt-6"
            >
              <SectionHeader>Frequently Asked Questions</SectionHeader>

              <div className="space-y-2 mt-2">
                {filteredFaq.map((item, i) => {
                  const isOpen = openFaqIndex === i;
                  return (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(i)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                      >
                        <span>{item.question}</span>
                        <svg
                          className={`w-4 h-4 shrink-0 text-cs-muted transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function SectionHeader({ children }) {
  return (
    <h2 className="text-xl font-bold text-gray-900 mb-3 pl-4 border-l-4 border-cs-blue">
      {children}
    </h2>
  );
}

function Subsection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

function FactorCard({ title, points, description }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-xs font-semibold text-cs-blue bg-cs-blue-light px-2 py-0.5 rounded-full">
          {points}
        </span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Search keyword index for filtering sections
   ────────────────────────────────────────────── */

const SECTION_KEYWORDS = {
  'getting-started': [
    'getting started', 'territory', 'first search', 'results', 'setup',
    'map', 'filter', 'prospecting', 'begin', 'how to', 'onboarding',
  ],
  'signal-score': [
    'signal score', 'score', 'grade', 'scoring', 'hot lead', 'warm lead',
    'moderate', 'cold', 'low signal', 'lease expiration', 'industry signal',
    'space size', 'data completeness', 'ai', 'priority', 'pro tier', 'numeric',
  ],
  projects: [
    'project', 'projects', 'list', 'save', 'organize', 'campaign', 'create',
    'export project', 'filter project',
  ],
  'lead-enrichment': [
    'enrichment', 'enrich', 'contact', 'email', 'phone', 'website',
    'upload', 'csv', 'decision maker', 'contact data',
  ],
  'outreach-tracking': [
    'outreach', 'tracking', 'contacted', 'send outreach', 'bulk',
    'follow up', 'call list', 'email batch',
  ],
  'exporting-data': [
    'export', 'csv', 'download', 'spreadsheet', 'limits', 'plan',
    'free', 'pro', 'unlimited',
  ],
  faq: [
    'faq', 'question', 'frequently asked', 'crm', 'integrate', 'pricing',
    'upgrade', 'share', 'team', 'update', 'data updated',
  ],
};
