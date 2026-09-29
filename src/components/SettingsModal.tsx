import React, { useState, useEffect } from 'react';
import { Settings, Building, BookOpen, HardDrive, Plus, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import type { Instituicao, Disciplina } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'inst' | 'disc' | 'db'>('inst');
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [dbPath, setDbPath] = useState<string>('');

  // Form Instituição
  const [instNome, setInstNome] = useState('');
  const [instSigla, setInstSigla] = useState('');

  // Form Disciplina
  const [discInstId, setDiscInstId] = useState<number>(1);
  const [discNome, setDiscNome] = useState('');
  const [discCodigo, setDiscCodigo] = useState('');

  const carregar = async () => {
    try {
      const [insts, discs, path] = await Promise.all([
        api.getInstituicoes(),
        api.getDisciplinas(),
        api.getDbPath(),
      ]);
      setInstituicoes(insts);
      setDisciplinas(discs);
      setDbPath(path);
      if (insts.length > 0) setDiscInstId(insts[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) carregar();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddInstituicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instNome.trim()) return;
    try {
      await api.saveInstituicao({
        nome: instNome,
        sigla: instSigla.trim() ? instSigla : null,
        logo_base64: null,
      });
      setInstNome('');
      setInstSigla('');
      await carregar();
      onUpdated();
    } catch (err) {
      alert(`Erro: ${err}`);
    }
  };

  const handleDeleteInstituicao = async (id: number) => {
    if (confirm('Excluir esta instituição apagará em cascata todas as suas disciplinas e questões associadas. Deseja continuar?')) {
      try {
        await api.deleteInstituicao(id);
        await carregar();
        onUpdated();
      } catch (err) {
        alert(`Erro: ${err}`);
      }
    }
  };

  const handleAddDisciplina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discNome.trim()) return;
    try {
      await api.saveDisciplina({
        instituicao_id: discInstId,
        nome: discNome,
        codigo: discCodigo.trim() ? discCodigo : null,
      });
      setDiscNome('');
      setDiscCodigo('');
      await carregar();
      onUpdated();
    } catch (err) {
      alert(`Erro: ${err}`);
    }
  };

  const handleDeleteDisciplina = async (id: number) => {
    if (confirm('Deseja excluir esta disciplina?')) {
      try {
        await api.deleteDisciplina(id);
        await carregar();
        onUpdated();
      } catch (err) {
        alert(`Erro: ${err}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6 no-print">
      <div className="w-full max-w-3xl bg-white dark:bg-monokai-bg border border-slate-200 dark:border-monokai-border rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh] text-slate-800 dark:text-monokai-fg transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-monokai-border flex items-center justify-between bg-slate-50 dark:bg-monokai-panel">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-monokai-cyan" />
            <h2 className="text-base font-bold text-slate-800 dark:text-monokai-fg">
              Configurações e Cadastros Acadêmicos
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-monokai-card text-slate-400 hover:text-slate-700 dark:hover:text-monokai-fg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 dark:border-monokai-border bg-slate-50/70 dark:bg-monokai-panel/60 px-4 pt-2 gap-2 text-xs transition-colors duration-200">
          <button
            onClick={() => setActiveTab('inst')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'inst'
                ? 'bg-white dark:bg-monokai-bg text-slate-900 dark:text-monokai-fg border-slate-300 dark:border-monokai-border shadow-sm'
                : 'text-slate-500 dark:text-monokai-comment border-transparent hover:text-slate-800 dark:hover:text-monokai-fg'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Instituições
          </button>

          <button
            onClick={() => setActiveTab('disc')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'disc'
                ? 'bg-white dark:bg-monokai-bg text-slate-900 dark:text-monokai-fg border-slate-300 dark:border-monokai-border shadow-sm'
                : 'text-slate-500 dark:text-monokai-comment border-transparent hover:text-slate-800 dark:hover:text-monokai-fg'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Disciplinas
          </button>

          <button
            onClick={() => setActiveTab('db')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'db'
                ? 'bg-white dark:bg-monokai-bg text-slate-900 dark:text-monokai-fg border-slate-300 dark:border-monokai-border shadow-sm'
                : 'text-slate-500 dark:text-monokai-comment border-transparent hover:text-slate-800 dark:hover:text-monokai-fg'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Persistência SQLite
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 text-xs bg-white dark:bg-monokai-bg">
          {activeTab === 'inst' && (
            <div className="space-y-4">
              <form onSubmit={handleAddInstituicao} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Nome da Instituição</label>
                  <input
                    type="text"
                    value={instNome}
                    onChange={(e) => setInstNome(e.target.value)}
                    placeholder="Ex: Universidade de Brasília"
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Sigla</label>
                  <input
                    type="text"
                    value={instSigla}
                    onChange={(e) => setInstSigla(e.target.value)}
                    placeholder="UnB"
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg uppercase focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white font-medium rounded flex items-center gap-1 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </form>

              <div className="space-y-1.5 mt-4">
                {instituicoes.map((inst) => (
                  <div
                    key={inst.id}
                    className="p-3 bg-slate-50 dark:bg-monokai-card/60 border border-slate-200 dark:border-monokai-border rounded-lg flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-monokai-fg">{inst.nome}</span>
                      {inst.sigla && (
                        <span className="ml-2 text-indigo-600 dark:text-monokai-cyan font-bold">({inst.sigla})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteInstituicao(inst.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'disc' && (
            <div className="space-y-4">
              <form onSubmit={handleAddDisciplina} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Instituição</label>
                  <select
                    value={discInstId}
                    onChange={(e) => setDiscInstId(Number(e.target.value))}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  >
                    {instituicoes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Nome da Disciplina</label>
                  <input
                    type="text"
                    value={discNome}
                    onChange={(e) => setDiscNome(e.target.value)}
                    placeholder="Ex: Banco de Dados I"
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Código</label>
                  <input
                    type="text"
                    value={discCodigo}
                    onChange={(e) => setDiscCodigo(e.target.value)}
                    placeholder="BD101"
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg uppercase focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white font-medium rounded flex items-center justify-center shadow-sm transition"
                    title="Adicionar"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="space-y-1.5 mt-4">
                {disciplinas.map((disc) => (
                  <div
                    key={disc.id}
                    className="p-3 bg-slate-50 dark:bg-monokai-card/60 border border-slate-200 dark:border-monokai-border rounded-lg flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-monokai-fg">{disc.nome}</span>
                      {disc.codigo && (
                        <span className="ml-2 text-indigo-600 dark:text-monokai-cyan font-mono text-[11px]">
                          [{disc.codigo}]
                        </span>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-monokai-comment mt-0.5">
                        Instituição: {disc.instituicao_nome || 'Geral'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDisciplina(disc.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'db' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-monokai-card/70 border border-slate-200 dark:border-monokai-border space-y-2">
                <span className="font-bold text-slate-800 dark:text-monokai-fg block text-xs">
                  Caminho do Banco de Dados SQLite (.db):
                </span>
                <code className="block p-2.5 rounded bg-white dark:bg-black/60 font-mono text-emerald-600 dark:text-emerald-400 text-xs break-all border border-slate-200 dark:border-monokai-border">
                  {dbPath}
                </code>
                <p className="text-[11px] text-slate-600 dark:text-monokai-comment leading-relaxed pt-1">
                  Em conformidade estrita com os princípios arquiteturais do aplicativo, todos os
                  dados de instituições, disciplinas, questões, fórmulas e avaliações são
                  armazenados com integridade relacional ACID e chave estrangeira ativa no SQLite.
                  Nenhum dado é salvo em arquivos soltos de texto (.json ou .txt).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
