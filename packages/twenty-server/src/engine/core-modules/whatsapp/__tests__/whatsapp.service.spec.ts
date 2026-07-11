import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WhatsappRealtimeService } from 'src/engine/core-modules/whatsapp/realtime/whatsapp-realtime.service';

// jest.mock is hoisted before imports, so the factory runs before any variable
// declarations. Store mock functions on the returned object so tests can
// access them via the imported `axios` reference.
jest.mock('axios', () => {
  const instance = { post: jest.fn(), get: jest.fn(), put: jest.fn() };

  return {
    __esModule: true,
    default: { create: jest.fn().mockReturnValue(instance), _instance: instance },
  };
});

import axios from 'axios';

import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappQuickReplyEntity } from 'src/engine/core-modules/whatsapp/whatsapp-quick-reply.entity';
import {
  WhatsappConnectionStatus,
  WhatsappInstanceEntity,
} from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import {
  WhatsappMessageDirection,
  WhatsappMessageEntity,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';

type MockAxiosInstance = { post: jest.Mock; get: jest.Mock; put: jest.Mock };
const getAxios = () =>
  (axios as unknown as { _instance: MockAxiosInstance })._instance;

const mockInstanceRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
};

const mockMessageRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const mockContactWindowRepo = {
  findOne: jest.fn(),
};

