import { useState, useRef, useEffect } from 'react';

function parseQuery(query, allLeads) {
  const q = query.toLowerCase();
  let results = [...allLeads];
  const appliedFilters = [];

  // Extract industry mentions
  const industries = [...new Set(allLeads.map(l => l.tenantIndustry).filter(Boolean))];
  const matchedIndustries = industries.filter(ind => q.includes(ind.toLowerCase()));
  if (matchedIndustries.length > 0) {
    results = results.filter(l => matchedIndustries.some(ind =>
      l.tenantIndustry.toLowerCase() === ind.toLowerCase()
    ));
    appliedFilters.push(`Industry: ${matchedIndustries.join(', ')}`);
  }

  // Extract square footage
  const sqftPatterns = [
    /(?:at least|more than|over|above|greater than|minimum|min)\s*([\d,]+)\s*(?:sq\.?\s*ft|square\s*feet|sqft|sf)/i,
    /(?:under|below|less than|up to|maximum|max|no more than)\s*([\d,]+)\s*(?:sq\.?\s*ft|square\s*feet|sqft|sf)/i,
    /(?:between|from)\s*([\d,]+)\s*(?:and|to|-)\s*([\d,]+)\s*(?:sq\.?\s*ft|square\s*feet|sqft|sf)/i,
    /([\d,]+)\s*(?:to|-)\s*([\d,]+)\s*(?:sq\.?\s*ft|square\s*feet|sqft|sf)/i,
    /([\d,]+)\s*\+?\s*(?:sq\.?\s*ft|square\s*feet|sqft|sf)/i,
  ];

  const minMatch = q.match(sqftPatterns[0]);
  const maxMatch = q.match(sqftPatterns[1]);
  const rangeMatch = q.match(sqftPatterns[2]) || q.match(sqftPatterns[3]);

  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1].replace(/,/g, ''));
    const hi = parseInt(rangeMatch[2].replace(/,/g, ''));
    results = results.filter(l => l.sqft >= lo && l.sqft <= hi);
    appliedFilters.push(`Square footage: ${lo.toLocaleString()} – ${hi.toLocaleString()} SF`);
  } else if (minMatch) {
    const val = parseInt(minMatch[1].replace(/,/g, ''));
    results = results.filter(l => l.sqft >= val);
    appliedFilters.push(`Square footage: ≥ ${val.toLocaleString()} SF`);
  } else if (maxMatch) {
    const val = parseInt(maxMatch[1].replace(/,/g, ''));
    results = results.filter(l => l.sqft <= val);
    appliedFilters.push(`Square footage: ≤ ${val.toLocaleString()} SF`);
  } else {
    const generalSqft = q.match(/([\d,]+)\s*\+?\s*(?:sq\.?\s*ft|square\s*feet|sqft|sf)/i);
    if (generalSqft) {
      const val = parseInt(generalSqft[1].replace(/,/g, ''));
      if (q.includes('+') || q.includes('plus') || q.includes('over') || q.includes('above')) {
        results = results.filter(l => l.sqft >= val);
        appliedFilters.push(`Square footage: ≥ ${val.toLocaleString()} SF`);
      } else {
        results = results.filter(l => l.sqft >= val * 0.8 && l.sqft <= val * 1.2);
        appliedFilters.push(`Square footage: ~${val.toLocaleString()} SF`);
      }
    }
  }

  // Extract year-based expiration
  const expiringPatterns = [
    /expir(?:ing|es?|ation)\s*(?:in|by|before|within)?\s*(\d{4})/i,
    /expir(?:ing|es?|ation)\s*(?:in|within|next)\s*(\d+)\s*(?:months?|yrs?|years?)/i,
    /leases?\s*(?:expiring|ending)\s*(?:in|by)?\s*(\d{4})/i,
    /expir(?:ing|es?|ation)\s*(?:this|next)\s*year/i,
  ];

  const expYearMatch = q.match(expiringPatterns[0]) || q.match(expiringPatterns[2]);
  const expRelMatch = q.match(expiringPatterns[1]);
  const expThisNextYear = q.match(expiringPatterns[3]);

  if (expYearMatch) {
    const year = parseInt(expYearMatch[1]);
    results = results.filter(l => {
      if (!l.expirationDate) return false;
      return l.expirationDate.getFullYear() === year;
    });
    appliedFilters.push(`Expiring in ${year}`);
  } else if (expRelMatch) {
    const num = parseInt(expRelMatch[1]);
    const unit = expRelMatch[2];
    const now = new Date();
    let endDate = new Date();
    if (/year|yr/i.test(unit)) {
      endDate.setFullYear(endDate.getFullYear() + num);
    } else {
      endDate.setMonth(endDate.getMonth() + num);
    }
    results = results.filter(l => {
      if (!l.expirationDate) return false;
      return l.expirationDate >= now && l.expirationDate <= endDate;
    });
    appliedFilters.push(`Expiring within ${num} ${unit}`);
  } else if (expThisNextYear) {
    const now = new Date();
    const year = q.includes('next') ? now.getFullYear() + 1 : now.getFullYear();
    results = results.filter(l => {
      if (!l.expirationDate) return false;
      return l.expirationDate.getFullYear() === year;
    });
    appliedFilters.push(`Expiring ${q.includes('next') ? 'next' : 'this'} year (${year})`);
  }

  // Extract commencement/start date
  const commPatterns = [
    /(?:start(?:ed|ing|s)?|commenc(?:ed|ing|es?|ement))\s*(?:in|after|since|from)?\s*(\d{4})/i,
    /(?:new|recent)\s*leases?\s*(?:from|since|in|after)?\s*(\d{4})/i,
  ];
  const commMatch = q.match(commPatterns[0]) || q.match(commPatterns[1]);
  if (commMatch) {
    const year = parseInt(commMatch[1]);
    results = results.filter(l => {
      if (!l.commencementDate) return false;
      return l.commencementDate.getFullYear() >= year;
    });
    appliedFilters.push(`Commenced from ${year}`);
  }

  // Extract city
  const cities = [...new Set(allLeads.map(l => l.city).filter(Boolean))];
  const matchedCity = cities.find(c => q.includes(c.toLowerCase()));
  if (matchedCity) {
    results = results.filter(l => l.city.toLowerCase() === matchedCity.toLowerCase());
    appliedFilters.push(`City: ${matchedCity}`);
  }

  // Extract state
  const states = [...new Set(allLeads.map(l => l.state).filter(Boolean))];
  const matchedState = states.find(s => {
    const lower = s.toLowerCase();
    return q.includes(lower) || q.includes(` ${lower} `) || q.endsWith(` ${lower}`);
  });
  if (matchedState && !matchedCity) {
    results = results.filter(l => l.state.toLowerCase() === matchedState.toLowerCase());
    appliedFilters.push(`State: ${matchedState}`);
  }

  // Extract building class
  const classMatch = q.match(/class\s*([abc])\b/i);
  if (classMatch) {
    results = results.filter(l =>
      l.buildingClass && l.buildingClass.toLowerCase().includes(classMatch[1].toLowerCase())
    );
    appliedFilters.push(`Building Class: ${classMatch[1].toUpperCase()}`);
  }

  // Extract tenant name search
  const tenantMatch = q.match(/(?:tenant|company|named?)\s*(?:is|called|named)?\s*["""]?([^"""\n,]+)["""]?/i);
  if (tenantMatch && !matchedIndustries.length && !matchedCity) {
    const name = tenantMatch[1].trim();
    if (name.length > 2) {
      results = results.filter(l => l.tenantName.toLowerCase().includes(name.toLowerCase()));
      appliedFilters.push(`Tenant name contains: "${name}"`);
    }
  }

  return { results, appliedFilters };
}

function generateResponseText(results, appliedFilters, query) {
  if (appliedFilters.length === 0) {
    return "I wasn't able to extract specific search criteria from your message. Try asking something like:\n\n• \"Show me Financial Services tenants with over 5,000 sq ft\"\n• \"Find leases expiring in 2025\"\n• \"Tenants in Jersey City with 3,000 to 10,000 sqft\"\n• \"Class A buildings with leases starting in 2023\"";
  }

  let response = `Found **${results.length.toLocaleString()} leads** matching your criteria:\n\n`;
  response += appliedFilters.map(f => `• ${f}`).join('\n');

  if (results.length === 0) {
    response += '\n\nNo leads matched all of these filters. Try broadening your search.';
  }

  return response;
}

export default function LeadAIPage({ allLeads, enrichmentData, projects, onSaveToProject }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hi! I'm your Lead AI assistant. Describe the type of leads you're looking for and I'll find them for you.\n\nTry something like:\n• \"Financial Services tenants with over 5,000 sq ft expiring in 2025\"\n• \"Find me tenants in Jersey City\"\n• \"Show Class A building leases starting in 2023\"",
      results: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [saveMenuIndex, setSaveMenuIndex] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const saveMenuRef = useRef(null);

  // Close save menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target)) {
        setSaveMenuIndex(null);
        setNewProjectName('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSaveResults = async (msgIndex, projectId, createNew) => {
    const msg = messages[msgIndex];
    if (!msg?.results) return;
    setSavingProject(true);
    try {
      const leadIds = msg.results.map(l => l.leadId);
      await onSaveToProject({
        createNew,
        name: createNew ? newProjectName.trim() : undefined,
        projectId: createNew ? undefined : projectId,
        leadIds,
      });
      setSaveMenuIndex(null);
      setNewProjectName('');
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSavingProject(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input.trim(), results: null };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate brief "thinking" delay
    setTimeout(() => {
      const { results, appliedFilters } = parseQuery(userMsg.text, allLeads);
      const responseText = generateResponseText(results, appliedFilters, userMsg.text);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: responseText,
        results: results.slice(0, 50),
        totalResults: results.length,
        appliedFilters,
      }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl ${msg.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cs-blue to-cs-cyan flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead AI</span>
                  </div>
                )}
                <div className={`rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-cs-blue text-white'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </div>
                </div>

                {/* Results table */}
                {msg.results && msg.results.length > 0 && (
                  <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-cs-blue shrink-0">
                        Showing {Math.min(msg.results.length, 50)} of {msg.totalResults.toLocaleString()} results
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.appliedFilters && msg.appliedFilters.map((f, fi) => (
                          <span key={fi} className="px-2 py-0.5 bg-cs-blue/10 text-cs-blue text-[10px] font-medium rounded-full">
                            {f}
                          </span>
                        ))}
                        <div className="relative" ref={saveMenuIndex === i ? saveMenuRef : null}>
                          <button
                            onClick={() => { setSaveMenuIndex(saveMenuIndex === i ? null : i); setNewProjectName(''); }}
                            className="px-3 py-1 bg-cs-blue hover:bg-cs-cyan text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Save to Project
                          </button>
                          {saveMenuIndex === i && (
                            <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                  Save {msg.results.length} leads to...
                                </p>
                              </div>
                              {projects.length > 0 && (
                                <div className="max-h-40 overflow-y-auto">
                                  {projects.map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleSaveResults(i, p.id, false)}
                                      disabled={savingProject}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between disabled:opacity-40"
                                    >
                                      <span className="font-medium text-gray-900">{p.name}</span>
                                      <span className="text-xs text-gray-400">{p.lead_count} leads</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="px-4 py-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-500 mb-2">Or create new project</p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && newProjectName.trim() && handleSaveResults(i, null, true)}
                                    placeholder="Project name..."
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveResults(i, null, true)}
                                    disabled={!newProjectName.trim() || savingProject}
                                    className="px-3 py-1.5 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    {savingProject ? '...' : 'Create'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tenant</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Industry</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Sq Ft</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">City</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Commencement</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Expiration</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {msg.results.map((lead, li) => {
                            const enrich = enrichmentData[lead.tenantName] || {};
                            return (
                              <tr key={li} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{lead.tenantName}</td>
                                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{lead.tenantIndustry}</td>
                                <td className="px-3 py-2 text-gray-900">{lead.sqft?.toLocaleString()}</td>
                                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{lead.city}, {lead.state}</td>
                                <td className="px-3 py-2 text-gray-500">{lead.commencementDateStr}</td>
                                <td className="px-3 py-2 text-gray-500">{lead.expirationDateStr}</td>
                                <td className="px-3 py-2 text-xs">
                                  {enrich.contactName ? (
                                    <span className="text-gray-900">{enrich.contactName}</span>
                                  ) : enrich.contactEmail ? (
                                    <a href={`mailto:${enrich.contactEmail}`} className="text-cs-blue hover:text-cs-cyan">{enrich.contactEmail}</a>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="mr-12">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cs-blue to-cs-cyan flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead AI</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-cs-blue/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-cs-blue/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-cs-blue/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the leads you're looking for..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cs-blue focus:border-cs-blue"
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="px-6 py-3 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
