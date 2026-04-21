export interface PolicyVerificationResult {
  policyNumber: string;
  status: 'active' | 'expired' | 'not-found';
  validUntil: string | null;
  provider: string;
  message: string;
}

export async function verifyPolicyValidity(input: {
  policyNumber: string;
  insurerId: string;
  claimId: string;
}): Promise<PolicyVerificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const number = (input.policyNumber || '').trim().toUpperCase();
  if (!number) {
    return {
      policyNumber: number,
      status: 'not-found',
      validUntil: null,
      provider: input.insurerId,
      message: 'Policy record could not be found.',
    };
  }

  if (number.includes('EXPIRED')) {
    return {
      policyNumber: number,
      status: 'expired',
      validUntil: '2025-12-31',
      provider: input.insurerId,
      message: 'Policy has expired and needs renewal confirmation.',
    };
  }

  if (number.includes('INVALID') || number.includes('MISSING')) {
    return {
      policyNumber: number,
      status: 'not-found',
      validUntil: null,
      provider: input.insurerId,
      message: 'No active policy found for this number.',
    };
  }

  return {
    policyNumber: number,
    status: 'active',
    validUntil: '2026-12-31',
    provider: input.insurerId,
    message: 'Policy is active and valid for claim processing.',
  };
}
