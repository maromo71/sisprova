import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  FileCode,
  ChevronDown,
  Clock,
  Sparkles,
  AlertTriangle,
  History,
} from 'lucide-react';
import { api } from '../services/api';
import { MermaidRenderer } from './MermaidRenderer';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { QuestionUsageHistoryModal } from './QuestionUsageHistoryModal';
import { exportQuestionsToJson, exportQuestionsToMarkdown } from '../utils/questionBatch';
import type {
  QuestaoCompleta,
  Disciplina,
  GrauDificuldade,
  TipoQuestao,
  AlternativaInput,
  MapaEstatisticasUso,
} from '../types';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion?: (q: QuestaoCompleta) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion,
}) => {
  const [questoes, setQuestoes] = useState<QuestaoCompleta[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [selectedDisciplinaFilter, setSelectedDisciplinaFilter] = useState<string>('all');
  const [selectedUsageFilter, setSelectedUsageFilter] = useState<'all' | 'ineditas' | 'usadas' | 'recentes'>('all');
  const [estatisticasUso, setEstatisticasUso] = useState<MapaEstatisticasUso>({});
  const [historyModalQuestion, setHistoryModalQuestion] = useState<QuestaoCompleta | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form State
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<number>(1);
  const [titulo, setTitulo] = useState<string>('');
  const [enunciado, setEnunciado] = useState<string>('');
  const [mermaid, setMermaid] = useState<string>('');
  const [grauDificuldade, setGrauDificuldade] = useState<GrauDificuldade>('MEDIO');
  const [tipoQuestao, setTipoQuestao] = useState<TipoQuestao>('DISSERTATIVA');
  const [linhasResposta, setLinhasResposta] = useState<number>(6);
  const [respostaEsperada, setRespostaEsperada] = useState<string>('');
  const [alternativas, setAlternativas] = useState<AlternativaInput[]>([
    { texto: '', correta: true },
    { texto: '', correta: false },
    { texto: '', correta: false },
    { texto: '', correta: false },
  ]);

  // Estados de Importação e Exportação em Lote (MELH-05)
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  const handleExportQuestions = async (format: 'json' | 'markdown') => {
    setIsExportMenuOpen(false);
    const targetQuestions = questoesFiltradas.length > 0 ? questoesFiltradas : questoes;
    if (targetQuestions.length === 0) {
      alert('Nenhuma questão disponível para exportação.');
      return;
    }

    const selectedDisc = disciplinas.find((d) => d.id === Number(selectedDisciplinaFilter));
    const discNome = selectedDisc ? selectedDisc.nome : undefined;

    let content = '';
    let filename = '';
    let filterName = '';
    let ext = '';

    if (format === 'json') {
      content = exportQuestionsToJson(targetQuestions);
      filename = `SisProva_Questoes_${discNome ? discNome.replace(/\s+/g, '_') : 'Geral'}.json`;
      filterName = 'Arquivo JSON (*.json)';
      ext = 'json';
    } else {
      content = exportQuestionsToMarkdown(targetQuestions, discNome);
      filename = `SisProva_Questoes_${discNome ? discNome.replace(/\s+/g, '_') : 'Geral'}.md`;
      filterName = 'Arquivo Markdown (*.md)';
      ext = 'md';
    }

    try {
      const savePath = await api.saveTextFileDialog(filename, filterName, [ext]);
      if (savePath) {
        await api.writeTextFile(savePath, content);
        alert(`Arquivo gravado com sucesso em:\n${savePath}`);
      } else {
        // Fallback navegador
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Erro na exportação:', err);
      alert(`Falha ao exportar arquivo: ${err}`);
    }
  };

  const carregarDados = async () => {
    try {
      const [qs, ds, stats] = await Promise.all([
        api.getQuestoes(),
        api.getDisciplinas(),
        api.getQuestoesEstatisticasUso(),
      ]);
      setQuestoes(qs);
      setDisciplinas(ds);
      setEstatisticasUso(stats || {});
      if (ds.length > 0) {
        setDisciplinaId((prev) => (ds.some((d) => d.id === prev) ? prev : ds[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenNew = () => {
    setCurrentId(null);
    setTitulo('');
    setEnunciado('');
    setMermaid('');
    setGrauDificuldade('MEDIO');
    setTipoQuestao('DISSERTATIVA');
    setLinhasResposta(6);
    setRespostaEsperada('');
    if (disciplinas.length > 0 && !disciplinas.some((d) => d.id === disciplinaId)) {
      setDisciplinaId(disciplinas[0].id);
    }
    setAlternativas([
      { texto: 'Alternativa 1', correta: true },
      { texto: 'Alternativa 2', correta: false },
      { texto: 'Alternativa 3', correta: false },
      { texto: 'Alternativa 4', correta: false },
    ]);
    setIsEditing(true);
  };

  const handleEdit = (q: QuestaoCompleta) => {
    setCurrentId(q.id);
    const validDisc = disciplinas.some((d) => d.id === q.disciplina_id)
      ? q.disciplina_id
      : (disciplinas[0]?.id ?? q.disciplina_id);
    setDisciplinaId(validDisc);
    setTitulo(q.titulo);
    setEnunciado(q.enunciado_markdown);
    setMermaid(q.diagrama_mermaid || '');
    setGrauDificuldade(q.grau_dificuldade);
    setTipoQuestao(q.tipo_questao);
    setLinhasResposta(q.linhas_resposta);
    setRespostaEsperada(q.resposta_esperada || '');
    setAlternativas(
      q.alternativas.length > 0
        ? q.alternativas.map((a) => ({ id: a.id, texto: a.texto, correta: a.correta }))
        : [
            { texto: '', correta: true },
            { texto: '', correta: false },
          ]
    );
    setIsEditing(true);
  };

  const handleAddAlternativa = () => {
    setAlternativas((prev) => [
      ...prev,
      { texto: '', correta: false },
    ]);
  };

  const handleRemoveAlternativa = (index: number) => {
    if (alternativas.length <= 2) {
      alert('A questão objetiva precisa de no mínimo 2 alternativas.');
      return;
    }
    const wasCorrect = alternativas[index].correta;
    setAlternativas((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (wasCorrect && next.length > 0) {
        next[0].correta = true;
      }
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta questão do SQLite?')) {
      try {
        await api.deleteQuestao(id);
        await carregarDados();
      } catch (err) {
        alert(`Erro ao excluir: ${err}`);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !enunciado.trim()) {
      alert('Preencha título e enunciado.');
      return;
    }

    const targetDiscId = disciplinas.some((d) => d.id === disciplinaId)
      ? disciplinaId
      : disciplinas[0]?.id;

    if (!targetDiscId) {
      alert('Cadastre ao menos uma disciplina nas Configurações antes de salvar questões.');
      return;
    }

    try {
      await api.saveQuestao({
        id: currentId,
        disciplina_id: targetDiscId,
        titulo,
        enunciado_markdown: enunciado,
        diagrama_mermaid: mermaid.trim() ? mermaid : null,
        grau_dificuldade: grauDificuldade,
        tipo_questao: tipoQuestao,
        linhas_resposta: tipoQuestao === 'OBJETIVA' ? 0 : linhasResposta,
        resposta_esperada: respostaEsperada.trim() ? respostaEsperada : null,
        alternativas: tipoQuestao === 'OBJETIVA' ? alternativas : [],
      });
      setIsEditing(false);
      await carregarDados();
    } catch (err) {
      alert(`Erro ao salvar no SQLite: ${err}`);
    }
  };

  const questoesFiltradas = questoes.filter((q) => {
    const matchDisc =
      selectedDisciplinaFilter === 'all' ||
      q.disciplina_id === Number(selectedDisciplinaFilter);
    const matchSearch =
      q.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.enunciado_markdown.toLowerCase().includes(searchTerm.toLowerCase());

    const stats = estatisticasUso[q.id];
    const totalUsos = stats?.total_usos || 0;
    const matchUsage =
      selectedUsageFilter === 'all'
        ? true
        : selectedUsageFilter === 'ineditas'
        ? totalUsos === 0
        : selectedUsageFilter === 'usadas'
        ? totalUsos > 0
        : selectedUsageFilter === 'recentes'
        ? stats?.usada_recentemente === true
        : true;

    return matchDisc && matchSearch && matchUsage;
  });

  const totalIneditas = questoes.filter((q) => (estatisticasUso[q.id]?.total_usos || 0) === 0).length;
  const totalUsadas = questoes.filter((q) => (estatisticasUso[q.id]?.total_usos || 0) > 0).length;
  const totalRecentes = questoes.filter((q) => estatisticasUso[q.id]?.usada_recentemente).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6 no-print">
      <div className="w-full max-w-5xl h-[88vh] bg-white dark:bg-monokai-bg border border-slate-200 dark:border-monokai-border rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-monokai-fg transition-colors duration-200">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-200 dark:border-monokai-border flex items-center justify-between bg-slate-50 dark:bg-monokai-panel">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-monokai-card border border-indigo-200 dark:border-monokai-border text-indigo-600 dark:text-monokai-cyan">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-monokai-fg">Banco de Questões Relacional</h2>
              <p className="text-xs text-slate-500 dark:text-monokai-comment">Persistência direta no SQLite local</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  title="Importar questões em lote a partir de arquivos JSON ou Markdown"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                  Importar Lote
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsExportMenuOpen((prev) => !prev)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    title="Exportar questões cadastradas"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                    Exportar
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isExportMenuOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-monokai-card border border-slate-200 dark:border-monokai-border rounded-lg shadow-xl py-1 z-30 text-xs">
                      <div className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-monokai-divider">
                        Exportar ({questoesFiltradas.length} questões)
                      </div>
                      <button
                        onClick={() => handleExportQuestions('json')}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-monokai-cardHover flex items-center gap-2 text-slate-700 dark:text-monokai-fg"
                      >
                        <FileCode className="w-3.5 h-3.5 text-amber-500" />
                        JSON Estruturado (.json)
                      </button>
                      <button
                        onClick={() => handleExportQuestions('markdown')}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-monokai-cardHover flex items-center gap-2 text-slate-700 dark:text-monokai-fg"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                        Markdown Formatado (.md)
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleOpenNew}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  Nova Questão
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-monokai-card text-slate-400 hover:text-slate-700 dark:hover:text-monokai-fg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-hidden flex bg-white dark:bg-monokai-bg">
          {isEditing ? (
            /* Formulário Completo de Edição / Criação */
            <form onSubmit={handleSave} className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-monokai-border">
                <h3 className="text-sm font-bold text-slate-800 dark:text-monokai-fg">
                  {currentId ? `Editando Questão #${currentId}` : 'Criar Nova Questão no SQLite'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 dark:text-monokai-comment hover:text-slate-800 dark:hover:text-monokai-fg"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-monokai-sub mb-1">Disciplina</label>
                  <select
                    value={disciplinaId}
                    onChange={(e) => setDisciplinaId(Number(e.target.value))}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  >
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} {d.codigo ? `[${d.codigo}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-monokai-sub mb-1">Tipo</label>
                  <select
                    value={tipoQuestao}
                    onChange={(e) => setTipoQuestao(e.target.value as TipoQuestao)}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  >
                    <option value="DISSERTATIVA">Dissertativa</option>
                    <option value="OBJETIVA">Objetiva (Múltipla Escolha)</option>
                    <option value="CODIGO">Código / Programação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-monokai-sub mb-1">Dificuldade</label>
                  <select
                    value={grauDificuldade}
                    onChange={(e) => setGrauDificuldade(e.target.value as GrauDificuldade)}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  >
                    <option value="FACIL">Fácil</option>
                    <option value="MEDIO">Médio</option>
                    <option value="DIFICIL">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-monokai-sub mb-1">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título resumido da questão"
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-monokai-sub">
                    Enunciado (Markdown + LaTeX)
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500 dark:text-monokai-comment">Inserir:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEnunciado(
                          (prev) => prev + '\n\n$$\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)$$'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border text-[10px] transition"
                    >
                      + Integral
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEnunciado(
                          (prev) => prev + '\n\n```python\ndef calcular():\n    return 42\n```'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border text-[10px] transition"
                    >
                      + Bloco de Código (Monokai)
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  placeholder="Escreva em Markdown com $f(x)$ ou $$\int f(x) dx$$..."
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg p-3 text-xs text-slate-800 dark:text-monokai-fg font-mono leading-relaxed focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-monokai-sub mb-1">
                  Diagrama Mermaid (Opcional)
                </label>
                <textarea
                  rows={4}
                  value={mermaid}
                  onChange={(e) => setMermaid(e.target.value)}
                  placeholder="graph TD&#10;    A --> B"
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg p-3 text-xs text-slate-800 dark:text-monokai-fg font-mono focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                />
                {mermaid && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 dark:border-monokai-border shadow-sm">
                    <MermaidRenderer code={mermaid} />
                  </div>
                )}
              </div>

              {tipoQuestao === 'OBJETIVA' ? (
                <div className="space-y-2 border-t border-slate-200 dark:border-monokai-border pt-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-monokai-sub">
                      Alternativas (Marque a opção correta no gabarito)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddAlternativa}
                      className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-monokai-cyan dark:hover:underline"
                    >
                      <Plus className="w-3 h-3" /> + Alternativa
                    </button>
                  </div>
                  {alternativas.map((alt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="modal_correta"
                        checked={alt.correta}
                        onChange={() =>
                          setAlternativas((prev) =>
                            prev.map((a, i) => ({ ...a, correta: i === idx }))
                          )
                        }
                        className="text-indigo-600 cursor-pointer"
                        title="Marcar como correta"
                      />
                      <span className="text-xs font-bold text-slate-500 dark:text-monokai-comment w-6">
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
                      {alternativas.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAlternativa(idx)}
                          className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition p-1"
                          title="Excluir alternativa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-monokai-sub">
                      Linhas de Resposta Pautadas (Espaçamento em folha)
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-monokai-comment">
                      0 = Sem pauta (para folha de respostas externa)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={linhasResposta}
                      onChange={(e) => setLinhasResposta(Math.max(0, Number(e.target.value)))}
                      className="w-28 bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-monokai-fg font-bold focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                    />
                    <div className="flex items-center gap-1">
                      {[0, 5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setLinhasResposta(num)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                            linhasResposta === num
                              ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-monokai-cyan dark:text-monokai-bg dark:border-monokai-cyan font-bold'
                              : 'bg-slate-100 dark:bg-monokai-panel text-slate-600 dark:text-monokai-fg border-slate-300 dark:border-monokai-border hover:bg-slate-200 dark:hover:bg-monokai-card'
                          }`}
                        >
                          {num === 0 ? '0 (avulsa)' : `${num} lin`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    Resposta Esperada / Padrão de Resposta (Gabarito)
                  </label>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-500 font-medium">
                    Visível apenas na Versão Gabarito (Professor)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={respostaEsperada}
                  onChange={(e) => setRespostaEsperada(e.target.value)}
                  placeholder="Ex: Resolução detalhada, resposta padrão em Markdown com fórmulas $$x = \frac{-b \pm \sqrt{\Delta}}{2a}$$, código de referência ou comentários..."
                  className="w-full bg-white dark:bg-monokai-panel border border-emerald-300 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-monokai-fg font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-monokai-comment">
                  💡 Este texto será impresso nas folhas da <strong>Versão Gabarito (Professor)</strong>. Na <strong>Versão do Aluno</strong>, este espaço permanece reservado com linhas pautadas ou em branco.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-monokai-border">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg rounded-lg text-xs border border-slate-300 dark:border-monokai-border transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Gravar no SQLite
                </button>
              </div>
            </form>
          ) : (
            /* Lista e Filtros de Questões */
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Barra de Busca e Filtro */}
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-monokai-comment" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar por título ou conteúdo do enunciado..."
                    className="w-full bg-slate-50 dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 dark:text-monokai-comment" />
                  <select
                    value={selectedDisciplinaFilter}
                    onChange={(e) => setSelectedDisciplinaFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none"
                  >
                    <option value="all">Todas as Disciplinas</option>
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtro de Histórico de Utilização (MELH-10) */}
              <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-200 dark:border-monokai-divider text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  <span className="text-[11px] text-slate-400 dark:text-monokai-comment font-semibold uppercase tracking-wider mr-1">
                    Auditoria de Uso:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedUsageFilter('all')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                      selectedUsageFilter === 'all'
                        ? 'bg-slate-800 text-white dark:bg-monokai-cyan dark:text-monokai-bg font-bold shadow-2xs'
                        : 'bg-slate-100 dark:bg-monokai-panel text-slate-600 dark:text-monokai-comment hover:bg-slate-200 dark:hover:bg-monokai-card'
                    }`}
                  >
                    Todas ({questoes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUsageFilter('ineditas')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                      selectedUsageFilter === 'ineditas'
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/40'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Inéditas ({totalIneditas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUsageFilter('usadas')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                      selectedUsageFilter === 'usadas'
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/40'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Já Utilizadas ({totalUsadas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUsageFilter('recentes')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                      selectedUsageFilter === 'recentes'
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-monokai-yellow hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800/40'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Recentes &lt; 6m ({totalRecentes})
                  </button>
                </div>
              </div>

              {/* Tabela de Questões */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {questoesFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-monokai-comment text-xs">
                    Nenhuma questão encontrada no SQLite com os filtros selecionados.
                  </div>
                ) : (
                  questoesFiltradas.map((q) => {
                    const stats = estatisticasUso[q.id];
                    const totalUsos = stats?.total_usos || 0;

                    return (
                      <div
                        key={q.id}
                        className="p-4 bg-slate-50 hover:bg-slate-100/90 dark:bg-monokai-card/60 dark:hover:bg-monokai-card border border-slate-200 dark:border-monokai-border rounded-xl transition flex items-start justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-monokai-fg">{q.titulo}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-monokai-panel text-indigo-600 dark:text-monokai-cyan border border-slate-200 dark:border-monokai-border">
                              {q.tipo_questao}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-monokai-sub">
                              Dificuldade: <strong>{q.grau_dificuldade}</strong>
                            </span>

                            {/* Badge de Histórico de Uso (MELH-10) */}
                            {totalUsos === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                Inédita
                              </span>
                            ) : stats?.usada_recentemente ? (
                              <button
                                type="button"
                                onClick={() => setHistoryModalQuestion(q)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-monokai-yellow border border-amber-300 dark:border-amber-700/60 transition shadow-2xs"
                                title="Aplicada recentemente há menos de 6 meses. Clique para ver histórico completo."
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-monokai-yellow" />
                                Usada {totalUsos}x ({stats.dias_desde_ultima_aplicacao !== null && stats.dias_desde_ultima_aplicacao !== undefined ? `há ${stats.dias_desde_ultima_aplicacao}d` : 'recente'})
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setHistoryModalQuestion(q)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 transition"
                                title="Clique para ver o histórico em que avaliações foi aplicada."
                              >
                                <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                Usada {totalUsos}x
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-monokai-comment line-clamp-2 font-mono">
                            {q.enunciado_markdown}
                          </p>

                          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-monokai-sub pt-1">
                            <span>Disciplina: {q.disciplina_nome || 'Geral'}</span>
                            {q.diagrama_mermaid && <span className="text-indigo-600 dark:text-monokai-cyan font-mono font-medium">Possui Diagrama</span>}
                            {q.tipo_questao === 'OBJETIVA' && (
                              <span>{q.alternativas.length} Alternativas</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onSelectQuestion && (
                            <button
                              onClick={() => onSelectQuestion(q)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adicionar à Prova
                            </button>
                          )}
                          <button
                            onClick={() => setHistoryModalQuestion(q)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-monokai-panel dark:hover:bg-monokai-card text-slate-500 hover:text-slate-800 dark:text-monokai-comment dark:hover:text-monokai-fg border border-slate-200 dark:border-monokai-border transition"
                            title="Ver Histórico de Provas e Frequência de Uso"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(q)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-monokai-panel dark:hover:bg-monokai-card text-slate-600 dark:text-monokai-fg border border-slate-200 dark:border-monokai-border transition"
                            title="Editar Questão"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 dark:bg-monokai-panel dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-monokai-border transition"
                            title="Excluir do SQLite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Importação em Lote (MELH-05) */}
      <ImportQuestionsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        disciplinas={disciplinas}
        defaultDisciplinaId={disciplinaId}
        onImportSuccess={async (count) => {
          await carregarDados();
          alert(`${count} questão(ões) importada(s) com sucesso para o banco de dados!`);
        }}
      />

      {/* Modal de Histórico de Uso da Questão (MELH-10) */}
      <QuestionUsageHistoryModal
        isOpen={historyModalQuestion !== null}
        onClose={() => setHistoryModalQuestion(null)}
        questao={historyModalQuestion}
        estatisticas={historyModalQuestion ? estatisticasUso[historyModalQuestion.id] : null}
      />
    </div>
  );
};
