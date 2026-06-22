import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { createHmac } from 'crypto';
import { type Request, type Response } from 'express';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { WhatsappWebhookJob } from 'src/engine/core-modules/whatsapp/whatsapp-webhook.job';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';

@Controller('whatsapp')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    @InjectMessageQueue(MessageQueue.whatsappQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  // Meta webhook verification handshake
  @Get('webhook/:workspaceId')
  handleChallenge(
    @Param('workspaceId') workspaceId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken =
      process.env.META_VERIFY_TOKEN ?? 'twenty-whatsapp-verify';

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log(
        `Webhook verified for workspace ${workspaceId}`,
      );

      return res.status(200).send(challenge);
    }

    this.logger.warn(
      `Webhook verification failed for workspace ${workspaceId}: invalid token`,
    );

    return res.status(403).json({ error: 'Forbidden' });
  }

  // Meta webhook event delivery
  @Post('webhook/:workspaceId')
  @HttpCode(200)
  async handleWebhook(
    @Param('workspaceId') workspaceId: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      return res.status(400).json({ error: 'Missing raw body' });
    }

    let appSecret: string;

    try {
      appSecret = await this.whatsappService.getDecryptedAppSecret(workspaceId);
    } catch {
      this.logger.warn(
        `No WhatsApp instance for workspace ${workspaceId}`,
      );

      return res.status(400).json({ error: 'Workspace not configured' });
    }

    if (!this.validateSignature(rawBody, signature, appSecret)) {
      this.logger.warn(
        `Invalid X-Hub-Signature-256 for workspace ${workspaceId}`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Respond 200 immediately; process asynchronously
    res.status(200).json({ received: true });

    const body = JSON.parse(rawBody.toString('utf8')) as {
      entry?: Array<{
        changes?: Array<{ value: Record<string, unknown> }>;
      }>;
    };

    const entries = body.entry ?? [];

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        await this.messageQueueService.add(
          WhatsappWebhookJob.name,
          { workspaceId, value: change.value },
          { retryLimit: 3 },
        );
      }
    }
  }

  private validateSignature(
    rawBody: Buffer,
    signature: string,
    appSecret: string,
  ): boolean {
    if (!signature?.startsWith('sha256=')) {
      return false;
    }

    const expected =
      'sha256=' +
      createHmac('sha256', appSecret).update(rawBody).digest('hex');

    if (expected.length !== signature.length) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    let mismatch = 0;

    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return mismatch === 0;
  }
}
