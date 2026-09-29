import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  X,
  CheckCircle,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  PenTool,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { MermaidRenderer } from './MermaidRenderer';
import type {
  QuestaoCompleta,
  Disciplina,
  GrauDificuldade,
  TipoQuestao,
  AlternativaInput,
} from '../types';

interface EditExamQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    ordem: number;
    valor_pontuacao: number;
    questao: QuestaoCompleta;
  } | null;
  itemIndex: number | null;
  disciplinas: Disciplina[];
  onSave: (
    itemIndex: number,
    updatedData: {
      id?: number | null;
      disciplina_id: number;
      titulo: string;
      enunciado_markdown: string;
      diagrama_mermaid: string | null;
      grau_dificuldade: GrauDificuldade;
      tipo_questao: TipoQuestao;
      linhas_resposta: number;
      alternativas: AlternativaInput[];
    },
    valor_pontuacao: number,
    isNewCopy: boolean
  ) => Promise<void>;
}

export const EditExamQuestionModal: React.FC<EditExamQuestionModalProps> = ({
  isOpen,
  onClose,
  item,
  itemIndex,
  disciplinas,
  onSave,
}) => {
  const [disciplinaId, setDisciplinaId] = useState<number>(1);
  const [titulo, setTitulo] = useState<string>('');
  const [enunciado, setEnunciado] = useState<string>('');
  const [mermaid, setMermaid] = useState<string>('');
  const [grauDificuldade, setGrauDificuldade] = useState<GrauDificuldade>('MEDIO');
  const [tipoQuestao, setTipoQuestao] = useState<TipoQuestao>('DISSERTATIVA');
  const [linhasResposta, setLinhasResposta] = useState<number>(6);
  const [pontuacao, setPontuacao] = useState<number>(2.5);
  const [alternativas, setAlternativas] = useState<AlternativaInput[]>([]);
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      const validDisc = disciplinas.some((d) => d.id === item.questao.disciplina_id)
        ? item.questao.disciplina_id
        : (disciplinas[0]?.id ?? 1);
      setDisciplinaId(validDisc);
      setTitulo(item.questao.titulo);
      setEnunciado(item.questao.enunciado_markdown);
      setMermaid(item.questao.diagrama_mermaid || '');
      setGrauDificuldade(item.questao.grau_dificuldade);
      setTipoQuestao(item.questao.tipo_questao);
      setLinhasResposta(item.questao.linhas_resposta ?? 0);
      setPontuacao(item.valor_pontuacao);
      setAlternativas(
        item.questao.alternativas && item.questao.alternativas.length > 0
          ? item.questao.alternativas.map((a) => ({
              id: a.id,
              texto: a.texto,
              correta: a.correta,
            }))
          : [
              { texto: 'Alternativa 1', correta: true },
              { texto: 'Alternativa 2', correta: false },
              { texto: 'Alternativa 3', correta: false },
              { texto: 'Alternativa 4', correta: false },
            ]
      );
      setPreviewTab('editor');
    }
  }, [item, disciplinas]);

  if (!isOpen || !item || itemIndex === null) return null;

  const handleSubmit = async (isNewCopy: boolean) => {
    if (!titulo.trim() || !enunciado.trim()) {
      alert('Preencha o título e o enunciado da questão.');
      return;
    }

    const targetDiscId = disciplinas.some((d) => d.id === disciplinaId)
      ? disciplinaId
      : (disciplinas[0]?.id ?? 1);

    setIsSubmitting(true);
    try {
      await onSave(
        itemIndex,
        {
          id: isNewCopy ? null : item.questao.id,
          disciplina_id: targetDiscId,
          titulo,
          enunciado_markdown: enunciado,
          diagrama_mermaid: mermaid.trim() ? mermaid : null,
          grau_dificuldade: grauDificuldade,
          tipo_questao: tipoQuestao,
          linhas_resposta: tipoQuestao === 'OBJETIVA' ? 0 : Math.max(0, linhasResposta),
          alternativas: tipoQuestao === 'OBJETIVA' ? alternativas : [],
        },
        pontuacao,
        isNewCopy
      );
      onClose();
    } catch (err) {
      alert(`Erro ao salvar questão: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAlternativa = () => {
    setAlternativas((prev) => [
      ...prev,
      { texto: `Nova Alternativa ${String.fromCharCode(65 + prev.length)}`, correta: false },
    ]);
  };

  const handleRemoveAlternativa = (index: number) => {
    if (alternativas.length <= 2) {
      alert('A questão objetiva precisa de no mínimo 2 alternativas.');
      return;
    }
    setAlternativas((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-monokai-bg border border-slate-200 dark:border-monokai-border rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-monokai-fg transition-colors duration-200">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-200 dark:border-monokai-border flex items-center justify-between bg-slate-50 dark:bg-monokai-panel">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-monokai-card border border-indigo-200 dark:border-monokai-border text-indigo-600 dark:text-monokai-cyan">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-monokai-fg">
                  Editar Questão #{item.ordem} na Avaliação
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-monokai-card text-indigo-700 dark:text-monokai-cyan font-mono border border-indigo-200 dark:border-monokai-border">
                  ID SQLite: {item.questao.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-monokai-comment">
                Edite os parâmetros da questão para esta prova com suporte a LaTeX, KaTeX e Mermaid.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-monokai-card text-slate-400 hover:text-slate-700 dark:hover:text-monokai-fg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-monokai-bg">
          {/* Título da Questão */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub mb-1">
              Título Resumido da Questão
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Derivadas Parciais e Teorema de Clairaut"
              className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-medium"
              required
            />
          </div>

          {/* Grid de Configurações: Disciplina, Tipo, Dificuldade e Pontuação */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub mb-1">
                Disciplina
              </label>
              <select
                value={disciplinaId}
                onChange={(e) => setDisciplinaId(Number(e.target.value))}
                className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none"
              >
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome} {d.codigo ? `[${d.codigo}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub mb-1">
                Tipo de Questão
              </label>
              <select
                value={tipoQuestao}
                onChange={(e) => setTipoQuestao(e.target.value as TipoQuestao)}
                className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none"
              >
                <option value="DISSERTATIVA">Dissertativa</option>
                <option value="OBJETIVA">Objetiva (Múltipla Escolha)</option>
                <option value="CODIGO">Código / Programação</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub mb-1">
                Grau de Dificuldade
              </label>
              <select
                value={grauDificuldade}
                onChange={(e) => setGrauDificuldade(e.target.value as GrauDificuldade)}
                className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none"
              >
                <option value="FACIL">Fácil</option>
                <option value="MEDIO">Médio</option>
                <option value="DIFICIL">Difícil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub mb-1">
                Pontuação nesta Prova
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={pontuacao}
                onChange={(e) => setPontuacao(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-monokai-orange focus:outline-none"
              />
            </div>
          </div>

          {/* Linhas de Resposta Pautadas (Permite 0 e sem limite máximo) */}
          {tipoQuestao !== 'OBJETIVA' && (
            <div className="p-3 bg-slate-50 dark:bg-monokai-card/50 border border-slate-200 dark:border-monokai-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-monokai-fg flex items-center gap-1.5">
                    Linhas de Resposta Pautadas
                    {linhasResposta === 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-600">
                        Modo Folha de Resposta / Sem pauta
                      </span>
                    )}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-monokai-comment mt-0.5">
                    Defina <strong>0</strong> caso o exame utilize folha de respostas avulsa. Não há limite máximo de linhas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={linhasResposta}
                    onChange={(e) => setLinhasResposta(Math.max(0, Number(e.target.value)))}
                    className="w-24 bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-monokai-fg font-bold text-center focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  />
                  <span className="text-xs font-medium text-slate-500 dark:text-monokai-comment">linhas</span>
                </div>
              </div>

              {/* Botões Rápidos de Quantidade de Linhas */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 dark:text-monokai-comment">Atalhos:</span>
                {[0, 4, 8, 12, 16, 24, 32].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setLinhasResposta(num)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                      linhasResposta === num
                        ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-monokai-cyan dark:text-monokai-bg dark:border-monokai-cyan font-bold shadow-sm'
                        : 'bg-white dark:bg-monokai-panel text-slate-700 dark:text-monokai-fg border-slate-200 dark:border-monokai-border hover:bg-slate-100 dark:hover:bg-monokai-card'
                    }`}
                  >
                    {num === 0 ? '0 (Folha Avulsa)' : `${num} lin`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enunciado da Questão com Tabs de Editor / Prévia KaTeX */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-monokai-sub">
                Enunciado da Questão (Markdown + LaTeX KaTeX)
              </label>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-monokai-panel p-0.5 rounded-lg border border-slate-200 dark:border-monokai-border">
                <button
                  type="button"
                  onClick={() => setPreviewTab('editor')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                    previewTab === 'editor'
                      ? 'bg-white dark:bg-monokai-card text-indigo-600 dark:text-monokai-cyan font-bold shadow-sm'
                      : 'text-slate-500 dark:text-monokai-comment hover:text-slate-800 dark:hover:text-monokai-fg'
                  }`}
                >
                  <PenTool className="w-3 h-3" /> Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                    previewTab === 'preview'
                      ? 'bg-white dark:bg-monokai-card text-indigo-600 dark:text-monokai-cyan font-bold shadow-sm'
                      : 'text-slate-500 dark:text-monokai-comment hover:text-slate-800 dark:hover:text-monokai-fg'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Prévia Formatada
                </button>
              </div>
            </div>

            {/* Snippets Rápidos de Inserção */}
            {previewTab === 'editor' && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-monokai-comment">
                <span>Inserir atalhos:</span>
                <button
                  type="button"
                  onClick={() => setEnunciado((prev) => prev + '\n\n$$\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)$$')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-monokai-panel dark:hover:bg-monokai-card text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border text-[10px]"
                >
                  + Integral LaTeX
                </button>
                <button
                  type="button"
                  onClick={() => setEnunciado((prev) => prev + '\n\n$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-monokai-panel dark:hover:bg-monokai-card text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border text-[10px]"
                >
                  + Limite LaTeX
                </button>
                <button
                  type="button"
                  onClick={() => setEnunciado((prev) => prev + '\n\n```python\ndef solucao(entrada):\n    # TODO\n    return entrada * 2\n```')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-monokai-panel dark:hover:bg-monokai-card text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border text-[10px]"
                >
                  + Bloco de Código
                </button>
                <button
                  type="button"
                  onClick={() => setEnunciado((prev) => prev + '\n\n| Item | Valor | Observação |\n| :--- | :---: | :--- |\n| A | 10 | Inicial |\n| B | 20 | Final |')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-monokai-panel dark:hover:bg-monokai-card text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border text-[10px]"
                >
                  + Tabela
                </button>
              </div>
            )}

            {previewTab === 'editor' ? (
              <textarea
                rows={6}
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Escreva em Markdown com $f(x)$ ou $$\int f(x) dx$$..."
                className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg p-3 text-xs text-slate-800 dark:text-monokai-fg font-mono leading-relaxed focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                required
              />
            ) : (
              <div className="p-4 rounded-lg border border-slate-300 dark:border-monokai-border bg-slate-50 dark:bg-monokai-panel/60 text-xs min-h-[140px] markdown-body text-slate-800 dark:text-monokai-fg overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {enunciado || '*Nenhum enunciado digitado ainda.*'}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Diagrama Mermaid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-monokai-sub">
                Diagrama Vetorial Mermaid (Opcional)
              </label>
              <button
                type="button"
                onClick={() => setMermaid('graph TD\n    A[Início] --> B{Decisão}\n    B -- Sim --> C[Resultado 1]\n    B -- Não --> D[Resultado 2]')}
                className="text-[10px] text-indigo-600 dark:text-monokai-cyan hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Inserir Exemplo
              </button>
            </div>
            <textarea
              rows={3}
              value={mermaid}
              onChange={(e) => setMermaid(e.target.value)}
              placeholder="graph TD&#10;    A[Entrada] --> B[Processo]"
              className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg p-2.5 text-xs text-slate-800 dark:text-monokai-fg font-mono focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
            />
            {mermaid.trim() !== '' && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 dark:border-monokai-border shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Prévia do Diagrama:</div>
                <MermaidRenderer code={mermaid} />
              </div>
            )}
          </div>

          {/* Alternativas (se questão for OBJETIVA) */}
          {tipoQuestao === 'OBJETIVA' && (
            <div className="space-y-2 border-t border-slate-200 dark:border-monokai-border pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-monokai-sub">
                  Alternativas (Marque a opção correta no gabarito)
                </label>
                <button
                  type="button"
                  onClick={handleAddAlternativa}
                  className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-cyan border border-indigo-200 dark:border-monokai-border text-[11px] font-medium flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> + Alternativa
                </button>
              </div>

              {alternativas.map((alt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit_modal_correta"
                    checked={alt.correta}
                    onChange={() =>
                      setAlternativas((prev) =>
                        prev.map((a, i) => ({ ...a, correta: i === idx }))
                      )
                    }
                    className="text-indigo-600 focus:ring-0 cursor-pointer"
                    title="Definir como alternativa correta"
                  />
                  <span className="w-5 font-bold text-slate-500 dark:text-monokai-comment text-xs text-center">
                    {String.fromCharCode(65 + idx)})
                  </span>
                  <input
                    type="text"
                    value={alt.texto}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlternativas((prev) =>
                        prev.map((a, i) => (i === idx ? { ...a, texto: val } : a))
                      );
                    }}
                    className="flex-1 bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                    placeholder={`Texto da alternativa ${String.fromCharCode(65 + idx)}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAlternativa(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    title="Excluir alternativa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com Ações de Salvamento */}
        <div className="p-4 border-t border-slate-200 dark:border-monokai-border bg-slate-50 dark:bg-monokai-panel flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg rounded-lg text-xs font-medium border border-slate-300 dark:border-monokai-border transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 dark:bg-monokai-panel dark:hover:bg-monokai-card text-indigo-700 dark:text-monokai-cyan rounded-lg text-xs font-semibold border border-indigo-200 dark:border-monokai-border flex items-center gap-1.5 transition shadow-sm"
              title="Cria uma nova questão independente no SQLite para preservar a questão original do banco"
            >
              <Copy className="w-3.5 h-3.5" />
              Salvar como Nova Cópia
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
              title="Atualiza esta questão no SQLite e aplica imediatamente na avaliação"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
