// Utility functions for offline data persistence

export interface InspectionProgress {
  id: string;
  timestamp: number;
  propertyName: string;
  inspectionType: string;
  inspectionData: any;
  currentStep: string;
  isComplete: boolean;
}

const DRAFT_KEY = 'inspection_drafts';
const CURRENT_DRAFT_KEY = 'current_inspection_draft';

// Save current inspection as draft
export function saveInspectionDraft(
  propertyName: string,
  inspectionType: string,
  currentStep: string,
  isComplete: boolean = false
): void {
  const inspectionData = JSON.parse(sessionStorage.getItem('inspectionData') || '{}');
  
  const draft: InspectionProgress = {
    id: sessionStorage.getItem('inspectionId') || Date.now().toString(),
    timestamp: Date.now(),
    propertyName,
    inspectionType,
    inspectionData,
    currentStep,
    isComplete,
  };

  // Save to current draft
  localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(draft));

  // Also save to drafts list if not complete
  if (!isComplete) {
    const drafts = getAllDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.unshift(draft);
    }
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  }
}

// Get all saved drafts
export function getAllDrafts(): InspectionProgress[] {
  try {
    const drafts = localStorage.getItem(DRAFT_KEY);
    return drafts ? JSON.parse(drafts) : [];
  } catch (error) {
    console.error('Error loading drafts:', error);
    return [];
  }
}

// Get current draft
export function getCurrentDraft(): InspectionProgress | null {
  try {
    const draft = localStorage.getItem(CURRENT_DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    console.error('Error loading current draft:', error);
    return null;
  }
}

// Resume inspection from draft
export function resumeInspection(draft: InspectionProgress): void {
  sessionStorage.setItem('inspectionId', draft.id);
  sessionStorage.setItem('selectedPropertyName', draft.propertyName);
  sessionStorage.setItem('inspectionType', draft.inspectionType);
  sessionStorage.setItem('inspectionData', JSON.stringify(draft.inspectionData));
}

// Delete a draft
export function deleteDraft(draftId: string): void {
  const drafts = getAllDrafts().filter(d => d.id !== draftId);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  
  // Also clear current draft if it matches
  const currentDraft = getCurrentDraft();
  if (currentDraft && currentDraft.id === draftId) {
    localStorage.removeItem(CURRENT_DRAFT_KEY);
  }
}

// Clear current draft (called after successful submission)
export function clearCurrentDraft(): void {
  localStorage.removeItem(CURRENT_DRAFT_KEY);
}

// Auto-save helper - debounced save function
let autoSaveTimeout: NodeJS.Timeout | null = null;

export function autoSaveInspection(
  propertyName: string,
  inspectionType: string,
  currentStep: string
): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  
  autoSaveTimeout = setTimeout(() => {
    saveInspectionDraft(propertyName, inspectionType, currentStep, false);
    console.log('Auto-saved inspection progress');
  }, 2000); // Save after 2 seconds of inactivity
}
