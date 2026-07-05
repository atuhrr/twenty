// FORK: Voka CRM — Fase 20: keyframes compartilhados do módulo Analytics
import { css } from '@linaria/core';

export const fadeSlideUpKeyframes = css`
  :global() {
    @keyframes fade-slide-up {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes grow-bar {
      from { width: 0%; }
      to   { width: var(--bar-target-width, 100%); }
    }

    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.4; }
      50%       { opacity: 1; }
    }
  }
`;
