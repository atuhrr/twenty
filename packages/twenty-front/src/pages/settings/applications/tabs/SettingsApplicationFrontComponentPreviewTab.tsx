import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Suspense, lazy } from 'react';
import { Section } from 'twenty-ui/layout';

const FrontComponentRenderer = lazy(() =>
  import('@/front-components/components/FrontComponentRenderer').then(
    (module) => ({ default: module.FrontComponentRenderer }),
  ),
);

const StyledPreviewFrame = styled.div`
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-light);
  border-radius: var(--t-border-radius-md);
  display: flex;
  height: 600px;
  overflow: auto;
  width: 100%;
`;

const StyledHeadlessNotice = styled.div`
  align-items: center;
  color: var(--t-font-color-secondary);
  display: flex;
  flex-direction: column;
  gap: var(--t-spacing-2);
  height: 100%;
  justify-content: center;
  padding: var(--t-spacing-6);
  text-align: center;
  width: 100%;
`;

const StyledHeadlessTitle = styled.span`
  color: var(--t-font-color-primary);
  font-size: var(--t-font-size-md);
  font-weight: var(--t-font-weight-medium);
`;

const StyledRendererContainer = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
`;

type SettingsApplicationFrontComponentPreviewTabProps = {
  frontComponentId: string;
  isHeadless: boolean;
};

export const SettingsApplicationFrontComponentPreviewTab = ({
  frontComponentId,
  isHeadless,
}: SettingsApplicationFrontComponentPreviewTabProps) => {
  return (
    <Section>
      <StyledPreviewFrame>
        {isHeadless ? (
          <StyledHeadlessNotice>
            <StyledHeadlessTitle>{t`Headless component`}</StyledHeadlessTitle>
            <span>{t`This component runs without a UI and renders nothing here.`}</span>
          </StyledHeadlessNotice>
        ) : (
          <StyledRendererContainer>
            <Suspense fallback={null}>
              <FrontComponentRenderer frontComponentId={frontComponentId} />
            </Suspense>
          </StyledRendererContainer>
        )}
      </StyledPreviewFrame>
    </Section>
  );
};
