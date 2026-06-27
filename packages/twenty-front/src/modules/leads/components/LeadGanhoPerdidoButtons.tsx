// FORK: Voka CRM — Fase 6: Ganho/Perdido action buttons for Lead (Opportunity) show page
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useCallback, useRef, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

// ─── Styled ──────────────────────────────────────────────────────────────────

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  position: relative;
`;

const StyledGanhoBtn = styled.button`
  background: #12B76A;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: #fff;
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 6px 14px;

  &:hover {
    background: #0fa05d;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledPerdidoBtn = styled.button`
  background: transparent;
  border: 1px solid ${themeCssVariables.color.red};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.color.red};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 6px 14px;

  &:hover {
    background: ${themeCssVariables.color.red3};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledReasonPopover = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 280px;
  z-index: 100;
`;

const StyledReasonLabel = styled.label`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledReasonInput = styled.input`
  background: ${themeCssVariables.background.tertiary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  outline: none;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  width: 100%;

  &:focus {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const StyledReasonActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledCancelBtn = styled.button`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 5px 12px;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

const StyledConfirmPerdidoBtn = styled.button`
  background: ${themeCssVariables.color.red};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: #fff;
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 5px 12px;

  &:hover {
    background: ${themeCssVariables.color.red8};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  objectRecordId: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const LeadGanhoPerdidoButtons = ({ objectRecordId }: Props) => {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const { updateOneRecord } = useUpdateOneRecord();

  const handleGanho = useCallback(async () => {
    setLoading(true);
    try {
      await updateOneRecord({
        objectNameSingular: 'opportunity',
        idToUpdate: objectRecordId,
        updateOneRecordInput: {
          stage: 'GANHO',
          statusLead: 'GANHO',
        },
        recordGqlFields: { id: true, stage: true, statusLead: true },
      });
    } finally {
      setLoading(false);
    }
  }, [objectRecordId, updateOneRecord]);

  const handlePerdidoClick = () => {
    setShowReasonInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePerdidoConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await updateOneRecord({
        objectNameSingular: 'opportunity',
        idToUpdate: objectRecordId,
        updateOneRecordInput: {
          statusLead: 'PERDIDO',
          motivoPerda: motivoPerda.trim() || null,
        },
        recordGqlFields: {
          id: true,
          stage: true,
          statusLead: true,
          motivoPerda: true,
        },
      });
      setShowReasonInput(false);
      setMotivoPerda('');
    } finally {
      setLoading(false);
    }
  }, [motivoPerda, objectRecordId, updateOneRecord]);

  const handleCancel = () => {
    setShowReasonInput(false);
    setMotivoPerda('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handlePerdidoConfirm();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <StyledContainer>
      <StyledGanhoBtn onClick={handleGanho} disabled={loading}>
        ✓ Ganho
      </StyledGanhoBtn>

      <StyledPerdidoBtn onClick={handlePerdidoClick} disabled={loading}>
        ✕ Perdido
      </StyledPerdidoBtn>

      {showReasonInput && (
        <StyledReasonPopover>
          <StyledReasonLabel>Motivo da perda (opcional)</StyledReasonLabel>
          <StyledReasonInput
            ref={inputRef}
            value={motivoPerda}
            onChange={(e) => setMotivoPerda(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: preço alto, concorrente, sem interesse..."
          />
          <StyledReasonActions>
            <StyledCancelBtn onClick={handleCancel}>Cancelar</StyledCancelBtn>
            <StyledConfirmPerdidoBtn
              onClick={() => void handlePerdidoConfirm()}
              disabled={loading}
            >
              Confirmar
            </StyledConfirmPerdidoBtn>
          </StyledReasonActions>
        </StyledReasonPopover>
      )}
    </StyledContainer>
  );
};
