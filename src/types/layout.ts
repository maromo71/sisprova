export type MargemPreset = 'compacta' | 'padrao' | 'ampla' | 'personalizada';
export type DensidadeEspacamento = 'compacta' | 'padrao' | 'ampla';
export type TamanhoFonte = 'pequena' | 'padrao' | 'grande';
export type CabecalhoEstilo = 'padrao' | 'compacto' | 'concurso' | 'minimo';

export interface LayoutPrintConfig {
  margemPreset: MargemPreset;
  margemVerticalMm: number;    // Ex: 10, 16, 22
  margemHorizontalMm: number;  // Ex: 12, 18, 24
  escalaPercentual: number;    // 80 a 110 (100 = 100%)
  densidade: DensidadeEspacamento; // 'compacta' | 'padrao' | 'ampla'
  tamanhoFonte: TamanhoFonte; // 'pequena' (12px) | 'padrao' (13.5px) | 'grande' (15px)
  cabecalhoEstilo: CabecalhoEstilo; // 'padrao' | 'compacto' | 'concurso' | 'minimo'
}

export const MARGEM_PRESETS: Record<Exclude<MargemPreset, 'personalizada'>, { vertical: number; horizontal: number; label: string; desc: string }> = {
  compacta: {
    vertical: 10,
    horizontal: 12,
    label: 'Compacta',
    desc: '10mm vertical / 12mm horizontal. Economia máxima de folhas e espaço.',
  },
  padrao: {
    vertical: 16,
    horizontal: 18,
    label: 'Padrão',
    desc: '16mm vertical / 18mm horizontal. Diagramação equilibrada e acadêmica.',
  },
  ampla: {
    vertical: 22,
    horizontal: 24,
    label: 'Ampla',
    desc: '22mm vertical / 24mm horizontal. Margens largas com espaço para anotações.',
  },
};

export const CABECALHO_TEMPLATES: Record<
  CabecalhoEstilo,
  { label: string; subtitulo: string; desc: string }
> = {
  padrao: {
    label: 'Universitário / Padrão',
    subtitulo: 'Acadêmico Completo',
    desc: 'Brasão institucional, disciplina, grid de identificação com 5 campos e orientações.',
  },
  compacto: {
    label: 'Compacto / Econômico',
    subtitulo: 'Economia de 60% de Altura',
    desc: 'Faixa horizontal em linha única para identificação. Libera espaço para até 2 questões a mais.',
  },
  concurso: {
    label: 'Vestibular / Concurso',
    subtitulo: 'Simulado Formal com Regras',
    desc: 'Quadro solene de instruções ao candidato, identificação de caderno e conferência de fiscal.',
  },
  minimo: {
    label: 'Mínimo / Simples',
    subtitulo: 'Moderno sem Bordas',
    desc: 'Linha divisória discreta sem caixas pesadas. Ideal para testes rápidos ou avaliações curtas.',
  },
};

export const DEFAULT_LAYOUT_CONFIG: LayoutPrintConfig = {
  margemPreset: 'padrao',
  margemVerticalMm: 16,
  margemHorizontalMm: 18,
  escalaPercentual: 100,
  densidade: 'padrao',
  tamanhoFonte: 'padrao',
  cabecalhoEstilo: 'padrao',
};

export const STORAGE_KEY_LAYOUT_CONFIG = 'sisprova_print_layout_config';
