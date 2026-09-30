import React from 'react';
import {
  X,
  History,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';
import { formatarDataBR } from '../utils/date';
import type { QuestaoCompleta, QuestaoEstatisticasUso } from '../types';

interface QuestionUsageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  questao: QuestaoCompleta | null;
  estatisticas?: QuestaoEstatisticasUso | null;
}

export const QuestionUsageHistoryModal: React.FC<QuestionUsageHistoryModalProps> = ({
  isOpen,
  onClose,
  questao,
  estatisticas,
}) => {
  if (!isOpen || !questao) return null;

  const totalUsos = estatisticas?.total_usos || 0;
  const historico = estatisticas?.historico || [];
  const usadaRecentemente = estatisticas?.usada_recentemente || false;
  const diasAtras = estatisticas?.dias_desde_ultima_aplicacao;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-monokai-card rounded-xl shadow-2xl border border-slate-200 dark:border-monokai-border overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-monokai-divider flex items-center justify-between bg-slate-50 dark:bg-monokai-panel">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-monokai-yellow flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-monokai-fg flex items-center gap-2">
                <span>Histórico de Aplicação da Questão</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-monokai-comment">
                Auditoria de reutilização e frequência em provas
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

        {/* Corpo com Informações e Histórico */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Dados da Questão */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-monokai-panel/70 border border-slate-200 dark:border-monokai-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-500 dark:text-monokai-comment">
                #{questao.id} &bull; {questao.disciplina_nome || 'Disciplina'}
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-monokai-border text-slate-700 dark:text-monokai-sub">
                {questao.tipo_questao}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  questao.grau_dificuldade === 'FACIL'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : questao.grau_dificuldade === 'MEDIO'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                }`}
              >
                {questao.grau_dificuldade}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-monokai-fg text-sm leading-snug">
              {questao.titulo}
            </h3>
          </div>

          {/* Cards de Resumo Estatístico */}
          <div className="grid grid-cols-3 gap-3">
            {/* Total de Aplicações */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-monokai-comment mb-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span>Total de Usos</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-monokai-fg">
                {totalUsos}
                <span className="text-xs font-normal text-slate-500 ml-1">
                  {totalUsos === 1 ? 'avaliação' : 'avaliações'}
                </span>
              </div>
            </div>

            {/* Última Aplicação */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-monokai-comment mb-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Última Vez</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-monokai-fg truncate">
                {estatisticas?.ultima_aplicacao ? (
                  formatarDataBR(estatisticas.ultima_aplicacao)
                ) : (
                  <span className="text-slate-400 dark:text-monokai-comment font-normal italic">
                    Nunca aplicada
                  </span>
                )}
              </div>
              {diasAtras !== undefined && diasAtras !== null && (
                <div className="text-[10px] text-slate-500 dark:text-monokai-comment mt-0.5">
                  {diasAtras <= 0 ? 'Hoje' : `Há ${diasAtras} dias`}
                </div>
              )}
            </div>

            {/* Situação Pedagógica */}
            <div
              className={`p-3 rounded-lg border ${
                totalUsos === 0
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30'
                  : usadaRecentemente
                  ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                {totalUsos === 0 ? (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : usadaRecentemente ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-monokai-yellow" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                )}
                <span
                  className={
                    totalUsos === 0
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : usadaRecentemente
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-blue-800 dark:text-blue-300'
                  }
                >
                  Status
                </span>
              </div>
              <div
                className={`text-xs font-bold ${
                  totalUsos === 0
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : usadaRecentemente
                    ? 'text-amber-900 dark:text-monokai-yellow'
                    : 'text-blue-900 dark:text-blue-200'
                }`}
              >
                {totalUsos === 0
                  ? 'Inédita'
                  : usadaRecentemente
                  ? 'Recente (< 6m)'
                  : 'Reuso Seguro'}
              </div>
            </div>
          </div>

          {/* Alerta de Cautela se Usada Recentemente */}
          {usadaRecentemente && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-monokai-yellow shrink-0 mt-0.5" />
              <div>
                <strong>Alerta Pedagógico de Recência:</strong> Esta questão foi aplicada há menos de 6 meses ({diasAtras !== null && diasAtras !== undefined ? `${diasAtras} dias` : 'recentemente'}). Verifique se sua turma atual possui estudantes em dependência ou com acesso a provas anteriores para evitar repetição involuntária de enunciados.
              </div>
            </div>
          )}

          {/* Linha do Tempo / Histórico de Provas */}
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-monokai-fg text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-monokai-comment" />
              <span>Avaliações em que Foi Incluída</span>
            </h4>

            {historico.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-monokai-border rounded-lg p-6 text-center text-slate-400 dark:text-monokai-comment">
                <Sparkles className="w-7 h-7 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="font-medium text-xs text-slate-600 dark:text-monokai-sub">
                  Esta questão é inédita!
                </p>
                <p className="text-[11px] mt-0.5 text-slate-400 dark:text-monokai-comment">
                  Ainda não foi aplicada em nenhuma prova cadastrada no sistema.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {historico.map((item, idx) => (
                  <div
                    key={`${item.avaliacao_id}-${idx}`}
                    className="p-3 rounded-lg border border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:border-slate-300 dark:hover:border-monokai-cardHover transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-monokai-card border border-slate-200 dark:border-monokai-border flex items-center justify-center font-bold text-slate-700 dark:text-monokai-sub shrink-0 text-[11px]">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-monokai-fg truncate">
                          {item.avaliacao_titulo}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-monokai-comment flex items-center gap-2">
                          <span>{item.disciplina_nome}</span>
                          <span>&bull;</span>
                          <span>Data: {formatarDataBR(item.data_aplicacao)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold bg-slate-100 dark:bg-monokai-card px-2 py-0.5 rounded text-slate-700 dark:text-monokai-sub border border-slate-200 dark:border-monokai-border">
                        {item.valor_pontuacao.toFixed(1)} pts
                      </span>
                      {item.dias_atras !== null && item.dias_atras !== undefined && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            item.dias_atras <= 180
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-monokai-card text-slate-500 dark:text-monokai-comment'
                          }`}
                        >
                          {item.dias_atras <= 0 ? 'Hoje' : `Há ${item.dias_atras} d`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Fechamento */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-monokai-divider bg-slate-50 dark:bg-monokai-panel flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-monokai-border dark:hover:bg-monokai-cardHover text-white text-xs font-semibold rounded-md shadow-xs transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
