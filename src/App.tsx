import React, { useState, useEffect } from 'react';
import { ExamBuilder } from './components/ExamBuilder';
import { QuestionBankModal } from './components/QuestionBankModal';
import { SettingsModal } from './components/SettingsModal';
import { GraduationCap, Database, Settings, ShieldCheck, Sun, Moon, HardDrive } from 'lucide-react';

export const App: React.FC = () => {
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'inst' | 'disc' | 'db'>('inst');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Tema Dark (Slate Moderno) / Light com persistência em localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Padrão Dark Moderno (Slate)
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-monokai-panel text-slate-900 dark:text-monokai-fg overflow-hidden font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white print:text-black print:block transition-colors duration-200">
      {/* Top Navbar Global do Aplicativo (Oculta na Impressão) */}
      <header className="app-header h-12 bg-white dark:bg-monokai-panel border-b border-slate-200 dark:border-monokai-divider px-4 flex items-center justify-between shrink-0 no-print select-none transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 dark:from-monokai-pink dark:to-monokai-purple flex items-center justify-center shadow-md text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-800 dark:text-monokai-fg flex items-center gap-2">
              Avaliador Acadêmico Desktop
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                100% Offline &bull; SQLite
              </span>
            </h1>
          </div>
        </div>

        {/* Botões Globais de Ferramentas */}
        <div className="flex items-center gap-2">
          {/* Botão de Alternar Modo DARK (Slate Moderno) / LIGHT */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm active:scale-95 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border flex items-center gap-2"
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro (Slate)'}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-100">Modo Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-slate-800">Modo Claro</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsQuestionBankOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border flex items-center gap-1.5 transition shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
            Banco de Questões
          </button>

          <button
            onClick={() => {
              setSettingsInitialTab('db');
              setIsSettingsOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border flex items-center gap-1.5 transition shadow-sm"
            title="Exportar ou Restaurar Backup do Banco de Dados (.sisprova)"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-500 dark:text-monokai-green" />
            Backup (.sisprova)
          </button>

          <button
            onClick={() => {
              setSettingsInitialTab('inst');
              setIsSettingsOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border flex items-center gap-1.5 transition shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-monokai-comment" />
            Configurações
          </button>
        </div>
      </header>

      {/* Área Central Split-Pane */}
      <main className="flex-1 overflow-hidden print:h-auto print:w-full print:overflow-visible print:bg-white print:block">
        <ExamBuilder
          key={refreshKey}
          onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
          onOpenSettings={(tab = 'inst') => {
            setSettingsInitialTab(tab);
            setIsSettingsOpen(true);
          }}
        />
      </main>

      {/* Modal do Banco de Questões Relacional */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => {
          setIsQuestionBankOpen(false);
          setRefreshKey((k) => k + 1);
        }}
        onSelectQuestion={(q) => {
          window.dispatchEvent(new CustomEvent('add-exam-question', { detail: q }));
          setIsQuestionBankOpen(false);
        }}
      />

      {/* Modal de Configurações Acadêmicas & SQLite */}
      <SettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsInitialTab}
        onClose={() => {
          setIsSettingsOpen(false);
          setRefreshKey((k) => k + 1);
        }}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default App;
