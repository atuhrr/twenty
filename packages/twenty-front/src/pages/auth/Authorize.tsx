import { styled } from '@linaria/react';
import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Key } from 'ts-key-enum';
import { AppPath } from 'twenty-shared/types';

import { AppConnectionHeader } from '@/applications/components/AppConnectionHeader';
import { AuthorizeActionButtons } from '@/applications/components/AuthorizeActionButtons';
import { useRedirect } from '@/domain-manager/hooks/useRedirect';
import { useGlobalHotkeys } from '@/ui/utilities/hotkey/hooks/useGlobalHotkeys';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQuery } from '@apollo/client/react';
import { isDefined } from 'twenty-shared/utils';
import {
  type IconComponent,
  IconDatabase,
  IconUserCircle,
} from 'twenty-ui/icon';
import { H1Title, H1TitleFontColor } from 'twenty-ui/typography';
import { ModalContent } from 'twenty-ui/surfaces';
import { ThemeContext } from 'twenty-ui/theme-constants';
import {
  AuthorizeAppDocument,
  FindApplicationRegistrationByClientIdDocument,
} from '~/generated-metadata/graphql';
import { useNavigateApp } from '~/hooks/useNavigateApp';

const StyledCardWrapper = styled.div`
  --oauth-modal-content-max-width: calc(
    var(--t-modal-size-md-width) + var(--t-spacing-32)
  );

  background-color: var(--t-background-primary);
  border-radius: var(--t-border-radius-md);
  box-shadow: var(--t-box-shadow-strong);
  display: flex;
  flex-direction: column;
  max-width: min(
    100%,
    calc(var(--oauth-modal-content-max-width) + var(--t-spacing-20))
  );
  overflow: hidden;
  width: fit-content;
`;

const StyledHeader = styled.div`
  align-items: center;
  background-image: url('/images/integrations/oauth-modal-header.png');
  background-position: center;
  background-size: cover;
  display: flex;
  gap: var(--t-spacing-2);
  height: var(--t-spacing-30);
  justify-content: center;
  width: 100%;
`;

const StyledOAuthTitle = styled(H1Title)`
  margin: 0;
  max-width: min(100%, var(--oauth-modal-content-max-width));
  padding-bottom: var(--t-spacing-1);
  text-wrap: balance;
  width: max-content;
`;

const StyledPermissionSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: var(--t-spacing-6);
  width: 100%;
`;

const StyledPermissionIntro = styled.p`
  color: var(--t-font-color-primary);
  font-family: var(--t-font-family);
  font-size: var(--t-font-size-md);
  font-weight: var(--t-font-weight-medium);
  line-height: var(--t-text-line-height-lg);
  margin: 0;
  padding: 0 0 var(--t-spacing-3) var(--t-spacing-1);
`;

const StyledScopeList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
`;

const StyledScopeItem = styled.li`
  align-items: center;
  color: var(--t-font-color-secondary);
  display: flex;
  font-family: var(--t-font-family);
  font-size: var(--t-font-size-md);
  gap: var(--t-spacing-2);
  line-height: var(--t-text-line-height-lg);
  padding-left: var(--t-spacing-2);

  & + & {
    border-top: 1px solid var(--t-border-color-light);
    margin-top: var(--t-spacing-3);
    padding-top: var(--t-spacing-3);
  }

  span {
    min-width: 0;
  }
`;

const StyledScopeIcon = styled.div`
  align-items: center;
  color: var(--t-color-blue);
  display: flex;
  flex-shrink: 0;
  justify-content: center;
`;

const StyledErrorText = styled.div`
  color: var(--t-color-red);
  font-size: var(--t-font-size-sm);
  margin-top: var(--t-spacing-4);
  text-align: center;
  width: 100%;
`;

const OAUTH_SCOPE_ICONS: { [scope: string]: IconComponent | undefined } = {
  api: IconDatabase,
  profile: IconUserCircle,
};

