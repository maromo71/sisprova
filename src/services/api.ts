import { invoke } from '@tauri-apps/api/core';
import type {
  Instituicao,
  InstituicaoInput,
  Disciplina,
  DisciplinaInput,
  QuestaoCompleta,
  QuestaoInput,
  AvaliacaoResumo,
  AvaliacaoDetalhe,
  AvaliacaoInput,
} from '../types';

// Detecta se está sendo executado no contexto do Tauri
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Fallback de memória para visualização rápida caso aberto em navegador convencional sem tauri runtime
let mockInstituicoes: Instituicao[] = [
  {
    id: 1,
    nome: 'Universidade Tecnológica / Centro de Ciências Exatas',
    sigla: 'UTFPR',
    logo_base64: null,
  },
];

let mockDisciplinas: Disciplina[] = [
  {
    id: 1,
    instituicao_id: 1,
    nome: 'Algoritmos e Estruturas de Dados',
    codigo: 'CC201',
    instituicao_nome: 'Universidade Tecnológica / Centro de Ciências Exatas',
  },
  {
    id: 2,
    instituicao_id: 1,
    nome: 'Cálculo Diferencial e Integral I',
    codigo: 'MAT101',
    instituicao_nome: 'Universidade Tecnológica / Centro de Ciências Exatas',
  },
];

let mockQuestoes: QuestaoCompleta[] = [
  {
    id: 1,
    disciplina_id: 1,
    disciplina_nome: 'Algoritmos e Estruturas de Dados',
    titulo: 'Complexidade de Algoritmos e Teorema Mestre',
    enunciado_markdown:
      'Dada a relação de recorrência $T(n) = 2T(n/2) + \\Theta(n)$ que descreve o algoritmo **Merge Sort**:\n\n1. Encontre a complexidade assintótica utilizando o **Teorema Mestre**.\n2. Demonstre se $f(n)$ cai no Caso 1, 2 ou 3 considerando $a=2, b=2$.\n\n```python\ndef merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\n```',
    diagrama_mermaid:
      'graph TD\n    A[Problema Principal T(n)] --> B[Subproblema T(n/2)]\n    A --> C[Subproblema T(n/2)]\n    B --> D[Folha O(1)]\n    B --> E[Folha O(1)]\n    C --> F[Folha O(1)]\n    C --> G[Folha O(1)]',
    grau_dificuldade: 'MEDIO',
    tipo_questao: 'DISSERTATIVA',
    linhas_resposta: 8,
    criado_em: '2026-03-29 10:00:00',
    alternativas: [],
  },
  {
    id: 2,
    disciplina_id: 1,
    disciplina_nome: 'Algoritmos e Estruturas de Dados',
    titulo: 'Estruturas de Dados Lineares: Pilha e Fila',
    enunciado_markdown:
      'Qual das seguintes operações possui complexidade temporal no pior caso de $O(1)$ tanto em uma **Pilha** quanto em uma **Fila** implementadas com listas duplamente encadeadas?',
    diagrama_mermaid: null,
    grau_dificuldade: 'FACIL',
    tipo_questao: 'OBJETIVA',
    linhas_resposta: 0,
    criado_em: '2026-03-29 10:15:00',
    alternativas: [
      { id: 1, questao_id: 2, texto: 'Inserção de um novo elemento no topo/final.', correta: true },
      { id: 2, questao_id: 2, texto: 'Busca linear por valor arbitrário $k$.', correta: false },
      { id: 3, questao_id: 2, texto: 'Ordenação in-place via QuickSort.', correta: false },
      { id: 4, questao_id: 2, texto: 'Inversão recursiva de todos os nós.', correta: false },
    ],
  },
  {
    id: 3,
    disciplina_id: 2,
    disciplina_nome: 'Cálculo Diferencial e Integral I',
    titulo: 'Integral Definida e Teorema Fundamental',
    enunciado_markdown:
      'Calcule o valor exato da integral definida abaixo utilizando o Teorema Fundamental do Cálculo:\n\n$$\\int_{0}^{\\pi/2} \\sin(2x) \\cdot e^{\\cos^2(x)} \\, dx$$\n\n*Apresente o desenvolvimento passo a passo e justifique a mudança de variáveis aplicada.*',
    diagrama_mermaid: null,
    grau_dificuldade: 'DIFICIL',
    tipo_questao: 'DISSERTATIVA',
    linhas_resposta: 10,
    criado_em: '2026-03-29 10:30:00',
    alternativas: [],
  },
];

