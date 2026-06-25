import { Test, type TestingModule } from '@nestjs/testing';

import { getQueueToken } from 'src/engine/core-modules/message-queue/utils/get-queue-token.util';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WhatsappOpportunityStageJob } from 'src/engine/core-modules/whatsapp/jobs/whatsapp-opportunity-stage.job';
import { WhatsappOpportunityStageListener } from 'src/engine/core-modules/whatsapp/listeners/whatsapp-opportunity-stage.listener';
import {
  WhatsappMessageDirection,
  WhatsappMessageEntity,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

const WORKSPACE_ID = 'ws-test-001';
const OPPORTUNITY_ID = 'opp-test-001';
const CONTACT_ID = 'contact-test-001';
const CONTACT_PHONE = '+5511987654321';

// Minimal fake WhatsappMessageEntity for use as dedupeAndSaveMessage return value
const makeFakeMsg = (): WhatsappMessageEntity => {
  const e = new WhatsappMessageEntity();

  e.id = 'msg-001';
  e.workspaceId = WORKSPACE_ID;
  e.contactId = CONTACT_ID;
  e.direction = WhatsappMessageDirection.OUTBOUND;
  e.type = WhatsappMessageType.TEXT;
  e.content = 'text';
  e.mediaUrl = null;
  e.externalMessageId = `automation:opportunity:${OPPORTUNITY_ID}:MEETING`;
  e.status = WhatsappMessageStatus.SENT;
  e.timestamp = new Date();
  e.createdAt = new Date();
  e.updatedAt = new Date();

  return e;
};

// ---- Shared mocks ----

const mockWhatsappService = {
  getContactWindow: jest.fn(),
  dedupeAndSaveMessage: jest.fn(),
  sendTextMessage: jest.fn(),
  sendTemplateMessage: jest.fn(),
};


const mockPersonRepo = {
  findOne: jest.fn(),
};

const mockGlobalWorkspaceOrmManager = {
  executeInWorkspaceContext: jest.fn(),
  getRepository: jest.fn(),
};

const mockWhatsappQueueService = {
  add: jest.fn(),
};

// ---- Job tests ----

describe('WhatsappOpportunityStageJob', () => {
  let job: WhatsappOpportunityStageJob;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappOpportunityStageJob,
        { provide: WhatsappService, useValue: mockWhatsappService },
        {
          provide: GlobalWorkspaceOrmManager,
          useValue: mockGlobalWorkspaceOrmManager,
        },
      ],
    }).compile();

    job = module.get<WhatsappOpportunityStageJob>(WhatsappOpportunityStageJob);
    jest.clearAllMocks();

    // Default: person lookup resolves a phone
    mockGlobalWorkspaceOrmManager.executeInWorkspaceContext.mockImplementation(
      async (fn: () => Promise<void>) => fn(),
    );
    mockGlobalWorkspaceOrmManager.getRepository.mockResolvedValue(
      mockPersonRepo,
    );
    mockPersonRepo.findOne.mockResolvedValue({
      id: CONTACT_ID,
      phones: {
        primaryPhoneCallingCode: '+55',
        primaryPhoneNumber: '11987654321',
      },
    });
    mockWhatsappService.sendTextMessage.mockResolvedValue('evo-msg-001');
    mockWhatsappService.sendTemplateMessage.mockResolvedValue('evo-msg-002');
  });

  describe('window open path (lastInboundAt < 24h)', () => {
    beforeEach(() => {
      mockWhatsappService.getContactWindow.mockResolvedValue({
        contactId: CONTACT_ID,
        lastInboundAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
        isWindowOpen: true,
      });
      mockWhatsappService.dedupeAndSaveMessage.mockResolvedValue(makeFakeMsg());
    });

    it('should save an OUTBOUND TEXT record and call sendTextMessage', async () => {
      await job.handle({
        workspaceId: WORKSPACE_ID,
        opportunityId: OPPORTUNITY_ID,
        contactId: CONTACT_ID,
      });

      expect(mockWhatsappService.dedupeAndSaveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          contactId: CONTACT_ID,
          direction: WhatsappMessageDirection.OUTBOUND,
          type: WhatsappMessageType.TEXT,
          externalMessageId: `automation:opportunity:${OPPORTUNITY_ID}:MEETING`,
          status: WhatsappMessageStatus.SENT,
        }),
      );

      expect(mockWhatsappService.sendTextMessage).toHaveBeenCalledWith(
        WORKSPACE_ID,
        expect.stringContaining('5511987654321'),
        expect.any(String),
      );

      expect(mockWhatsappService.sendTemplateMessage).not.toHaveBeenCalled();
    });
  });

  describe('window closed path (lastInboundAt >= 24h)', () => {
    beforeEach(() => {
      mockWhatsappService.getContactWindow.mockResolvedValue({
        contactId: CONTACT_ID,
        lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h ago
        isWindowOpen: false,
      });
      mockWhatsappService.dedupeAndSaveMessage.mockResolvedValue(makeFakeMsg());
    });

    it('should save an OUTBOUND TEMPLATE record and call sendTemplateMessage', async () => {
      await job.handle({
        workspaceId: WORKSPACE_ID,
        opportunityId: OPPORTUNITY_ID,
        contactId: CONTACT_ID,
      });

      expect(mockWhatsappService.dedupeAndSaveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WhatsappMessageType.TEMPLATE,
          externalMessageId: `automation:opportunity:${OPPORTUNITY_ID}:MEETING`,
        }),
      );

      expect(mockWhatsappService.sendTemplateMessage).toHaveBeenCalledWith(
        WORKSPACE_ID,
        expect.stringContaining('5511987654321'),
        'reuniao_agendada',
        'pt_BR',
        [],
      );

      expect(mockWhatsappService.sendTextMessage).not.toHaveBeenCalled();
    });
  });

  describe('window never opened (no contact window record)', () => {
    beforeEach(() => {
      mockWhatsappService.getContactWindow.mockResolvedValue({
        contactId: CONTACT_ID,
        lastInboundAt: null,
        isWindowOpen: false,
      });
      mockWhatsappService.dedupeAndSaveMessage.mockResolvedValue(makeFakeMsg());
    });

    it('should use template when window has never been opened', async () => {
      await job.handle({
        workspaceId: WORKSPACE_ID,
        opportunityId: OPPORTUNITY_ID,
        contactId: CONTACT_ID,
      });

      expect(mockWhatsappService.sendTemplateMessage).toHaveBeenCalled();
      expect(mockWhatsappService.sendTextMessage).not.toHaveBeenCalled();
    });
  });

  describe('idempotency', () => {
    beforeEach(() => {
      mockWhatsappService.getContactWindow.mockResolvedValue({
        contactId: CONTACT_ID,
        lastInboundAt: new Date(),
        isWindowOpen: true,
      });
      // dedupeAndSaveMessage returns null → already sent
      mockWhatsappService.dedupeAndSaveMessage.mockResolvedValue(null);
    });

    it('should not send again when the automation message already exists', async () => {
      await job.handle({
        workspaceId: WORKSPACE_ID,
        opportunityId: OPPORTUNITY_ID,
        contactId: CONTACT_ID,
      });

      expect(mockWhatsappService.sendTextMessage).not.toHaveBeenCalled();
      expect(mockWhatsappService.sendTemplateMessage).not.toHaveBeenCalled();
    });
  });

  describe('missing phone', () => {
    beforeEach(() => {
      mockWhatsappService.getContactWindow.mockResolvedValue({
        contactId: CONTACT_ID,
        lastInboundAt: new Date(),
        isWindowOpen: true,
      });
      mockWhatsappService.dedupeAndSaveMessage.mockResolvedValue(makeFakeMsg());
      mockPersonRepo.findOne.mockResolvedValue(null);
    });

    it('should not throw and should not call sendTextMessage when person has no phone', async () => {
      await expect(
        job.handle({
          workspaceId: WORKSPACE_ID,
          opportunityId: OPPORTUNITY_ID,
          contactId: CONTACT_ID,
        }),
      ).resolves.not.toThrow();

      expect(mockWhatsappService.sendTextMessage).not.toHaveBeenCalled();
    });
  });
});

