import { VehicleVerificationSnapshot } from '../claims/types';

interface VerifyVehicleInput {
  claimId: string;
  registrationNumber: string;
  make?: string;
  model?: string;
  year?: string;
}

export async function verifyVehicleFromRegistry(input: VerifyVehicleInput): Promise<VehicleVerificationSnapshot> {
  // Demo-safe integration stub.
  // This simulates Customs/Excise lookup while keeping the output shape stable.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const normalized = {
    make: (input.make || 'TOYOTA').toUpperCase(),
    model: (input.model || 'HILUX').toUpperCase(),
    modelYear: input.year || '2023',
    bodyType: 'PICKUP',
    ownerName: 'JS BANK LIMITED',
    taxStatus: 'Paid',
    classOfVehicle: 'CR',
    engineNo: '2GD1397511',
    chassisNo: 'AHTBB3CD123456789',
    registrationDate: '11 Sep 2023',
    taxPayment: 'Dec 31, 2023',
    seatingCapacity: '3',
    cplc: 'Vehicle is Clear',
    safeCustody: 'Vehicle is Clear.',
    horsePower: '2393',
  };

  const snapshot: VehicleVerificationSnapshot = {
    claimId: input.claimId,
    registrationNumber: input.registrationNumber.toUpperCase(),
    source: 'excise',
    verified: true,
    verifiedAt: new Date().toISOString(),
    rawResponse: {
      upstream: 'pakistan-excise-demo',
      status: 'ok',
      fetchedAt: new Date().toISOString(),
      data: normalized,
    },
    normalized,
    mismatchFlags: [],
    fallbackReason: null,
  };

  return snapshot;
}
