import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { MermaidRenderer } from './MermaidRenderer';
import type {
  QuestaoCompleta,
  Disciplina,
  GrauDificuldade,
  TipoQuestao,
  AlternativaInput,
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
  const [alternativas, setAlternativas] = useState<AlternativaInput[]>([
    { texto: '', correta: true },
    { texto: '', correta: false },
    { texto: '', correta: false },
    { texto: '', correta: false },
  ]);

  const carregarDados = async () => {
    try {
      const [qs, ds] = await Promise.all([api.getQuestoes(), api.getDisciplinas()]);
      setQuestoes(qs);
      setDisciplinas(ds);
      if (ds.length > 0 && !disciplinaId) {
        setDisciplinaId(ds[0].id);
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
    setDisciplinaId(q.disciplina_id);
    setTitulo(q.titulo);
    setEnunciado(q.enunciado_markdown);
    setMermaid(q.diagrama_mermaid || '');
    setGrauDificuldade(q.grau_dificuldade);
    setTipoQuestao(q.tipo_questao);
    setLinhasResposta(q.linhas_resposta);
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

    try {
      await api.saveQuestao({
        id: currentId,
        disciplina_id: disciplinaId,
        titulo,
        enunciado_markdown: enunciado,
        diagrama_mermaid: mermaid.trim() ? mermaid : null,
        grau_dificuldade: grauDificuldade,
        tipo_questao: tipoQuestao,
        linhas_resposta: tipoQuestao === 'OBJETIVA' ? 0 : linhasResposta,
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
    return matchDisc && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 no-print">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Banco de Questões Relacional</h2>
              <p className="text-xs text-slate-400">Persistência direta no SQLite local</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleOpenNew}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4" />
                Nova Questão
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-hidden flex">
          {isEditing ? (
            /* Formulário Completo de Edição / Criação */
            <form onSubmit={handleSave} className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-200">
                  {currentId ? `Editando Questão #${currentId}` : 'Criar Nova Questão no SQLite'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Disciplina</label>
                  <select
                    value={disciplinaId}
                    onChange={(e) => setDisciplinaId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} {d.codigo ? `[${d.codigo}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
                  <select
                    value={tipoQuestao}
                    onChange={(e) => setTipoQuestao(e.target.value as TipoQuestao)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="DISSERTATIVA">Dissertativa</option>
                    <option value="OBJETIVA">Objetiva (Múltipla Escolha)</option>
                    <option value="CODIGO">Código / Programação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Dificuldade</label>
                  <select
                    value={grauDificuldade}
                    onChange={(e) => setGrauDificuldade(e.target.value as GrauDificuldade)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="FACIL">Fácil</option>
                    <option value="MEDIO">Médio</option>
                    <option value="DIFICIL">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título resumido da questão"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Enunciado (Markdown + LaTeX)
                </label>
                <textarea
                  rows={6}
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  placeholder="Escreva em Markdown com $f(x)$ ou $$\int f(x) dx$$..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Diagrama Mermaid (Opcional)
                </label>
                <textarea
                  rows={4}
                  value={mermaid}
                  onChange={(e) => setMermaid(e.target.value)}
                  placeholder="graph TD&#10;    A --> B"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono"
                />
                {mermaid && (
                  <div className="mt-2 p-3 bg-white rounded-lg">
                    <MermaidRenderer code={mermaid} />
                  </div>
                )}
              </div>

              {tipoQuestao === 'OBJETIVA' ? (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <label className="block text-xs font-medium text-slate-300">
                    Alternativas (Marque a correta)
                  </label>
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
                      />
                      <span className="text-xs font-bold text-slate-400 w-6">
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
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + idx)}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Linhas de Resposta Pautadas (Espaçamento em folha)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={linhasResposta}
                    onChange={(e) => setLinhasResposta(Number(e.target.value))}
                    className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-bold"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Gravar no SQLite
                </button>
              </div>
            </form>
          ) : (
            /* Lista e Filtros de Questões */
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Barra de Busca e Filtro */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar por título ou conteúdo do enunciado..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={selectedDisciplinaFilter}
                    onChange={(e) => setSelectedDisciplinaFilter(e.target.value)}
                    className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
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

              {/* Tabela de Questões */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {questoesFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Nenhuma questão encontrada no SQLite com os filtros selecionados.
                  </div>
                ) : (
                  questoesFiltradas.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 bg-slate-800/50 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{q.titulo}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                            {q.tipo_questao}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Dificuldade: <strong>{q.grau_dificuldade}</strong>
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 font-mono">
                          {q.enunciado_markdown}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span>Disciplina: {q.disciplina_nome || 'Geral'}</span>
                          {q.diagrama_mermaid && <span className="text-indigo-400 font-mono">Possui Diagrama</span>}
                          {q.tipo_questao === 'OBJETIVA' && (
                            <span>{q.alternativas.length} Alternativas</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSelectQuestion && (
                          <button
                            onClick={() => onSelectQuestion(q)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar à Prova
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(q)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Editar Questão"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                          title="Excluir do SQLite"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
