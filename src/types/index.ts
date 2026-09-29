// Espelhamento estrito das estruturas e entidades do SQLite / Rust

export type GrauDificuldade = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type TipoQuestao = 'DISSERTATIVA' | 'OBJETIVA' | 'CODIGO';

export interface Instituicao {
  id: number;
  nome: string;
  sigla: string | null;
  logo_base64: string | null;
}

export interface InstituicaoInput {
  id?: number | null;
  nome: string;
  sigla?: string | null;
  logo_base64?: string | null;
}

export interface Disciplina {
  id: number;
  instituicao_id: number;
  nome: string;
  codigo: string | null;
  instituicao_nome?: string | null;
}

export interface DisciplinaInput {
  id?: number | null;
  instituicao_id: number;
  nome: string;
  codigo?: string | null;
}

export interface Alternativa {
  id: number;
  questao_id: number;
  texto: string;
  correta: boolean;
}

export interface AlternativaInput {
  id?: number | null;
  texto: string;
  correta: boolean;
}

export interface QuestaoCompleta {
  id: number;
  disciplina_id: number;
  disciplina_nome?: string | null;
  titulo: string;
  enunciado_markdown: string;
  diagrama_mermaid: string | null;
  grau_dificuldade: GrauDificuldade;
  tipo_questao: TipoQuestao;
  linhas_resposta: number;
  criado_em?: string | null;
  alternativas: Alternativa[];
}

export interface QuestaoInput {
  id?: number | null;
  disciplina_id: number;
  titulo: string;
  enunciado_markdown: string;
  diagrama_mermaid?: string | null;
  grau_dificuldade: GrauDificuldade;
  tipo_questao: TipoQuestao;
  linhas_resposta: number;
  alternativas: AlternativaInput[];
}

export interface AvaliacaoItemInput {
  questao_id: number;
  ordem: number;
  valor_pontuacao: number;
}

export interface AvaliacaoItemDetalhe {
  avaliacao_id: number;
  questao_id: number;
  ordem: number;
  valor_pontuacao: number;
  questao: QuestaoCompleta;
}

export interface AvaliacaoInput {
  id?: number | null;
  disciplina_id: number;
  titulo: string;
  instrucoes?: string | null;
  data_aplicacao?: string | null;
  peso_total: number;
  itens: AvaliacaoItemInput[];
}

export interface AvaliacaoResumo {
  id: number;
  disciplina_id: number;
  disciplina_nome: string;
  instituicao_nome: string;
  titulo: string;
  instrucoes?: string | null;
  data_aplicacao?: string | null;
  peso_total: number;
  total_questoes: number;
  criado_em?: string | null;
}

export interface AvaliacaoDetalhe {
  id: number;
  disciplina_id: number;
  disciplina_nome: string;
  disciplina_codigo?: string | null;
  instituicao_id: number;
  instituicao_nome: string;
  instituicao_sigla?: string | null;
  instituicao_logo_base64?: string | null;
  titulo: string;
  instrucoes?: string | null;
  data_aplicacao?: string | null;
  peso_total: number;
  criado_em?: string | null;
  itens: AvaliacaoItemDetalhe[];
}

export interface LiveExamState {
  instituicao: Instituicao | null;
  disciplina: Disciplina | null;
  titulo: string;
  instrucoes: string;
  data_aplicacao: string;
  peso_total: number;
  itens: Array<{
    ordem: number;
    valor_pontuacao: number;
    questao: QuestaoCompleta;
  }>;
}