let mockAvaliacoes: AvaliacaoDetalhe[] = [];

export const api = {
  // Instituições
  async getInstituicoes(): Promise<Instituicao[]> {
    if (isTauriEnvironment()) {
      return await invoke<Instituicao[]>('get_instituicoes');
    }
    return [...mockInstituicoes];
  },

  async saveInstituicao(input: InstituicaoInput): Promise<Instituicao> {
    if (isTauriEnvironment()) {
      return await invoke<Instituicao>('save_instituicao', { instituicao: input });
    }
    if (input.id) {
      mockInstituicoes = mockInstituicoes.map((i) =>
        i.id === input.id
          ? {
              ...i,
              nome: input.nome,
              sigla: input.sigla ?? null,
              logo_base64: input.logo_base64 ?? null,
            }
          : i
      );
      return mockInstituicoes.find((i) => i.id === input.id)!;
    }
    const novo: Instituicao = {
      id: Date.now(),
      nome: input.nome,
      sigla: input.sigla ?? null,
      logo_base64: input.logo_base64 ?? null,
    };
    mockInstituicoes.push(novo);
    return novo;
  },

  async deleteInstituicao(id: number): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_instituicao', { id });
      return;
    }
    mockInstituicoes = mockInstituicoes.filter((i) => i.id !== id);
  },

  // Disciplinas
  async getDisciplinas(instituicaoId?: number): Promise<Disciplina[]> {
    if (isTauriEnvironment()) {
      return await invoke<Disciplina[]>('get_disciplinas', {
        instituicaoId: instituicaoId ?? null,
      });
    }
    if (instituicaoId) {
      return mockDisciplinas.filter((d) => d.instituicao_id === instituicaoId);
    }
    return [...mockDisciplinas];
  },

  async saveDisciplina(input: DisciplinaInput): Promise<Disciplina> {
    if (isTauriEnvironment()) {
      return await invoke<Disciplina>('save_disciplina', { disciplina: input });
    }
    const inst = mockInstituicoes.find((i) => i.id === input.instituicao_id);
    if (input.id) {
      mockDisciplinas = mockDisciplinas.map((d) =>
        d.id === input.id
          ? {
              ...d,
              instituicao_id: input.instituicao_id,
              nome: input.nome,
              codigo: input.codigo ?? null,
              instituicao_nome: inst?.nome ?? null,
            }
          : d
      );
      return mockDisciplinas.find((d) => d.id === input.id)!;
    }
    const novo: Disciplina = {
      id: Date.now(),
      instituicao_id: input.instituicao_id,
      nome: input.nome,
      codigo: input.codigo ?? null,
      instituicao_nome: inst?.nome ?? null,
    };
    mockDisciplinas.push(novo);
    return novo;
  },

  async deleteDisciplina(id: number): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_disciplina', { id });
      return;
    }
    mockDisciplinas = mockDisciplinas.filter((d) => d.id !== id);
  },

  // Questões
  async getQuestoes(disciplinaId?: number): Promise<QuestaoCompleta[]> {
    if (isTauriEnvironment()) {
      return await invoke<QuestaoCompleta[]>('get_questoes', {
        disciplinaId: disciplinaId ?? null,
      });
    }
    if (disciplinaId) {
      return mockQuestoes.filter((q) => q.disciplina_id === disciplinaId);
    }
    return [...mockQuestoes];
  },

  async getQuestao(id: number): Promise<QuestaoCompleta> {
    if (isTauriEnvironment()) {
      return await invoke<QuestaoCompleta>('get_questao', { id });
    }
    const found = mockQuestoes.find((q) => q.id === id);
    if (!found) throw new Error('Questão não encontrada');
    return found;
  },

  async saveQuestao(input: QuestaoInput): Promise<QuestaoCompleta> {
    if (isTauriEnvironment()) {
      return await invoke<QuestaoCompleta>('save_questao', { questao: input });
    }
    const disc = mockDisciplinas.find((d) => d.id === input.disciplina_id);
    const id = input.id || Date.now();
    const nova: QuestaoCompleta = {
      id,
      disciplina_id: input.disciplina_id,
      disciplina_nome: disc?.nome ?? '',
      titulo: input.titulo,
      enunciado_markdown: input.enunciado_markdown,
      diagrama_mermaid: input.diagrama_mermaid ?? null,
      grau_dificuldade: input.grau_dificuldade,
      tipo_questao: input.tipo_questao,
      linhas_resposta: input.linhas_resposta,
      criado_em: new Date().toISOString(),
      alternativas: input.alternativas.map((a, idx) => ({
        id: a.id || idx + 1,
        questao_id: id,
        texto: a.texto,
        correta: a.correta,
      })),
    };

    const idx = mockQuestoes.findIndex((q) => q.id === id);
    if (idx >= 0) {
      mockQuestoes[idx] = nova;
    } else {
      mockQuestoes.unshift(nova);
    }
    return nova;
  },

  async deleteQuestao(id: number): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_questao', { id });
      return;
    }
    mockQuestoes = mockQuestoes.filter((q) => q.id !== id);
  },

  // Avaliações
  async getAvaliacoes(): Promise<AvaliacaoResumo[]> {
    if (isTauriEnvironment()) {
      return await invoke<AvaliacaoResumo[]>('get_avaliacoes');
    }
    return mockAvaliacoes.map((a) => ({
      id: a.id,
      disciplina_id: a.disciplina_id,
      disciplina_nome: a.disciplina_nome,
      instituicao_nome: a.instituicao_nome,
      titulo: a.titulo,
      instrucoes: a.instrucoes,
      data_aplicacao: a.data_aplicacao,
      peso_total: a.peso_total,
      total_questoes: a.itens.length,
      criado_em: a.criado_em,
    }));
  },

  async getAvaliacaoDetalhe(id: number): Promise<AvaliacaoDetalhe> {
    if (isTauriEnvironment()) {
      return await invoke<AvaliacaoDetalhe>('get_avaliacao_detalhe', { id });
    }
    const found = mockAvaliacoes.find((a) => a.id === id);
    if (!found) throw new Error('Avaliação não encontrada');
    return found;
  },

  async saveAvaliacao(payload: AvaliacaoInput): Promise<AvaliacaoDetalhe> {
    if (isTauriEnvironment()) {
      return await invoke<AvaliacaoDetalhe>('save_avaliacao', { payload });
    }
    const disc = mockDisciplinas.find((d) => d.id === payload.disciplina_id);
    const inst = mockInstituicoes.find((i) => i.id === disc?.instituicao_id);
    const avaliacaoId = payload.id || Date.now();

    const itensDetalhe = payload.itens.map((item) => {
      const q = mockQuestoes.find((mq) => mq.id === item.questao_id)!;
      return {
        avaliacao_id: avaliacaoId,
        questao_id: item.questao_id,
        ordem: item.ordem,
        valor_pontuacao: item.valor_pontuacao,
        questao: q,
      };
    });

    const detalhe: AvaliacaoDetalhe = {
      id: avaliacaoId,
      disciplina_id: payload.disciplina_id,
      disciplina_nome: disc?.nome || 'Disciplina Geral',
      disciplina_codigo: disc?.codigo || null,
      instituicao_id: inst?.id || 1,
      instituicao_nome: inst?.nome || 'Instituição Acadêmica',
      instituicao_sigla: inst?.sigla || null,
      instituicao_logo_base64: inst?.logo_base64 || null,
      titulo: payload.titulo,
      instrucoes: payload.instrucoes || null,
      data_aplicacao: payload.data_aplicacao || null,
      peso_total: payload.peso_total,
      criado_em: new Date().toISOString(),
      itens: itensDetalhe,
    };

    const idx = mockAvaliacoes.findIndex((a) => a.id === avaliacaoId);
    if (idx >= 0) {
      mockAvaliacoes[idx] = detalhe;
    } else {
      mockAvaliacoes.unshift(detalhe);
    }
    return detalhe;
  },

  async deleteAvaliacao(id: number): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_avaliacao', { id });
      return;
    }
    mockAvaliacoes = mockAvaliacoes.filter((a) => a.id !== id);
  },

  async getDbPath(): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke<string>('get_db_path');
    }
    return '%APPDATA%\\AvaliadorApp\\data.db (Modo Preview)';
  },
};
