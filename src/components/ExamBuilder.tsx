import React, { useState, useEffect, useDeferredValue, useRef } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Database,
  Save,
  FileText,
  CheckCircle,
  Eye,
  EyeOff,
  Sliders,
  FolderOpen,
} from 'lucide-react';
import { A4Preview } from './A4Preview';
import { api } from '../services/api';
import type {
  Instituicao,
  Disciplina,
  QuestaoCompleta,
  LiveExamState,
  GrauDificuldade,
  TipoQuestao,
  AvaliacaoResumo,
} from '../types';

interface ExamBuilderProps {
  onOpenQuestionBank: () => void;
  onOpenSettings: () => void;
}

export const ExamBuilder: React.FC<ExamBuilderProps> = ({
  onOpenQuestionBank,
  onOpenSettings,
}) => {
  // Dados de apoio do SQLite
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [todasQuestoes, setTodasQuestoes] = useState<QuestaoCompleta[]>([]);
  const [avaliacoesSalvas, setAvaliacoesSalvas] = useState<AvaliacaoResumo[]>([]);

  // Estado atual da avaliação em edição
  const [examId, setExamId] = useState<number | null>(null);
  const [selectedInstId, setSelectedInstId] = useState<number>(1);
  const [selectedDiscId, setSelectedDiscId] = useState<number>(1);
  const [titulo, setTitulo] = useState<string>('AVALIAÇÃO BIMESTRAL I');
  const [instrucoes, setInstrucoes] = useState<string>(
    '1. É proibido o uso de calculadoras ou dispositivos eletrônicos.\n2. Respostas a lápis não dão direito à revisão de nota.\n3. Justifique todas as respostas dissertativas.'
  );
  const [dataAplicacao, setDataAplicacao] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [pesoTotal, setPesoTotal] = useState<number>(10.0);
  const [examItems, setExamItems] = useState<
    Array<{ ordem: number; valor_pontuacao: number; questao: QuestaoCompleta }>
  >([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'meta' | 'questoes' | 'nova_inline'>('questoes');
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(90);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);

  // Formulário Inline de Nova Questão Rápida
  const [inlineTitulo, setInlineTitulo] = useState<string>('Questão de Análise de Algoritmos');
  const [inlineTipo, setInlineTipo] = useState<TipoQuestao>('DISSERTATIVA');
  const [inlineDificuldade, setInlineDificuldade] = useState<GrauDificuldade>('MEDIO');
  const [inlineEnunciado, setInlineEnunciado] = useState<string>(
    'Explique o princípio do método **Divisão e Conquista** e dê a complexidade de tempo de sua resolução pelo Teorema Mestre:\n\n$$T(n) = 2T(n/2) + O(n)$$'
  );
  const [inlineMermaid, setInlineMermaid] = useState<string>(
    'graph TD\n    Raiz[Problema] --> E[Sub 1]\n    Raiz --> D[Sub 2]'
  );
  const [inlineLinhas, setInlineLinhas] = useState<number>(6);
  const [inlinePontos, setInlinePontos] = useState<number>(2.5);
  const [inlineAlternativas, setInlineAlternativas] = useState<
    Array<{ texto: string; correta: boolean }>
  >([
    { texto: 'Complexidade de tempo é linear O(n)', correta: false },
    { texto: 'Complexidade de tempo é linearítmica O(n log n)', correta: true },
    { texto: 'Complexidade de tempo é quadrática O(n^2)', correta: false },
    { texto: 'Complexidade de tempo é constante O(1)', correta: false },
  ]);

  const printableRef = useRef<HTMLDivElement>(null);

  // Carrega dados iniciais do SQLite
  const loadInitialData = async () => {
    try {
      const [insts, discs, quests, avs] = await Promise.all([
        api.getInstituicoes(),
        api.getDisciplinas(),
        api.getQuestoes(),
        api.getAvaliacoes(),
      ]);

      setInstituicoes(insts);
      setDisciplinas(discs);
      setTodasQuestoes(quests);
      setAvaliacoesSalvas(avs);

      if (insts.length > 0 && !selectedInstId) {
        setSelectedInstId(insts[0].id);
      }
      if (discs.length > 0 && !selectedDiscId) {
        setSelectedDiscId(discs[0].id);
      }

      // Adiciona a primeira questão padrão se o exame estiver vazio
      if (quests.length > 0 && examItems.length === 0) {
        setExamItems([
          {
            ordem: 1,
            valor_pontuacao: 5.0,
            questao: quests[0],
          },
        ]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados SQLite:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Instituição e Disciplina selecionadas
  const instituicaoAtual = instituicoes.find((i) => i.id === selectedInstId) || null;
  const disciplinaAtual = disciplinas.find((d) => d.id === selectedDiscId) || null;

  // Estado consolidado para o Live Preview (usando useDeferredValue para garantir 60 FPS contínuos)
  const rawExamState: LiveExamState = {
    instituicao: instituicaoAtual,
    disciplina: disciplinaAtual,
    titulo,
    instrucoes,
    data_aplicacao: dataAplicacao,
    peso_total: pesoTotal,
    itens: examItems,
  };

  const deferredExamState = useDeferredValue(rawExamState);

  // Executa o fluxo de impressão padronizado via CSS @media print
  const handlePrint = () => {
    window.print();
  };

  // Salvar avaliação no SQLite
  const handleSaveExam = async () => {
    if (!selectedDiscId) {
      alert('Selecione uma disciplina para a avaliação.');
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        id: examId,
        disciplina_id: selectedDiscId,
        titulo,
        instrucoes,
        data_aplicacao: dataAplicacao,
        peso_total: pesoTotal,
        itens: examItems.map((item, idx) => ({
          questao_id: item.questao.id,
          ordem: idx + 1,
          valor_pontuacao: item.valor_pontuacao,
        })),
      };

      const salva = await api.saveAvaliacao(payload);
      setExamId(salva.id);
      setSaveSuccess(true);

      const avs = await api.getAvaliacoes();
      setAvaliacoesSalvas(avs);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Erro ao salvar avaliação: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar avaliação salva do banco
  const handleLoadSavedExam = async (id: number) => {
    try {
      const detalhe = await api.getAvaliacaoDetalhe(id);
      setExamId(detalhe.id);
      setSelectedInstId(detalhe.instituicao_id);
      setSelectedDiscId(detalhe.disciplina_id);
      setTitulo(detalhe.titulo);
      setInstrucoes(detalhe.instrucoes || '');
      setDataAplicacao(detalhe.data_aplicacao || new Date().toISOString().split('T')[0]);
      setPesoTotal(detalhe.peso_total);

      setExamItems(
        detalhe.itens.map((it) => ({
          ordem: it.ordem,
          valor_pontuacao: it.valor_pontuacao,
          questao: it.questao,
        }))
      );

      setIsLoadModalOpen(false);
    } catch (err) {
      alert(`Falha ao abrir avaliação: ${err}`);
    }
  };

  // Adicionar questão do banco de questões à prova
  const handleAddQuestionToExam = (q: QuestaoCompleta) => {
    if (examItems.some((it) => it.questao.id === q.id)) {
      alert('Esta questão já foi incluída na avaliação.');
      return;
    }
    const novaOrdem = examItems.length + 1;
    const novosPontos = Math.max(
      1.0,
      Number((pesoTotal / Math.max(1, examItems.length + 1)).toFixed(1))
    );

    setExamItems((prev) => [
      ...prev,
      {
        ordem: novaOrdem,
        valor_pontuacao: novosPontos,
        questao: q,
      },
    ]);
  };

  // Remover questão da avaliação
  const handleRemoveQuestion = (index: number) => {
    setExamItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((item, idx) => ({ ...item, ordem: idx + 1 }));
    });
  };

  // Mover questão para cima / baixo
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === examItems.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    setExamItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((it, idx) => ({ ...it, ordem: idx + 1 }));
    });
  };

  // Criar e inserir nova questão inline
  const handleCreateInlineQuestion = async () => {
    if (!inlineTitulo.trim() || !inlineEnunciado.trim()) {
      alert('Título e enunciado são obrigatórios.');
      return;
    }

    try {
      const novaQuestao = await api.saveQuestao({
        disciplina_id: selectedDiscId,
        titulo: inlineTitulo,
        enunciado_markdown: inlineEnunciado,
        diagrama_mermaid: inlineMermaid.trim() ? inlineMermaid : null,
        grau_dificuldade: inlineDificuldade,
        tipo_questao: inlineTipo,
        linhas_resposta: inlineTipo === 'OBJETIVA' ? 0 : inlineLinhas,
        alternativas: inlineTipo === 'OBJETIVA' ? inlineAlternativas : [],
      });

      // Recarrega banco
      const quests = await api.getQuestoes();
      setTodasQuestoes(quests);

      // Adiciona à prova
      setExamItems((prev) => [
        ...prev,
        {
          ordem: prev.length + 1,
          valor_pontuacao: inlinePontos,
          questao: novaQuestao,
        },
      ]);

      // Alterna de volta para visualização das questões
      setActiveTab('questoes');
    } catch (err) {
      alert(`Erro ao criar questão: ${err}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 print:h-auto print:w-auto print:overflow-visible print:bg-white print:block">
      {/* ======================================================== */}
      {/* PAINEL ESQUERDO: EDITOR & FORMULÁRIOS (45% a 50% de largura) */}
      {/* ======================================================== */}
      <aside className="w-[48%] h-full flex flex-col border-r border-slate-800 bg-slate-900/90 no-print z-10">
        {/* Barra Superior do Editor */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-indigo-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Editor de Avaliação
            </span>
            {examId && (
              <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                ID #{examId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsLoadModalOpen(true)}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition"
              title="Abrir avaliação salva"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
              Abrir
            </button>

            <button
              onClick={handleSaveExam}
              disabled={isSaving}
              className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition shadow-sm ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1 text-xs rounded bg-slate-100 hover:bg-white text-slate-900 font-semibold flex items-center gap-1.5 transition shadow"
              title="Imprimir ou Salvar PDF via layout A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-900" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Abas de Navegação do Editor */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-3 pt-2 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('questoes')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'questoes'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
            Questões na Prova ({examItems.length})
          </button>

          <button
            onClick={() => setActiveTab('nova_inline')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'nova_inline'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Nova Questão Rápida
          </button>

          <button
            onClick={() => setActiveTab('meta')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'meta'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Metadados e Cabeçalho
          </button>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ==================================================== */}
          {/* ABA: METADADOS DA PROVA */}
          {/* ==================================================== */}
          {activeTab === 'meta' && (
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-end pb-1">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  Gerenciar Instituições & Disciplinas
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Instituição</label>
                  <select
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {instituicoes.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nome} {inst.sigla ? `(${inst.sigla})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Disciplina</label>
                  <select
                    value={selectedDiscId}
                    onChange={(e) => setSelectedDiscId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {disciplinas.map((disc) => (
                      <option key={disc.id} value={disc.id}>
                        {disc.nome} {disc.codigo ? `[${disc.codigo}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Título da Prova</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: AVALIAÇÃO FINAL - 1º BIMESTRE"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data da Aplicação</label>
                  <input
                    type="date"
                    value={dataAplicacao}
                    onChange={(e) => setDataAplicacao(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor Total (Pontos)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pesoTotal}
                    onChange={(e) => setPesoTotal(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Instruções Acadêmicas (exibidas no cabeçalho)
                </label>
                <textarea
                  rows={4}
                  value={instrucoes}
                  onChange={(e) => setInstrucoes(e.target.value)}
                  placeholder="Instruções para o aluno..."
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ABA: QUESTÕES NA PROVA & ADIÇÃO DO BANCO */}
          {/* ==================================================== */}
          {activeTab === 'questoes' && (
            <div className="space-y-3">
              {/* Botões de Ação do Banco */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">
                  Total de Questões: <strong className="text-white">{examItems.length}</strong> |
                  Soma de Pontos:{' '}
                  <strong className="text-indigo-300">
                    {examItems.reduce((acc, it) => acc + (it.valor_pontuacao || 0), 0).toFixed(1)}
                  </strong>{' '}
                  / {pesoTotal}
                </span>

                <button
                  onClick={onOpenQuestionBank}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded flex items-center gap-1.5 transition"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  Gerenciar Banco Completo
                </button>
              </div>

              {/* Seletor Rápido de Questões do Banco SQLite */}
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider">
                  Adicionar Questão Existente do Banco SQLite
                </span>
                <div className="flex gap-2">
                  <select
                    id="quick-add-select"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecione uma questão cadastrada...
                    </option>
                    {todasQuestoes.map((q) => (
                      <option key={q.id} value={q.id}>
                        [{q.tipo_questao}] {q.titulo} ({q.grau_dificuldade})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const select = document.getElementById(
                        'quick-add-select'
                      ) as HTMLSelectElement;
                      const val = Number(select?.value);
                      if (val) {
                        const target = todasQuestoes.find((q) => q.id === val);
                        if (target) handleAddQuestionToExam(target);
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>

              {/* Lista Ordenável de Questões na Prova */}
              <div className="space-y-2 mt-3">
                {examItems.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-800 rounded-lg text-center text-slate-500 text-xs">
                    Nenhuma questão adicionada ainda. Selecione uma questão acima ou crie uma nova
                    questão rápida.
                  </div>
                ) : (
                  examItems.map((item, index) => (
                    <div
                      key={`${item.questao.id}-${index}`}
                      className="p-3 bg-slate-800/80 border border-slate-700/70 rounded-lg flex items-center justify-between gap-3 hover:border-slate-600 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {item.ordem}
                        </span>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                            {item.questao.titulo}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700">
                              {item.questao.tipo_questao}
                            </span>
                            <span>{item.questao.grau_dificuldade}</span>
                            {item.questao.diagrama_mermaid && (
                              <span className="text-indigo-400 font-mono">Mermaid OK</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Pontuação da Questão */}
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-400 text-[11px]">Pts:</span>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={item.valor_pontuacao}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setExamItems((prev) =>
                                prev.map((it, i) =>
                                  i === index ? { ...it, valor_pontuacao: val } : it
                                )
                              );
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Reordenar */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === examItems.length - 1}
                            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Excluir da Prova */}
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                          title="Remover da prova"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ABA: CRIADOR INLINE DE NOVA QUESTÃO */}
          {/* ==================================================== */}
          {activeTab === 'nova_inline' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-2.5 rounded bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
                Esta questão será salva permanentemente no SQLite e imediatamente adicionada ao
                exame. Suporta equações matemáticas LaTeX `$f(x)$` e diagramas Mermaid.
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Título da Questão</label>
                <input
                  type="text"
                  value={inlineTitulo}
                  onChange={(e) => setInlineTitulo(e.target.value)}
                  placeholder="Ex: Teorema Fundamental do Cálculo"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipo</label>
                  <select
                    value={inlineTipo}
                    onChange={(e) => setInlineTipo(e.target.value as TipoQuestao)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DISSERTATIVA">Dissertativa</option>
                    <option value="OBJETIVA">Objetiva (Múltipla Escolha)</option>
                    <option value="CODIGO">Código / Programação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dificuldade</label>
                  <select
                    value={inlineDificuldade}
                    onChange={(e) => setInlineDificuldade(e.target.value as GrauDificuldade)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FACIL">Fácil</option>
                    <option value="MEDIO">Médio</option>
                    <option value="DIFICIL">Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pontuação</label>
                  <input
                    type="number"
                    step="0.5"
                    value={inlinePontos}
                    onChange={(e) => setInlinePontos(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-indigo-300"
                  />
                </div>
              </div>

              {/* Botões Rápidos de Inserção de Snippets */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-500">Inserir modelo:</span>
                <button
                  type="button"
                  onClick={() =>
                    setInlineEnunciado(
                      (prev) => prev + '\n\n$$\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)$$'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  + Integral
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInlineEnunciado(
                      (prev) => prev + '\n\n```python\ndef solucao(n):\n    return n * 2\n```'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  + Bloco de Código
                </button>
              </div>

              {/* Enunciado Markdown */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Enunciado (Markdown + Fórmulas KaTeX)
                </label>
                <textarea
                  rows={5}
                  value={inlineEnunciado}
                  onChange={(e) => setInlineEnunciado(e.target.value)}
                  placeholder="Digite o enunciado da questão..."
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Editor Dedicado de Script Mermaid */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">
                    Diagrama Mermaid (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setInlineMermaid('graph TD\n    A[Entrada] --> B[Processo]\n    B --> C[Saída]')
                    }
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Carregar Exemplo
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={inlineMermaid}
                  onChange={(e) => setInlineMermaid(e.target.value)}
                  placeholder="graph TD&#10;    A --> B"
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              {/* Alternativas se Objetiva */}
              {inlineTipo === 'OBJETIVA' ? (
                <div className="space-y-2 border-t border-slate-800 pt-2">
                  <label className="block text-slate-300 font-medium">
                    Alternativas (Marque a correta para o gabarito)
                  </label>
                  {inlineAlternativas.map((alt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="inline_correta"
                        checked={alt.correta}
                        onChange={() =>
                          setInlineAlternativas((prev) =>
                            prev.map((a, i) => ({ ...a, correta: i === idx }))
                          )
                        }
                        className="text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="w-5 font-bold text-slate-400">
                        {String.fromCharCode(65 + idx)})
                      </span>
                      <input
                        type="text"
                        value={alt.texto}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInlineAlternativas((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, texto: val } : a))
                          );
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Linhas de Resposta Pautadas (Espaçamento em folha)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={inlineLinhas}
                    onChange={(e) => setInlineLinhas(Number(e.target.value))}
                    className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-bold"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateInlineQuestion}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4" />
                Salvar Questão no SQLite e Adicionar à Prova
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* PAINEL DIREITO: LIVE PREVIEW PAGINADO A4 (50% a 55% da largura) */}
      {/* ======================================================== */}
      <main className="w-[52%] h-full flex flex-col bg-slate-950 relative overflow-hidden print:w-full print:h-auto print:overflow-visible print:bg-white print:block print:static">
        {/* Barra de Controles da Prévia */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between no-print z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Preview A4
            </span>
            <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
              60 FPS Debounced
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Alternar Gabarito */}
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`px-2 py-1 rounded border text-xs flex items-center gap-1 transition ${
                showAnswers
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Exibir alternativas corretas para conferência"
            >
              {showAnswers ? (
                <>
                  <Eye className="w-3.5 h-3.5" /> Gabarito Ativo
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Ver Gabarito
                </>
              )}
            </button>

            {/* Controles de Zoom da Visualização */}
            <div className="flex items-center bg-slate-800 rounded border border-slate-700 p-0.5">
              <button
                onClick={() => setPreviewZoom((z) => Math.max(z - 10, 60))}
                className="px-1.5 py-0.5 text-slate-400 hover:text-white"
              >
                -
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-300">{previewZoom}%</span>
              <button
                onClick={() => setPreviewZoom((z) => Math.min(z + 10, 130))}
                className="px-1.5 py-0.5 text-slate-400 hover:text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Área Rolável de Visualização com Escala Dinâmica */}
        <div className="flex-1 overflow-auto flex justify-center p-6 bg-slate-950/60 print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
          <div
            style={{
              transform: `scale(${previewZoom / 100})`,
              transformOrigin: 'top center',
            }}
            className="preview-scale-wrapper transition-transform duration-100 print:transform-none print:w-full print:m-0 print:p-0 print:block"
          >
            <A4Preview ref={printableRef} exam={deferredExamState} showAnswers={showAnswers} />
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL: ABRIR AVALIAÇÃO SALVA NO SQLITE */}
      {/* ======================================================== */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400" />
                Avaliações Salvas no SQLite
              </h3>
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times; Fechar
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {avaliacoesSalvas.length === 0 ? (
                <p className="text-center text-slate-500 py-6 text-xs">
                  Nenhuma avaliação salva encontrada no banco SQLite.
                </p>
              ) : (
                avaliacoesSalvas.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => handleLoadSavedExam(av.id)}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">{av.titulo}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {av.disciplina_nome} &bull; {av.instituicao_nome}
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1 flex gap-3">
                        <span>{av.total_questoes} questões</span>
                        <span>{av.peso_total} pontos</span>
                        {av.data_aplicacao && <span>Data: {av.data_aplicacao}</span>}
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs rounded font-medium">
                      Carregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
