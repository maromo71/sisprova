import React, { useState } from 'react';
import { ExamBuilder } from './components/ExamBuilder';
import { QuestionBankModal } from './components/QuestionBankModal';
import { SettingsModal } from './components/SettingsModal';
import { GraduationCap, Database, Settings, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white print:text-black print:block">
      {/* Top Navbar Global do Aplicativo (Oculta na Impressão) */}
      <header className="app-header h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 no-print select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Avaliador Acadêmico Desktop
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                100% Offline &bull; SQLite
              </span>
            </h1>
          </div>
        </div>

        {/* Botões Globais de Ferramentas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuestionBankOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 flex items-center gap-1.5 transition shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Banco de Questões
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 flex items-center gap-1.5 transition shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            Configurações
          </button>
        </div>
      </header>

      {/* Área Central Split-Pane */}
      <main className="flex-1 overflow-hidden print:h-auto print:w-full print:overflow-visible print:bg-white print:block">
        <ExamBuilder
          key={refreshKey}
          onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      {/* Modal do Banco de Questões Relacional */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => {
          setIsQuestionBankOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Modal de Configurações Acadêmicas & SQLite */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default App;
