import { useState } from 'react';

export default function AddressSearch({ onSearch, onClear }) {
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(5);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'TenantLeadSearch/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        onSearch({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          radiusMiles: radius,
          label: data[0].display_name,
        });
      } else {
        alert('Address not found. Try a different search.');
      }
    } catch {
      alert('Geocoding failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setAddress('');
    onClear();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-cs-cyan uppercase tracking-wider">Map Search</h2>
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Address or Zip Code</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. 10017 or 535 Madison Ave, NY"
          className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white placeholder-cs-muted focus:outline-none focus:ring-2 focus:ring-cs-blue"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-cs-muted mb-1 uppercase tracking-wider">Radius (miles)</label>
        <select
          value={radius}
          onChange={e => setRadius(Number(e.target.value))}
          className="w-full border border-cs-border rounded-lg px-3 py-2 text-sm bg-cs-navy-mid text-white focus:outline-none focus:ring-2 focus:ring-cs-blue"
        >
          {[1, 2, 5, 10, 25, 50].map(r => (
            <option key={r} value={r}>{r} mile{r > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={searching || !address.trim()}
          className="flex-1 bg-cs-blue hover:bg-cs-cyan disabled:opacity-40 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
        >
          {searching ? 'Searching...' : 'Search Area'}
        </button>
        <button
          onClick={handleClear}
          className="flex-1 border border-cs-border hover:border-cs-blue text-cs-muted hover:text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          Clear Map
        </button>
      </div>
      <p className="text-xs text-cs-muted">
        Or draw a rectangle/polygon on the map to select an area
      </p>
    </div>
  );
}
