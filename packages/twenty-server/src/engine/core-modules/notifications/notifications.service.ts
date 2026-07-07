// FORK: Voka CRM — Fase C: notificações do workspace
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import { NotificationEntity } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  findRecent(workspaceId: string, limit = 30): Promise<NotificationEntity[]> {
    return this.repo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  unreadCount(workspaceId: string): Promise<number> {
    return this.repo.count({ where: { workspaceId, readAt: IsNull() } });
  }

  create(
    workspaceId: string,
    dto: { title: string; body?: string; type?: string; link?: string },
  ): Promise<NotificationEntity> {
    return this.repo.save(
      this.repo.create({
        workspaceId,
        title: dto.title,
        body: dto.body ?? null,
        type: dto.type ?? 'SYSTEM',
        link: dto.link ?? null,
        readAt: null,
      }),
    );
  }

  async markRead(workspaceId: string, id: string): Promise<void> {
    await this.repo.update({ workspaceId, id }, { readAt: new Date() });
  }

  async markAllRead(workspaceId: string): Promise<void> {
    await this.repo.update(
      { workspaceId, readAt: IsNull() },
      { readAt: new Date() },
    );
  }
}
