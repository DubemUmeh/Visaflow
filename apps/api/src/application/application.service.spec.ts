import type { ApplicationService as ApplicationServiceType } from './application.service';

process.env.DATABASE_URL ??= 'postgres://user:pass@localhost:5432/visaflow_test';

const { ApplicationService } = jest.requireActual('./application.service') as {
  ApplicationService: typeof ApplicationServiceType;
};

const baseApplication = {
  id: 'app-1',
  visaTypeId: 'visa-1',
  destinationCountryId: 'country-1',
  nationalityCountryId: 'country-2',
  status: 'DRAFT',
  totalSteps: 5,
  applicantFirstName: 'Ada',
  applicantLastName: 'Lovelace',
  applicantEmail: 'ada@example.com',
  applicantPassportNo: 'P123456',
  applicantPassportExpiry: new Date('2030-01-01T00:00:00.000Z'),
  travelDateFrom: new Date('2027-01-01T00:00:00.000Z'),
  travelDateTo: new Date('2027-01-15T00:00:00.000Z'),
};

describe('ApplicationService progress/payment readiness', () => {
  const service = new ApplicationService(null as never, null as never) as unknown as {
    calculateApplicationProgress: (params: Record<string, unknown>) => {
      currentStep: number;
      missingRequirements: string[];
      canPay: boolean;
      canSubmit: boolean;
      isComplete: boolean;
    };
  };

  it('keeps applications with missing required documents out of payment readiness', () => {
    const progress = service.calculateApplicationProgress({
      app: baseApplication,
      requirements: [
        { documentType: 'PASSPORT_COPY' },
        { documentType: 'BANK_STATEMENT' },
      ],
      documents: [{ documentType: 'PASSPORT_COPY', status: 'PROCESSING' }],
      payments: [],
    });

    expect(progress).toMatchObject({
      currentStep: 4,
      missingRequirements: ['BANK_STATEMENT'],
      canPay: false,
      canSubmit: false,
      isComplete: false,
    });
  });

  it('does not count uploading or rejected documents as complete', () => {
    const progress = service.calculateApplicationProgress({
      app: baseApplication,
      requirements: [{ documentType: 'PASSPORT_COPY' }],
      documents: [
        { documentType: 'PASSPORT_COPY', status: 'UPLOADING' },
        { documentType: 'PASSPORT_COPY', status: 'REJECTED' },
      ],
      payments: [],
    });

    expect(progress.missingRequirements).toEqual(['PASSPORT_COPY']);
    expect(progress.canPay).toBe(false);
  });

  it('allows payment only after required documents satisfy backend rules', () => {
    const progress = service.calculateApplicationProgress({
      app: baseApplication,
      requirements: [{ documentType: 'PASSPORT_COPY' }],
      documents: [{ documentType: 'PASSPORT_COPY', status: 'VERIFIED' }],
      payments: [],
    });

    expect(progress).toMatchObject({
      currentStep: 5,
      missingRequirements: [],
      canPay: true,
      canSubmit: true,
      isComplete: true,
    });
  });
});
