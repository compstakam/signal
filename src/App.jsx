import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLeadData } from './hooks/useLeadData';
import { useProjects } from './hooks/useProjects';
import { useNewLeads } from './hooks/useNewLeads';
import { useEnrichment } from './hooks/useEnrichment';
import { useOutreach } from './hooks/useOutreach';
import { useSubscription } from './hooks/useSubscription';
import { useOnboarding } from './hooks/useOnboarding';
import { usePreferences } from './hooks/usePreferences';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import LeadTable from './components/LeadTable';
import ProjectsPage from './components/ProjectsPage';
import IntegrationsPage from './components/IntegrationsPage';
import AccountSettingsPage from './components/AccountSettingsPage';
import LeadAlertsPage from './components/LeadAlertsPage';
import LeadAIPage from './components/LeadAIPage';
import SaveToProjectModal from './components/SaveToProjectModal';
import UploadContactsModal from './components/UploadContactsModal';
import OnboardingFlow from './components/OnboardingFlow';
import UpgradePrompt from './components/UpgradePrompt';
import AdminDashboard from './components/AdminDashboard';
import HelpCenterPage from './components/HelpCenterPage';
import { computeAllSignalScores } from './utils/signalScore';

const emptyFilters = {
  industries: [],
  sqftMin: undefined,
  sqftMax: undefined,
  commencementFrom: undefined,
  commencementTo: undefined,
  expirationFrom: undefined,
  expirationTo: undefined,
  circle: undefined,
  bounds: undefined,
  polygon: undefined,
};

