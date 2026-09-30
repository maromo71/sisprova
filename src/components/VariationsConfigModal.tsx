import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Check,
  X,
  Hash,
  Eye,
} from 'lucide-react';
import type { VariacoesConfig } from '../utils/shuffle';
import { calcularMatrizGabarito } from '../utils/shuffle';
import type { LiveExamState } from '../types';

interface VariationsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VariacoesConfig;
  onSaveConfig: (novaConfig: VariacoesConfig) => void;
  exam: LiveExamState;
}

export const VariationsConfigModal: React.FC<VariationsConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  exam,
}) => {
  const [ativo, setAtivo] = useState<boolean>(config.ativo);
  const [quantidade, setQuantidade] = useState<2 | 3 | 4>(config.quantidade);
  const [embaralharQuestoes, setEmbaralharQuestoes] = useState<boolean>(
    config.embaralharQuestoes
  );
  const [embaralharAlternativas, setEmbaralharAlternativas] = useState<boolean>(
    config.embaralharAlternativas
  );
  const [seed, setSeed] = useState<number>(config.seed);

  if (!isOpen) return null;

  const configTemp: VariacoesConfig = {
    ativo,
    quantidade,
    embaralharQuestoes,
    embaralharAlternativas,
    seed,
  };

  const { tiposHabilitados, itens } = calcularMatrizGabarito(exam, configTemp);

  const handleSortearSeed = () => {
    const novaSeed = Math.floor(Math.random() * 90000) + 10000;
    setSeed(novaSeed);
  };

  const handleSalvar = () => {
    onSaveConfig({
      ativo,
      quantidade,
      embaralharQuestoes,
      embaralharAlternativas,
      seed,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-monokai-bg border border-slate-200 dark:border-monokai-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-200 dark:border-monokai-border bg-slate-50 dark:bg-monokai-panel flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 dark:bg-monokai-cyan flex items-center justify-center text-white dark:text-monokai-bg shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-monokai-fg flex items-center gap-2">
                Geração de Variações de Prova
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-monokai-cyan/20 dark:text-monokai-cyan px-2 py-0.5 rounded-full">
                  MELH-02
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-monokai-comment">
                Embaralhamento seguro de questões e alternativas para dificultar fraudes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-monokai-fg hover:bg-slate-200 dark:hover:bg-monokai-card transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Configurações e Preview */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-monokai-fg flex-1">
          {/* Toggle Principal de Ativação */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-monokai-cyan/40 bg-indigo-50/60 dark:bg-monokai-card flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-indigo-950 dark:text-monokai-fg flex items-center gap-2">
                <span>Ativar Provas Múltiplas (Tipos A, B, C, D)</span>
              </div>
              <p className="text-[11px] text-indigo-800/80 dark:text-monokai-comment">
                Habilita a geração paralela de diferentes versões de cadernos e folhas OMR.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-monokai-panel peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-monokai-border peer-checked:bg-indigo-600 dark:peer-checked:bg-monokai-cyan"></div>
            </label>
          </div>

          {/* Configurações Avançadas se Ativo */}
          <div className={`space-y-4 ${ativo ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Quantidade de Versões */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-monokai-fg mb-1.5">
                Quantidade de Versões de Prova:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { qtd: 2 as const, label: '2 Versões (A e B)', desc: 'Ideal para carteiras lado a lado' },
                  { qtd: 3 as const, label: '3 Versões (A, B e C)', desc: 'Excelente para salas médias' },
                  { qtd: 4 as const, label: '4 Versões (A, B, C e D)', desc: 'Máxima segurança pedagógica' },
                ].map((item) => (
                  <button
                    key={item.qtd}
                    type="button"
                    onClick={() => setQuantidade(item.qtd)}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      quantidade === item.qtd
                        ? 'border-indigo-600 bg-indigo-50/50 dark:border-monokai-cyan dark:bg-monokai-card shadow-sm'
                        : 'border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-50 dark:hover:bg-monokai-cardHover'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-monokai-fg flex items-center justify-between">
                      {item.label}
                      {quantidade === item.qtd && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-monokai-cyan" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-monokai-comment mt-1">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Níveis de Embaralhamento */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-monokai-fg mb-1.5">
                Níveis de Embaralhamento Configuráveis:
              </label>
              <div className="space-y-2">
                {/* Nível 1: Ordem das Questões */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-50 dark:hover:bg-monokai-card cursor-pointer">
                  <input
                    type="checkbox"
                    checked={embaralharQuestoes}
                    onChange={(e) => setEmbaralharQuestoes(e.target.checked)}
                    className="mt-0.5 text-indigo-600 focus:ring-0 rounded"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-monokai-fg flex items-center gap-1.5">
                      1. Embaralhar a ordem das questões
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-monokai-comment mt-0.5 leading-relaxed">
                      Altera a numeração sequencial das questões em cada versão (ex: a Questão 1 na Prova A vira a Questão 4 na Prova B). A Prova A permanece como matriz original.
                    </p>
                  </div>
                </label>

                {/* Nível 2: Ordem das Alternativas Internas */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-50 dark:hover:bg-monokai-card cursor-pointer">
                  <input
                    type="checkbox"
                    checked={embaralharAlternativas}
                    onChange={(e) => setEmbaralharAlternativas(e.target.checked)}
                    className="mt-0.5 text-indigo-600 focus:ring-0 rounded"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-monokai-fg flex items-center gap-1.5">
                      2. Embaralhar alternativas internas das questões objetivas
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-monokai-comment mt-0.5 leading-relaxed">
                      Permuta as letras A, B, C, D, E mantendo a resposta correta rastreada na Folha Consolidada de Gabaritos.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Semente Determinística (Seed) */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-monokai-border bg-slate-50 dark:bg-monokai-panel flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 dark:text-monokai-fg flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-monokai-cyan" />
                  Semente Determinística (Seed)
                </div>
                <p className="text-[10px] text-slate-500 dark:text-monokai-comment mt-0.5">
                  Garante que o sorteio seja 100% reproduzível a qualquer momento.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  className="w-24 bg-white dark:bg-monokai-bg border border-slate-300 dark:border-monokai-border rounded px-2 py-1 font-mono text-center text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleSortearSeed}
                  className="px-2.5 py-1 bg-white dark:bg-monokai-card border border-slate-300 dark:border-monokai-border hover:bg-slate-100 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg rounded text-xs font-medium flex items-center gap-1 transition"
                  title="Gera uma nova permutação aleatória de questões e alternativas"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Sortear Nova
                </button>
              </div>
            </div>

            {/* Prévia da Matriz de Respostas em Tempo Real */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 dark:text-monokai-fg flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-monokai-cyan" />
                  Prévia da Matriz de Gabaritos ({tiposHabilitados.map((t) => `Tipo ${t}`).join(', ')})
                </span>
                <span className="text-[10px] text-slate-500 dark:text-monokai-comment">
                  {itens.length} questões na prova
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-monokai-border rounded-lg bg-white dark:bg-monokai-panel">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-100 dark:bg-monokai-card border-b border-slate-200 dark:border-monokai-border sticky top-0">
                    <tr>
                      <th className="p-1.5 font-bold text-center w-10">Ref</th>
                      <th className="p-1.5 font-bold">Título</th>
                      {tiposHabilitados.map((t) => (
                        <th
                          key={t}
                          className="p-1.5 font-black text-center w-16 bg-slate-200/50 dark:bg-monokai-panel"
                        >
                          Prova {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-monokai-border/40">
                    {itens.map((item) => (
                      <tr key={item.questaoId} className="hover:bg-slate-50 dark:hover:bg-monokai-card">
                        <td className="p-1.5 text-center font-bold text-slate-500 font-mono">
                          {String(item.ordemOriginal).padStart(2, '0')}
                        </td>
                        <td className="p-1.5 truncate max-w-[180px]">
                          {item.questaoTitulo}
                        </td>
                        {tiposHabilitados.map((t) => {
                          const resp = item.respostas[t];
                          return (
                            <td key={t} className="p-1.5 text-center font-mono">
                              {resp.letraGabarito ? (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-black text-white dark:bg-monokai-fg dark:text-monokai-bg font-black text-[10px]">
                                  {resp.letraGabarito}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Pautada</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-slate-200 dark:border-monokai-border bg-slate-50 dark:bg-monokai-panel flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-monokai-border rounded-lg text-xs font-semibold text-slate-700 dark:text-monokai-fg hover:bg-slate-100 dark:hover:bg-monokai-card transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSalvar}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-cyan dark:hover:bg-monokai-cyan/90 text-white dark:text-monokai-bg rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Check className="w-4 h-4" />
            Aplicar Configurações de Variações
          </button>
        </div>
      </div>
    </div>
  );
};
