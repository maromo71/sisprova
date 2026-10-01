import type { LiveExamState, QuestaoCompleta } from '../types';

export type TipoVariacao = 'A' | 'B' | 'C' | 'D';

export interface VariacoesConfig {
  ativo: boolean;
  quantidade: 2 | 3 | 4; // Quantas versões gerar (A/B, A/B/C ou A/B/C/D)
  embaralharQuestoes: boolean;
  embaralharAlternativas: boolean;
  seed: number;
}

export const VARIACOES_PADRAO: VariacoesConfig = {
  ativo: false,
  quantidade: 4,
  embaralharQuestoes: true,
  embaralharAlternativas: true,
  seed: 42,
};

// Gerador Pseudoaleatório Determinístico (Mulberry32)
export function criarPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Algoritmo Fisher-Yates Determinístico
export function shuffleArray<T>(array: T[], randomFn: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Seed offset para cada tipo de prova
const SEED_OFFSET: Record<TipoVariacao, number> = {
  A: 0,
  B: 1337,
  C: 2789,
  D: 4099,
};

/**
 * Gera uma variação do exame com base na configuração e no tipo (A, B, C ou D).
 * A Prova A é mantida como a ordem original do professor para facilidade de referência,
 * a menos que se queira embaralhar todas. Aqui, a Prova A representa a versão base de referência.
 */
export function gerarExamVariacao(
  baseExam: LiveExamState,
  tipo: TipoVariacao,
  config: VariacoesConfig
): LiveExamState {
  if (!config.ativo || tipo === 'A') {
    // Prova A é a base original com ordens sequenciais
    return {
      ...baseExam,
      itens: baseExam.itens.map((item, idx) => ({
        ...item,
        ordem: idx + 1,
      })),
    };
  }

  // Gera seed única para este tipo
  const tipoSeed = (config.seed + SEED_OFFSET[tipo]) >>> 0;
  const prngQuestoes = criarPRNG(tipoSeed);

  // 1. Embaralha ou clona questões
  let itensProcessados = [...baseExam.itens];

  if (config.embaralharQuestoes && itensProcessados.length > 1) {
    itensProcessados = shuffleArray(itensProcessados, prngQuestoes);
  }

  // 2. Embaralha alternativas se configurado
  itensProcessados = itensProcessados.map((item, index) => {
    const questaoOriginal = item.questao;

    if (
      config.embaralharAlternativas &&
      questaoOriginal.tipo_questao === 'OBJETIVA' &&
      questaoOriginal.alternativas &&
      questaoOriginal.alternativas.length > 1
    ) {
      // PRNG determinístico para as alternativas desta questão específica
      const questaoSeed = (tipoSeed + (questaoOriginal.id || index) * 31) >>> 0;
      const prngAlternativas = criarPRNG(questaoSeed);
      const alternativasEmbaralhadas = shuffleArray(
        questaoOriginal.alternativas,
        prngAlternativas
      );

      const novaQuestao: QuestaoCompleta = {
        ...questaoOriginal,
        alternativas: alternativasEmbaralhadas,
      };

      return {
        ...item,
        ordem: index + 1,
        questao: novaQuestao,
      };
    }

    return {
      ...item,
      ordem: index + 1,
    };
  });

  return {
    ...baseExam,
    itens: itensProcessados,
  };
}

export interface MatrizGabaritoItem {
  questaoId: number;
  questaoTitulo: string;
  tipoQuestao: string;
  valorPontuacao: number;
  ordemOriginal: number; // Posição na Prova A
  respostas: Record<
    TipoVariacao,
    {
      ordemNaProva: number;
      letraGabarito: string | null; // 'A', 'B', 'C', 'D' ou null se dissertativa
      textoAlternativa?: string;
    }
  >;
}

/**
 * Constrói a matriz comparativa completa de gabaritos para todos os tipos habilitados.
 */
export function calcularMatrizGabarito(
  baseExam: LiveExamState,
  config: VariacoesConfig
): {
  tiposHabilitados: TipoVariacao[];
  itens: MatrizGabaritoItem[];
  distribuicaoGabarito: Record<TipoVariacao, Record<string, number>>;
} {
  const tipos: TipoVariacao[] = !config.ativo
    ? ['A']
    : config.quantidade === 2
    ? ['A', 'B']
    : config.quantidade === 3
    ? ['A', 'B', 'C']
    : ['A', 'B', 'C', 'D'];

  // Gera todas as variações necessárias
  const variacoes: Record<TipoVariacao, LiveExamState> = {
    A: config.ativo ? gerarExamVariacao(baseExam, 'A', config) : baseExam,
    B: config.ativo ? gerarExamVariacao(baseExam, 'B', config) : baseExam,
    C: config.ativo ? gerarExamVariacao(baseExam, 'C', config) : baseExam,
    D: config.ativo ? gerarExamVariacao(baseExam, 'D', config) : baseExam,
  };

  const matrizItens: MatrizGabaritoItem[] = [];
  const distribuicao: Record<TipoVariacao, Record<string, number>> = {
    A: {},
    B: {},
    C: {},
    D: {},
  };

  // Itera pelas questões da Prova A (ordem canônica original)
  baseExam.itens.forEach((itemBase, idx) => {
    const qBase = itemBase.questao;
    const ordemOriginal = idx + 1;

    const row: MatrizGabaritoItem = {
      questaoId: qBase.id,
      questaoTitulo: qBase.titulo,
      tipoQuestao: qBase.tipo_questao,
      valorPontuacao: itemBase.valor_pontuacao,
      ordemOriginal,
      respostas: {
        A: { ordemNaProva: ordemOriginal, letraGabarito: null },
        B: { ordemNaProva: ordemOriginal, letraGabarito: null },
        C: { ordemNaProva: ordemOriginal, letraGabarito: null },
        D: { ordemNaProva: ordemOriginal, letraGabarito: null },
      },
    };

    tipos.forEach((tipo) => {
      const examTipo = variacoes[tipo];
      const itemNaVarIndex = examTipo.itens.findIndex((it) => it.questao.id === qBase.id);
      const itemNaVar = examTipo.itens[itemNaVarIndex];
      const ordemNaProva = itemNaVarIndex >= 0 ? itemNaVar.ordem : ordemOriginal;

      if (qBase.tipo_questao === 'OBJETIVA' && itemNaVar) {
        const altCorretaIndex = itemNaVar.questao.alternativas.findIndex((a) => a.correta);
        if (altCorretaIndex >= 0) {
          const letra = String.fromCharCode(65 + altCorretaIndex);
          row.respostas[tipo] = {
            ordemNaProva,
            letraGabarito: letra,
            textoAlternativa: itemNaVar.questao.alternativas[altCorretaIndex].texto,
          };
          distribuicao[tipo][letra] = (distribuicao[tipo][letra] || 0) + 1;
        } else {
          row.respostas[tipo] = {
            ordemNaProva,
            letraGabarito: '?',
          };
        }
      } else {
        row.respostas[tipo] = {
          ordemNaProva,
          letraGabarito: null, // Dissertativa / Código
        };
      }
    });

    matrizItens.push(row);
  });

  return {
    tiposHabilitados: tipos,
    itens: matrizItens,
    distribuicaoGabarito: distribuicao,
  };
}
