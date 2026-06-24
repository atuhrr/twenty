import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

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

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: getRepositoryToken(WhatsappInstanceEntity), useValue: mockInstanceRepo },
        { provide: getRepositoryToken(WhatsappMessageEntity), useValue: mockMessageRepo },
        { provide: getRepositoryToken(WhatsappContactWindowEntity), useValue: mockContactWindowRepo },
        { provide: SecretEncryptionService, useValue: mockSecretEncryption },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    jest.clearAllMocks();
  });

  describe('registerInstance', () => {
    it('should create a new instance when none exists', async () => {
      mockInstanceRepo.findOne.mockResolvedValue(null);
      mockInstanceRepo.create.mockReturnValue({
        workspaceId: 'ws-1',
        wabaId: 'waba-1',
        phoneNumberId: 'phone-1',
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
      getAxios().post.mockResolvedValue({ data: {} });

      const result = await service.registerInstance('ws-1', {
        wabaId: 'waba-1',
        phoneNumberId: 'phone-1',
        accessToken: 'token',
        appSecret: 'secret',
      });

      expect(mockInstanceRepo.create).toHaveBeenCalled();
      expect(mockSecretEncryption.encrypt).toHaveBeenCalledWith('token');
      expect(mockSecretEncryption.encrypt).toHaveBeenCalledWith('secret');
      expect(result.connectionStatus).toBe(WhatsappConnectionStatus.PENDING);
    });

    it('should update existing instance when one exists', async () => {
      const existing = {
        workspaceId: 'ws-1',
        wabaId: 'old-waba',
        phoneNumberId: 'old-phone',
        accessTokenEncrypted: 'enc:old',
        appSecretEncrypted: 'enc:old-secret',
        connectionStatus: WhatsappConnectionStatus.CONNECTED,
        displayPhoneNumber: '+551199999999',
      };

      mockInstanceRepo.findOne.mockResolvedValue(existing);
      mockInstanceRepo.save.mockResolvedValue({ ...existing, wabaId: 'new-waba' });
      getAxios().post.mockResolvedValue({ data: {} });

      await service.registerInstance('ws-1', {
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
    it('should call Evolution API and return the message id', async () => {
      getAxios().post.mockResolvedValue({ data: { key: { id: 'wamid.abc123' } } });

      const id = await service.sendTextMessage('ws-1', '5511987654321', 'Olá');

      expect(getAxios().post).toHaveBeenCalledWith(
        '/message/sendText/ws_ws-1',
        { number: '5511987654321', text: { body: 'Olá' } },
      );
      expect(id).toBe('wamid.abc123');
    });

    it('should retry on transient failure and succeed', async () => {
      getAxios().post
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({ data: { key: { id: 'wamid.retry-ok' } } });

      // Start the call (it will pause on the retry delay setTimeout)
      const promise = service.sendTextMessage('ws-1', '5511987654321', 'Hi');

      // Advance all fake timers so the retry delay resolves
      await jest.runAllTimersAsync();

      const id = await promise;

      expect(getAxios().post).toHaveBeenCalledTimes(2);
      expect(id).toBe('wamid.retry-ok');
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

  describe('checkConnectionStatus', () => {
    it('should return CONNECTED when Evolution state is open', async () => {
      getAxios().get.mockResolvedValue({ data: { instance: { state: 'open' } } });
      mockInstanceRepo.update.mockResolvedValue(undefined);

      const status = await service.checkConnectionStatus('ws-1');

      expect(status).toBe(WhatsappConnectionStatus.CONNECTED);
    });

    it('should return DISCONNECTED on Evolution API error', async () => {
      getAxios().get.mockRejectedValue(new Error('connection refused'));

      const status = await service.checkConnectionStatus('ws-1');

      expect(status).toBe(WhatsappConnectionStatus.DISCONNECTED);
    });
  });
});
