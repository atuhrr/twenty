// FORK: Voka CRM — Fase 20.2: filtro de período para analytics
import { registerEnumType } from '@nestjs/graphql';

export enum PeriodFilter {
  HOJE = 'hoje',
  ONTEM = 'ontem',
  SEMANA = 'semana',
  MES = 'mes',
  TUDO = 'tudo',
}

registerEnumType(PeriodFilter, { name: 'PeriodFilter' });

export function getDateRange(period: PeriodFilter): { from: Date; to: Date } {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  switch (period) {
    case PeriodFilter.HOJE:
      return { from: todayStart, to: now };

    case PeriodFilter.ONTEM: {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 1);
      return { from: start, to: todayStart };
    }

    case PeriodFilter.SEMANA: {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 7);
      return { from: start, to: now };
    }

    case PeriodFilter.MES: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: now };
    }

    case PeriodFilter.TUDO:
    default:
      return { from: new Date(0), to: now };
  }
}
