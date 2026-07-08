// FORK: Voka CRM — rotas das telas de autenticação próprias (design TailAdmin).
// Fonte única: consumida pelo roteamento (redirects) e pelo CaptchaProvider
// (essas telas enviam captcha ao server, que o exige quando configurado).
export const VOKA_AUTH_PATHS = [
  '/entrar',
  '/cadastro',
  '/recuperar-senha',
  '/verificacao',
];
