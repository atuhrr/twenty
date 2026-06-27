// FORK: Voka CRM — Fase 10: receives webhooks from IG, Messenger, Telegram
// Each channel has its own path; verification token is reused from META_VERIFY_TOKEN env.
import { Body, Controller, Get, Logger, Param, Post, Query, Res } from '@nestjs/common';

import { Response } from 'express';

import { OmniChannelService } from 'src/engine/core-modules/omni-channel/omni-channel.service';

@Controller('core/omni-channel')
export class OmniChannelController {
  private readonly logger = new Logger(OmniChannelController.name);

  constructor(private readonly omniChannelService: OmniChannelService) {}

  /** Webhook verification challenge (GET) — same token as WhatsApp */
  @Get(':channel/webhook')
  verifyWebhook(
    @Param('channel') channel: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    const expectedToken = process.env.META_VERIFY_TOKEN ?? '';

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log(`${channel} webhook verified`);
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  /** Webhook events (POST) — workspaceId comes from query param */
  @Post(':channel/webhook')
  async handleWebhook(
    @Param('channel') channel: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    // Respond immediately to avoid timeout
    res.status(200).json({ ok: true });

    if (!workspaceId) {
      this.logger.warn(`${channel} webhook missing workspaceId query param`);
      return;
    }

    await this.omniChannelService
      .processInboundWebhook(channel, workspaceId, body)
      .catch((err) => {
        this.logger.error(
          `${channel} webhook processing error: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }
}
