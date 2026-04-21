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
  const agents = ['agent-pk-001', 'agent-pk-007', 'agent-pk-011'];
  const selected = agents[Math.floor(Math.random() * agents.length)];
  return {
    agentId: `${selected}#${input.externalClaimId.slice(-5)}`,
  };
}
