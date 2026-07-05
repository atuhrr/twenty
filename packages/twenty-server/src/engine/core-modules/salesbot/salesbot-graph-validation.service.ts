// FORK: Voka CRM — Fase 14.1: integridade estrutural do grafo (distinto do nó "Validação")
import { Injectable } from '@nestjs/common';

import {
  type BotGraph,
  type GraphValidationError,
  type GraphValidationResult,
} from './salesbot-graph.types';

@Injectable()
export class BotGraphValidationService {
  validate(graph: BotGraph): GraphValidationResult {
    const errors: GraphValidationError[] = [];

    this.checkStartNodes(graph, errors);
    this.checkConditionBranches(graph, errors);
    this.checkOrphanNodes(graph, errors);
    this.checkCycles(graph, errors);

    return { valid: errors.length === 0, errors };
  }

  // ── 1. Exatamente um nó START ───────────────────────────────────────────────

  private checkStartNodes(
    graph: BotGraph,
    errors: GraphValidationError[],
  ): void {
    const starts = graph.nodes.filter((n) => n.type === 'START');

    if (starts.length === 0) {
      errors.push({
        code: 'NO_START',
        message:
          'O grafo precisa de exatamente um nó "Iniciar bot". Adicione-o ao canvas.',
      });
    } else if (starts.length > 1) {
      errors.push({
        code: 'MULTIPLE_STARTS',
        message: `Há ${starts.length} nós "Iniciar bot". Deve existir apenas um.`,
      });
    }
  }

  // ── 2. Nó CONDITION com ramos verdadeiro e falso ────────────────────────────

  private checkConditionBranches(
    graph: BotGraph,
    errors: GraphValidationError[],
  ): void {
    for (const node of graph.nodes.filter((n) => n.type === 'CONDITION')) {
      const out = graph.edges.filter((e) => e.source === node.id);
      const hasTrueBranch = out.some((e) => e.sourceHandle === 'true');
      const hasFalseBranch = out.some((e) => e.sourceHandle === 'false');
      const label = `"${String(node.config.label ?? node.id.slice(0, 6))}"`;

      if (!hasTrueBranch) {
        errors.push({
          code: 'CONDITION_MISSING_TRUE',
          message: `Condição ${label} não tem ramo "Verdadeiro" conectado.`,
          nodeId: node.id,
        });
      }

      if (!hasFalseBranch) {
        errors.push({
          code: 'CONDITION_MISSING_FALSE',
          message: `Condição ${label} não tem ramo "Falso" conectado.`,
          nodeId: node.id,
        });
      }
    }
  }

  // ── 3. Nós órfãos (não alcançáveis a partir do START) ──────────────────────

  private checkOrphanNodes(
    graph: BotGraph,
    errors: GraphValidationError[],
  ): void {
    const starts = graph.nodes.filter((n) => n.type === 'START');

    if (starts.length !== 1) return; // já reportado pelo check 1

    const reachable = new Set<string>();
    const queue = [starts[0].id];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (reachable.has(current)) continue;

      reachable.add(current);
      graph.edges
        .filter((e) => e.source === current)
        .forEach((e) => {
          if (!reachable.has(e.target)) queue.push(e.target);
        });
    }

    for (const node of graph.nodes) {
      if (node.type === 'TRIGGER') continue; // TRIGGER fica fora do fluxo por design
      if (!reachable.has(node.id)) {
        errors.push({
          code: 'ORPHAN_NODE',
          message: `Nó "${String(node.config.label ?? node.id.slice(0, 6))}" (${node.type}) não é alcançável a partir de "Iniciar bot".`,
          nodeId: node.id,
        });
      }
    }
  }

  // ── 4. Detecção de ciclo (DFS tri-colorido) ─────────────────────────────────

  private checkCycles(graph: BotGraph, errors: GraphValidationError[]): void {
    if (this.hasCycle(graph)) {
      errors.push({
        code: 'CYCLE',
        message:
          'O grafo contém um ciclo. Bots com ciclos podem gerar loops infinitos na execução.',
      });
    }
  }

  private hasCycle(graph: BotGraph): boolean {
    // 0 = não visitado · 1 = em pilha (cinza) · 2 = concluído (preto)
    const state = new Map<string, 0 | 1 | 2>(
      graph.nodes.map((n) => [n.id, 0]),
    );

    const dfs = (id: string): boolean => {
      state.set(id, 1);

      for (const edge of graph.edges.filter((e) => e.source === id)) {
        const s = state.get(edge.target) ?? 0;

        if (s === 1) return true; // aresta de retorno = ciclo
        if (s === 0 && dfs(edge.target)) return true;
      }

      state.set(id, 2);

      return false;
    };

    for (const node of graph.nodes) {
      if ((state.get(node.id) ?? 0) === 0 && dfs(node.id)) return true;
    }

    return false;
  }
}