export default function App() {
  const [page, setPage] = useState('find-leads');
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saveMode, setSaveMode] = useState('selected');
  const [upgradePromptDismissed, setUpgradePromptDismissed] = useState(false);

  const { leads, allLeads, industries, loading, error } = useLeadData(filters);
  const { newLeadIds, initialize: initNewLeads } = useNewLeads();
  const {
    projects, fetchProjects, createProject, updateProject, deleteProject,
    addLeadsToProject, removeLeadsFromProject, getProjectDetail,
  } = useProjects();
  const { enrichmentData, enriching, fetchEnrichment, enrichLeads, uploadContacts } = useEnrichment();
  const { contactedMap, sendOutreachMap, fetchOutreach, toggleContacted, toggleSendOutreach, bulkUpdate } = useOutreach();
  const { subscription, fetchSubscription, recordExport, changeTier } = useSubscription();
  const {
    onboarding, loading: onboardingLoading,
    completeStep, incrementSearchCount, completeOnboarding, shouldShowUpgradePrompt,
  } = useOnboarding();
  const { preferences, fetchPreferences, savePreferences } = usePreferences();

  useEffect(() => {
    if (allLeads.length > 0) {
      initNewLeads(allLeads);
      fetchProjects();
      fetchEnrichment();
      fetchOutreach();
      fetchSubscription();
      fetchPreferences();
    }
  }, [allLeads.length]);

  // Compute Signal Scores for all leads
  const signalScores = useMemo(() => {
    if (allLeads.length === 0) return {};
    return computeAllSignalScores(allLeads, enrichmentData, preferences || {});
  }, [allLeads, enrichmentData, preferences]);

  const isProTier = subscription?.tier === 'pro' || subscription?.tier === 'enterprise';

  // Track project lead IDs for project filtering
  const [projectLeadIds, setProjectLeadIds] = useState(null);

  useEffect(() => {
    if (filters.projectId) {
      getProjectDetail(Number(filters.projectId)).then(data => {
        setProjectLeadIds(new Set(data.leads.map(l => l.lead_id)));
      }).catch(() => setProjectLeadIds(null));
    } else {
      setProjectLeadIds(null);
    }
  }, [filters.projectId, getProjectDetail]);

  // Apply outreach, signal score, and project filters on top of lead data filters
  const filteredLeads = useMemo(() => {
    let result = leads;
    if (filters.sendOutreachFilter === 'yes') {
      result = result.filter(l => sendOutreachMap[l.leadId]);
    } else if (filters.sendOutreachFilter === 'no') {
      result = result.filter(l => !sendOutreachMap[l.leadId]);
    }
    if (filters.contactedFilter === 'yes') {
      result = result.filter(l => contactedMap[l.leadId]);
    } else if (filters.contactedFilter === 'no') {
      result = result.filter(l => !contactedMap[l.leadId]);
    }
    // Signal Score grade filter
    if (filters.signalGrade) {
      const allowedGrades = filters.signalGrade.split('');
      result = result.filter(l => {
        const ss = signalScores[l.leadId];
        return ss && allowedGrades.includes(ss.grade);
      });
    }
    // Project filter
    if (filters.projectId && projectLeadIds) {
      result = result.filter(l => projectLeadIds.has(l.leadId));
    }
    return result;
  }, [leads, filters.sendOutreachFilter, filters.contactedFilter, filters.signalGrade, filters.projectId, sendOutreachMap, contactedMap, signalScores, projectLeadIds]);

  const handleAddressSearch = useCallback((circle) => {
    setFilters(f => ({ ...f, circle, bounds: undefined, polygon: undefined }));
  }, []);

  const handleClearMap = useCallback(() => {
    setFilters(f => ({ ...f, circle: undefined, bounds: undefined, polygon: undefined }));
  }, []);

  const handleShapeDrawn = useCallback((shape) => {
    if (!shape) {
      setFilters(f => ({ ...f, bounds: undefined, polygon: undefined }));
      return;
    }
    if (shape.type === 'bounds') {
      setFilters(f => ({ ...f, bounds: shape.bounds, polygon: undefined, circle: undefined }));
    } else if (shape.type === 'polygon') {
      setFilters(f => ({ ...f, polygon: shape.latlngs, bounds: undefined, circle: undefined }));
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(emptyFilters);
  }, []);

  const handleRowClick = useCallback((lead, idx) => {
    setSelectedLead(lead);
    setSelectedId(idx);
  }, []);

  const handleSaveToProject = useCallback(async ({ createNew, name, projectId, filterCriteria }) => {
    try {
      let targetId = projectId;
      if (createNew) {
        const project = await createProject(name, '', filterCriteria);
        targetId = project.id;
      }
      const idsToSave = saveMode === 'results'
        ? filteredLeads.map(l => l.leadId)
        : [...selectedLeadIds];
      await addLeadsToProject(targetId, idsToSave);
      setSelectedLeadIds(new Set());
      setShowSaveModal(false);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to save leads:', err);
    }
  }, [selectedLeadIds, leads, saveMode, createProject, addLeadsToProject, fetchProjects]);

  const handleSaveResultsToProject = useCallback(() => {
    setSaveMode('results');
    setShowSaveModal(true);
  }, []);

  // Track searches for upgrade prompt (count filter applications as searches)
  const handleFilterChangeWithTracking = useCallback((newFilters) => {
    setFilters(prev => {
      const next = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      // Check if any meaningful filter was applied (not just clearing)
      const hasFilters = next.industries?.length > 0 || next.sqftMin || next.sqftMax ||
        next.commencementFrom || next.expirationFrom || next.circle || next.bounds || next.polygon;
      if (hasFilters && onboarding && !onboarding.completed) {
        incrementSearchCount();
      }
      return next;
    });
  }, [onboarding, incrementSearchCount]);

  // Show onboarding flow if not completed
  if (onboardingLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cs-navy">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-cs-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cs-muted font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (onboarding && !onboarding.completed) {
    return (
      <OnboardingFlow
        onComplete={completeOnboarding}
        completeStep={completeStep}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cs-navy">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-cs-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cs-muted font-medium">Loading lead data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-cs-navy">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-400">Error loading data</p>
          <p className="text-sm mt-1 text-cs-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <TopNav activePage={page} onNavigate={setPage} subscription={subscription} />

      <div className="flex-1 flex min-h-0">
        {page === 'find-leads' && (
          <>
            <Sidebar
              industries={industries}
              filters={filters}
              onFilterChange={handleFilterChangeWithTracking}
              onClearFilters={handleClearFilters}
              onAddressSearch={handleAddressSearch}
              onClearMap={handleClearMap}
              resultCount={filteredLeads.length}
              onSaveResultsToProject={handleSaveResultsToProject}
              contactedMap={contactedMap}
              sendOutreachMap={sendOutreachMap}
              projects={projects}
            />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="h-1/2 p-2 bg-cs-navy">
                <MapView
                  leads={filteredLeads}
                  circle={filters.circle}
                  selectedLead={selectedLead}
                  onShapeDrawn={handleShapeDrawn}
                />
              </div>
              <div className="h-1/2 border-t border-gray-200 bg-white">
                <LeadTable
                  leads={filteredLeads}
                  onRowClick={handleRowClick}
                  selectedId={selectedId}
                  selectable
                  selectedLeadIds={selectedLeadIds}
                  onSelectionChange={setSelectedLeadIds}
                  newLeadIds={newLeadIds}
                  onSaveToProject={() => { setSaveMode('selected'); setShowSaveModal(true); }}
                  enrichmentData={enrichmentData}
                  enriching={enriching}
                  onEnrich={() => {
                    const names = [...new Set(filteredLeads.map(l => l.tenantName).filter(Boolean))];
                    enrichLeads(names);
                  }}
                  onUploadContacts={() => setShowUploadModal(true)}
                  contactedMap={contactedMap}
                  sendOutreachMap={sendOutreachMap}
                  onToggleContacted={toggleContacted}
                  onToggleSendOutreach={toggleSendOutreach}
                  onBulkUpdate={bulkUpdate}
                  subscription={subscription}
                  onRecordExport={recordExport}
                  onUpgrade={() => setPage('settings')}
                  signalScores={signalScores}
                  isProTier={isProTier}
                />
              </div>
            </div>
          </>
        )}

        {page === 'projects' && (
          <ProjectsPage
            projects={projects}
            allLeads={allLeads}
            newLeadIds={newLeadIds}
            onCreateProject={(name) => createProject(name)}
            onDeleteProject={deleteProject}
            getProjectDetail={getProjectDetail}
            removeLeadsFromProject={removeLeadsFromProject}
            fetchProjects={fetchProjects}
            enrichmentData={enrichmentData}
            contactedMap={contactedMap}
            sendOutreachMap={sendOutreachMap}
            subscription={subscription}
            onRecordExport={recordExport}
            onUpgrade={() => setPage('settings')}
            signalScores={signalScores}
            isProTier={isProTier}
            updateProject={updateProject}
          />
        )}

        {page === 'lead-ai' && (
          <LeadAIPage
            allLeads={allLeads}
            enrichmentData={enrichmentData}
            projects={projects}
            onSaveToProject={async ({ createNew, name, projectId, leadIds }) => {
              let targetId = projectId;
              if (createNew) {
                const project = await createProject(name);
                targetId = project.id;
              }
              await addLeadsToProject(targetId, leadIds);
              await fetchProjects();
            }}
          />
        )}

        {page === 'integrations' && <IntegrationsPage />}
        {page === 'lead-alerts' && <LeadAlertsPage />}
        {page === 'settings' && <AccountSettingsPage subscription={subscription} onChangeTier={changeTier} preferences={preferences} onSavePreferences={savePreferences} />}
        {page === 'admin' && <AdminDashboard />}
        {page === 'help' && <HelpCenterPage />}
      </div>

      {showSaveModal && (
        <SaveToProjectModal
          projects={projects}
          selectedCount={saveMode === 'results' ? filteredLeads.length : selectedLeadIds.size}
          saveMode={saveMode}
          filters={saveMode === 'results' ? filters : null}
          onSave={handleSaveToProject}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showUploadModal && (
        <UploadContactsModal
          allLeads={allLeads}
          onUpload={async (contacts, overwrite) => {
            await uploadContacts(contacts, overwrite);
            setShowUploadModal(false);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {shouldShowUpgradePrompt && !upgradePromptDismissed && (
        <UpgradePrompt
          searchCount={onboarding?.searchCount ?? 0}
          onUpgrade={() => {
            setUpgradePromptDismissed(true);
            setPage('settings');
          }}
          onDismiss={() => setUpgradePromptDismissed(true)}
        />
      )}
    </div>
  );
}