// ---- Listener tests ----

describe('WhatsappOpportunityStageListener', () => {
  let listener: WhatsappOpportunityStageListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappOpportunityStageListener,
        {
          provide: getQueueToken(MessageQueue.whatsappQueue),
          useValue: mockWhatsappQueueService,
        },
      ],
    }).compile();

    listener = module.get<WhatsappOpportunityStageListener>(
      WhatsappOpportunityStageListener,
    );
    jest.clearAllMocks();
  });

  it('should enqueue a job when stage transitions to MEETING', async () => {
    await listener.handleOpportunityUpdate({
      name: 'opportunity.updated',
      workspaceId: WORKSPACE_ID,
      objectMetadata: {} as never,
      events: [
        {
          recordId: OPPORTUNITY_ID,
          properties: {
            before: { stage: 'NEW', pointOfContactId: CONTACT_ID } as never,
            after: { stage: 'MEETING', pointOfContactId: CONTACT_ID } as never,
            updatedFields: ['stage'],
            diff: {},
          },
        },
      ],
    });

    expect(mockWhatsappQueueService.add).toHaveBeenCalledWith(
      WhatsappOpportunityStageJob.name,
      {
        workspaceId: WORKSPACE_ID,
        opportunityId: OPPORTUNITY_ID,
        contactId: CONTACT_ID,
      },
    );
  });

  it('should not enqueue when stage does not change to MEETING', async () => {
    await listener.handleOpportunityUpdate({
      name: 'opportunity.updated',
      workspaceId: WORKSPACE_ID,
      objectMetadata: {} as never,
      events: [
        {
          recordId: OPPORTUNITY_ID,
          properties: {
            before: { stage: 'NEW', pointOfContactId: CONTACT_ID } as never,
            after: { stage: 'PROPOSAL', pointOfContactId: CONTACT_ID } as never,
            updatedFields: ['stage'],
            diff: {},
          },
        },
      ],
    });

    expect(mockWhatsappQueueService.add).not.toHaveBeenCalled();
  });

  it('should not enqueue when stage field was not updated', async () => {
    await listener.handleOpportunityUpdate({
      name: 'opportunity.updated',
      workspaceId: WORKSPACE_ID,
      objectMetadata: {} as never,
      events: [
        {
          recordId: OPPORTUNITY_ID,
          properties: {
            before: { stage: 'MEETING', pointOfContactId: CONTACT_ID } as never,
            after: { stage: 'MEETING', pointOfContactId: CONTACT_ID } as never,
            updatedFields: ['name'],
            diff: {},
          },
        },
      ],
    });

    expect(mockWhatsappQueueService.add).not.toHaveBeenCalled();
  });

  it('should not enqueue when stage is already MEETING (re-save)', async () => {
    await listener.handleOpportunityUpdate({
      name: 'opportunity.updated',
      workspaceId: WORKSPACE_ID,
      objectMetadata: {} as never,
      events: [
        {
          recordId: OPPORTUNITY_ID,
          properties: {
            before: { stage: 'MEETING', pointOfContactId: CONTACT_ID } as never,
            after: { stage: 'MEETING', pointOfContactId: CONTACT_ID } as never,
            updatedFields: ['stage'],
            diff: {},
          },
        },
      ],
    });

    expect(mockWhatsappQueueService.add).not.toHaveBeenCalled();
  });

  it('should not enqueue when pointOfContactId is null', async () => {
    await listener.handleOpportunityUpdate({
      name: 'opportunity.updated',
      workspaceId: WORKSPACE_ID,
      objectMetadata: {} as never,
      events: [
        {
          recordId: OPPORTUNITY_ID,
          properties: {
            before: { stage: 'NEW', pointOfContactId: null } as never,
            after: { stage: 'MEETING', pointOfContactId: null } as never,
            updatedFields: ['stage'],
            diff: {},
          },
        },
      ],
    });

    expect(mockWhatsappQueueService.add).not.toHaveBeenCalled();
  });

  it('should enqueue one job per qualifying event in a batch', async () => {
    const OPP_2 = 'opp-test-002';
    const CONTACT_2 = 'contact-test-002';

    await listener.handleOpportunityUpdate({
      name: 'opportunity.updated',
      workspaceId: WORKSPACE_ID,
      objectMetadata: {} as never,
      events: [
        {
          recordId: OPPORTUNITY_ID,
          properties: {
            before: { stage: 'NEW', pointOfContactId: CONTACT_ID } as never,
            after: { stage: 'MEETING', pointOfContactId: CONTACT_ID } as never,
            updatedFields: ['stage'],
            diff: {},
          },
        },
        {
          recordId: OPP_2,
          properties: {
            before: { stage: 'SCREENING', pointOfContactId: CONTACT_2 } as never,
            after: { stage: 'MEETING', pointOfContactId: CONTACT_2 } as never,
            updatedFields: ['stage'],
            diff: {},
          },
        },
        // This one should NOT enqueue (wrong target stage)
        {
          recordId: 'opp-test-003',
          properties: {
            before: { stage: 'NEW', pointOfContactId: CONTACT_ID } as never,
            after: { stage: 'SCREENING', pointOfContactId: CONTACT_ID } as never,
            updatedFields: ['stage'],
            diff: {},
          },
        },
      ],
    });

    expect(mockWhatsappQueueService.add).toHaveBeenCalledTimes(2);
    expect(mockWhatsappQueueService.add).toHaveBeenNthCalledWith(
      1,
      WhatsappOpportunityStageJob.name,
      { workspaceId: WORKSPACE_ID, opportunityId: OPPORTUNITY_ID, contactId: CONTACT_ID },
    );
    expect(mockWhatsappQueueService.add).toHaveBeenNthCalledWith(
      2,
      WhatsappOpportunityStageJob.name,
      { workspaceId: WORKSPACE_ID, opportunityId: OPP_2, contactId: CONTACT_2 },
    );
  });
});

// Expose CONTACT_PHONE to silence TS unused warning — it is used as a semantic label above
void CONTACT_PHONE;
