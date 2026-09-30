import React from 'react';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  Type,
  Layout,
  AlignJustify
} from 'lucide-react';
import {
  type LayoutPrintConfig,
  type MargemPreset,
  type DensidadeEspacamento,
  type TamanhoFonte,
  type CabecalhoEstilo,
  MARGEM_PRESETS,
  DEFAULT_LAYOUT_CONFIG
} from '../types/layout';

interface LayoutSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LayoutPrintConfig;
  onChange: (newConfig: LayoutPrintConfig) => void;
}

export const LayoutSettingsModal: React.FC<LayoutSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  if (!isOpen) return null;

  const handlePresetSelect = (preset: MargemPreset) => {
    if (preset === 'personalizada') {
      onChange({
        ...config,
        margemPreset: 'personalizada',
      });
    } else {
      const presetValues = MARGEM_PRESETS[preset];
      onChange({
        ...config,
        margemPreset: preset,
        margemVerticalMm: presetValues.vertical,
        margemHorizontalMm: presetValues.horizontal,
      });
    }
  };

  const handleVerticalMarginChange = (val: number) => {
    onChange({
      ...config,
      margemPreset: 'personalizada',
      margemVerticalMm: val,
    });
  };

  const handleHorizontalMarginChange = (val: number) => {
    onChange({
      ...config,
      margemPreset: 'personalizada',
      margemHorizontalMm: val,
    });
  };

  const handleScaleChange = (val: number) => {
    onChange({
      ...config,
      escalaPercentual: val,
    });
  };

  const handleDensityChange = (densidade: DensidadeEspacamento) => {
    onChange({
      ...config,
      densidade,
    });
  };

  const handleFontSizeChange = (tamanhoFonte: TamanhoFonte) => {
    onChange({
      ...config,
      tamanhoFonte,
    });
  };

  const handleHeaderStyleChange = (cabecalhoEstilo: CabecalhoEstilo) => {
    onChange({
      ...config,
      cabecalhoEstilo,
    });
  };

  const handleResetDefaults = () => {
    onChange({ ...DEFAULT_LAYOUT_CONFIG });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-monokai-card rounded-xl shadow-2xl border border-slate-200 dark:border-monokai-border overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-monokai-divider flex items-center justify-between bg-slate-50 dark:bg-monokai-panel">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-monokai-cyan flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-monokai-fg flex items-center gap-2">
                <span>Diagramação & Escala da Prova</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-monokai-cyan font-bold">
                  A4 Print & PDF
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-monokai-comment">
                Controle margens, escala de redução, densidade e cabeçalho para otimizar páginas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-monokai-comment dark:hover:text-monokai-fg rounded-lg hover:bg-slate-200/60 dark:hover:bg-monokai-panel transition"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Configurações */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* 1. Margens da Folha A4 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-900 dark:text-monokai-fg flex items-center gap-2 text-xs uppercase tracking-wider">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span>Margens da Folha A4</span>
              </label>
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-monokai-sub">
                Vertical: {config.margemVerticalMm}mm &bull; Horizontal: {config.margemHorizontalMm}mm
              </span>
            </div>

            {/* Presets Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {(['compacta', 'padrao', 'ampla'] as const).map((preset) => {
                const isSelected = config.margemPreset === preset;
                const pInfo = MARGEM_PRESETS[preset];

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-indigo-600 dark:border-monokai-cyan bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-50 dark:hover:bg-monokai-cardHover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-monokai-fg">
                        {pInfo.label}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-monokai-cyan" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-monokai-comment leading-tight mb-2">
                      {preset === 'compacta' && '10mm / 12mm'}
                      {preset === 'padrao' && '16mm / 18mm'}
                      {preset === 'ampla' && '22mm / 24mm'}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-monokai-comment/80">
                      {preset === 'compacta' && 'Economia máxima'}
                      {preset === 'padrao' && 'Acadêmico padrão'}
                      {preset === 'ampla' && 'Para anotações'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ajuste Fino / Personalizado */}
            <div className="mt-3 p-3 bg-slate-50 dark:bg-monokai-panel/60 border border-slate-200 dark:border-monokai-border rounded-lg space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-700 dark:text-monokai-sub">
                Ajuste Fino Personalizado (mm):
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-monokai-comment">Margem Vertical:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-monokai-fg">
                      {config.margemVerticalMm} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="30"
                    step="1"
                    value={config.margemVerticalMm}
                    onChange={(e) => handleVerticalMarginChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-monokai-border rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-monokai-comment">Margem Horizontal:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-monokai-fg">
                      {config.margemHorizontalMm} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="30"
                    step="1"
                    value={config.margemHorizontalMm}
                    onChange={(e) => handleHorizontalMarginChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-monokai-border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Escala de Impressão e Redução de Conteúdo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-900 dark:text-monokai-fg flex items-center gap-2 text-xs uppercase tracking-wider">
                <Minimize2 className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span>Escala do Conteúdo da Prova</span>
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-monokai-cyan bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/40">
                {config.escalaPercentual}%
              </span>
            </div>

            {/* Slider de Escala */}
            <div className="space-y-2">
              <input
                type="range"
                min="80"
                max="110"
                step="5"
                value={config.escalaPercentual}
                onChange={(e) => handleScaleChange(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-monokai-border rounded-lg"
              />
              {/* Presets Rápidos */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {[80, 85, 90, 95, 100, 105].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => handleScaleChange(scale)}
                    className={`flex-1 py-1 rounded text-xs font-mono font-medium transition ${
                      config.escalaPercentual === scale
                        ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 dark:bg-monokai-panel text-slate-600 dark:text-monokai-comment hover:bg-slate-200 dark:hover:bg-monokai-cardHover'
                    }`}
                  >
                    {scale}%
                  </button>
                ))}
              </div>
            </div>

            {/* Dica Pedagógica */}
            <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-monokai-yellow shrink-0 mt-0.5" />
              <div>
                <strong>Dica contra páginas órfãs:</strong> Ajustar a escala para <strong>90%</strong> ou <strong>95%</strong> é a maneira mais rápida de evitar que as últimas linhas de uma questão transbordem para uma folha adicional vazia!
              </div>
            </div>
          </div>

          {/* 3. Densidade de Espaçamento e 4. Tamanho da Fonte */}
          <div className="grid grid-cols-2 gap-4">
            {/* Densidade */}
            <div>
              <label className="font-semibold text-slate-900 dark:text-monokai-fg flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                <AlignJustify className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span>Espaçamento Vertical</span>
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'compacta', label: 'Compacto', desc: 'Gaps menores (-30%)' },
                  { id: 'padrao', label: 'Padrão', desc: 'Espaçamento regular' },
                  { id: 'ampla', label: 'Amplo', desc: 'Mais espaço/rascunho' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDensityChange(d.id as DensidadeEspacamento)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                      config.densidade === d.id
                        ? 'border-indigo-600 dark:border-monokai-cyan bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-monokai-cyan'
                        : 'border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-50 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{d.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-monokai-comment">{d.desc}</div>
                    </div>
                    {config.densidade === d.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-monokai-cyan" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamanho da Fonte */}
            <div>
              <label className="font-semibold text-slate-900 dark:text-monokai-fg flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                <Type className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span>Tamanho da Fonte</span>
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'pequena', label: 'Pequena (12px)', desc: 'Provas longas' },
                  { id: 'padrao', label: 'Padrão (13.5px)', desc: 'Ideal ABNT' },
                  { id: 'grande', label: 'Grande (15px)', desc: 'Acessibilidade' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFontSizeChange(f.id as TamanhoFonte)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                      config.tamanhoFonte === f.id
                        ? 'border-indigo-600 dark:border-monokai-cyan bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-monokai-cyan'
                        : 'border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-50 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{f.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-monokai-comment">{f.desc}</div>
                    </div>
                    {config.tamanhoFonte === f.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-monokai-cyan" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Modelo do Cabeçalho Institucional (MELH-08) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-900 dark:text-monokai-fg flex items-center gap-2 text-xs uppercase tracking-wider">
                <Layout className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span>Templates de Cabeçalho Institucional (MELH-08)</span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-monokai-comment">
                4 modelos pré-formatados
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'padrao',
                  label: 'Universitário / Padrão',
                  sub: 'Acadêmico Completo',
                  desc: 'Brasão institucional, dados da disciplina, campos de matrícula/turma/nota e orientações.',
                },
                {
                  id: 'compacto',
                  label: 'Compacto / Econômico',
                  sub: 'Economia de 60% de Altura',
                  desc: 'Faixa horizontal em linha única para identificação. Libera espaço para até 2 questões a mais.',
                },
                {
                  id: 'concurso',
                  label: 'Vestibular / Concurso',
                  sub: 'Simulado Formal com Regras',
                  desc: 'Quadro solene de instruções ao candidato, identificação de caderno e conferência de fiscal.',
                },
                {
                  id: 'minimo',
                  label: 'Mínimo / Simples',
                  sub: 'Moderno sem Bordas',
                  desc: 'Linha divisória discreta sem caixas pesadas. Ideal para testes rápidos ou avaliações curtas.',
                },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleHeaderStyleChange(h.id as CabecalhoEstilo)}
                  className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                    config.cabecalhoEstilo === h.id
                      ? 'border-indigo-600 dark:border-monokai-cyan bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-50 dark:hover:bg-monokai-cardHover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-monokai-fg block">
                        {h.label}
                      </span>
                      <span className="text-[10px] text-indigo-600 dark:text-monokai-cyan font-medium">
                        {h.sub}
                      </span>
                    </div>
                    {config.cabecalhoEstilo === h.id && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-monokai-cyan shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-monokai-comment leading-tight mt-1">
                    {h.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-monokai-divider bg-slate-50 dark:bg-monokai-panel flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 dark:text-monokai-sub dark:hover:text-monokai-fg hover:bg-slate-200/50 dark:hover:bg-monokai-cardHover rounded-md transition flex items-center gap-1.5"
            title="Restaurar margens e escalas recomendadas de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões (16mm / 100%)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-sm transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Concluído</span>
          </button>
        </div>
      </div>
    </div>
  );
};
