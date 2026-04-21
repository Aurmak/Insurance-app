interface CreateErpClaimInput {
  claimNumber: string;
  insurerId: string;
}

interface AssignErpClaimInput {
  externalClaimId: string;
  insurerId: string;
}

export async function createErpClaim(input: CreateErpClaimInput): Promise<{ externalClaimId: string }> {
  // Demo-safe ERP adapter stub.
  await new Promise((resolve) => setTimeout(resolve, 400));
  const suffix = Math.floor(Math.random() * 90000) + 10000;
  return {
    externalClaimId: `${input.insurerId.toUpperCase()}-ERP-${suffix}`,
  };
}

export async function assignErpClaim(input: AssignErpClaimInput): Promise<{ agentId: string }> {
  // Demo-safe ERP assignment stub.
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    agentId: 'agent-pk-001',
  };
}