const mockSecretEncryption = {
  encrypt: jest.fn((v: string) => `enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('enc:', '')),
};

// Reusable stub that satisfies getInstanceCredentials
const makeInstance = (overrides?: Partial<WhatsappInstanceEntity>) => ({
  workspaceId: 'ws-1',
  wabaId: 'waba-1',
  phoneNumberId: 'phone-123',
  accessTokenEncrypted: 'enc:my-token',
  appSecretEncrypted: 'enc:my-secret',
  connectionStatus: WhatsappConnectionStatus.CONNECTED,
  displayPhoneNumber: '+55 11 99999-9999',
  ...overrides,
});

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: getRepositoryToken(WhatsappInstanceEntity), useValue: mockInstanceRepo },
        { provide: getRepositoryToken(WhatsappMessageEntity), useValue: mockMessageRepo },
        { provide: getRepositoryToken(WhatsappContactWindowEntity), useValue: mockContactWindowRepo },
        { provide: getRepositoryToken(WhatsappQuickReplyEntity), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), delete: jest.fn(), create: jest.fn() } },
        { provide: GlobalWorkspaceOrmManager, useValue: { executeInWorkspaceContext: jest.fn(), getRepository: jest.fn() } },
        { provide: WhatsappRealtimeService, useValue: { publicarMensagem: jest.fn(), assinarMensagens: jest.fn() } },
        { provide: SecretEncryptionService, useValue: mockSecretEncryption },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    jest.clearAllMocks();
  });

  describe('registerInstance', () => {
    it('should create a new instance and verify with Meta API', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(null);
      mockInstanceRepo.create.mockReturnValue({
        workspaceId: 'ws-1',
        wabaId: 'waba-1',
        phoneNumberId: 'phone-123',
        accessTokenEncrypted: 'enc:token',
        appSecretEncrypted: 'enc:secret',
        connectionStatus: WhatsappConnectionStatus.PENDING,
        displayPhoneNumber: null,
      });
      mockInstanceRepo.save.mockResolvedValue({
        id: 'inst-1',
        workspaceId: 'ws-1',
        connectionStatus: WhatsappConnectionStatus.PENDING,
        displayPhoneNumber: null,
      });
      mockInstanceRepo.update.mockResolvedValue(undefined);
      // Meta API phone verification succeeds
      getAxios().get.mockResolvedValue({ data: { id: 'phone-123', verified_name: 'Test' } });

      const result = await service.registerInstance('ws-1', {
        wabaId: 'waba-1',
        phoneNumberId: 'phone-123',
        accessToken: 'token',
        appSecret: 'secret',
      });

      expect(mockInstanceRepo.create).toHaveBeenCalled();
      expect(mockSecretEncryption.encrypt).toHaveBeenCalledWith('token');
      expect(mockSecretEncryption.encrypt).toHaveBeenCalledWith('secret');
      // Should verify via Meta API GET /{phoneNumberId}
      expect(getAxios().get).toHaveBeenCalledWith(
        '/phone-123',
        expect.objectContaining({ params: { fields: 'id,verified_name' } }),
      );
      expect(result.connectionStatus).toBe(WhatsappConnectionStatus.CONNECTED);
    });

    it('should mark DISCONNECTED when Meta API verification fails', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(null);
      mockInstanceRepo.create.mockReturnValue({ workspaceId: 'ws-1', connectionStatus: WhatsappConnectionStatus.PENDING });
      mockInstanceRepo.save.mockResolvedValue({ id: 'inst-1', workspaceId: 'ws-1', connectionStatus: WhatsappConnectionStatus.PENDING });
      mockInstanceRepo.update.mockResolvedValue(undefined);
      getAxios().get.mockRejectedValue(new Error('invalid token'));

      const result = await service.registerInstance('ws-1', {
        wabaId: 'waba-1',
        phoneNumberId: 'phone-123',
        accessToken: 'bad-token',
        appSecret: 'secret',
      });

      expect(result.connectionStatus).toBe(WhatsappConnectionStatus.DISCONNECTED);
    });

    it('should update existing instance when one exists', async () => {
      const existing = makeInstance({ id: 'inst-1', wabaId: 'old-waba' } as Partial<WhatsappInstanceEntity>);

      mockInstanceRepo.findOne.mockResolvedValue(existing);
      mockInstanceRepo.save.mockResolvedValue({ ...existing, wabaId: 'new-waba' });
      mockInstanceRepo.update.mockResolvedValue(undefined);
      getAxios().get.mockResolvedValue({ data: { id: 'phone-123', verified_name: 'Test' } });

      // Multi-número: a atualização de uma instância existente é explícita,
      // via instanceId — sem ele, registerInstance cria uma nova instância.
      await service.registerInstance('ws-1', {
        instanceId: existing.id,
        wabaId: 'new-waba',
        phoneNumberId: 'new-phone',
        accessToken: 'new-token',
        appSecret: 'new-secret',
      });

      expect(mockInstanceRepo.create).not.toHaveBeenCalled();
      expect(existing.wabaId).toBe('new-waba');
    });
  });

  describe('sendTextMessage', () => {
    it('should call Meta Graph API and return the message id', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(makeInstance());
      // Meta API response: { messages: [{ id: 'wamid.xxx' }] }
      getAxios().post.mockResolvedValue({ data: { messages: [{ id: 'wamid.abc123' }] } });

      const id = await service.sendTextMessage('ws-1', '5511987654321', 'Olá');

      expect(getAxios().post).toHaveBeenCalledWith(
        '/phone-123/messages',
        {
          messaging_product: 'whatsapp',
          to: '5511987654321',
          type: 'text',
          text: { body: 'Olá' },
        },
      );
      expect(id).toBe('wamid.abc123');
    });

    it('should retry on transient failure and succeed', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(makeInstance());
      getAxios().post
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({ data: { messages: [{ id: 'wamid.retry-ok' }] } });

      const promise = service.sendTextMessage('ws-1', '5511987654321', 'Hi');

      await jest.runAllTimersAsync();

      const id = await promise;

      expect(getAxios().post).toHaveBeenCalledTimes(2);
      expect(id).toBe('wamid.retry-ok');
    });

    it('should throw NotFoundException when no instance exists', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendTextMessage('ws-1', '5511987654321', 'Olá'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendTemplateMessage', () => {
    it('should call Meta Graph API with template payload and return id', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(makeInstance());
      getAxios().post.mockResolvedValue({ data: { messages: [{ id: 'wamid.tmpl-1' }] } });

      const id = await service.sendTemplateMessage(
        'ws-1',
        '5511987654321',
        'reuniao_agendada',
        'pt_BR',
        [],
      );

      expect(getAxios().post).toHaveBeenCalledWith(
        '/phone-123/messages',
        {
          messaging_product: 'whatsapp',
          to: '5511987654321',
          type: 'template',
          template: {
            name: 'reuniao_agendada',
            language: { code: 'pt_BR' },
            components: [],
          },
        },
      );
      expect(id).toBe('wamid.tmpl-1');
    });
  });

  describe('markAsRead', () => {
    it('should call Meta API with status:read payload', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(makeInstance());
      getAxios().post.mockResolvedValue({ data: { success: true } });

      await service.markAsRead('ws-1', 'ignored-remote-jid', 'wamid.abc123');

      expect(getAxios().post).toHaveBeenCalledWith(
        '/phone-123/messages',
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: 'wamid.abc123',
        },
      );
    });

    it('should not throw when Meta API call fails', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(makeInstance());
      getAxios().post.mockRejectedValue(new Error('network error'));

      const promise = service.markAsRead('ws-1', 'jid', 'wamid.abc123');

      // Advance fake timers so callWithRetry delays resolve
      await jest.runAllTimersAsync();
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('checkConnectionStatus', () => {
    it('should return CONNECTED when Meta API responds with phone data', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(makeInstance());
      mockInstanceRepo.update.mockResolvedValue(undefined);
      getAxios().get.mockResolvedValue({ data: { id: 'phone-123', verified_name: 'Test' } });

      const status = await service.checkConnectionStatus('ws-1');

      expect(status).toBe(WhatsappConnectionStatus.CONNECTED);
    });

    it('should return DISCONNECTED when Meta API call fails', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(makeInstance());
      getAxios().get.mockRejectedValue(new Error('unauthorized'));

      const status = await service.checkConnectionStatus('ws-1');

      expect(status).toBe(WhatsappConnectionStatus.DISCONNECTED);
    });

    it('should return DISCONNECTED when no instance exists', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(null);

      const status = await service.checkConnectionStatus('ws-1');

      expect(status).toBe(WhatsappConnectionStatus.DISCONNECTED);
    });
  });

  describe('dedupeAndSaveMessage', () => {
    const baseParams = {
      workspaceId: 'ws-1',
      contactId: 'contact-uuid',
      direction: WhatsappMessageDirection.INBOUND,
      type: WhatsappMessageType.TEXT,
      content: 'hello',
      mediaUrl: null,
      externalMessageId: 'wamid.xyz',
      status: WhatsappMessageStatus.DELIVERED,
      timestamp: new Date(),
    };

    it('should save and return new message', async () => {
      mockMessageRepo.findOne.mockResolvedValue(null);
      const created = { id: 'msg-1', ...baseParams };

      mockMessageRepo.create.mockReturnValue(created);
      mockMessageRepo.save.mockResolvedValue(created);

      const result = await service.dedupeAndSaveMessage(baseParams);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('msg-1');
    });

    it('should return null for duplicate externalMessageId', async () => {
      mockMessageRepo.findOne.mockResolvedValue({ id: 'existing-msg' });

      const result = await service.dedupeAndSaveMessage(baseParams);

      expect(result).toBeNull();
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getDecryptedAppSecret', () => {
    it('should decrypt and return the app secret', async () => {
      mockInstanceRepo.findOne.mockResolvedValue({ appSecretEncrypted: 'enc:my-secret' });

      const secret = await service.getDecryptedAppSecret('ws-1');

      expect(secret).toBe('my-secret');
    });

    it('should throw NotFoundException when instance does not exist', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(null);

      await expect(service.getDecryptedAppSecret('ws-1')).rejects.toThrow(NotFoundException);
    });
  });
});
