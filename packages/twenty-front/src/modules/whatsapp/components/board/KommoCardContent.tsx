/* oxlint-disable twenty/no-hardcoded-colors */
import { useCallback, useContext } from 'react';

import { styled } from '@linaria/react';

import { RecordBoardContext } from '@/object-record/record-board/contexts/RecordBoardContext';
import { useRecordBoardSelection } from '@/object-record/record-board/hooks/useRecordBoardSelection';
import { RecordBoardCardContext } from '@/object-record/record-board/record-board-card/contexts/RecordBoardCardContext';
import { isRecordBoardCardSelectedComponentFamilyState } from '@/object-record/record-board/states/isRecordBoardCardSelectedComponentFamilyState';
import { StopPropagationContainer } from '@/object-record/record-board/record-board-card/components/StopPropagationContainer';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useAtomComponentFamilyState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useLastWhatsappMessage } from '@/whatsapp/hooks/useLastWhatsappMessage';
import { useWhatsappContactWindow } from '@/whatsapp/hooks/useWhatsappContactWindow';
import { IS_WHATSAPP_MOCK } from '@/whatsapp/mocks/whatsappMockData';
import {
  formatBRL,
  formatRelativeTimePt,
  getAvatarColor,
  getInitials,
  getMockTagForRecord,
} from '@/whatsapp/utils/kmmCardUtils';
import { CheckboxVariant, Checkbox } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

// ─── Styled components ──────────────────────────────────────────────────────

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
`;

const StyledTopRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 10px;
  padding: 12px 12px 6px;
`;

const StyledAvatar = styled.div<{ bg: string }>`
  align-items: center;
  background: ${({ bg }) => bg};
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  height: 34px;
  justify-content: center;
  width: 34px;
`;

const StyledNameBlock = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledLeadName = styled.span`
  /* FORK: Voka CRM — lead title in Kommo link-blue #2E90FA (Kommo semantic color = alvo-visual --link) */
  color: #2E90FA;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTag = styled.span<{ bg: string; color: string }>`
  background: ${({ bg }) => bg};
  border-radius: 4px;
  color: ${({ color }) => color};
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
`;

const StyledCheckboxWrapper = styled.div`
  flex-shrink: 0;
  margin-top: 2px;
`;

const StyledMeta = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 2px;
  line-height: 1.4;
  padding: 0 12px 8px 56px;
`;

const StyledMetaLine = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledDivider = styled.div`
  background: ${themeCssVariables.border.color.light};
  height: 1px;
  margin: 0 12px;
`;

const StyledWhatsappRow = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  padding: 7px 12px;
`;

const StyledWaDot = styled.span<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  flex-shrink: 0;
  height: 7px;
  width: 7px;
`;

const StyledWaPreview = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex: 1;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledWaTime = styled.span`
  color: ${themeCssVariables.font.color.light};
  flex-shrink: 0;
  font-size: 10px;
`;

const StyledBottomRow = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 7px 12px 10px;
`;

const StyledValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: 12px;
  font-weight: 600;
`;

const StyledNeedsReplyBadge = styled.span`
  background: #ffebee;
  border-radius: 4px;
  color: #c62828;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
`;

// ─── Data extraction ──────────────────────────────────────────────────────

type CardData = {
  displayName: string;
  companyName: string | null;
  phoneNumber: string | null;
  dealValue: string | null;
  whatsappOriginTag: string | null;
};

