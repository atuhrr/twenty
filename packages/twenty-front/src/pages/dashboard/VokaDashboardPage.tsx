import { VokaAtividadeRecente } from './components/VokaAtividadeRecente';
import { VokaKpiCards } from './components/VokaKpiCards';
import { VokaLeadsChart } from './components/VokaLeadsChart';
import { VokaMetaMes } from './components/VokaMetaMes';
import { VokaTarefasHoje } from './components/VokaTarefasHoje';

export function VokaDashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Painel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Visão geral do seu CRM
        </p>
      </div>

      {/* KPI Cards — linha completa */}
      <VokaKpiCards />

      {/* Gráfico + Meta */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <VokaLeadsChart />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <VokaMetaMes />
        </div>
      </div>

      {/* Atividade Recente + Tarefas de Hoje */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <VokaAtividadeRecente />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <VokaTarefasHoje />
        </div>
      </div>
    </div>
  );
}
