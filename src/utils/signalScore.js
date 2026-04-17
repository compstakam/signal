/**
 * Signal Score — AI-powered lead scoring with user preferences
 *
 * Scores each lead 0-100 based on:
 *   1. Lease timing (0-45 pts) — closer expiration = higher urgency
 *   2. Lease size (0-35 pts) — matches user's ideal size range
 *   3. Industry match (0-20 pts) — user's preferred industries score highest
 */

// Default industry signal weights (used when no preferences set), scaled 0-20
const INDUSTRY_SIGNALS = {
  'technology':                     20,
  'software & information':         20,
  'financial services':             18,
  'professional services':          16,
  'legal':                          16,
  'commercial & professional service': 16,
  'healthcare':                     14,
  'insurance':                      14,
  'media':                          14,
  'media & entertainment':          14,
  'telecommunications':             13,
  'real estate':                    12,
  'retail':                         11,
  'food & beverage':                11,
  'hospitality':                    10,
  'education':                      10,
  'construction':                   10,
  'manufacturing':                  9,
  'transportation & logistics':     9,
  'energy & utilities':             8,
  'government':                     6,
  'nonprofit':                      6,
};

/** All available industries for the preferences UI */
export const AVAILABLE_INDUSTRIES = Object.keys(INDUSTRY_SIGNALS).map(k =>
  k.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
);

/**
 * Lease timing score (0-45)
 * Closer expiration = higher urgency
 */
function expirationScore(expirationDate) {
  if (!expirationDate) return 5;

  const now = new Date();
  const expDate = expirationDate instanceof Date ? expirationDate : new Date(expirationDate);
  if (isNaN(expDate.getTime())) return 5;

  const monthsUntilExpiry = (expDate - now) / (1000 * 60 * 60 * 24 * 30.44);

  if (monthsUntilExpiry <= 0) return 45;        // Already expired
  if (monthsUntilExpiry <= 3) return 45;         // Expiring within 3 months
  if (monthsUntilExpiry <= 6) return 39;         // 3-6 months
  if (monthsUntilExpiry <= 12) return 32;        // 6-12 months
  if (monthsUntilExpiry <= 24) return 20;        // 1-2 years
  if (monthsUntilExpiry <= 36) return 9;         // 2-3 years
  return 2;                                       // 3+ years out
}

/**
 * Lease size score (0-35)
 * Scores based on how well the lead's size matches the user's ideal range.
 * When no preferences, defaults to 5K-25K sweet spot.
 */
function spaceSizeScore(sqft, preferences = {}) {
  if (!sqft || sqft <= 0) return 5;

  const idealMin = preferences.sqftMin || 5000;
  const idealMax = preferences.sqftMax || 25000;
  const idealRange = idealMax - idealMin;

  // Inside ideal range — full points
  if (sqft >= idealMin && sqft <= idealMax) return 35;

  // How far outside the range
  let distance;
  if (sqft < idealMin) {
    distance = (idealMin - sqft) / idealMin;
  } else {
    distance = (sqft - idealMax) / idealMax;
  }

  // Score drops with distance from ideal range
  if (distance <= 0.25) return 28;  // Within 25% of boundary
  if (distance <= 0.5) return 22;   // Within 50%
  if (distance <= 1.0) return 15;   // Within 100%
  if (distance <= 2.0) return 8;    // Within 200%
  return 4;                          // Very far from ideal
}

/**
 * Industry match score (0-20)
 * If user has preferred industries, those get max points.
 * Otherwise falls back to default industry rankings.
 */
function industryScore(industry, preferences = {}) {
  if (!industry) return 6;
  const key = industry.toLowerCase().trim();
  const preferred = (preferences.preferredIndustries || []).map(i => i.toLowerCase().trim());

  // If user has set preferred industries, use simple match/no-match scoring
  if (preferred.length > 0) {
    if (preferred.includes(key)) return 20;
    // Check partial match
    for (const pref of preferred) {
      if (key.includes(pref) || pref.includes(key)) return 20;
    }
    return 8; // Not a preferred industry — baseline
  }

  // No preferences — use default industry rankings
  if (INDUSTRY_SIGNALS[key] !== undefined) return INDUSTRY_SIGNALS[key];

  // Partial match against defaults
  for (const [pattern, score] of Object.entries(INDUSTRY_SIGNALS)) {
    if (key.includes(pattern) || pattern.includes(key)) return score;
  }

  return 10; // Unknown industry
}

/**
 * Compute Signal Score for a lead
 * @param {Object} lead - Lead object
 * @param {Object} enrichment - Enrichment data
 * @param {Object} preferences - User preferences { sqftMin, sqftMax, preferredIndustries }
 * @returns {Object} { score, grade, factors }
 */
export function computeSignalScore(lead, enrichment = {}, preferences = {}) {
  const expScore = expirationScore(lead.expirationDate);
  const sizeScore = spaceSizeScore(lead.sqft, preferences);
  const indScore = industryScore(lead.tenantIndustry, preferences);

  const totalScore = Math.min(100, expScore + sizeScore + indScore);

  let grade;
  if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 65) grade = 'B';
  else if (totalScore >= 45) grade = 'C';
  else if (totalScore >= 25) grade = 'D';
  else grade = 'F';

  return {
    score: totalScore,
    grade,
    factors: {
      expiration: expScore,
      spaceSize: sizeScore,
      industry: indScore,
    },
  };
}

/**
 * Compute Signal Scores for all leads at once
 * @param {Array} leads - Array of lead objects
 * @param {Object} enrichmentData - Map of tenantName -> enrichment data
 * @param {Object} preferences - User signal score preferences
 * @returns {Object} Map of leadId -> { score, grade, factors }
 */
export function computeAllSignalScores(leads, enrichmentData = {}, preferences = {}) {
  const scores = {};
  for (const lead of leads) {
    const enrichment = enrichmentData[lead.tenantName] || {};
    scores[lead.leadId] = computeSignalScore(lead, enrichment, preferences);
  }
  return scores;
}

export function getGradeLabel(grade) {
  const labels = { A: 'Hot Lead', B: 'Warm Lead', C: 'Moderate', D: 'Low Signal', F: 'Cold' };
  return labels[grade] || 'Unknown';
}

export function getGradeColors(grade) {
  const colors = {
    A: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', bar: 'bg-red-500' },
    B: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', bar: 'bg-orange-500' },
    C: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', bar: 'bg-amber-500' },
    D: { bg: 'bg-gray-50', text: 'text-gray-500', ring: 'ring-gray-200', bar: 'bg-gray-400' },
    F: { bg: 'bg-gray-50', text: 'text-gray-400', ring: 'ring-gray-100', bar: 'bg-gray-300' },
  };
  return colors[grade] || colors.F;
}
