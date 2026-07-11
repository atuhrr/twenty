// FORK: Zellate — módulo standalone do tempo real (Redis pub/sub).
// Importado por whatsapp E salesbot sem criar dependência circular.
import { Module } from '@nestjs/common';

import { WhatsappRealtimeService } from 'src/engine/core-modules/whatsapp/realtime/whatsapp-realtime.service';

@Module({
  providers: [WhatsappRealtimeService],
  exports: [WhatsappRealtimeService],
})
export class WhatsappRealtimeModule {}
