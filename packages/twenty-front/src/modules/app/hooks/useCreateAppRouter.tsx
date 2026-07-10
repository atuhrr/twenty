import { AppRouterProviders } from '@/app/components/AppRouterProviders';
import { LazyRoute } from '@/app/components/LazyRoute';
import { SettingsRoutes } from '@/app/components/SettingsRoutes';
import { SettingsTailLayout } from '@/tailadmin/layout/SettingsTailLayout';
import { AuthTailLayout } from '@/tailadmin/layout/AuthTailLayout';
import { VerifyLoginTokenEffect } from '@/auth/components/VerifyLoginTokenEffect';

import { VerifyEmailEffect } from '@/auth/components/VerifyEmailEffect';
import indexAppPath from '@/navigation/utils/indexAppPath';
import { RecordIndexSkeletonLoader } from '@/object-record/record-index/components/RecordIndexSkeletonLoader';
import { BlankLayout } from '@/ui/layout/page/components/BlankLayout';
import { DefaultLayout } from '@/ui/layout/page/components/DefaultLayout';
import { AppPath } from 'twenty-shared/types';

import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';

const VokaAppLayout = lazy(() =>
  import('@/tailadmin/layout/VokaAppLayout').then((module) => ({
    default: module.VokaAppLayout,
  })),
);

const VokaDashboardPage = lazy(() =>
  import('~/pages/dashboard/VokaDashboardPage').then((module) => ({
    default: module.VokaDashboardPage,
  })),
);

const RecordIndexPage = lazy(() =>
  import('~/pages/object-record/RecordIndexPage').then((module) => ({
    default: module.RecordIndexPage,
  })),
);

const RecordShowPage = lazy(() =>
  import('~/pages/object-record/RecordShowPage').then((module) => ({
    default: module.RecordShowPage,
  })),
);

const SignInUp = lazy(() =>
  import('~/pages/auth/SignInUp').then((module) => ({
    default: module.SignInUp,
  })),
);

const PasswordReset = lazy(() =>
  import('~/pages/auth/PasswordReset').then((module) => ({
    default: module.PasswordReset,
  })),
);

const Authorize = lazy(() =>
  import('~/pages/auth/Authorize').then((module) => ({
    default: module.Authorize,
  })),
);

const WorkspaceActivation = lazy(() =>
  import('~/pages/onboarding/WorkspaceActivation').then((module) => ({
    default: module.WorkspaceActivation,
  })),
);

const CreateProfile = lazy(() =>
  import('~/pages/onboarding/CreateProfile').then((module) => ({
    default: module.CreateProfile,
  })),
);

const SyncEmails = lazy(() =>
  import('~/pages/onboarding/SyncEmails').then((module) => ({
    default: module.SyncEmails,
  })),
);

const InviteTeam = lazy(() =>
  import('~/pages/onboarding/InviteTeam').then((module) => ({
    default: module.InviteTeam,
  })),
);

const ConnectWhatsApp = lazy(() =>
  import('~/pages/onboarding/ConnectWhatsApp').then((module) => ({
    default: module.ConnectWhatsApp,
  })),
);

const ChooseYourPlan = lazy(() =>
  import('~/pages/onboarding/ChooseYourPlan').then((module) => ({
    default: module.ChooseYourPlan,
  })),
);

const PaymentSuccess = lazy(() =>
  import('~/pages/onboarding/PaymentSuccess').then((module) => ({
    default: module.PaymentSuccess,
  })),
);

const BookCallDecision = lazy(() =>
  import('~/pages/onboarding/BookCallDecision').then((module) => ({
    default: module.BookCallDecision,
  })),
);

const BookCall = lazy(() =>
  import('~/pages/onboarding/BookCall').then((module) => ({
    default: module.BookCall,
  })),
);

const StandalonePageLayoutPage = lazy(() =>
  import('~/pages/page-layout/StandalonePageLayoutPage').then((module) => ({
    default: module.StandalonePageLayoutPage,
  })),
);

