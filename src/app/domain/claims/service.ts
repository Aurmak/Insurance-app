import { canTransition } from './stateMachine';
import { AuditLog, Claim, ClaimState, ClaimStore, TimelineEvent, VehicleVerificationSnapshot } from './types';

const CLAIM_STORE_KEY = 'claims_orchestration_store_v1';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function createClaimNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 90000) + 10000);
  return `PK-${yy}${mm}${dd}-${suffix}`;
}

function defaultStore(): ClaimStore {
  return {
    claims: [],
    vehicleSnapshots: [],
    timelineEvents: [],
    auditLogs: [],
  };
}

function loadStore(): ClaimStore {
  try {
    const raw = localStorage.getItem(CLAIM_STORE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as ClaimStore;
    return {
      claims: parsed.claims || [],
      vehicleSnapshots: parsed.vehicleSnapshots || [],
      timelineEvents: parsed.timelineEvents || [],
      auditLogs: parsed.auditLogs || [],
    };
  } catch {
    return defaultStore();
  }
}

function saveStore(store: ClaimStore): void {
  localStorage.setItem(CLAIM_STORE_KEY, JSON.stringify(store));
}

function pushTimeline(
  store: ClaimStore,
  claimId: string,
  eventType: string,
  actorUserId: string,
  payload: Record<string, unknown>,
  fromState: ClaimState | null,
  toState: ClaimState | null
): TimelineEvent {
  const event: TimelineEvent = {
    id: createId('te'),
    claimId,
    eventType,
    fromState,
    toState,
    eventAt: new Date().toISOString(),
    actorUserId,
    payload,
  };
  store.timelineEvents.push(event);
  return event;
}

function pushAudit(
  store: ClaimStore,
  entityType: string,
  entityId: string,
  action: string,
  actorUserId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): AuditLog {
  const log: AuditLog = {
    id: createId('al'),
    entityType,
    entityId,
    action,
    actorUserId,
    timestamp: new Date().toISOString(),
    before,
    after,
  };
  store.auditLogs.push(log);
  return log;
}

export function getClaimById(claimId: string): Claim | null {
  const store = loadStore();
  return store.claims.find((claim) => claim.id === claimId) || null;
}

export function getClaimTimeline(claimId: string): TimelineEvent[] {
  const store = loadStore();
  return store.timelineEvents.filter((event) => event.claimId === claimId);
}

export function createDraftClaim(input: {
  policyNumber: string;
  insurerId: string;
  createdByUserId: string;
  lossType?: Claim['lossType'];
  lossDateTime?: string;
  locationAddress?: string;
}): Claim {
  const now = new Date().toISOString();
  const claim: Claim = {
    id: createId('claim'),
    claimNumber: createClaimNumber(),
    policyNumber: input.policyNumber,
    insurerId: input.insurerId,
    state: 'DRAFT',
    lossType: input.lossType || 'collision',
    lossDateTime: input.lossDateTime || now,
    lossLocation: {
      lat: null,
      lng: null,
      address: input.locationAddress || 'Location not provided',
    },
    createdByUserId: input.createdByUserId,
    assignedAgentId: null,
    priority: 'normal',
    slaDueAt: null,
    reasonCode: null,
    reasonText: null,
    externalClaimId: null,
    createdAt: now,
    updatedAt: now,
  };

  const store = loadStore();
  store.claims.push(claim);
  pushTimeline(store, claim.id, 'CLAIM_CREATED', input.createdByUserId, { claimNumber: claim.claimNumber }, null, 'DRAFT');
  pushAudit(store, 'Claim', claim.id, 'CREATE', input.createdByUserId, null, claim);
  saveStore(store);
  return claim;
}

export function transitionClaimState(
  claimId: string,
  toState: ClaimState,
  actorUserId: string,
  eventType: string,
  payload: Record<string, unknown> = {}
): Claim {
  const store = loadStore();
  const claim = store.claims.find((item) => item.id === claimId);
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }

  const fromState = claim.state;
  if (fromState !== toState && !canTransition(fromState, toState)) {
    throw new Error(`Invalid state transition ${fromState} -> ${toState}`);
  }

  if (fromState !== toState) {
    const before = { ...claim };
    claim.state = toState;
    claim.updatedAt = new Date().toISOString();
    pushTimeline(store, claimId, eventType, actorUserId, payload, fromState, toState);
    pushAudit(store, 'Claim', claimId, `TRANSITION_${fromState}_TO_${toState}`, actorUserId, before, { ...claim });
    saveStore(store);
  }

  return claim;
}

