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

export function seedDemoAssignedClaimsForAgent(agentId: string, insurerId: string = 'insurer-demo'): void {
  const store = loadStore();
  const existingDemo = store.claims.filter(
    (claim) => claim.assignedAgentId === agentId && claim.policyNumber.startsWith('POL-DEMO-AGENT-')
  );
  if (existingDemo.length >= 3) return;

  const now = Date.now();
  const demos: Array<{
    policyNumber: string;
    lossType: Claim['lossType'];
    address: string;
    state: ClaimState;
    reasonText?: string;
    minutesAgo: number;
  }> = [
    {
      policyNumber: 'POL-DEMO-AGENT-001',
      lossType: 'collision',
      address: 'Gulshan-e-Iqbal, Karachi',
      state: 'ASSIGNED',
      minutesAgo: 45,
    },
    {
      policyNumber: 'POL-DEMO-AGENT-002',
      lossType: 'third-party',
      address: 'DHA Phase 6, Lahore',
      state: 'INFO_REQUESTED',
      reasonText: 'Please capture close-up photos of rear panel and add repairability notes.',
      minutesAgo: 120,
    },
    {
      policyNumber: 'POL-DEMO-AGENT-003',
      lossType: 'theft',
      address: 'Blue Area, Islamabad',
      state: 'ASSIGNED',
      minutesAgo: 15,
    },
  ];

  demos.forEach((demo, index) => {
    const createdAt = new Date(now - demo.minutesAgo * 60 * 1000).toISOString();
    const claim: Claim = {
      id: createId('claim'),
      claimNumber: createClaimNumber(),
      policyNumber: demo.policyNumber,
      insurerId,
      state: demo.state,
      lossType: demo.lossType,
      lossDateTime: createdAt,
      lossLocation: {
        lat: null,
        lng: null,
        address: demo.address,
      },
      createdByUserId: 'handler-demo',
      assignedAgentId: agentId,
      priority: index === 0 ? 'high' : 'normal',
      slaDueAt: null,
      reasonCode: demo.state === 'INFO_REQUESTED' ? 'MORE_CONTEXT_REQUIRED' : null,
      reasonText: demo.reasonText || null,
      externalClaimId: `${insurerId.toUpperCase()}-ERP-DEMO-${1000 + index}`,
      createdAt,
      updatedAt: createdAt,
    };

    store.claims.push(claim);
    pushTimeline(store, claim.id, 'CLAIM_CREATED', 'handler-demo', { demoSeed: true }, null, 'DRAFT');
    pushTimeline(store, claim.id, 'FNOL_SUBMITTED', 'handler-demo', { demoSeed: true }, 'DRAFT', 'FNOL_SUBMITTED');
    pushTimeline(store, claim.id, 'ERP_CREATED', 'system', { externalClaimId: claim.externalClaimId }, 'FNOL_SUBMITTED', 'ERP_CREATED');
    pushTimeline(store, claim.id, 'AGENT_ASSIGNED', 'handler-demo', { agentId, demoSeed: true }, 'ERP_CREATED', 'ASSIGNED');
    if (demo.state === 'INFO_REQUESTED') {
      pushTimeline(
        store,
        claim.id,
        'INFO_REQUESTED',
        'handler-demo',
        { reasonText: demo.reasonText || 'Additional evidence requested.' },
        'ASSIGNED',
        'INFO_REQUESTED'
      );
    }
    pushAudit(store, 'Claim', claim.id, 'DEMO_SEED_CREATE', 'system', null, claim);
  });

  saveStore(store);
}

