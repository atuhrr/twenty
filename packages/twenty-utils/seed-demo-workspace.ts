/**
 * Seed Demo Workspace — Voka CRM (dados brasileiros)
 *
 * Uso:
 *   npx ts-node -e "require('./packages/twenty-utils/seed-demo-workspace.ts')"
 *
 * Ou via curl/node com o token de API:
 *   API_TOKEN=<token> npx ts-node packages/twenty-utils/seed-demo-workspace.ts
 *
 * Requer: servidor rodando em http://localhost:3000
 */

const API_URL = process.env.TWENTY_API_URL ?? 'http://localhost:3000/api';
const API_TOKEN = process.env.API_TOKEN ?? '';

if (!API_TOKEN) {
  console.error('❌  Defina API_TOKEN com o token de API do Twenty');
  console.error('   Acesse Configurações → API e Webhooks → Gerar token');
  process.exit(1);
}

type GQLResult = { data?: Record<string, unknown>; errors?: unknown[] };

const gql = async (query: string, variables?: object): Promise<GQLResult> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json() as Promise<GQLResult>;
};

// ─── Companies ──────────────────────────────────────────────────────────────

const COMPANIES = [
  { name: 'Construtora Santos & Silva Ltda.', domainName: 'santosilva.com.br' },
  { name: 'Clínica Vitalidade Saúde', domainName: 'vitalidadesaude.com.br' },
  { name: 'TechBrasil Soluções Digitais', domainName: 'techbrasil.com.br' },
  { name: 'Grupo Estrela Empreendimentos', domainName: 'grupoestrela.com.br' },
  { name: 'Academia FitForce', domainName: 'fitforce.com.br' },
];

const CREATE_COMPANY = `
  mutation($name: String!, $domainName: String!) {
    createCompany(data: { name: $name, domainName: { primaryLinkLabel: "", primaryLinkUrl: $domainName } }) {
      id
      name
    }
  }
`;

// ─── Leads (People) ─────────────────────────────────────────────────────────

const LEADS = [
  { firstName: 'Ana', lastName: 'Silva', phone: '+5511999990001', jobTitle: 'Gestora de Projetos', companyIdx: 0 },
  { firstName: 'Pedro', lastName: 'Oliveira', phone: '+5521988880002', jobTitle: 'Diretor Comercial', companyIdx: 1 },
  { firstName: 'Camila', lastName: 'Santos', phone: '+5531977770003', jobTitle: 'CEO', companyIdx: 2 },
  { firstName: 'Rafael', lastName: 'Mendes', phone: '+5541966660004', jobTitle: 'Gerente de Compras', companyIdx: 3 },
  { firstName: 'Juliana', lastName: 'Costa', phone: '+5551955550005', jobTitle: 'Empreendedora', companyIdx: 4 },
  { firstName: 'Lucas', lastName: 'Ferreira', phone: '+5511944440006', jobTitle: 'Sócio Proprietário', companyIdx: 0 },
  { firstName: 'Mariana', lastName: 'Lima', phone: '+5521933330007', jobTitle: 'Diretora de Marketing', companyIdx: 1 },
  { firstName: 'Thiago', lastName: 'Rodrigues', phone: '+5531922220008', jobTitle: 'Analista de Negócios', companyIdx: 2 },
  { firstName: 'Beatriz', lastName: 'Almeida', phone: '+5541911110009', jobTitle: 'Consultora', companyIdx: 3 },
  { firstName: 'Mateus', lastName: 'Carvalho', phone: '+5551900000010', jobTitle: 'CTO', companyIdx: 4 },
  { firstName: 'Isabela', lastName: 'Gomes', phone: '+5511888880011', jobTitle: 'Proprietária', companyIdx: 0 },
  { firstName: 'Guilherme', lastName: 'Martins', phone: '+5521877770012', jobTitle: 'Gerente Geral', companyIdx: 1 },
  { firstName: 'Fernanda', lastName: 'Pereira', phone: '+5531866660013', jobTitle: 'Diretora Executiva', companyIdx: 2 },
  { firstName: 'Diego', lastName: 'Nascimento', phone: '+5541855550014', jobTitle: 'Fundador', companyIdx: 3 },
  { firstName: 'Larissa', lastName: 'Souza', phone: '+5551844440015', jobTitle: 'COO', companyIdx: 4 },
];

const CREATE_PERSON = `
  mutation($firstName: String!, $lastName: String!, $phone: String!, $jobTitle: String!, $companyId: ID!) {
    createPerson(data: {
      name: { firstName: $firstName, lastName: $lastName }
      phones: { primaryPhoneNumber: $phone, primaryPhoneCountryCode: "+55" }
      jobTitle: $jobTitle
      company: { id: $companyId }
    }) {
      id
      name { firstName lastName }
    }
  }
`;

// ─── Opportunities ──────────────────────────────────────────────────────────

