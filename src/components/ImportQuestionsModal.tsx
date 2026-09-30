import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  FileCode,
  AlertTriangle,
  X,
  Plus,
  Loader2,
  CheckSquare,
  Square,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import {
  parsePackageFromJson,
  parseQuestionsFromMarkdown,
  type ParsedQuestionCandidate,
  type JsonImportPackage,
} from '../utils/questionBatch';
import type { Disciplina } from '../types';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  defaultDisciplinaId: number;
  onImportSuccess: (count: number) => void;
}

export const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  disciplinas,
  defaultDisciplinaId,
  onImportSuccess,
}) => {
  const [selectedDiscId, setSelectedDiscId] = useState<number>(() => {
    if (disciplinas.length > 0) {
      const match = disciplinas.find((d) => d.id === defaultDisciplinaId);
      return match ? match.id : disciplinas[0].id;
    }
    return defaultDisciplinaId;
  });
  const [rawText, setRawText] = useState<string>('');
  const [importMode, setImportMode] = useState<'json' | 'markdown'>('json');
  const [candidates, setCandidates] = useState<ParsedQuestionCandidate[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedPackage, setDetectedPackage] = useState<JsonImportPackage | null>(null);
  const [createAvaliacaoTogether, setCreateAvaliacaoTogether] = useState<boolean>(true);

  // Sincroniza selectedDiscId garantindo que corresponda a uma disciplina existente
  useEffect(() => {
    if (isOpen && disciplinas.length > 0) {
      if (!disciplinas.some((d) => d.id === selectedDiscId)) {
        const found = disciplinas.some((d) => d.id === defaultDisciplinaId)
          ? defaultDisciplinaId
          : disciplinas[0].id;
        setSelectedDiscId(found);
        setCandidates((prev) => prev.map((c) => ({ ...c, disciplina_id: found })));
      }
    }
  }, [isOpen, disciplinas, defaultDisciplinaId, selectedDiscId]);

  if (!isOpen) return null;

  const handleProcessText = (text: string, mode: 'json' | 'markdown') => {
    setErrorMessage(null);
    setDetectedPackage(null);
    if (!text.trim()) {
      setCandidates([]);
      setSelectedIndices(new Set());
      return;
    }

    try {
      let parsed: ParsedQuestionCandidate[] = [];
      let activeDiscId = selectedDiscId;

      // Validação preventiva de disciplina
      if (disciplinas.length > 0 && !disciplinas.some((d) => d.id === activeDiscId)) {
        activeDiscId = disciplinas[0].id;
        setSelectedDiscId(activeDiscId);
      }

      if (mode === 'json') {
        const pkg = parsePackageFromJson(text, activeDiscId);
        setDetectedPackage(pkg);
        parsed = pkg.candidates;

        // Auto-detecção inteligente de disciplina pelo nome ou código
        if (pkg.disciplina) {
          const matched = disciplinas.find((d) => {
            const codMatch =
              pkg.disciplina?.codigo &&
              d.codigo &&
              d.codigo.trim().toLowerCase() === pkg.disciplina.codigo.trim().toLowerCase();
            const nomeMatch =
              pkg.disciplina?.nome &&
              d.nome.trim().toLowerCase() === pkg.disciplina.nome.trim().toLowerCase();
            return codMatch || nomeMatch;
          });

          if (matched) {
            activeDiscId = matched.id;
            setSelectedDiscId(matched.id);
            parsed = parsed.map((c) => ({ ...c, disciplina_id: matched.id }));
          }
        }
      } else {
        parsed = parseQuestionsFromMarkdown(text, activeDiscId);
      }

      setCandidates(parsed);
      // Por padrão seleciona todas as que são válidas
      const validIndices = new Set<number>();
      parsed.forEach((c, idx) => {
        if (c.valida) validIndices.add(idx);
      });
      setSelectedIndices(validIndices);

      if (parsed.length === 0) {
        setErrorMessage('Nenhuma questão reconhecida no formato selecionado.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar o conteúdo.');
      setCandidates([]);
      setSelectedIndices(new Set());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith('.json');
    const mode = isJson ? 'json' : 'markdown';
    setImportMode(mode);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleProcessText(content, mode);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePickFileNative = async () => {
    try {
      const isJson = importMode === 'json';
      const ext = isJson ? ['json'] : ['md', 'markdown', 'txt'];
      const filter = isJson ? 'Arquivo JSON (*.json)' : 'Arquivo Markdown (*.md, *.txt)';
      const path = await api.pickTextFileDialog(filter, ext);
      if (path) {
        const content = await api.readTextFile(path);
        setRawText(content);
        handleProcessText(content, importMode);
      }
    } catch (err) {
      console.warn('Fallback para input de arquivo HTML:', err);
    }
  };

  const toggleSelectIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === candidates.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(candidates.map((_, i) => i)));
    }
  };

  const handleConfirmImport = async () => {
    // Garante resolução de disciplina id existente
    const actualDiscId = disciplinas.some((d) => d.id === selectedDiscId)
      ? selectedDiscId
      : (disciplinas[0]?.id ?? 1);

    const toImport = candidates
      .filter((_, idx) => selectedIndices.has(idx))
      .map((c) => ({
        ...c,
        disciplina_id: actualDiscId,
      }));

    if (toImport.length === 0) {
      alert('Selecione ao menos uma questão para importar.');
      return;
    }

    try {
      setIsProcessing(true);
      const inserted = await api.saveQuestoesLote(toImport);

      // Se o JSON continha uma avaliação completa e a opção de gerar avaliação estiver marcada
      if (detectedPackage?.avaliacao && createAvaliacaoTogether) {
        try {
          const todasQuestoes = await api.getQuestoes();
          const questoesDaDisc = todasQuestoes.filter((q) => q.disciplina_id === actualDiscId);
          // Pega as últimas 'inserted' questões
          const questoesParaAvaliacao = questoesDaDisc.slice(0, inserted);

          const pesoTotal = detectedPackage.avaliacao.peso_total || 10.0;
          const valorPorQuestao =
            questoesParaAvaliacao.length > 0
              ? Number((pesoTotal / questoesParaAvaliacao.length).toFixed(2))
              : 1.0;

          await api.saveAvaliacao({
            disciplina_id: actualDiscId,
            titulo: detectedPackage.avaliacao.titulo || 'Avaliação Importada',
            instrucoes: detectedPackage.avaliacao.instrucoes || null,
            data_aplicacao: detectedPackage.avaliacao.data_aplicacao || null,
            peso_total: pesoTotal,
            itens: questoesParaAvaliacao.map((q, idx) => ({
              questao_id: q.id,
              ordem: idx + 1,
              valor_pontuacao: valorPorQuestao,
            })),
          });
        } catch (avErr) {
          console.warn('Aviso ao criar avaliação complementar:', avErr);
        }
      }

      onImportSuccess(inserted);
      onClose();
    } catch (err) {
      alert(`Erro ao gravar lote de questões: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-monokai-panel border border-slate-200 dark:border-monokai-border rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-monokai-fg">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-monokai-divider flex items-center justify-between bg-slate-50 dark:bg-monokai-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-monokai-purple/20 text-indigo-600 dark:text-monokai-purple rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-monokai-fg">
                Importação de Questões em Lote (MELH-05)
              </h2>
              <p className="text-xs text-slate-500 dark:text-monokai-comment">
                Carregue arquivos estruturados em JSON ou Markdown com detecção automática de pautas e gabaritos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-monokai-fg hover:bg-slate-200 dark:hover:bg-monokai-cardHover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-monokai-divider bg-white dark:bg-monokai-panel grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
              Disciplina de Destino
            </label>
            <select
              value={selectedDiscId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedDiscId(id);
                // Atualiza também os candidatos
                setCandidates((prev) => prev.map((c) => ({ ...c, disciplina_id: id })));
              }}
              className="w-full bg-slate-50 dark:bg-monokai-card border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
            >
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} {d.codigo ? `[${d.codigo}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub mb-1.5">
              Formato do Arquivo
            </label>
            <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-monokai-border">
              <button
                type="button"
                onClick={() => {
                  setImportMode('json');
                  if (rawText) handleProcessText(rawText, 'json');
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  importMode === 'json'
                    ? 'bg-indigo-600 dark:bg-monokai-green text-white'
                    : 'bg-slate-50 dark:bg-monokai-card text-slate-600 dark:text-monokai-sub hover:bg-slate-100 dark:hover:bg-monokai-cardHover'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                JSON (.json)
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportMode('markdown');
                  if (rawText) handleProcessText(rawText, 'markdown');
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  importMode === 'markdown'
                    ? 'bg-indigo-600 dark:bg-monokai-green text-white'
                    : 'bg-slate-50 dark:bg-monokai-card text-slate-600 dark:text-monokai-sub hover:bg-slate-100 dark:hover:bg-monokai-cardHover'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Markdown (.md)
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex-1 cursor-pointer py-1.5 px-3 bg-slate-100 dark:bg-monokai-card hover:bg-slate-200 dark:hover:bg-monokai-cardHover border border-slate-300 dark:border-monokai-border rounded-lg text-xs font-medium text-slate-700 dark:text-monokai-fg flex items-center justify-center gap-2 shadow-sm transition">
              <Upload className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
              <span>Selecionar Arquivo</span>
              <input
                type="file"
                accept={importMode === 'json' ? '.json' : '.md,.markdown,.txt'}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handlePickFileNative}
              className="py-1.5 px-3 bg-indigo-50 dark:bg-monokai-purple/20 text-indigo-700 dark:text-monokai-purple border border-indigo-200 dark:border-monokai-purple/30 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-monokai-purple/30 transition shadow-sm"
              title="Abrir via Diálogo Nativo"
            >
              Explorador
            </button>
          </div>
        </div>

        {/* Banner de Metadados do Pacote Detectado */}
        {detectedPackage && (detectedPackage.disciplina || detectedPackage.avaliacao) && (
          <div className="mx-4 mt-3 p-3 bg-indigo-50 dark:bg-monokai-card/90 border border-indigo-200 dark:border-monokai-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-monokai-cyan shrink-0" />
              <div>
                <span className="font-bold text-indigo-950 dark:text-monokai-fg">
                  Estrutura SisProva Identificada:
                </span>{' '}
                {detectedPackage.disciplina && (
                  <span className="text-slate-700 dark:text-monokai-sub">
                    Disciplina: <strong>{detectedPackage.disciplina.nome}</strong>
                    {detectedPackage.disciplina.codigo ? ` [${detectedPackage.disciplina.codigo}]` : ''}
                  </span>
                )}
                {detectedPackage.instituicao && (
                  <span className="text-slate-500 dark:text-monokai-comment text-[11px] ml-1">
                    ({detectedPackage.instituicao.nome})
                  </span>
                )}
              </div>
            </div>

            {detectedPackage.avaliacao && (
              <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-monokai-panel px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-monokai-border shadow-xs hover:border-indigo-400 transition select-none">
                <input
                  type="checkbox"
                  checked={createAvaliacaoTogether}
                  onChange={(e) => setCreateAvaliacaoTogether(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-slate-800 dark:text-monokai-fg font-medium">
                  Criar também a avaliação "<strong>{detectedPackage.avaliacao.titulo}</strong>"
                </span>
              </label>
            )}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Split: Input / Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-monokai-divider">
          {/* Left: Raw text / paste */}
          <div className="flex flex-col h-full p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-monokai-sub">
                Conteúdo / Código Fonte ({importMode.toUpperCase()})
              </span>
              <button
                onClick={() => {
                  setRawText('');
                  setCandidates([]);
                  setSelectedIndices(new Set());
                }}
                className="text-[11px] text-slate-400 hover:text-rose-500 transition"
              >
                Limpar
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                handleProcessText(e.target.value, importMode);
              }}
              placeholder={
                importMode === 'json'
                  ? 'Cole o JSON aqui ou selecione um arquivo...\nExemplo:\n[\n  {\n    "titulo": "Derivada da Função",\n    "enunciado_markdown": "Calcule $f\'(x)$...",\n    "grau_dificuldade": "MEDIO",\n    "tipo_questao": "DISSERTATIVA",\n    "linhas_resposta": 6,\n    "resposta_esperada": "Pela regra da cadeia..."\n  }\n]'
                  : 'Cole o Markdown aqui ou selecione um arquivo...\nExemplo:\n## Questão 1: Algoritmos de Busca\n- **Dificuldade:** FACIL\n- **Tipo:** OBJETIVA\n\nQual a complexidade da busca binária?\n\n- [x] O(log n)\n- [ ] O(n)\n- [ ] O(n^2)\n\n> Resposta: A busca binária reduz o espaço pela metade a cada passo.'
              }
              className="flex-1 w-full p-3 font-mono text-xs bg-slate-50 dark:bg-monokai-bg border border-slate-300 dark:border-monokai-border rounded-lg text-slate-800 dark:text-monokai-fg resize-none focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan leading-relaxed"
            />
          </div>

          {/* Right: Detected Questions Candidates */}
          <div className="flex flex-col h-full p-4 overflow-hidden bg-slate-50/50 dark:bg-monokai-bg/40">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200 dark:border-monokai-divider">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-monokai-fg">
                  Pré-visualização das Questões Identificadas
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-monokai-card text-indigo-700 dark:text-monokai-cyan">
                  {candidates.length} {candidates.length === 1 ? 'questão' : 'questões'}
                </span>
              </div>

              {candidates.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-indigo-600 dark:text-monokai-cyan hover:underline flex items-center gap-1 font-medium"
                >
                  {selectedIndices.size === candidates.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      Desmarcar Todas
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      Selecionar Todas
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {candidates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-monokai-comment">
                  <Upload className="w-8 h-8 mb-2 stroke-1 opacity-50" />
                  <p className="text-xs font-medium">Nenhuma questão carregada para visualização.</p>
                  <p className="text-[11px] opacity-75 mt-0.5">
                    Cole o código JSON/Markdown ao lado ou carregue um arquivo.
                  </p>
                </div>
              ) : (
                candidates.map((q, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectIndex(idx)}
                      className={`p-3 rounded-lg border transition cursor-pointer select-none text-xs ${
                        isChecked
                          ? 'bg-white dark:bg-monokai-card border-indigo-400 dark:border-monokai-green/60 shadow-sm'
                          : 'bg-white/60 dark:bg-monokai-card/40 border-slate-200 dark:border-monokai-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // controlado pelo clique no container
                          className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 dark:text-monokai-fg truncate">
                              #{idx + 1} {q.titulo}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                q.grau_dificuldade === 'FACIL'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : q.grau_dificuldade === 'DIFICIL'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {q.grau_dificuldade}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider bg-slate-100 dark:bg-black/40 text-slate-600 dark:text-monokai-sub">
                              {q.tipo_questao}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-monokai-sub line-clamp-2 leading-relaxed">
                            {q.enunciado_markdown}
                          </p>

                          {q.tipo_questao === 'OBJETIVA' && q.alternativas.length > 0 && (
                            <div className="mt-2 space-y-1 pl-1">
                              {q.alternativas.map((alt, aIdx) => (
                                <div
                                  key={aIdx}
                                  className={`text-[10px] flex items-center gap-1.5 ${
                                    alt.correta
                                      ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                      : 'text-slate-500 dark:text-monokai-comment'
                                  }`}
                                >
                                  <span>{String.fromCharCode(65 + aIdx)})</span>
                                  <span className="truncate">{alt.texto}</span>
                                  {alt.correta && (
                                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                      Gabarito
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {q.resposta_esperada && (
                            <div className="mt-1.5 p-1.5 rounded bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-monokai-border text-[10px] text-slate-600 dark:text-monokai-comment line-clamp-2">
                              <span className="font-semibold text-slate-700 dark:text-monokai-sub">
                                Espelho:
                              </span>{' '}
                              {q.resposta_esperada}
                            </div>
                          )}

                          {q.erros.length > 0 && (
                            <div className="mt-2 space-y-0.5">
                              {q.erros.map((err, errIdx) => (
                                <div
                                  key={errIdx}
                                  className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-monokai-divider bg-slate-50 dark:bg-monokai-card flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-monokai-comment flex items-center gap-2">
            <span>
              Selecionadas para gravação:{' '}
              <strong className="text-slate-900 dark:text-monokai-fg font-bold">
                {selectedIndices.size}
              </strong>{' '}
              de {candidates.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-monokai-border bg-white dark:bg-monokai-panel hover:bg-slate-100 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedIndices.size === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gravando no SQLite...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Importar {selectedIndices.size} Questões
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
