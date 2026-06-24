import { styled } from '@linaria/react';

import { WhatsappMessageType } from '@/whatsapp/types/WhatsappMessage.type';

type ChatAttachmentProps = {
  type: WhatsappMessageType;
  mediaUrl: string;
  content: string | null;
};

const StyledImageThumb = styled.img`
  border-radius: 6px;
  display: block;
  max-height: 200px;
  max-width: 100%;
  object-fit: cover;
`;

const StyledDocumentRow = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const StyledDocumentIcon = styled.div`
  align-items: center;
  background: #e8e9ef;
  border-radius: 6px;
  display: flex;
  font-size: 20px;
  height: 36px;
  justify-content: center;
  width: 36px;
`;

const StyledDocumentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StyledDocumentName = styled.span`
  color: #1a1a2e;
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
`;

const StyledDocumentMeta = styled.span`
  color: #8b8b9a;
  font-size: 11px;
`;

const ICON_BY_TYPE: Record<string, string> = {
  DOCUMENT: '📄',
  AUDIO: '🎵',
  TEMPLATE: '📋',
};

export const ChatAttachment = ({
  type,
  mediaUrl,
  content,
}: ChatAttachmentProps) => {
  if (type === 'IMAGE') {
    return <StyledImageThumb src={mediaUrl} alt={content ?? 'imagem'} />;
  }

  const icon = ICON_BY_TYPE[type] ?? '📎';
  const fileName = content ?? mediaUrl.split('/').pop() ?? 'arquivo';

  return (
    <StyledDocumentRow>
      <StyledDocumentIcon>{icon}</StyledDocumentIcon>
      <StyledDocumentInfo>
        <StyledDocumentName>{fileName}</StyledDocumentName>
        <StyledDocumentMeta>
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
            Abrir
          </a>
        </StyledDocumentMeta>
      </StyledDocumentInfo>
    </StyledDocumentRow>
  );
};
