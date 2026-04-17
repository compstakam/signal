import { useState, useEffect, useMemo } from 'react';
import { loadLeadData } from '../utils/parseExcel';
import { isPointInCircle, isPointInBounds, isPointInPolygon } from '../utils/geoUtils';

export function useLeadData(filters) {
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeadData()
      .then(setAllLeads)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const industries = useMemo(() => {
    const set = new Set(allLeads.map(l => l.tenantIndustry).filter(Boolean));
    return [...set].sort();
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      if (filters.tenantNameSearch) {
        const search = filters.tenantNameSearch.toLowerCase();
        if (!lead.tenantName.toLowerCase().includes(search)) return false;
      }

      if (filters.industries?.length > 0 && !filters.industries.includes(lead.tenantIndustry)) {
        return false;
      }

      if (filters.sqftMin && lead.sqft < filters.sqftMin) return false;
      if (filters.sqftMax && lead.sqft > filters.sqftMax) return false;

      if (filters.commencementFrom && lead.commencementDate) {
        if (lead.commencementDate < filters.commencementFrom) return false;
      }
      if (filters.commencementTo && lead.commencementDate) {
        if (lead.commencementDate > filters.commencementTo) return false;
      }

      if (filters.expirationFrom && lead.expirationDate) {
        if (lead.expirationDate < filters.expirationFrom) return false;
      }
      if (filters.expirationTo && lead.expirationDate) {
        if (lead.expirationDate > filters.expirationTo) return false;
      }

      if (filters.circle) {
        const { lat, lng, radiusMiles } = filters.circle;
        if (!isPointInCircle(lead.lat, lead.lng, lat, lng, radiusMiles)) return false;
      }

      if (filters.bounds) {
        if (!isPointInBounds(lead.lat, lead.lng, filters.bounds)) return false;
      }

      if (filters.polygon) {
        if (!isPointInPolygon(lead.lat, lead.lng, filters.polygon)) return false;
      }

      return true;
    });
  }, [allLeads, filters]);

  return { leads: filteredLeads, allLeads, industries, loading, error };
}