const OPPORTUNITIES = [
  // NEW - Novo Lead
  { name: 'Apartamento Zona Sul — Ana Silva', stage: 'NEW', amountBRL: 450000, pocIdx: 0, days: 0 },
  { name: 'Plano Saúde Empresarial — Pedro Oliveira', stage: 'NEW', amountBRL: 1200, pocIdx: 1, days: 1 },
  { name: 'Site + App Mobile — Camila Santos', stage: 'NEW', amountBRL: 28000, pocIdx: 2, days: 0 },
  // SCREENING - Em Atendimento
  { name: 'Imóvel Comercial — Rafael Mendes', stage: 'SCREENING', amountBRL: 890000, pocIdx: 3, days: 3 },
  { name: 'Consultoria Academia — Juliana Costa', stage: 'SCREENING', amountBRL: 5500, pocIdx: 4, days: 2 },
  { name: 'CRM Personalizado — Lucas Ferreira', stage: 'SCREENING', amountBRL: 35000, pocIdx: 5, days: 5 },
  // MEETING - Qualificado
  { name: 'Cobertura Duplex — Mariana Lima', stage: 'MEETING', amountBRL: 1200000, pocIdx: 6, days: 7 },
  { name: 'Equipamentos Fitness — Thiago Rodrigues', stage: 'MEETING', amountBRL: 42000, pocIdx: 7, days: 6 },
  { name: 'Automação Marketing — Beatriz Almeida', stage: 'MEETING', amountBRL: 18000, pocIdx: 8, days: 8 },
  // PROPOSAL - Proposta
  { name: 'Casa de Alto Padrão — Mateus Carvalho', stage: 'PROPOSAL', amountBRL: 2500000, pocIdx: 9, days: 14 },
  { name: 'Franquia FitForce — Isabela Gomes', stage: 'PROPOSAL', amountBRL: 85000, pocIdx: 10, days: 12 },
  // CUSTOMER - Cliente
  { name: 'Expansão Clínica — Guilherme Martins', stage: 'CUSTOMER', amountBRL: 320000, pocIdx: 11, days: 30 },
  { name: 'ERP Integrado — Fernanda Pereira', stage: 'CUSTOMER', amountBRL: 95000, pocIdx: 12, days: 25 },
  { name: 'Loteamento Residencial — Diego Nascimento', stage: 'CUSTOMER', amountBRL: 4800000, pocIdx: 13, days: 45 },
  { name: 'Rede de Academias — Larissa Souza', stage: 'CUSTOMER', amountBRL: 580000, pocIdx: 14, days: 20 },
];

const CREATE_OPPORTUNITY = `
  mutation($name: String!, $stage: OpportunityStageEnum!, $amountMicros: BigFloat!, $closeDatetime: DateTime!, $pocId: ID!, $companyId: ID!) {
    createOpportunity(data: {
      name: $name
      stage: $stage
      amount: { amountMicros: $amountMicros, currencyCode: "BRL" }
      closeDate: $closeDatetime
      pointOfContact: { id: $pocId }
      company: { id: $companyId }
    }) {
      id
      name
      stage
    }
  }
`;

// ─── Main ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  console.log('🚀  Seeding demo workspace...\n');

  // 1. Companies
  console.log('🏢  Criando empresas...');
  const companyIds: string[] = [];
  for (const company of COMPANIES) {
    const res = await gql(CREATE_COMPANY, company);
    const id = (res.data?.createCompany as { id: string } | undefined)?.id;
    if (!id) {
      console.error(`   ❌ Falha ao criar empresa ${company.name}`, res.errors);
      continue;
    }
    companyIds.push(id);
    console.log(`   ✅ ${company.name} (${id})`);
    await sleep(200);
  }

  // 2. People (leads)
  console.log('\n👤  Criando leads...');
  const personIds: string[] = [];
  for (const lead of LEADS) {
    const companyId = companyIds[lead.companyIdx];
    if (!companyId) {
      personIds.push('');
      continue;
    }
    const res = await gql(CREATE_PERSON, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      jobTitle: lead.jobTitle,
      companyId,
    });
    const person = res.data?.createPerson as { id: string; name: { firstName: string; lastName: string } } | undefined;
    if (!person?.id) {
      console.error(`   ❌ Falha ao criar ${lead.firstName} ${lead.lastName}`, res.errors);
      personIds.push('');
      continue;
    }
    personIds.push(person.id);
    console.log(`   ✅ ${person.name.firstName} ${person.name.lastName} (${person.id})`);
    await sleep(200);
  }

  // 3. Opportunities
  console.log('\n💼  Criando oportunidades...');
  for (const opp of OPPORTUNITIES) {
    const pocId = personIds[opp.pocIdx];
    const companyId = companyIds[LEADS[opp.pocIdx].companyIdx];
    if (!pocId || !companyId) {
      console.warn(`   ⚠️  Pulando ${opp.name}: lead ou empresa não encontrada`);
      continue;
    }
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 30 - opp.days);

    const res = await gql(CREATE_OPPORTUNITY, {
      name: opp.name,
      stage: opp.stage,
      amountMicros: opp.amountBRL * 1_000_000,
      closeDatetime: closeDate.toISOString(),
      pocId,
      companyId,
    });
    const created = res.data?.createOpportunity as { id: string; name: string; stage: string } | undefined;
    if (!created?.id) {
      console.error(`   ❌ Falha ao criar ${opp.name}`, res.errors);
      continue;
    }
    console.log(`   ✅ [${opp.stage}] ${opp.name} — R$ ${opp.amountBRL.toLocaleString('pt-BR')}`);
    await sleep(200);
  }

  console.log('\n✨  Demo workspace criado com sucesso!');
  console.log('   15 leads brasileiros, 5 empresas, 15 oportunidades em todos os estágios');
};

run().catch(console.error);