export function seedDemoPolicyholderOutcomeClaims(userId: string, insurerId: string = 'insurer-demo'): void {
  const store = loadStore();
  const existingDemo = store.claims.filter(
    (claim) => claim.createdByUserId === userId && claim.policyNumber.startsWith('POL-DEMO-CUST-')
  );
  if (existingDemo.length >= 2) return;

  const now = Date.now();
  const demos: Array<{
    policyNumber: string;
    lossType: Claim['lossType'];
    address: string;
    state: ClaimState;
    minutesAgo: number;
    amountPaidPKR?: number;
    rejectionReason?: string;
  }> = [
    {
      policyNumber: 'POL-DEMO-CUST-001',
      lossType: 'collision',
      address: 'Clifton Block 5, Karachi',
      state: 'PAID',
      minutesAgo: 240,
      amountPaidPKR: 185000,
    },
    {
      policyNumber: 'POL-DEMO-CUST-002',
      lossType: 'third-party',
      address: 'Johar Town, Lahore',
      state: 'REJECTED',
      minutesAgo: 360,
      rejectionReason: 'Claim rejected due to policy exclusion: commercial usage not covered under declared private use.',
    },
  ];

  demos.forEach((demo, index) => {
    const createdAt = new Date(now - demo.minutesAgo * 60 * 1000).toISOString();
    const claim: Claim = {
      id: createId('claim'),
      claimNumber: createClaimNumber(),
      policyNumber: demo.policyNumber,
      insurerId,
      state: demo.state,
      lossType: demo.lossType,
      lossDateTime: createdAt,
      lossLocation: {
        lat: null,
        lng: null,
        address: demo.address,
      },
      createdByUserId: userId,
      assignedAgentId: `agent-pk-00${index + 1}`,
      priority: 'normal',
      slaDueAt: null,
      reasonCode: demo.state === 'REJECTED' ? 'POLICY_EXCLUSION' : null,
      reasonText: demo.rejectionReason || null,
      externalClaimId: `${insurerId.toUpperCase()}-ERP-CUST-${2000 + index}`,
      createdAt,
      updatedAt: createdAt,
    };

    store.claims.push(claim);
    pushTimeline(store, claim.id, 'CLAIM_CREATED', userId, { demoSeed: true }, null, 'DRAFT');
    pushTimeline(store, claim.id, 'FNOL_SUBMITTED', userId, { demoSeed: true }, 'DRAFT', 'FNOL_SUBMITTED');
    pushTimeline(store, claim.id, 'ERP_CREATED', 'system', { externalClaimId: claim.externalClaimId }, 'FNOL_SUBMITTED', 'ERP_CREATED');
    pushTimeline(store, claim.id, 'AGENT_ASSIGNED', 'handler-demo', { agentId: claim.assignedAgentId }, 'ERP_CREATED', 'ASSIGNED');
    pushTimeline(store, claim.id, 'ESTIMATE_SUBMITTED', claim.assignedAgentId || 'agent-pk-001', { demoSeed: true }, 'ASSIGNED', 'ESTIMATE_SUBMITTED');
    pushTimeline(store, claim.id, 'APPROVAL_PENDING', 'handler-demo', {}, 'ESTIMATE_SUBMITTED', 'APPROVAL_PENDING');

    if (demo.state === 'PAID') {
      pushTimeline(store, claim.id, 'APPROVED', 'handler-demo', {}, 'APPROVAL_PENDING', 'APPROVED');
      pushTimeline(store, claim.id, 'SETTLEMENT_PREPARED', 'handler-demo', { approvedAmountPKR: demo.amountPaidPKR }, 'APPROVED', 'SETTLEMENT_PREPARED');
      pushTimeline(store, claim.id, 'PAYMENT_IN_PROGRESS', 'finance-demo', {}, 'SETTLEMENT_PREPARED', 'PAYMENT_IN_PROGRESS');
      pushTimeline(store, claim.id, 'PAID', 'finance-demo', { amountPaidPKR: demo.amountPaidPKR, currency: 'PKR' }, 'PAYMENT_IN_PROGRESS', 'PAID');
    } else {
      pushTimeline(
        store,
        claim.id,
        'REJECTED',
        'handler-demo',
        { reason: demo.rejectionReason || 'Claim not approved.' },
        'APPROVAL_PENDING',
        'REJECTED'
      );
    }

    pushAudit(store, 'Claim', claim.id, 'DEMO_SEED_CREATE', 'system', null, claim);
  });

  saveStore(store);
}
