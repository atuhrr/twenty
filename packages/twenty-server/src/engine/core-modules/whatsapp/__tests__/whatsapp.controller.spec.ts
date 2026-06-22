import { createHmac } from 'crypto';

import { Test, type TestingModule } from '@nestjs/testing';

import { getQueueToken } from 'src/engine/core-modules/message-queue/utils/get-queue-token.util';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WhatsappController } from 'src/engine/core-modules/whatsapp/whatsapp.controller';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';

const APP_SECRET = 'test-app-secret';

const buildSignature = (body: Buffer | string, secret: string) =>
  'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

const buildMockResponse = () => {
  const res: {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
    _status: number;
    _body: unknown;
  } = {
    _status: 200,
    _body: null,
    status: jest.fn().mockImplementation(function (this: typeof res, code: number) {
      this._status = code;
      return this;
    }),
    json: jest.fn().mockImplementation(function (this: typeof res, body: unknown) {
      this._body = body;
      return this;
    }),
    send: jest.fn().mockImplementation(function (this: typeof res, body: unknown) {
      this._body = body;
      return this;
    }),
  };

  return res;
};

const mockWhatsappService = {
  getDecryptedAppSecret: jest.fn(),
};

const mockMessageQueueService = {
  add: jest.fn(),
};

describe('WhatsappController', () => {
  let controller: WhatsappController;

  beforeEach(async () => {
    process.env.META_VERIFY_TOKEN = 'twenty-whatsapp-verify';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappController],
      providers: [
        {
          provide: WhatsappService,
          useValue: mockWhatsappService,
        },
        {
          provide: getQueueToken(MessageQueue.whatsappQueue),
          useValue: mockMessageQueueService,
        },
      ],
    }).compile();

    controller = module.get<WhatsappController>(WhatsappController);
    jest.clearAllMocks();
  });

  describe('handleChallenge (GET)', () => {
    it('should echo hub.challenge when token matches', () => {
      const res = buildMockResponse();

      controller.handleChallenge(
        'ws-1',
        'subscribe',
        'twenty-whatsapp-verify',
        '1234567890',
        res as unknown as Parameters<typeof controller.handleChallenge>[4],
      );

      expect(res._status).toBe(200);
      expect(res._body).toBe('1234567890');
    });

    it('should return 403 when token does not match', () => {
      const res = buildMockResponse();

      controller.handleChallenge(
        'ws-1',
        'subscribe',
        'wrong-token',
        '9999',
        res as unknown as Parameters<typeof controller.handleChallenge>[4],
      );

      expect(res._status).toBe(403);
    });

    it('should return 403 when mode is not subscribe', () => {
      const res = buildMockResponse();

      controller.handleChallenge(
        'ws-1',
        'unsubscribe',
        'twenty-whatsapp-verify',
        '9999',
        res as unknown as Parameters<typeof controller.handleChallenge>[4],
      );

      expect(res._status).toBe(403);
    });
  });

  describe('handleWebhook (POST)', () => {
    const workspaceId = 'ws-1';
    const messagePayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                messages: [
                  {
                    id: 'wamid.test001',
                    from: '5511987654321',
                    timestamp: '1750000000',
                    type: 'text',
                    text: { body: 'Olá' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const buildRequest = (body: object, secret: string) => {
      const rawBody = Buffer.from(JSON.stringify(body));

      return {
        rawBody,
        headers: {
          'x-hub-signature-256': buildSignature(rawBody, secret),
        },
      };
    };

    it('should accept valid signature and enqueue job', async () => {
      mockWhatsappService.getDecryptedAppSecret.mockResolvedValue(APP_SECRET);
      mockMessageQueueService.add.mockResolvedValue(undefined);

      const { rawBody } = buildRequest(messagePayload, APP_SECRET);
      const signature = buildSignature(rawBody, APP_SECRET);
      const res = buildMockResponse();

      await controller.handleWebhook(
        workspaceId,
        signature,
        { rawBody } as unknown as Parameters<typeof controller.handleWebhook>[2],
        res as unknown as Parameters<typeof controller.handleWebhook>[3],
      );

      expect(res._status).toBe(200);
      expect(mockMessageQueueService.add).toHaveBeenCalledTimes(1);
      expect(mockMessageQueueService.add).toHaveBeenCalledWith(
        'WhatsappWebhookJob',
        expect.objectContaining({ workspaceId }),
        { retryLimit: 3 },
      );
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      mockWhatsappService.getDecryptedAppSecret.mockResolvedValue(APP_SECRET);

      const rawBody = Buffer.from(JSON.stringify(messagePayload));
      const res = buildMockResponse();

      await expect(
        controller.handleWebhook(
          workspaceId,
          'sha256=invalidhex',
          { rawBody } as unknown as Parameters<typeof controller.handleWebhook>[2],
          res as unknown as Parameters<typeof controller.handleWebhook>[3],
        ),
      ).rejects.toThrow('Invalid webhook signature');

      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });

    it('should return 400 when rawBody is missing', async () => {
      const res = buildMockResponse();

      await controller.handleWebhook(
        workspaceId,
        'sha256=anything',
        { rawBody: undefined } as unknown as Parameters<typeof controller.handleWebhook>[2],
        res as unknown as Parameters<typeof controller.handleWebhook>[3],
      );

      expect(res._status).toBe(400);
    });

    it('should return 400 when workspace has no WhatsApp instance', async () => {
      mockWhatsappService.getDecryptedAppSecret.mockRejectedValue(
        new Error('not found'),
      );

      const rawBody = Buffer.from('{}');
      const res = buildMockResponse();

      await controller.handleWebhook(
        workspaceId,
        buildSignature(rawBody, APP_SECRET),
        { rawBody } as unknown as Parameters<typeof controller.handleWebhook>[2],
        res as unknown as Parameters<typeof controller.handleWebhook>[3],
      );

      expect(res._status).toBe(400);
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });
  });
});
