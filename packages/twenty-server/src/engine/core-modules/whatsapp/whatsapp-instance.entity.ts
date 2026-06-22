import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

export enum WhatsappConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  PENDING = 'PENDING',
}

@Entity({ name: 'whatsappInstance', schema: 'core' })
export class WhatsappInstanceEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text' })
  wabaId: string;

  @Column({ nullable: false, type: 'text' })
  phoneNumberId: string;

  @Column({ nullable: false, type: 'text' })
  accessTokenEncrypted: string;

  @Column({ nullable: false, type: 'text' })
  appSecretEncrypted: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: WhatsappConnectionStatus,
    default: WhatsappConnectionStatus.DISCONNECTED,
  })
  connectionStatus: WhatsappConnectionStatus;

  @Column({ nullable: true, type: 'text' })
  displayPhoneNumber: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
