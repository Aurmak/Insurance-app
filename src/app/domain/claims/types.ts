export type ClaimState =
  | 'DRAFT'
  | 'FNOL_SUBMITTED'
  | 'VEHICLE_VERIFIED'
  | 'ERP_CREATED'
  | 'ASSIGNED'
  | 'INVESTIGATION_IN_PROGRESS'
  | 'INFO_REQUESTED'
  | 'INFO_RECEIVED'
  | 'ESTIMATE_PENDING'
  | 'ESTIMATE_SUBMITTED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'REPAIR_IN_PROGRESS'
  | 'REPAIR_COMPLETED'
  | 'SETTLEMENT_PREPARED'
  | 'PAYMENT_IN_PROGRESS'
  | 'PAID'
  | 'CLOSED';

export interface Claim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  insurerId: string;
  state: ClaimState;
  lossType: 'collision' | 'theft' | 'third-party' | 'other';
  lossDateTime: string;
  lossLocation: {
    lat: number | null;
    lng: number | null;
    address: string;
  };
  createdByUserId: string;
  assignedAgentId: string | null;
  priority: 'low' | 'normal' | 'high' | 'critical';
  slaDueAt: string | null;
  reasonCode: string | null;
  reasonText: string | null;
  externalClaimId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleVerificationSnapshot {
  claimId: string;
  registrationNumber: string;
  source: 'customs' | 'excise' | 'manual-fallback';
  verified: boolean;
  verifiedAt: string | null;
  rawResponse: Record<string, unknown>;
  normalized: {
    make: string;
    model: string;
    modelYear: string;
    bodyType: string;
    ownerName: string;
    taxStatus: string;
    classOfVehicle: string;
    engineNo: string;
    chassisNo?: string;
    registrationDate?: string;
    taxPayment?: string;
    seatingCapacity?: string;
    cplc?: string;
    safeCustody?: string;
    horsePower?: string;
  };
  mismatchFlags: string[];
  fallbackReason: string | null;
}

export interface TimelineEvent {
  id: string;
  claimId: string;
  eventType: string;
  fromState: ClaimState | null;
  toState: ClaimState | null;
  eventAt: string;
  actorUserId: string;
  payload: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string;
  timestamp: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface ClaimStore {
  claims: Claim[];
  vehicleSnapshots: VehicleVerificationSnapshot[];
  timelineEvents: TimelineEvent[];
  auditLogs: AuditLog[];
}