export function attachVehicleVerificationSnapshot(
  claimId: string,
  snapshot: VehicleVerificationSnapshot,
  actorUserId: string
): VehicleVerificationSnapshot {
  const store = loadStore();
  const claim = store.claims.find((item) => item.id === claimId);
  if (!claim) throw new Error(`Claim not found: ${claimId}`);

  const existingIndex = store.vehicleSnapshots.findIndex((item) => item.claimId === claimId);
  if (existingIndex >= 0) {
    const before = { ...store.vehicleSnapshots[existingIndex] };
    store.vehicleSnapshots[existingIndex] = snapshot;
    pushAudit(store, 'VehicleVerificationSnapshot', claimId, 'UPDATE', actorUserId, before, snapshot);
  } else {
    store.vehicleSnapshots.push(snapshot);
    pushAudit(store, 'VehicleVerificationSnapshot', claimId, 'CREATE', actorUserId, null, snapshot);
  }

  if (snapshot.verified) {
    if (claim.state === 'FNOL_SUBMITTED') {
      const before = { ...claim };
      claim.state = 'VEHICLE_VERIFIED';
      claim.updatedAt = new Date().toISOString();
      pushTimeline(
        store,
        claimId,
        'VEHICLE_VERIFIED',
        actorUserId,
        { registrationNumber: snapshot.registrationNumber, source: snapshot.source },
        'FNOL_SUBMITTED',
        'VEHICLE_VERIFIED'
      );
      pushAudit(store, 'Claim', claimId, 'TRANSITION_FNOL_SUBMITTED_TO_VEHICLE_VERIFIED', actorUserId, before, { ...claim });
    } else if (claim.state === 'DRAFT') {
      const before = { ...claim };
      claim.state = 'FNOL_SUBMITTED';
      claim.updatedAt = new Date().toISOString();
      pushTimeline(store, claimId, 'FNOL_SUBMITTED', actorUserId, {}, 'DRAFT', 'FNOL_SUBMITTED');
      pushAudit(store, 'Claim', claimId, 'TRANSITION_DRAFT_TO_FNOL_SUBMITTED', actorUserId, before, { ...claim });

      const beforeVerify = { ...claim };
      claim.state = 'VEHICLE_VERIFIED';
      claim.updatedAt = new Date().toISOString();
      pushTimeline(
        store,
        claimId,
        'VEHICLE_VERIFIED',
        actorUserId,
        { registrationNumber: snapshot.registrationNumber, source: snapshot.source },
        'FNOL_SUBMITTED',
        'VEHICLE_VERIFIED'
      );
      pushAudit(store, 'Claim', claimId, 'TRANSITION_FNOL_SUBMITTED_TO_VEHICLE_VERIFIED', actorUserId, beforeVerify, { ...claim });
    }
  }

  saveStore(store);
  return snapshot;
}

export function setErpCreated(claimId: string, externalClaimId: string, actorUserId: string): Claim {
  const store = loadStore();
  const claim = store.claims.find((item) => item.id === claimId);
  if (!claim) throw new Error(`Claim not found: ${claimId}`);

  if (!canTransition(claim.state, 'ERP_CREATED')) {
    return claim;
  }

  const before = { ...claim };
  claim.externalClaimId = externalClaimId;
  claim.state = 'ERP_CREATED';
  claim.updatedAt = new Date().toISOString();
  pushTimeline(store, claimId, 'ERP_CREATED', actorUserId, { externalClaimId }, before.state, 'ERP_CREATED');
  pushAudit(store, 'Claim', claimId, 'ERP_CREATED', actorUserId, before, { ...claim });
  saveStore(store);
  return claim;
}

export function setAssigned(claimId: string, agentId: string, actorUserId: string): Claim {
  const store = loadStore();
  const claim = store.claims.find((item) => item.id === claimId);
  if (!claim) throw new Error(`Claim not found: ${claimId}`);

  if (!canTransition(claim.state, 'ASSIGNED')) {
    return claim;
  }

  const before = { ...claim };
  claim.assignedAgentId = agentId;
  claim.state = 'ASSIGNED';
  claim.updatedAt = new Date().toISOString();
  pushTimeline(store, claimId, 'AGENT_ASSIGNED', actorUserId, { agentId }, before.state, 'ASSIGNED');
  pushAudit(store, 'Claim', claimId, 'ASSIGNED', actorUserId, before, { ...claim });
  saveStore(store);
  return claim;
}

export function getClaimsStore(): ClaimStore {
  return loadStore();
}
