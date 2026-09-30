import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  BookOpen,
  HardDrive,
  Plus,
  Trash2,
  X,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../services/api';
import type { Instituicao, Disciplina } from '../types';
import { processImageFileToBase64 } from '../utils/image';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  initialTab?: 'inst' | 'disc' | 'db';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  initialTab = 'inst',
}) => {
  const [activeTab, setActiveTab] = useState<'inst' | 'disc' | 'db'>(initialTab);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [dbPath, setDbPath] = useState<string>('');

  // Form Instituição
  const [instNome, setInstNome] = useState('');
  const [instSigla, setInstSigla] = useState('');
  const [instLogoBase64, setInstLogoBase64] = useState<string | null>(null);

  // Form Disciplina
  const [discInstId, setDiscInstId] = useState<number>(1);
  const [discNome, setDiscNome] = useState('');
  const [discCodigo, setDiscCodigo] = useState('');

  // Estados e Handlers de Backup e Restauração (MELH-09)
  const [backupLoading, setBackupLoading] = useState<boolean>(false);
  const [backupFeedback, setBackupFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    if (isOpen) {
      setActiveTab(initialTab);
      setBackupFeedback(null);
      carregar();
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleAddInstituicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instNome.trim()) return;
    try {
      await api.saveInstituicao({
        nome: instNome.trim(),
        sigla: instSigla.trim() ? instSigla.trim() : null,
        logo_base64: instLogoBase64 || null,
      });
      setInstNome('');
      setInstSigla('');
      setInstLogoBase64(null);
      await carregar();
      onUpdated();
    } catch (err) {
      alert(`Erro: ${err}`);
    }
  };

  const handleUpdateLogoInstituicao = async (inst: Instituicao, file: File) => {
    try {
      const base64 = await processImageFileToBase64(file);
      await api.saveInstituicao({
        id: inst.id,
        nome: inst.nome,
        sigla: inst.sigla,
        logo_base64: base64,
      });
      await carregar();
      onUpdated();
    } catch (err) {
      alert(`Erro ao processar imagem do brasão: ${err}`);
    }
  };

  const handleRemoveLogoInstituicao = async (inst: Instituicao) => {
    try {
      await api.saveInstituicao({
        id: inst.id,
        nome: inst.nome,
        sigla: inst.sigla,
        logo_base64: null,
      });
      await carregar();
      onUpdated();
    } catch (err) {
      alert(`Erro ao remover brasão: ${err}`);
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

  const handleExportBackup = async () => {
    try {
      setBackupLoading(true);
      setBackupFeedback(null);
      const defaultName = `SisProva_Backup_${new Date().toISOString().split('T')[0]}.sisprova`;
      const path = await api.exportBackupDialog(defaultName);
      if (path) {
        setBackupFeedback({
          message: `Backup exportado com sucesso em: ${path}`,
          type: 'success',
        });
      }
    } catch (err) {
      setBackupFeedback({
        message: `Falha ao exportar backup: ${err}`,
        type: 'error',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImportBackup = async () => {
    if (
      !confirm(
        'ATENÇÃO: A restauração de backup substituirá todos os dados atuais do banco de dados local por aqueles contidos no arquivo.\n\nUm backup de segurança (.bak) do seu banco atual será gerado automaticamente.\n\nDeseja continuar?'
      )
    ) {
      return;
    }

    try {
      setBackupLoading(true);
      setBackupFeedback(null);
      const path = await api.importBackupDialog();
      if (path) {
        await carregar();
        onUpdated();
        setBackupFeedback({
          message: `Backup restaurado com sucesso a partir de: ${path}. Todos os dados foram sincronizados!`,
          type: 'success',
        });
      }
    } catch (err) {
      setBackupFeedback({
        message: `Erro ao restaurar arquivo de backup: ${err}`,
        type: 'error',
      });
    } finally {
      setBackupLoading(false);
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
              <form onSubmit={handleAddInstituicao} className="space-y-2.5 p-3 bg-slate-50 dark:bg-monokai-panel/60 rounded-xl border border-slate-200 dark:border-monokai-border">
                <div className="flex gap-2 items-end">
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
                    <Plus className="w-3.5 h-3.5" /> Cadastrar
                  </button>
                </div>

                {/* Seleção de Brasão para nova instituição */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-monokai-border">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-monokai-sub font-medium text-[11px]">Brasão / Logotipo:</span>
                    {instLogoBase64 ? (
                      <div className="flex items-center gap-2">
                        <img src={instLogoBase64} alt="Preview" className="w-6 h-6 object-contain bg-white rounded border border-slate-300" />
                        <span className="text-emerald-600 dark:text-monokai-green text-[11px] font-semibold">Imagem anexada</span>
                        <button
                          type="button"
                          onClick={() => setInstLogoBase64(null)}
                          className="text-rose-500 hover:underline text-[11px]"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-monokai-comment text-[11px] italic">Nenhum brasão anexado</span>
                    )}
                  </div>
                  <label className="cursor-pointer px-2 py-0.5 text-[11px] bg-white dark:bg-monokai-card hover:bg-slate-100 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border rounded flex items-center gap-1 transition">
                    <Upload className="w-3 h-3 text-indigo-500 dark:text-monokai-cyan" />
                    <span>{instLogoBase64 ? 'Trocar Imagem' : 'Anexar Brasão (PNG/JPG/SVG)'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const b64 = await processImageFileToBase64(file);
                            setInstLogoBase64(b64);
                          } catch (err) {
                            alert(`Erro ao ler imagem: ${err}`);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </form>

              <div className="space-y-2 mt-4">
                <div className="text-[11px] font-bold text-slate-500 dark:text-monokai-comment uppercase tracking-wider">
                  Instituições Cadastradas ({instituicoes.length})
                </div>
                {instituicoes.map((inst) => (
                  <div
                    key={inst.id}
                    className="p-3 bg-slate-50 dark:bg-monokai-card/60 border border-slate-200 dark:border-monokai-border rounded-lg flex items-center justify-between shadow-sm gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Brasão Thumbnail */}
                      <div className="w-10 h-10 bg-white rounded border border-slate-200 dark:border-monokai-border p-1 flex items-center justify-center shrink-0 shadow-2xs">
                        {inst.logo_base64 ? (
                          <img
                            src={inst.logo_base64}
                            alt={`Brasão ${inst.nome}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300 dark:text-monokai-comment" />
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-slate-900 dark:text-monokai-fg flex items-center gap-1.5">
                          <span>{inst.nome}</span>
                          {inst.sigla && (
                            <span className="text-indigo-600 dark:text-monokai-cyan font-bold">({inst.sigla})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <label className="cursor-pointer text-indigo-600 dark:text-monokai-cyan hover:underline font-medium">
                            {inst.logo_base64 ? 'Trocar brasão' : '+ Incluir brasão'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpdateLogoInstituicao(inst, file);
                              }}
                            />
                          </label>
                          {inst.logo_base64 && (
                            <>
                              <span className="text-slate-300 dark:text-monokai-border">•</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveLogoInstituicao(inst)}
                                className="text-rose-500 hover:text-rose-700 text-[11px]"
                              >
                                Remover brasão
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteInstituicao(inst.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-monokai-panel transition"
                      title="Excluir instituição"
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
            <div className="space-y-4">
              {backupFeedback && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition ${
                    backupFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {backupFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  )}
                  <div className="flex-1 break-all leading-relaxed">
                    {backupFeedback.message}
                  </div>
                </div>
              )}

              {/* Seção de Backup e Restauração Transacional */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-monokai-card/70 border border-slate-200 dark:border-monokai-border space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-slate-800 dark:text-monokai-fg text-xs uppercase tracking-wide">
                    Backup e Restauração do Sistema (MELH-09)
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-monokai-comment leading-relaxed">
                  Exporte um arquivo único de segurança contendo todas as instituições, disciplinas, questões com KaTeX/Mermaid e avaliações cadastradas. O arquivo pode ser guardado em pendrives ou transferido para outro computador.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Card Fazer Backup */}
                  <div className="p-3 bg-white dark:bg-monokai-panel rounded-lg border border-slate-200 dark:border-monokai-border flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-monokai-fg flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-monokai-cyan" />
                        Fazer Backup Completo
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-monokai-comment mt-1">
                        Gera snapshot íntegro em formato <code>.sisprova</code> via comando VACUUM atômico.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={backupLoading}
                      onClick={handleExportBackup}
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      {backupLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Exportar (.sisprova)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Card Restaurar Backup */}
                  <div className="p-3 bg-white dark:bg-monokai-panel rounded-lg border border-slate-200 dark:border-monokai-border flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-monokai-fg flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        Restaurar Backup
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-monokai-comment mt-1">
                        Carrega um arquivo <code>.sisprova</code> ou <code>.db</code> com validação de integridade.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={backupLoading}
                      onClick={handleImportBackup}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      {backupLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-amber-500" />
                          Importar (.sisprova)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informações Técnicas */}
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
