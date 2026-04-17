import FilterPanel from './FilterPanel';
import AddressSearch from './AddressSearch';

export default function Sidebar({
  industries, filters, onFilterChange, onClearFilters,
  onAddressSearch, onClearMap,
  resultCount, onSaveResultsToProject,
  contactedMap, sendOutreachMap,
  projects,
}) {
  return (
    <div className="w-72 bg-cs-navy-light border-r border-cs-border flex flex-col overflow-y-auto shrink-0">
      <div className="p-4 border-b border-cs-border">
        <FilterPanel
          industries={industries}
          filters={filters}
          onFilterChange={onFilterChange}
          onClear={onClearFilters}
          resultCount={resultCount}
          onSaveResultsToProject={onSaveResultsToProject}
          contactedMap={contactedMap}
          sendOutreachMap={sendOutreachMap}
          projects={projects}
        />
      </div>
      <div className="p-4">
        <AddressSearch onSearch={onAddressSearch} onClear={onClearMap} />
      </div>
    </div>
  );
}
