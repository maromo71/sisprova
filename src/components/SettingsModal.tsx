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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 no-print">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Configurações e Cadastros Acadêmicos
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('inst')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'inst'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Instituições
          </button>

          <button
            onClick={() => setActiveTab('disc')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'disc'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Disciplinas
          </button>

          <button
            onClick={() => setActiveTab('db')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${
              activeTab === 'db'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Persistência SQLite
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === 'inst' && (
            <div className="space-y-4">
              <form onSubmit={handleAddInstituicao} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-slate-300 mb-1">Nome da Instituição</label>
                  <input
                    type="text"
                    value={instNome}
                    onChange={(e) => setInstNome(e.target.value)}
                    placeholder="Ex: Universidade de Brasília"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="block text-slate-300 mb-1">Sigla</label>
                  <input
                    type="text"
                    value={instSigla}
                    onChange={(e) => setInstSigla(e.target.value)}
                    placeholder="UnB"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </form>

              <div className="space-y-1.5 mt-4">
                {instituicoes.map((inst) => (
                  <div
                    key={inst.id}
                    className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{inst.nome}</span>
                      {inst.sigla && (
                        <span className="ml-2 text-indigo-400 font-bold">({inst.sigla})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteInstituicao(inst.id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
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
                  <label className="block text-slate-300 mb-1">Instituição</label>
                  <select
                    value={discInstId}
                    onChange={(e) => setDiscInstId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    {instituicoes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-slate-300 mb-1">Nome da Disciplina</label>
                  <input
                    type="text"
                    value={discNome}
                    onChange={(e) => setDiscNome(e.target.value)}
                    placeholder="Ex: Banco de Dados I"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    value={discCodigo}
                    onChange={(e) => setDiscCodigo(e.target.value)}
                    placeholder="BD101"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 uppercase"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded flex items-center justify-center"
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
                    className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{disc.nome}</span>
                      {disc.codigo && (
                        <span className="ml-2 text-indigo-400 font-mono text-[11px]">
                          [{disc.codigo}]
                        </span>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Instituição: {disc.instituicao_nome || 'Geral'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDisciplina(disc.id)}
                      className="text-slate-400 hover:text-rose-400 p-1"
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
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">
                  Caminho do Banco de Dados SQLite (.db):
                </span>
                <code className="block p-2.5 rounded bg-black/60 font-mono text-emerald-400 text-xs break-all border border-slate-800">
                  {dbPath}
                </code>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
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