// FORK: Voka CRM — Fase A: telas de auth fiéis ao design TailAdmin
const VokaSignInPage = lazy(() =>
  import('~/pages/auth/VokaSignInPage').then((m) => ({
    default: m.VokaSignInPage,
  })),
);
const VokaSignUpPage = lazy(() =>
  import('~/pages/auth/VokaSignUpPage').then((m) => ({
    default: m.VokaSignUpPage,
  })),
);
const VokaForgotPasswordPage = lazy(() =>
  import('~/pages/auth/VokaForgotPasswordPage').then((m) => ({
    default: m.VokaForgotPasswordPage,
  })),
);
const VokaTwoStepPage = lazy(() =>
  import('~/pages/auth/VokaTwoStepPage').then((m) => ({
    default: m.VokaTwoStepPage,
  })),
);
const NotFound = lazy(() =>
  import('~/pages/not-found/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

// FORK: Voka CRM — placeholder pages for new modules
const InboxPage = lazy(() =>
  import('~/pages/inbox/InboxPage').then((module) => ({
    default: module.InboxPage,
  })),
);

const MailPage = lazy(() =>
  import('~/pages/mail/MailPage').then((module) => ({
    default: module.MailPage,
  })),
);

// FORK: Voka CRM — Fase 5: Leads não classificados (incoming queue)
const LeadsNaoClassificadosPage = lazy(() =>
  import('~/pages/leads/LeadsNaoClassificadosPage').then((module) => ({
    default: module.LeadsNaoClassificadosPage,
  })),
);

const BroadcastPage = lazy(() =>
  import('~/pages/broadcast/BroadcastPage').then((module) => ({
    default: module.BroadcastPage,
  })),
);

const AutomacoesPage = lazy(() =>
  import('~/pages/automation/AutomacoesPage').then((module) => ({
    default: module.AutomacoesPage,
  })),
);

const SalesbotPage = lazy(() =>
  import('~/pages/salesbot/SalesbotPage').then((module) => ({
    default: module.SalesbotPage,
  })),
);

const SalesbotEditorPage = lazy(() =>
  import('~/pages/salesbot/SalesbotEditorPage').then((module) => ({
    default: module.SalesbotEditorPage,
  })),
);

const WebFormsPage = lazy(() =>
  import('~/pages/web-forms/WebFormsPage').then((module) => ({
    default: module.WebFormsPage,
  })),
);

// FORK: Zellate — F1 Financeiro: página de Faturas
const FaturasPage = lazy(() =>
  import('~/pages/faturas/FaturasPage').then((module) => ({
    default: module.FaturasPage,
  })),
);

// FORK: Zellate — Calendário do usuário (eventos + tarefas com prazo)
const CalendarioPage = lazy(() =>
  import('~/pages/calendario/CalendarioPage').then((module) => ({
    default: module.CalendarioPage,
  })),
);

// FORK: Voka CRM — Fase 17: Tarefas (kanban)
const TarefasPage = lazy(() =>
  import('~/pages/tarefas/TarefasPage').then((module) => ({
    default: module.TarefasPage,
  })),
);

const TemplatesPage = lazy(() =>
  import('~/pages/templates/TemplatesPage').then((module) => ({
    default: module.TemplatesPage,
  })),
);

// FORK: Voka CRM — T-4: Funil Kanban
const FunilKanbanPage = lazy(() =>
  import('~/pages/funil/FunilKanbanPage').then((module) => ({
    default: module.FunilKanbanPage,
  })),
);

// FORK: Voka CRM — T-3: Listas de Leads, Contatos e Empresas
// FORK: Voka CRM — T-12: páginas de detalhe TailAdmin
const LeadDetailPage = lazy(() =>
  import('~/pages/leads/LeadDetailPage').then((module) => ({
    default: module.LeadDetailPage,
  })),
);
const ContatoDetailPage = lazy(() =>
  import('~/pages/contatos/ContatoDetailPage').then((module) => ({
    default: module.ContatoDetailPage,
  })),
);
const EmpresaDetailPage = lazy(() =>
  import('~/pages/empresas/EmpresaDetailPage').then((module) => ({
    default: module.EmpresaDetailPage,
  })),
);
const LeadsListPage = lazy(() =>
  import('~/pages/leads/LeadsListPage').then((module) => ({
    default: module.LeadsListPage,
  })),
);

const ContatosListPage = lazy(() =>
  import('~/pages/contatos/ContatosListPage').then((module) => ({
    default: module.ContatosListPage,
  })),
);

const EmpresasListPage = lazy(() =>
  import('~/pages/empresas/EmpresasListPage').then((module) => ({
    default: module.EmpresasListPage,
  })),
);

// FORK: Voka CRM — Fase 2: Clientes Recorrentes + Catálogo
const ClientesPage = lazy(() =>
  import('~/pages/clientes/ClientesPage').then((module) => ({
    default: module.ClientesPage,
  })),
);

const CatalogoPage = lazy(() =>
  import('~/pages/catalogo/CatalogoPage').then((module) => ({
    default: module.CatalogoPage,
  })),
);

// FORK: Voka CRM — Fase 20: Estatísticas
// FORK: Voka CRM — T-7: página unificada de Estatísticas (TailAdmin)
const EstatisticasPage = lazy(() =>
  import('~/pages/estatisticas/EstatisticasPage').then((module) => ({
    default: module.EstatisticasPage,
  })),
);
const DashboardPage = lazy(() =>
  import('~/pages/estatisticas/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const RoiPage = lazy(() =>
  import('~/pages/estatisticas/RoiPage').then((module) => ({
    default: module.RoiPage,
  })),
);
const AnaliseGanhoPerdaPage = lazy(() =>
  import('~/pages/estatisticas/AnaliseGanhoPerdaPage').then((module) => ({
    default: module.AnaliseGanhoPerdaPage,
  })),
);
const RelatorioConsolidadoPage = lazy(() =>
  import('~/pages/estatisticas/RelatorioConsolidadoPage').then((module) => ({
    default: module.RelatorioConsolidadoPage,
  })),
);

export const useCreateAppRouter = (
  isFunctionSettingsEnabled?: boolean,
  isAdminPageEnabled?: boolean,
) =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route
        element={<AppRouterProviders />}
        // To switch state to `loading` temporarily to enable us
        // to set scroll position before the page is rendered
        loader={async () => Promise.resolve(null)}
      >
        <Route element={<DefaultLayout />}>
          <Route path={AppPath.Verify} element={<VerifyLoginTokenEffect />} />
          <Route path={AppPath.VerifyEmail} element={<VerifyEmailEffect />} />
          {/* FORK: Voka CRM — T-11: shell TailAdmin (painel de marca + stepper) */}
          <Route element={<AuthTailLayout />}>
            <Route
              path="/entrar"
              element={
                <LazyRoute fallback={null}>
                  <VokaSignInPage />
                </LazyRoute>
              }
            />
            <Route
              path="/cadastro"
              element={
                <LazyRoute fallback={null}>
                  <VokaSignUpPage />
                </LazyRoute>
              }
            />
            <Route
              path="/recuperar-senha"
              element={
                <LazyRoute fallback={null}>
                  <VokaForgotPasswordPage />
                </LazyRoute>
              }
            />
            <Route
              path="/verificacao"
              element={
                <LazyRoute fallback={null}>
                  <VokaTwoStepPage />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.SignInUp}
              element={
                <LazyRoute fallback={null}>
                  <SignInUp />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.Invite}
              element={
                <LazyRoute fallback={null}>
                  <SignInUp />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.ResetPassword}
              element={
                <LazyRoute fallback={null}>
                  <PasswordReset />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.WorkspaceActivation}
              element={
                <LazyRoute fallback={null}>
                  <WorkspaceActivation />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.CreateProfile}
              element={
                <LazyRoute fallback={null}>
                  <CreateProfile />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.SyncEmails}
              element={
                <LazyRoute fallback={null}>
                  <SyncEmails />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.InviteTeam}
              element={
                <LazyRoute fallback={null}>
                  <InviteTeam />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.ConnectWhatsApp}
              element={
                <LazyRoute fallback={null}>
                  <ConnectWhatsApp />
                </LazyRoute>
              }
            />
          </Route>
          <Route
            path={AppPath.PlanRequired}
            element={
              <LazyRoute fallback={null}>
                <ChooseYourPlan />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.PlanRequiredSuccess}
            element={
              <LazyRoute fallback={null}>
                <PaymentSuccess />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.BookCallDecision}
            element={
              <LazyRoute fallback={null}>
                <BookCallDecision />
              </LazyRoute>
            }
          />
          <Route
            path={AppPath.BookCall}
            element={
              <LazyRoute fallback={null}>
                <BookCall />
              </LazyRoute>
            }
          />
          <Route element={<Suspense fallback={null}><VokaAppLayout /></Suspense>}>
            <Route
              path={indexAppPath.getIndexAppPath()}
              element={
                <LazyRoute fallback={null}>
                  <VokaDashboardPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — T-13: redirects /objects/* → páginas Voka vivem
                em usePageChangeEffectNavigateLocation (fonte única). */}
            <Route
              path={AppPath.RecordIndexPage}
              element={
                <LazyRoute fallback={<RecordIndexSkeletonLoader />}>
                  <RecordIndexPage />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.RecordShowPage}
              element={
                <LazyRoute>
                  <RecordShowPage />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.PageLayoutPage}
              element={
                <LazyRoute>
                  <StandalonePageLayoutPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — T-10: sidebar interna TailAdmin nas configurações */}
            <Route
              path={AppPath.SettingsCatchAll}
              element={
                <SettingsTailLayout>
                  <SettingsRoutes
                    isFunctionSettingsEnabled={isFunctionSettingsEnabled}
                    isAdminPageEnabled={isAdminPageEnabled}
                  />
                </SettingsTailLayout>
              }
            />
            {/* FORK: Voka CRM — module placeholder routes */}
            <Route
              path="/inbox"
              element={
                <LazyRoute>
                  <InboxPage />
                </LazyRoute>
              }
            />
            <Route
              path="/mail"
              element={
                <LazyRoute>
                  <MailPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — T-4: Funil Kanban */}
            <Route
              path="/funil"
              element={
                <LazyRoute>
                  <FunilKanbanPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — T-3: listas dedicadas */}
            <Route
              path="/leads"
              element={
                <LazyRoute>
                  <LeadsListPage />
                </LazyRoute>
              }
            />
            <Route
              path="/contatos"
              element={
                <LazyRoute>
                  <ContatosListPage />
                </LazyRoute>
              }
            />
            <Route
              path="/empresas"
              element={
                <LazyRoute>
                  <EmpresasListPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — T-12: páginas de detalhe TailAdmin */}
            <Route
              path="/leads/:id"
              element={
                <LazyRoute>
                  <LeadDetailPage />
                </LazyRoute>
              }
            />
            <Route
              path="/contatos/:id"
              element={
                <LazyRoute>
                  <ContatoDetailPage />
                </LazyRoute>
              }
            />
            <Route
              path="/empresas/:id"
              element={
                <LazyRoute>
                  <EmpresaDetailPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 2: Clientes Recorrentes + Catálogo */}
            <Route
              path="/clientes"
              element={
                <LazyRoute>
                  <ClientesPage />
                </LazyRoute>
              }
            />
            <Route
              path="/catalogo"
              element={
                <LazyRoute>
                  <CatalogoPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 5: leads incoming queue */}
            <Route
              path="/leads-nao-classificados"
              element={
                <LazyRoute>
                  <LeadsNaoClassificadosPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Campanhas de Disparo em Massa */}
            <Route
              path="/campanhas"
              element={
                <LazyRoute>
                  <BroadcastPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 17: Tarefas */}
            <Route
              path="/tarefas"
              element={
                <LazyRoute>
                  <TarefasPage />
                </LazyRoute>
              }
            />
            <Route
              path="/calendario"
              element={
                <LazyRoute>
                  <CalendarioPage />
                </LazyRoute>
              }
            />
            <Route
              path="/faturas"
              element={
                <LazyRoute>
                  <FaturasPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 15: Formulários Web */}
            <Route
              path="/formularios"
              element={
                <LazyRoute>
                  <WebFormsPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 14: Salesbot lista */}
            <Route
              path="/salesbot"
              element={
                <LazyRoute>
                  <SalesbotPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 14.2: editor visual (placeholder na 14.1) */}
            <Route
              path="/salesbot/:id"
              element={
                <LazyRoute>
                  <SalesbotEditorPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 13: Automações */}
            <Route
              path="/automacoes"
              element={
                <LazyRoute>
                  <AutomacoesPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — B2.1: Templates de chat e e-mail */}
            <Route
              path="/templates"
              element={
                <LazyRoute>
                  <TemplatesPage />
                </LazyRoute>
              }
            />
            {/* FORK: Voka CRM — Fase 20: Estatísticas */}
            {/* FORK: Voka CRM — T-7: página unificada */}
            <Route
              path="/estatisticas"
              element={
                <LazyRoute>
                  <EstatisticasPage />
                </LazyRoute>
              }
            />
            <Route
              path="/estatisticas/dashboard"
              element={
                <LazyRoute>
                  <DashboardPage />
                </LazyRoute>
              }
            />
            <Route
              path="/estatisticas/roi"
              element={
                <LazyRoute>
                  <RoiPage />
                </LazyRoute>
              }
            />
            <Route
              path="/estatisticas/analise-ganho-perda"
              element={
                <LazyRoute>
                  <AnaliseGanhoPerdaPage />
                </LazyRoute>
              }
            />
            <Route
              path="/estatisticas/relatorio-consolidado"
              element={
                <LazyRoute>
                  <RelatorioConsolidadoPage />
                </LazyRoute>
              }
            />
            <Route
              path={AppPath.NotFoundWildcard}
              element={
                <LazyRoute>
                  <NotFound />
                </LazyRoute>
              }
            />
          </Route>
        </Route>
        <Route element={<BlankLayout />}>
          <Route
            path={AppPath.Authorize}
            element={
              <LazyRoute>
                <Authorize />
              </LazyRoute>
            }
          />
        </Route>
      </Route>,
    ),
  );