export const Authorize = () => {
  const { t } = useLingui();
  const { theme, colorScheme } = useContext(ThemeContext);
  const navigate = useNavigateApp();
  const [searchParam] = useSearchParams();
  const { redirect } = useRedirect();

  const oauthScopeLabels: { [scope: string]: string | undefined } = {
    api: t`Access your workspace data`,
    profile: t`Read your profile`,
  };

  // Support both camelCase (legacy) and standard OAuth snake_case params
  const clientId = searchParam.get('client_id') ?? searchParam.get('clientId');
  const codeChallenge =
    searchParam.get('code_challenge') ?? searchParam.get('codeChallenge');
  const redirectUrl =
    searchParam.get('redirect_uri') ?? searchParam.get('redirectUrl');
  const state = searchParam.get('state');

  const {
    data,
    loading,
    error: queryError,
  } = useQuery(FindApplicationRegistrationByClientIdDocument, {
    variables: { clientId: clientId ?? '' },
    skip: !isDefined(clientId),
  });

  const applicationRegistration = data?.findApplicationRegistrationByClientId;
  const [authorizeApp] = useMutation(AuthorizeAppDocument);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const shouldRedirectToNotFound =
    !isDefined(clientId) || (!loading && !isDefined(applicationRegistration));

  useEffect(() => {
    if (shouldRedirectToNotFound) {
      navigate(AppPath.NotFound);
    }
  }, [shouldRedirectToNotFound, navigate]);

  const appendThemeToUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);

      url.searchParams.set('theme', colorScheme);

      return url.toString();
    } catch {
      return urlString;
    }
  };

  const handleAuthorize = async () => {
    if (isDefined(clientId) && isDefined(redirectUrl)) {
      setIsAuthorizing(true);
      setAuthorizeError(null);

      await authorizeApp({
        variables: {
          clientId,
          codeChallenge: codeChallenge ?? undefined,
          redirectUrl,
          state: state ?? undefined,
        },
        onCompleted: (responseData) => {
          redirect(appendThemeToUrl(responseData.authorizeApp.redirectUrl));
        },
        onError: (error) => {
          setIsAuthorizing(false);
          setAuthorizeError(
            error.message || t`Authorization failed. Please try again.`,
          );
        },
      });
    }
  };

  useGlobalHotkeys({
    keys: [Key.Enter],
    callback: (keyboardEvent) => {
      if (
        keyboardEvent.target instanceof HTMLButtonElement ||
        loading ||
        isAuthorizing ||
        !isDefined(applicationRegistration)
      ) {
        return;
      }

      handleAuthorize();
    },
    containsModifier: false,
    dependencies: [
      loading,
      isAuthorizing,
      applicationRegistration,
      clientId,
      redirectUrl,
    ],
    options: {
      preventDefault: false,
    },
  });

  if (isDefined(queryError)) {
    return (
      <ModalContent isVerticallyCentered isHorizontallyCentered>
        <StyledCardWrapper>
          <ModalContent contentPadding={10}>
            <StyledOAuthTitle
              title={<Trans>Something went wrong</Trans>}
              fontColor={H1TitleFontColor.Primary}
            />
            <StyledErrorText>
              {t`Unable to load application details. Please try again later.`}
            </StyledErrorText>
          </ModalContent>
        </StyledCardWrapper>
      </ModalContent>
    );
  }

  if (loading || !applicationRegistration) {
    return null;
  }

  const appName = applicationRegistration.name;
  const appLogoUrl = applicationRegistration.logoUrl;
  const requestedScopes: string[] = applicationRegistration.oAuthScopes ?? [];

  return (
    <ModalContent isVerticallyCentered isHorizontallyCentered>
      <StyledCardWrapper>
        <StyledHeader>
          <AppConnectionHeader appLogoUrl={appLogoUrl} appName={appName} />
        </StyledHeader>
        <ModalContent contentPadding={10}>
          <StyledOAuthTitle
            title={<Trans>Connect {appName} to your account</Trans>}
            fontColor={H1TitleFontColor.Primary}
          />
          {requestedScopes.length > 0 && (
            <StyledPermissionSection>
              <StyledPermissionIntro>
                <Trans>{appName} would like to:</Trans>
              </StyledPermissionIntro>
              <StyledScopeList>
                {requestedScopes.map((scope) => {
                  const ScopeIcon = OAUTH_SCOPE_ICONS[scope] ?? IconDatabase;

                  return (
                    <StyledScopeItem key={scope}>
                      <StyledScopeIcon>
                        <ScopeIcon
                          size={theme.icon.size.md}
                          stroke={theme.icon.stroke.sm}
                        />
                      </StyledScopeIcon>
                      <span>{oauthScopeLabels[scope] ?? scope}</span>
                    </StyledScopeItem>
                  );
                })}
              </StyledScopeList>
            </StyledPermissionSection>
          )}
          {authorizeError && (
            <StyledErrorText>{authorizeError}</StyledErrorText>
          )}
          <AuthorizeActionButtons
            onCancel={() => navigate(AppPath.Index)}
            onAuthorize={handleAuthorize}
            isLoading={isAuthorizing}
          />
        </ModalContent>
      </StyledCardWrapper>
    </ModalContent>
  );
};