const extractCardData = (record: ObjectRecord | null | undefined): CardData => {
  if (!record) {
    return {
      displayName: 'Lead',
      companyName: null,
      phoneNumber: null,
      dealValue: null,
      whatsappOriginTag: null,
    };
  }

  const r = record as Record<string, unknown>;

  // Lead display name: prefer pointOfContact full name, fallback to opportunity name
  let displayName = (r.name as string | null) ?? 'Lead';
  const poc = r.pointOfContact as Record<string, unknown> | null;
  if (poc) {
    const pocName = poc.name as {
      firstName?: string | null;
      lastName?: string | null;
    } | null;
    if (pocName) {
      const full = [pocName.firstName, pocName.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (full) displayName = full;
    }
  }

  // Company name
  const company = r.company as Record<string, unknown> | null;
  const companyName = company
    ? ((company.name as string | null) ?? null)
    : null;

  // Phone from pointOfContact
  let phoneNumber: string | null = null;
  if (poc) {
    const phones = poc.phones as {
      primaryPhoneNumber?: string | null;
      primaryPhoneCountryCode?: string | null;
    } | null;
    if (phones?.primaryPhoneNumber) {
      phoneNumber = phones.primaryPhoneCountryCode
        ? `${phones.primaryPhoneCountryCode} ${phones.primaryPhoneNumber}`
        : phones.primaryPhoneNumber;
    }
  }

  // Deal value from amount
  let dealValue: string | null = null;
  const amount = r.amount as {
    amountMicros?: number | null;
    currencyCode?: string | null;
  } | null;
  if (amount?.amountMicros && amount.amountMicros > 0) {
    dealValue = formatBRL(amount.amountMicros);
  }

  const whatsappOriginTag = (r.whatsappOriginTag as string | null) ?? null;

  return {
    displayName,
    companyName,
    phoneNumber,
    dealValue,
    whatsappOriginTag,
  };
};

// ─── Component ───────────────────────────────────────────────────────────

export const KommoCardContent = () => {
  const { recordId } = useContext(RecordBoardCardContext);
  const { recordBoardId } = useContext(RecordBoardContext);

  const recordStore = useAtomFamilyStateValue(recordStoreFamilyState, recordId);

  const { message } = useLastWhatsappMessage(recordId);
  const { isWindowOpen } = useWhatsappContactWindow(recordId);

  const { checkIfLastUnselectAndCloseDropdown } =
    useRecordBoardSelection(recordBoardId);

  const [isRecordBoardCardSelected, setIsRecordBoardCardSelected] =
    useAtomComponentFamilyState(
      isRecordBoardCardSelectedComponentFamilyState,
      recordId,
    );

  const handleCheckbox = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsRecordBoardCardSelected(e.target.checked);
      checkIfLastUnselectAndCloseDropdown();
    },
    [setIsRecordBoardCardSelected, checkIfLastUnselectAndCloseDropdown],
  );

  const {
    displayName,
    companyName,
    phoneNumber,
    dealValue,
    whatsappOriginTag,
  } = extractCardData(recordStore);

  // Determine tag to show
  let tagLabel: string | null = null;
  let tagBg = '#E8F5E9';
  let tagColor = '#2E7D32';

  if (whatsappOriginTag) {
    tagLabel = whatsappOriginTag;
  } else if (IS_WHATSAPP_MOCK) {
    const mockTag = getMockTagForRecord(recordId);
    tagLabel = mockTag.label;
    tagBg = mockTag.bg;
    tagColor = mockTag.color;
  }

  // WhatsApp window dot color
  const waDotColor = !message
    ? 'transparent'
    : isWindowOpen
      ? '#25D366'
      : '#FFA500';

  // "Needs reply": last message was inbound
  const needsReply = message?.direction === 'INBOUND';

  return (
    <StyledWrapper>
      {/* ── Top: avatar + name + tag + checkbox ── */}
      <StyledTopRow>
        <StyledAvatar bg={getAvatarColor(displayName)}>
          {getInitials(displayName) || '?'}
        </StyledAvatar>

        <StyledNameBlock>
          <StyledLeadName>{displayName}</StyledLeadName>
          {tagLabel && (
            <StyledTag bg={tagBg} color={tagColor}>
              {tagLabel}
            </StyledTag>
          )}
        </StyledNameBlock>

        {/* className="checkbox-container" triggers RecordCard hover CSS */}
        <StyledCheckboxWrapper className="checkbox-container">
          <StopPropagationContainer>
            <Checkbox
              hoverable
              checked={isRecordBoardCardSelected}
              onChange={handleCheckbox}
              variant={CheckboxVariant.Secondary}
            />
          </StopPropagationContainer>
        </StyledCheckboxWrapper>
      </StyledTopRow>

      {/* ── Meta: company + phone ── */}
      {(companyName ?? phoneNumber) && (
        <StyledMeta>
          {companyName && <StyledMetaLine>{companyName}</StyledMetaLine>}
          {phoneNumber && <StyledMetaLine>📱 {phoneNumber}</StyledMetaLine>}
        </StyledMeta>
      )}

      {/* ── WhatsApp preview ── */}
      {message?.content && (
        <>
          <StyledDivider />
          <StyledWhatsappRow>
            <StyledWaDot color={waDotColor} />
            <StyledWaPreview>
              {needsReply ? '' : '↩ '}
              {message.content.substring(0, 60)}
              {message.content.length > 60 ? '…' : ''}
            </StyledWaPreview>
            <StyledWaTime>
              {formatRelativeTimePt(message.timestamp)}
            </StyledWaTime>
          </StyledWhatsappRow>
        </>
      )}

      {/* ── Bottom: value + needs-reply badge ── */}
      <StyledDivider />
      <StyledBottomRow>
        {dealValue ? <StyledValue>{dealValue}</StyledValue> : <span />}
        {needsReply && (
          <StyledNeedsReplyBadge>● Responder</StyledNeedsReplyBadge>
        )}
      </StyledBottomRow>
    </StyledWrapper>
  );
};
