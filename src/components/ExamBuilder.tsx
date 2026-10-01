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
  Edit2,
  FileSpreadsheet,
  Building,
  Layers,
  Shuffle,
  Download,
  Loader2,
  Check,
  X,
  Copy,
  FilePlus,
  AlertTriangle,
  Undo2,
  Redo2,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react';
import { processImageFileToBase64 } from '../utils/image';
import { A4Preview } from './A4Preview';
import { AnswerSheetPreview, type AnswerSheetLayout } from './AnswerSheetPreview';
import { EditExamQuestionModal } from './EditExamQuestionModal';
import { ConsolidatedAnswerKeyPreview } from './ConsolidatedAnswerKeyPreview';
import { VariationsConfigModal } from './VariationsConfigModal';
import { LayoutSettingsModal } from './LayoutSettingsModal';
import {
  type LayoutPrintConfig,
  DEFAULT_LAYOUT_CONFIG,
  STORAGE_KEY_LAYOUT_CONFIG,
} from '../types/layout';
import { useExamHistory } from '../hooks/useExamHistory';
import {
  type VariacoesConfig,
  type TipoVariacao,
  VARIACOES_PADRAO,
  gerarExamVariacao,
} from '../utils/shuffle';
import { exportElementToPdf } from '../services/pdfExport';
import { exportExamToLatex } from '../services/latexExport';
import { exportExamToDocx } from '../services/docxExport';
import { api } from '../services/api';
import { formatarDataBR } from '../utils/date';
import type {
  Instituicao,
  Disciplina,
  QuestaoCompleta,
  LiveExamState,
  GrauDificuldade,
  TipoQuestao,
  AvaliacaoResumo,
  AlternativaInput,
  MapaEstatisticasUso,
} from '../types';

interface ExamBuilderProps {
  onOpenQuestionBank: () => void;
  onOpenSettings: (tab?: 'inst' | 'disc' | 'db') => void;
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
  const [instNome, setInstNome] = useState<string>('INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA');
  const [instSigla, setInstSigla] = useState<string>('IFSP');
  const [instLogo, setInstLogo] = useState<string | null>(null);
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
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Modo de visualização do documento: Caderno de Prova vs Folha de Respostas (OMR) vs Gabarito Consolidado
  const [previewDocType, setPreviewDocType] = useState<
    'prova' | 'folha_respostas' | 'gabarito_consolidado'
  >('prova');
  const [answerSheetLayout, setAnswerSheetLayout] = useState<AnswerSheetLayout>('1_per_page');

  // Configurações de Variações de Prova (MELH-02: Tipos A, B, C, D)
  const [variacoesConfig, setVariacoesConfig] = useState<VariacoesConfig>(() => {
    const saved = localStorage.getItem('sisprova_variacoes_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Erro ao carregar variações salvas:', e);
      }
    }
    return VARIACOES_PADRAO;
  });
  const [activeVariacaoTipo, setActiveVariacaoTipo] = useState<TipoVariacao>('A');
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingLatex, setIsExportingLatex] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [pdfToast, setPdfToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [examToDelete, setExamToDelete] = useState<AvaliacaoResumo | null>(null);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);
  const [estatisticasUso, setEstatisticasUso] = useState<MapaEstatisticasUso>({});
  const [layoutConfig, setLayoutConfig] = useState<LayoutPrintConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAYOUT_CONFIG);
      if (saved) {
        return { ...DEFAULT_LAYOUT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Erro ao ler layoutConfig:', e);
    }
    return DEFAULT_LAYOUT_CONFIG;
  });

  const handleLayoutConfigChange = (newConfig: LayoutPrintConfig) => {
    setLayoutConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_LAYOUT_CONFIG, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Erro ao salvar layoutConfig:', e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  const handleUpdateVariacoesConfig = (novaConfig: VariacoesConfig) => {
    setVariacoesConfig(novaConfig);
    localStorage.setItem('sisprova_variacoes_config', JSON.stringify(novaConfig));
  };

  // Histórico de Alterações com Desfazer/Refazer (MELH-07)
  const { recordChange, undo, redo, resetHistory, canUndo, canRedo } = useExamHistory({
    examItems,
    titulo,
    instrucoes,
    dataAplicacao,
    pesoTotal,
  });

  const pushSnapshot = (customItems?: typeof examItems) => {
    recordChange({
      examItems: customItems ?? examItems,
      titulo,
      instrucoes,
      dataAplicacao,
      pesoTotal,
    });
  };

  const handleUndo = () => {
    const prev = undo();
    if (prev) {
      setExamItems(prev.examItems);
      setTitulo(prev.titulo);
      setInstrucoes(prev.instrucoes);
      setDataAplicacao(prev.dataAplicacao);
      setPesoTotal(prev.pesoTotal);
      setPdfToast({
        message: 'Ação desfeita (Ctrl+Z)',
        type: 'success',
      });
      setTimeout(() => setPdfToast(null), 2000);
    }
  };

  const handleRedo = () => {
    const next = redo();
    if (next) {
      setExamItems(next.examItems);
      setTitulo(next.titulo);
      setInstrucoes(next.instrucoes);
      setDataAplicacao(next.dataAplicacao);
      setPesoTotal(next.pesoTotal);
      setPdfToast({
        message: 'Ação refeita (Ctrl+Y)',
        type: 'success',
      });
      setTimeout(() => setPdfToast(null), 2000);
    }
  };

  // Atalhos de teclado globais para desfazer / refazer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, examItems, titulo, instrucoes, dataAplicacao, pesoTotal]);

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
  const [inlineRespostaEsperada, setInlineRespostaEsperada] = useState<string>(
    'Pelo Teorema Mestre com a=2, b=2 e f(n)=O(n), recai no Caso 2 com T(n) = O(n log n).'
  );
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
      const [insts, discs, quests, avs, stats] = await Promise.all([
        api.getInstituicoes(),
        api.getDisciplinas(),
        api.getQuestoes(),
        api.getAvaliacoes(),
        api.getQuestoesEstatisticasUso(),
      ]);

      setInstituicoes(insts);
      setDisciplinas(discs);
      setTodasQuestoes(quests);
      setAvaliacoesSalvas(avs);
      setEstatisticasUso(stats || {});

      if (insts.length > 0) {
        const found = insts.find((i) => i.id === selectedInstId) || insts[0];
        setSelectedInstId(found.id);
        setInstNome(found.nome);
        setInstSigla(found.sigla || '');
        setInstLogo(found.logo_base64 || null);
      }
      if (discs.length > 0) {
        setSelectedDiscId((prev) => (discs.some((d) => d.id === prev) ? prev : discs[0].id));
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

  // Escuta evento global para adicionar questão selecionada no Banco de Questões
  useEffect(() => {
    const handleCustomAdd = (e: Event) => {
      const customEvt = e as CustomEvent<QuestaoCompleta>;
      if (customEvt.detail) {
        handleAddQuestionToExam(customEvt.detail);
      }
    };
    window.addEventListener('add-exam-question', handleCustomAdd);
    return () => window.removeEventListener('add-exam-question', handleCustomAdd);
  }, [examItems, pesoTotal, todasQuestoes]);

  // Seleção rápida de instituição no dropdown
  const handleSelectInstituicao = (id: number) => {
    setSelectedInstId(id);
    const found = instituicoes.find((i) => i.id === id);
    if (found) {
      setInstNome(found.nome);
      setInstSigla(found.sigla || '');
      setInstLogo(found.logo_base64 || null);
    }
  };

  // Upload e remoção do Brasão Institucional na Prova
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await processImageFileToBase64(file);
      setInstLogo(base64);
    } catch (err) {
      alert(`Erro ao processar imagem do brasão: ${err}`);
    }
  };

  const handleRemoveLogo = () => {
    setInstLogo(null);
  };

  // Instituição e Disciplina selecionadas (Live Reactive State)
  const instituicaoAtual: Instituicao = {
    id: selectedInstId || 1,
    nome: instNome || 'INSTITUIÇÃO DE ENSINO',
    sigla: instSigla.trim() ? instSigla.trim() : null,
    logo_base64: instLogo || null,
  };
  const disciplinaAtual = disciplinas.find((d) => d.id === selectedDiscId) || null;

  // Soma dinâmica da pontuação das questões na avaliação (atualização em tempo real do preview)
  const somaPontuacaoQuestoes = React.useMemo(() => {
    return Number(
      examItems.reduce((acc, it) => acc + (Number(it.valor_pontuacao) || 0), 0).toFixed(2)
    );
  }, [examItems]);

  // Se houver questões na prova, o valor total é a soma real das questões; caso contrário, utiliza pesoTotal base
  const pesoTotalEfetivo = examItems.length > 0 ? somaPontuacaoQuestoes : pesoTotal;

  // Mantém pesoTotal sincronizado com a soma das questões quando houver itens
  useEffect(() => {
    if (examItems.length > 0) {
      const soma = Number(
        examItems.reduce((acc, it) => acc + (Number(it.valor_pontuacao) || 0), 0).toFixed(2)
      );
      if (soma !== pesoTotal) {
        setPesoTotal(soma);
      }
    }
  }, [examItems, pesoTotal]);

  // Estado consolidado para o Live Preview (usando useDeferredValue para garantir 60 FPS contínuos)
  const rawExamState: LiveExamState = {
    instituicao: instituicaoAtual,
    disciplina: disciplinaAtual,
    titulo,
    instrucoes,
    data_aplicacao: dataAplicacao,
    peso_total: pesoTotalEfetivo,
    itens: examItems,
  };

  const deferredExamState = useDeferredValue(rawExamState);

  // Calcula a versão do exame a exibir dependendo se Provas Múltiplas estão ativas
  const examToDisplay = React.useMemo(() => {
    if (!variacoesConfig.ativo) {
      return deferredExamState;
    }
    return gerarExamVariacao(deferredExamState, activeVariacaoTipo, variacoesConfig);
  }, [deferredExamState, activeVariacaoTipo, variacoesConfig]);

  // Executa o fluxo de impressão padronizado via CSS @media print
  const handlePrint = () => {
    window.print();
  };

  // Exportação Direta para PDF Nativo sem Diálogo do Navegador (MELH-03)
  const handleExportPdf = async () => {
    let targetElement: HTMLElement | null = null;
    let docSuffix = 'Prova';

    if (previewDocType === 'prova') {
      targetElement = document.getElementById('printable-a4-sheet');
      const tipoPart = variacoesConfig.ativo ? `_Tipo_${activeVariacaoTipo}` : '';
      const modePart = showAnswers ? '_Versao_Gabarito' : '_Versao_Aluno';
      docSuffix = `Prova${tipoPart}${modePart}`;
    } else if (previewDocType === 'folha_respostas') {
      targetElement = document.getElementById('printable-answer-sheet');
      const tipoPart = variacoesConfig.ativo ? `_Tipo_${activeVariacaoTipo}` : '';
      const modePart = showAnswers ? '_Mascara_Gabarito' : '_Folha_Aluno';
      docSuffix = `Folha_OMR${tipoPart}${modePart}`;
    } else {
      targetElement = document.getElementById('printable-consolidated-key');
      docSuffix = 'Gabarito_Consolidado_Geral';
    }

    if (!targetElement) {
      alert('Elemento da prévia A4 não encontrado para exportação.');
      return;
    }

    setIsExportingPdf(true);
    setPdfToast(null);

    const safeTitle = (titulo || 'Avaliacao').replace(/[\\/:*?"<>|]/g, '_').trim();
    const defaultFileName = `${safeTitle}_${docSuffix}.pdf`;

    try {
      const result = await exportElementToPdf(targetElement, {
        title: `${titulo || 'Avaliação Acadêmica'} - ${docSuffix}`,
        author: instNome || 'SisProva',
        subject: disciplinaAtual?.nome || 'Avaliação Acadêmica',
        defaultFileName,
      });

      if (result.success) {
        setPdfToast({
          message: `PDF salvo com sucesso! ${result.filePath ? `(${result.filePath})` : ''}`,
          type: 'success',
        });
        setTimeout(() => setPdfToast(null), 6000);
      } else if (!result.cancelled) {
        setPdfToast({
          message: `Erro ao exportar PDF: ${result.error || 'Erro desconhecido'}`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Erro na exportação para PDF:', err);
      setPdfToast({
        message: `Falha ao gerar PDF: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Exportação para Word (.docx) editável (MELH-04)
  const handleExportDocx = async () => {
    if (examItems.length === 0) {
      alert('Adicione ao menos uma questão à avaliação antes de exportar para Word (.docx).');
      return;
    }
    setIsExportingDocx(true);
    setPdfToast(null);

    const safeTitle = (titulo || 'Avaliacao').replace(/[\\/:*?"<>|]/g, '_').trim();
    const tipoPart = variacoesConfig.ativo ? `_Tipo_${activeVariacaoTipo}` : '';
    const modePart = showAnswers ? '_Gabarito' : '_Aluno';
    const defaultFileName = `${safeTitle}${tipoPart}${modePart}.docx`;

    try {
      const result = await exportExamToDocx(examToDisplay, {
        showAnswers,
        variacaoTipo: variacoesConfig.ativo ? activeVariacaoTipo : null,
        defaultFileName,
        cabecalhoEstilo: layoutConfig.cabecalhoEstilo,
      });

      if (result.success) {
        setPdfToast({
          message: `Documento Word (.docx) salvo com sucesso! ${result.filePath ? `(${result.filePath})` : ''}`,
          type: 'success',
        });
        setTimeout(() => setPdfToast(null), 6000);
      } else if (!result.cancelled) {
        setPdfToast({
          message: `Erro ao exportar Word: ${result.error || 'Erro desconhecido'}`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Erro na exportação para Word (.docx):', err);
      setPdfToast({
        message: `Falha ao gerar Word (.docx): ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Exportação para LaTeX (.tex) compilável (MELH-04)
  const handleExportLatex = async () => {
    if (examItems.length === 0) {
      alert('Adicione ao menos uma questão à avaliação antes de exportar para LaTeX (.tex).');
      return;
    }
    setIsExportingLatex(true);
    setPdfToast(null);

    const safeTitle = (titulo || 'Avaliacao').replace(/[\\/:*?"<>|]/g, '_').trim();
    const tipoPart = variacoesConfig.ativo ? `_Tipo_${activeVariacaoTipo}` : '';
    const modePart = showAnswers ? '_Gabarito' : '_Aluno';
    const defaultFileName = `${safeTitle}${tipoPart}${modePart}.tex`;

    try {
      const result = await exportExamToLatex(examToDisplay, {
        showAnswers,
        variacaoTipo: variacoesConfig.ativo ? activeVariacaoTipo : null,
        defaultFileName,
        cabecalhoEstilo: layoutConfig.cabecalhoEstilo,
      });

      if (result.success) {
        setPdfToast({
          message: `Arquivo LaTeX (.tex) salvo com sucesso! ${result.filePath ? `(${result.filePath})` : ''}`,
          type: 'success',
        });
        setTimeout(() => setPdfToast(null), 6000);
      } else if (!result.cancelled) {
        setPdfToast({
          message: `Erro ao exportar LaTeX: ${result.error || 'Erro desconhecido'}`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Erro na exportação para LaTeX:', err);
      setPdfToast({
        message: `Falha ao gerar LaTeX: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setIsExportingLatex(false);
    }
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
        peso_total: pesoTotalEfetivo,
        itens: examItems.map((item, idx) => ({
          questao_id: item.questao.id,
          ordem: idx + 1,
          valor_pontuacao: item.valor_pontuacao,
        })),
      };

      const salva = await api.saveAvaliacao(payload);
      setExamId(salva.id);

      // Sincroniza o nome/sigla da instituição no SQLite se estiver associada
      if (selectedInstId && instNome.trim()) {
        try {
          await api.saveInstituicao({
            id: selectedInstId,
            nome: instNome.trim(),
            sigla: instSigla.trim() ? instSigla.trim() : null,
            logo_base64: instLogo || null,
          });
          setInstituicoes((prev) =>
            prev.map((i) =>
              i.id === selectedInstId
                ? { ...i, nome: instNome.trim(), sigla: instSigla.trim() ? instSigla.trim() : null }
                : i
            )
          );
        } catch (e) {
          console.warn('Aviso ao sincronizar instituição:', e);
        }
      }

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

      const foundInst = instituicoes.find((i) => i.id === detalhe.instituicao_id);
      if (foundInst) {
        setInstNome(foundInst.nome);
        setInstSigla(foundInst.sigla || '');
        setInstLogo(foundInst.logo_base64 || null);
      }

      setSelectedDiscId(detalhe.disciplina_id);
      setTitulo(detalhe.titulo);
      setInstrucoes(detalhe.instrucoes || '');
      setDataAplicacao(detalhe.data_aplicacao || new Date().toISOString().split('T')[0]);
      setPesoTotal(detalhe.peso_total);

      const loadedItems = detalhe.itens.map((it) => ({
        ordem: it.ordem,
        valor_pontuacao: it.valor_pontuacao,
        questao: it.questao,
      }));
      setExamItems(loadedItems);
      resetHistory({
        examItems: loadedItems,
        titulo: detalhe.titulo,
        instrucoes: detalhe.instrucoes || '',
        dataAplicacao: detalhe.data_aplicacao || new Date().toISOString().split('T')[0],
        pesoTotal: detalhe.peso_total,
      });

      setIsLoadModalOpen(false);
    } catch (err) {
      alert(`Falha ao abrir avaliação: ${err}`);
    }
  };

  // Iniciar nova avaliação em branco
  const handleNewExam = () => {
    if (
      examItems.length > 0 &&
      !window.confirm(
        'Deseja iniciar uma nova avaliação em branco? Alterações não salvas na avaliação atual serão descartadas.'
      )
    ) {
      return;
    }
    const defaultTitulo = 'NOVA AVALIAÇÃO ACADÊMICA';
    const defaultInstrucoes =
      '1. É proibido o uso de calculadoras ou dispositivos eletrônicos.\n2. Respostas a lápis não dão direito à revisão de nota.\n3. Justifique todas as respostas dissertativas.';
    const defaultData = new Date().toISOString().split('T')[0];
    const defaultPeso = 10.0;

    setExamId(null);
    setTitulo(defaultTitulo);
    setInstrucoes(defaultInstrucoes);
    setDataAplicacao(defaultData);
    setPesoTotal(defaultPeso);
    setExamItems([]);

    resetHistory({
      examItems: [],
      titulo: defaultTitulo,
      instrucoes: defaultInstrucoes,
      dataAplicacao: defaultData,
      pesoTotal: defaultPeso,
    });

    setPdfToast({
      message: 'Nova avaliação em branco iniciada.',
      type: 'success',
    });
    setTimeout(() => setPdfToast(null), 3000);
  };

  // Clonar avaliação no SQLite (MELH-06)
  const handleCloneExam = async (id: number, customTitle?: string) => {
    try {
      setIsCloning(true);
      const clonada = await api.cloneAvaliacao(id, customTitle);
      const avs = await api.getAvaliacoes();
      setAvaliacoesSalvas(avs);

      // Carrega diretamente a avaliação clonada no editor
      await handleLoadSavedExam(clonada.id);

      setPdfToast({
        message: `Avaliação "${clonada.titulo}" clonada com sucesso!`,
        type: 'success',
      });
      setTimeout(() => setPdfToast(null), 5000);
    } catch (err) {
      console.error('Erro ao clonar avaliação:', err);
      alert(`Erro ao clonar avaliação: ${err}`);
    } finally {
      setIsCloning(false);
    }
  };

  // Excluir avaliação com segurança (Mantém 100% o Banco de Questões)
  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await api.deleteAvaliacao(examToDelete.id);
      const avs = await api.getAvaliacoes();
      setAvaliacoesSalvas(avs);

      // Se a avaliação excluída era a atualmente aberta na tela, reseta o identificador
      if (examId === examToDelete.id) {
        setExamId(null);
      }

      setPdfToast({
        message: `Avaliação "${examToDelete.titulo}" excluída com sucesso. O Banco de Questões permanece intacto!`,
        type: 'success',
      });
      setTimeout(() => setPdfToast(null), 5000);
      setExamToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir avaliação:', err);
      alert(`Erro ao excluir avaliação: ${err}`);
    }
  };

  // Adicionar questão do banco de questões à prova
  const handleAddQuestionToExam = (q: QuestaoCompleta) => {
    if (examItems.some((it) => it.questao.id === q.id)) {
      alert('Esta questão já foi incluída na avaliação.');
      return;
    }
    pushSnapshot();
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
    pushSnapshot();
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
    pushSnapshot();
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

    const targetDiscId = disciplinas.some((d) => d.id === selectedDiscId)
      ? selectedDiscId
      : disciplinas[0]?.id;

    if (!targetDiscId) {
      alert('Nenhuma disciplina válida encontrada. Cadastre uma disciplina primeiro nas Configurações.');
      return;
    }

    try {
      const novaQuestao = await api.saveQuestao({
        disciplina_id: targetDiscId,
        titulo: inlineTitulo,
        enunciado_markdown: inlineEnunciado,
        diagrama_mermaid: inlineMermaid.trim() ? inlineMermaid : null,
        grau_dificuldade: inlineDificuldade,
        tipo_questao: inlineTipo,
        linhas_resposta: inlineTipo === 'OBJETIVA' ? 0 : inlineLinhas,
        resposta_esperada: inlineRespostaEsperada.trim() ? inlineRespostaEsperada : null,
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

  const handleInlineAddAlternativa = () => {
    setInlineAlternativas((prev) => [
      ...prev,
      { texto: '', correta: false },
    ]);
  };

  const handleInlineRemoveAlternativa = (index: number) => {
    if (inlineAlternativas.length <= 2) {
      alert('A questão objetiva precisa de no mínimo 2 alternativas.');
      return;
    }
    const wasCorrect = inlineAlternativas[index].correta;
    setInlineAlternativas((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (wasCorrect && next.length > 0) {
        next[0].correta = true;
      }
      return next;
    });
  };

  // Salvar questão editada diretamente da avaliação
  const handleSaveEditedQuestion = async (
    index: number,
    updatedData: {
      id?: number | null;
      disciplina_id: number;
      titulo: string;
      enunciado_markdown: string;
      diagrama_mermaid: string | null;
      grau_dificuldade: GrauDificuldade;
      tipo_questao: TipoQuestao;
      linhas_resposta: number;
      resposta_esperada?: string | null;
      alternativas: AlternativaInput[];
    },
    valor_pontuacao: number,
    isNewCopy: boolean
  ) => {
    try {
      const targetDiscId = disciplinas.some((d) => d.id === updatedData.disciplina_id)
        ? updatedData.disciplina_id
        : (disciplinas[0]?.id ?? selectedDiscId);

      const saved = await api.saveQuestao({
        id: isNewCopy ? null : updatedData.id,
        disciplina_id: targetDiscId,
        titulo: updatedData.titulo,
        enunciado_markdown: updatedData.enunciado_markdown,
        diagrama_mermaid: updatedData.diagrama_mermaid,
        grau_dificuldade: updatedData.grau_dificuldade,
        tipo_questao: updatedData.tipo_questao,
        linhas_resposta: updatedData.linhas_resposta,
        resposta_esperada: updatedData.resposta_esperada,
        alternativas: updatedData.alternativas,
      });

      // Recarrega banco
      const quests = await api.getQuestoes();
      setTodasQuestoes(quests);

      // Atualiza o item correspondente no exame
      setExamItems((prev) =>
        prev.map((it, idx) =>
          idx === index
            ? {
              ...it,
              valor_pontuacao,
              questao: saved,
            }
            : it
        )
      );
    } catch (err) {
      console.error('Erro ao salvar questão editada:', err);
      alert(`Erro ao salvar questão: ${err}`);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-100 dark:bg-monokai-panel text-slate-800 dark:text-monokai-fg print:h-auto print:w-auto print:overflow-visible print:bg-white print:block transition-colors duration-200">
      {/* ======================================================== */}
      {/* PAINEL ESQUERDO: EDITOR & FORMULÁRIOS (45% a 50% de largura) */}
      {/* ======================================================== */}
      <aside className="w-[48%] h-full flex flex-col border-r border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-bg no-print z-10 transition-colors duration-200">
        {/* Barra Superior do Editor */}
        <div className="p-3 border-b border-slate-200 dark:border-monokai-border flex items-center justify-between bg-slate-50 dark:bg-monokai-panel transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-indigo-600 dark:text-monokai-cyan flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-monokai-cyan" />
              Editor de Avaliação
            </span>
            {examId && (
              <span className="text-[11px] bg-slate-100 dark:bg-monokai-card text-slate-600 dark:text-monokai-comment px-2 py-0.5 rounded border border-slate-200 dark:border-monokai-border">
                ID #{examId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Histórico Desfazer / Refazer (MELH-07) */}
            <div className="flex items-center rounded border border-slate-200 dark:border-monokai-border overflow-hidden shadow-xs mr-0.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:disabled:bg-monokai-card dark:text-monokai-fg flex items-center gap-1 transition"
                title="Desfazer última alteração (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span className="hidden sm:inline">Desfazer</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:disabled:bg-monokai-card dark:text-monokai-fg flex items-center gap-1 border-l border-slate-200 dark:border-monokai-border transition"
                title="Refazer alteração (Ctrl+Y ou Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span className="hidden sm:inline">Refazer</span>
              </button>
            </div>

            <button
              onClick={handleNewExam}
              className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border flex items-center gap-1 transition"
              title="Iniciar uma nova avaliação em branco"
            >
              <FilePlus className="w-3.5 h-3.5 text-slate-600 dark:text-monokai-fg" />
              <span>Nova</span>
            </button>

            <button
              onClick={() => setIsLoadModalOpen(true)}
              className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border flex items-center gap-1 transition"
              title="Gerenciar / Abrir avaliações salvas no SQLite"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
              <span>Abrir</span>
            </button>

            {examId && (
              <button
                onClick={() => handleCloneExam(examId)}
                disabled={isCloning}
                className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border flex items-center gap-1 transition"
                title="Clonar esta avaliação atual como uma nova prova"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                <span>{isCloning ? 'Clonando...' : 'Clonar'}</span>
              </button>
            )}

            <button
              onClick={handleSaveExam}
              disabled={isSaving}
              className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition shadow-sm ${saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-pink dark:hover:bg-monokai-pink/90 text-white'
                }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar'}
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center gap-1.5 transition shadow dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900"
              title="Imprimir ou Salvar PDF via layout A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Abas de Navegação do Editor */}
        <div className="flex border-b border-slate-200 dark:border-monokai-border bg-slate-100/70 dark:bg-monokai-panel/80 px-3 pt-2 gap-1 text-xs transition-colors duration-200">
          <button
            onClick={() => setActiveTab('questoes')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${activeTab === 'questoes'
                ? 'bg-white text-slate-900 border-slate-200 dark:bg-monokai-bg dark:text-monokai-fg dark:border-monokai-border shadow-sm'
                : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-monokai-comment dark:hover:text-monokai-fg'
              }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
            Questões na Prova ({examItems.length})
          </button>

          <button
            onClick={() => setActiveTab('nova_inline')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${activeTab === 'nova_inline'
                ? 'bg-white text-slate-900 border-slate-200 dark:bg-monokai-bg dark:text-monokai-fg dark:border-monokai-border shadow-sm'
                : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-monokai-comment dark:hover:text-monokai-fg'
              }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-monokai-green" />
            Nova Questão Rápida
          </button>

          <button
            onClick={() => setActiveTab('meta')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition flex items-center gap-1.5 ${activeTab === 'meta'
                ? 'bg-white text-slate-900 border-slate-200 dark:bg-monokai-bg dark:text-monokai-fg dark:border-monokai-border shadow-sm'
                : 'text-slate-500 border-transparent hover:text-slate-800 dark:text-monokai-comment dark:hover:text-monokai-fg'
              }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-monokai-comment" />
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
                  onClick={() => onOpenSettings('inst')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                >
                  Gerenciar Instituições & Disciplinas
                </button>
              </div>
              {/* Bloco de Configuração da Instituição no Cabeçalho */}
              <div className="p-3 bg-slate-50 dark:bg-monokai-card border border-slate-200 dark:border-monokai-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-monokai-cyan flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    Identificação da Instituição
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSettings('inst')}
                    className="text-xs text-indigo-600 dark:text-monokai-cyan hover:underline"
                  >
                    Gerenciar Instituições
                  </button>
                </div>

                {instituicoes.length > 0 && (
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-monokai-comment mb-1">
                      Carregar de Instituição Cadastrada
                    </label>
                    <select
                      value={selectedInstId}
                      onChange={(e) => handleSelectInstituicao(Number(e.target.value))}
                      className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                    >
                      {instituicoes.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.nome} {inst.sigla ? `(${inst.sigla})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-700 dark:text-monokai-sub font-medium text-xs mb-1">
                      Nome da Instituição (Texto Impresso)
                    </label>
                    <input
                      type="text"
                      value={instNome}
                      onChange={(e) => setInstNome(e.target.value)}
                      placeholder="Ex: UNIVERSIDADE FEDERAL DE SÃO PAULO"
                      className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-monokai-sub font-medium text-xs mb-1">
                      Sigla (Opcional)
                    </label>
                    <input
                      type="text"
                      value={instSigla}
                      onChange={(e) => setInstSigla(e.target.value)}
                      placeholder="Ex: UNIFESP"
                      className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-semibold uppercase"
                    />
                  </div>
                </div>

                {/* Brasão / Logotipo da Instituição na Prova */}
                <div>
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium text-xs mb-1">
                    Brasão / Logotipo da Faculdade
                  </label>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-monokai-panel rounded border border-slate-200 dark:border-monokai-border">
                    {instLogo ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded border border-slate-300 dark:border-monokai-border p-1 flex items-center justify-center shrink-0">
                          <img
                            src={instLogo}
                            alt="Brasão"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-[11px] text-emerald-600 dark:text-monokai-green font-semibold">
                            ✓ Brasão ativo no cabeçalho
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer text-indigo-600 dark:text-monokai-cyan hover:underline text-[11px] font-medium">
                              Trocar imagem
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={handleLogoFileChange}
                              />
                            </label>
                            <span className="text-slate-300 dark:text-monokai-border">•</span>
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="text-rose-500 hover:text-rose-700 text-[11px]"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400 dark:text-monokai-comment">
                          Nenhum brasão anexado
                        </span>
                        <label className="cursor-pointer px-2.5 py-1 text-xs bg-white dark:bg-monokai-card hover:bg-slate-100 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg border border-slate-300 dark:border-monokai-border rounded font-medium flex items-center gap-1.5 transition shadow-xs">
                          <Upload className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                          <span>Anexar Brasão</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoFileChange}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium text-xs">Disciplina</label>
                  <button
                    type="button"
                    onClick={() => onOpenSettings('disc')}
                    className="text-xs text-indigo-600 dark:text-monokai-cyan hover:underline"
                  >
                    Gerenciar Disciplinas
                  </button>
                </div>
                <select
                  value={selectedDiscId}
                  onChange={(e) => setSelectedDiscId(Number(e.target.value))}
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                >
                  {disciplinas.map((disc) => (
                    <option key={disc.id} value={disc.id}>
                      {disc.nome} {disc.codigo ? `[${disc.codigo}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Título da Prova</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: AVALIAÇÃO FINAL - 1º BIMESTRE"
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Data da Aplicação</label>
                  <input
                    type="date"
                    value={dataAplicacao}
                    onChange={(e) => setDataAplicacao(e.target.value)}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Valor Total (Pontos)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pesoTotal}
                    onChange={(e) => setPesoTotal(Number(e.target.value))}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-bold text-indigo-600 dark:text-monokai-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">
                  Instruções Acadêmicas (exibidas no cabeçalho)
                </label>
                <textarea
                  rows={4}
                  value={instrucoes}
                  onChange={(e) => setInstrucoes(e.target.value)}
                  placeholder="Instruções para o aluno..."
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded p-2 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* ABA: QUESTÕES NA PROVA & ADIÇÃO DO BANCO */}
          {/* ==================================================== */}
          {activeTab === 'questoes' && (
            <div className="space-y-3">
              {/* Botões de Ação do Banco e Variações */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-monokai-border gap-2">
                <span className="text-xs text-slate-500 dark:text-monokai-comment flex items-center gap-1.5 flex-wrap">
                  <span>Total:</span> <strong className="text-slate-800 dark:text-monokai-fg">{examItems.length}</strong> q. |{' '}
                  <span>Pontuação:</span>
                  <strong className="text-indigo-600 dark:text-monokai-cyan font-bold text-xs bg-indigo-50 dark:bg-monokai-cyan/20 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-monokai-cyan/40">
                    {pesoTotalEfetivo.toFixed(1)} pts
                  </strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsVariationsModalOpen(true)}
                    className={`px-2 py-1 text-xs rounded border flex items-center gap-1 transition ${variacoesConfig.ativo
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-monokai-cyan/20 dark:border-monokai-cyan dark:text-monokai-cyan font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border'
                      }`}
                    title="Configurar geração de Provas Múltiplas (Tipos A, B, C, D)"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                    <span>{variacoesConfig.ativo ? `Variações (${variacoesConfig.quantidade} tipos)` : 'Variações'}</span>
                  </button>

                  <button
                    onClick={onOpenQuestionBank}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-indigo-600 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-cyan dark:border-monokai-border rounded flex items-center gap-1.5 transition"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Banco
                  </button>
                </div>
              </div>

              {/* Seletor Rápido de Questões do Banco SQLite */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-monokai-card/60 border border-slate-200 dark:border-monokai-border space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-monokai-sub block uppercase tracking-wider">
                  Adicionar Questão Existente do Banco SQLite
                </span>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <select
                    id="quick-add-select"
                    className="flex-1 min-w-0 max-w-full truncate bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecione uma questão cadastrada...
                    </option>
                    {todasQuestoes.map((q) => {
                      const stats = estatisticasUso[q.id];
                      const totalUsos = stats?.total_usos || 0;
                      const statusStr = totalUsos === 0
                        ? '✨ Inédita'
                        : stats?.usada_recentemente
                          ? `⚠️ Recente (${stats.dias_desde_ultima_aplicacao !== null && stats.dias_desde_ultima_aplicacao !== undefined ? `${stats.dias_desde_ultima_aplicacao}d` : '<6m'})`
                          : `Usada ${totalUsos}x`;
                      return (
                        <option key={q.id} value={q.id}>
                          [{q.tipo_questao}] {q.titulo} ({q.grau_dificuldade}) — {statusStr}
                        </option>
                      );
                    })}
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
                    className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white rounded text-xs font-medium flex items-center gap-1 transition shadow-sm whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>

              {/* Lista Ordenável de Questões na Prova */}
              <div className="space-y-2 mt-3">
                {examItems.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-200 dark:border-monokai-border rounded-lg text-center text-slate-400 dark:text-monokai-comment text-xs">
                    Nenhuma questão adicionada ainda. Selecione uma questão acima ou crie uma nova
                    questão rápida.
                  </div>
                ) : (
                  examItems.map((item, index) => (
                    <div
                      key={`${item.questao.id}-${index}`}
                      className="p-3 bg-white hover:bg-slate-50 dark:bg-monokai-card dark:hover:bg-monokai-cardHover border border-slate-200 dark:border-monokai-border rounded-lg flex items-center justify-between gap-3 transition shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-indigo-50 dark:bg-monokai-panel border border-indigo-200 dark:border-monokai-border text-indigo-700 dark:text-monokai-cyan font-bold text-xs flex items-center justify-center">
                          {item.ordem}
                        </span>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-monokai-fg line-clamp-1">
                            {item.questao.titulo}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-monokai-comment">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-monokai-panel border border-slate-200 dark:border-monokai-border">
                              {item.questao.tipo_questao}
                            </span>
                            <span>{item.questao.grau_dificuldade}</span>
                            {/* Badges de Histórico Pedagógico (MELH-10) */}
                            {estatisticasUso[item.questao.id]?.usada_recentemente && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-700/60"
                                title={`Atenção pedagógica: Questão aplicada há menos de 6 meses (${estatisticasUso[item.questao.id].dias_desde_ultima_aplicacao !== null && estatisticasUso[item.questao.id].dias_desde_ultima_aplicacao !== undefined ? `${estatisticasUso[item.questao.id].dias_desde_ultima_aplicacao}d atrás` : 'recente'})!`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-monokai-yellow" /> Recente
                              </span>
                            )}
                            {(estatisticasUso[item.questao.id]?.total_usos || 0) === 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40"
                                title="Questão inédita (nunca aplicada em provas)"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-emerald-500" /> Inédita
                              </span>
                            )}
                            {item.questao.diagrama_mermaid && (
                              <span className="text-indigo-600 dark:text-monokai-cyan font-mono">Mermaid OK</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Pontuação da Questão */}
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-500 dark:text-monokai-comment text-[11px]">Pts:</span>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={item.valor_pontuacao}
                            onFocus={() => pushSnapshot()}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setExamItems((prev) =>
                                prev.map((it, i) =>
                                  i === index ? { ...it, valor_pontuacao: val } : it
                                )
                              );
                            }}
                            className="w-14 bg-slate-50 dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-1.5 py-1 text-center text-xs font-bold text-indigo-600 dark:text-monokai-cyan focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Editar Questão na Prova */}
                        <button
                          onClick={() => setEditingItemIndex(index)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-monokai-cyan hover:bg-slate-100 dark:hover:bg-monokai-panel rounded transition"
                          title="Editar esta questão (enunciado, alternativas, linhas ou diagrama)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reordenar */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-800 dark:hover:text-monokai-fg disabled:opacity-30 transition"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === examItems.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-800 dark:hover:text-monokai-fg disabled:opacity-30 transition"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Excluir da Prova */}
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-monokai-pink transition"
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
              <div className="p-2.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800/40 dark:text-indigo-300 text-[11px] leading-relaxed">
                Esta questão será salva permanentemente no SQLite e imediatamente adicionada ao
                exame. Suporta equações matemáticas LaTeX `$f(x)$` e diagramas Mermaid.
              </div>

              <div>
                <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Título da Questão</label>
                <input
                  type="text"
                  value={inlineTitulo}
                  onChange={(e) => setInlineTitulo(e.target.value)}
                  placeholder="Ex: Teorema Fundamental do Cálculo"
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-medium"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Disciplina</label>
                  <select
                    value={selectedDiscId}
                    onChange={(e) => setSelectedDiscId(Number(e.target.value))}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  >
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} {d.codigo ? `[${d.codigo}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Tipo</label>
                  <select
                    value={inlineTipo}
                    onChange={(e) => setInlineTipo(e.target.value as TipoQuestao)}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  >
                    <option value="DISSERTATIVA">Dissertativa</option>
                    <option value="OBJETIVA">Objetiva (Múltipla Escolha)</option>
                    <option value="CODIGO">Código / Programação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Dificuldade</label>
                  <select
                    value={inlineDificuldade}
                    onChange={(e) => setInlineDificuldade(e.target.value as GrauDificuldade)}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                  >
                    <option value="FACIL">Fácil</option>
                    <option value="MEDIO">Médio</option>
                    <option value="DIFICIL">Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">Pontuação</label>
                  <input
                    type="number"
                    step="0.5"
                    value={inlinePontos}
                    onChange={(e) => setInlinePontos(Number(e.target.value))}
                    className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2.5 py-1.5 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-bold text-indigo-600 dark:text-monokai-orange"
                  />
                </div>
              </div>

              {/* Botões Rápidos de Inserção de Snippets */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-500 dark:text-monokai-comment">Inserir modelo:</span>
                <button
                  type="button"
                  onClick={() =>
                    setInlineEnunciado(
                      (prev) => prev + '\n\n$$\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)$$'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border transition"
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
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:text-monokai-fg dark:border-monokai-border transition"
                >
                  + Bloco de Código (Monokai)
                </button>
              </div>

              {/* Enunciado Markdown */}
              <div>
                <label className="block text-slate-700 dark:text-monokai-sub font-medium mb-1">
                  Enunciado (Markdown + Fórmulas KaTeX)
                </label>
                <textarea
                  rows={5}
                  value={inlineEnunciado}
                  onChange={(e) => setInlineEnunciado(e.target.value)}
                  placeholder="Digite o enunciado da questão..."
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded p-2 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Editor Dedicado de Script Mermaid */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium">
                    Diagrama Mermaid (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setInlineMermaid('graph TD\n    A[Entrada] --> B[Processo]\n    B --> C[Saída]')
                    }
                    className="text-[10px] text-indigo-600 dark:text-monokai-cyan hover:underline"
                  >
                    Carregar Exemplo
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={inlineMermaid}
                  onChange={(e) => setInlineMermaid(e.target.value)}
                  placeholder="graph TD&#10;    A --> B"
                  className="w-full bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded p-2 text-slate-800 dark:text-monokai-fg focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan font-mono text-xs"
                />
              </div>

              {/* Alternativas se Objetiva */}
              {inlineTipo === 'OBJETIVA' ? (
                <div className="space-y-2 border-t border-slate-200 dark:border-monokai-border pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-monokai-sub font-medium">
                      Alternativas (Marque a correta para o gabarito)
                    </label>
                    <button
                      type="button"
                      onClick={handleInlineAddAlternativa}
                      className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-monokai-cyan dark:hover:underline"
                    >
                      <Plus className="w-3 h-3" /> + Alternativa
                    </button>
                  </div>
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
                        title="Marcar como correta"
                      />
                      <span className="w-5 font-bold text-slate-400 dark:text-monokai-comment">
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
                        className="flex-1 bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2 py-1 text-slate-800 dark:text-monokai-fg text-xs"
                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + idx)}`}
                      />
                      {inlineAlternativas.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleInlineRemoveAlternativa(idx)}
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
                    <label className="block text-slate-700 dark:text-monokai-sub font-medium">
                      Linhas de Resposta Pautadas (Espaçamento em folha)
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-monokai-comment">
                      0 = Sem pauta (para folha de resposta avulsa)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={inlineLinhas}
                      onChange={(e) => setInlineLinhas(Math.max(0, Number(e.target.value)))}
                      className="w-24 bg-white dark:bg-monokai-panel border border-slate-300 dark:border-monokai-border rounded px-2 py-1 text-slate-800 dark:text-monokai-fg text-xs font-bold focus:outline-none focus:border-indigo-500 dark:focus:border-monokai-cyan"
                    />
                    <div className="flex items-center gap-1">
                      {[0, 4, 8, 12, 16, 24].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setInlineLinhas(num)}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition ${inlineLinhas === num
                              ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-monokai-cyan dark:text-monokai-bg dark:border-monokai-cyan font-bold'
                              : 'bg-white dark:bg-monokai-panel text-slate-600 dark:text-monokai-fg border-slate-300 dark:border-monokai-border hover:bg-slate-100'
                            }`}
                        >
                          {num === 0 ? '0 (avulsa)' : `${num} lin`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Padrão de Resposta / Espelho de Correção (Opcional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-monokai-sub font-medium">
                    Padrão de Resposta / Gabarito (Opcional - Markdown/LaTeX)
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-monokai-green font-semibold">
                    Visível apenas na Versão Gabarito
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={inlineRespostaEsperada}
                  onChange={(e) => setInlineRespostaEsperada(e.target.value)}
                  placeholder="Ex: Resolução esperada, fórmula $T(n) = O(n \log n)$ ou critérios de pontuação..."
                  className="w-full bg-emerald-50/40 dark:bg-monokai-panel border border-emerald-300 dark:border-monokai-green/50 rounded p-2 text-slate-800 dark:text-monokai-fg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateInlineQuestion}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-monokai-green dark:hover:bg-monokai-green/90 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
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
      <main className="w-[52%] h-full flex flex-col bg-slate-200/90 dark:bg-monokai-panel relative overflow-hidden print:w-full print:h-auto print:overflow-visible print:bg-white print:block print:static transition-colors duration-200">
        {/* Barra de Controles da Prévia */}
        {/* Barra Superior de Controles da Prévia (2 Níveis Harmoniosos) */}
        <div className="border-b border-slate-200 dark:border-monokai-border bg-white dark:bg-monokai-panel no-print z-10 transition-colors duration-200 shadow-2xs">
          {/* NÍVEL 1: Tipo de Documento & Modo de Visualização */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-monokai-divider flex flex-wrap items-center justify-between gap-2">
            {/* Seletor Segmentado de Documento */}
            <div className="flex items-center bg-slate-100 dark:bg-monokai-card p-0.5 rounded-lg border border-slate-200 dark:border-monokai-border shadow-2xs">
              <button
                type="button"
                onClick={() => setPreviewDocType('prova')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${previewDocType === 'prova'
                    ? 'bg-white dark:bg-monokai-bg text-indigo-600 dark:text-monokai-cyan shadow-xs font-bold'
                    : 'text-slate-600 dark:text-monokai-comment hover:text-slate-900 dark:hover:text-monokai-fg'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Caderno de Prova</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDocType('folha_respostas')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${previewDocType === 'folha_respostas'
                    ? 'bg-white dark:bg-monokai-bg text-indigo-600 dark:text-monokai-cyan shadow-xs font-bold'
                    : 'text-slate-600 dark:text-monokai-comment hover:text-slate-900 dark:hover:text-monokai-fg'
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Folha OMR</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDocType('gabarito_consolidado')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${previewDocType === 'gabarito_consolidado'
                    ? 'bg-white dark:bg-monokai-bg text-indigo-600 dark:text-monokai-cyan shadow-xs font-bold'
                    : 'text-slate-600 dark:text-monokai-comment hover:text-slate-900 dark:hover:text-monokai-fg'
                  }`}
                title={
                  variacoesConfig.ativo
                    ? 'Folha de Gabaritos do Professor Consolidada (Tipos A, B, C, D)'
                    : 'Folha de Gabarito Oficial do Professor (Versão Única)'
                }
              >
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>{variacoesConfig.ativo ? 'Gabarito Consolidado' : 'Gabarito Oficial'}</span>
              </button>
            </div>

            {/* Seletor Segmentado: Versão Aluno vs Versão Gabarito */}
            <div className="flex items-center bg-slate-100 dark:bg-monokai-card p-0.5 rounded-lg border border-slate-200 dark:border-monokai-border shadow-2xs">
              <button
                type="button"
                onClick={() => setShowAnswers(false)}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${!showAnswers
                    ? 'bg-white dark:bg-monokai-bg text-indigo-700 dark:text-monokai-cyan shadow-xs font-bold'
                    : 'text-slate-600 dark:text-monokai-comment hover:text-slate-900 dark:hover:text-monokai-fg'
                  }`}
                title={
                  previewDocType === 'folha_respostas'
                    ? 'Folha de Respostas em branco para preenchimento manual do estudante'
                    : 'Versão do Aluno: pautas em branco e alternativas desmarcadas'
                }
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{previewDocType === 'folha_respostas' ? 'Folha do Aluno' : 'Versão do Aluno'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAnswers(true)}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${showAnswers
                    ? 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-monokai-comment hover:text-slate-900 dark:hover:text-monokai-fg'
                  }`}
                title={
                  previewDocType === 'folha_respostas'
                    ? 'Máscara oficial com bolhas preenchidas para correção'
                    : 'Versão Gabarito: espelho de correção docente com Markdown/KaTeX e alternativas assinaladas'
                }
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{previewDocType === 'folha_respostas' ? 'Máscara Gabarito' : 'Versão Gabarito'}</span>
              </button>
            </div>
          </div>

          {/* NÍVEL 2: Variações Antifraude + Layout OMR + Zoom + Ações de Exportação */}
          <div className="px-3 py-1.5 bg-slate-50/70 dark:bg-monokai-panel/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Esquerda: Variações de Prova ou Layout OMR */}
            <div className="flex items-center gap-2">
              {/* Opções de Layout quando em Folha OMR */}
              {previewDocType === 'folha_respostas' && (
                <div className="flex items-center bg-white dark:bg-monokai-card p-0.5 rounded-md border border-slate-200 dark:border-monokai-border shadow-2xs text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-monokai-comment px-1.5 uppercase">
                    Layout:
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnswerSheetLayout('1_per_page')}
                    className={`px-2 py-0.5 rounded font-medium transition ${answerSheetLayout === '1_per_page'
                        ? 'bg-indigo-50 dark:bg-monokai-bg text-indigo-700 dark:text-monokai-cyan font-bold border border-indigo-200 dark:border-monokai-border'
                        : 'text-slate-500 dark:text-monokai-comment hover:text-slate-800'
                      }`}
                    title="1 folha inteira A4"
                  >
                    1 por folha
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerSheetLayout('2_per_page')}
                    className={`px-2 py-0.5 rounded font-medium transition ${answerSheetLayout === '2_per_page'
                        ? 'bg-indigo-50 dark:bg-monokai-bg text-indigo-700 dark:text-monokai-cyan font-bold border border-indigo-200 dark:border-monokai-border'
                        : 'text-slate-500 dark:text-monokai-comment hover:text-slate-800'
                      }`}
                    title="2 folhas por página A4 com corte central (50% economia)"
                  >
                    2 por folha (corte)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerSheetLayout('4_per_page')}
                    className={`px-2 py-0.5 rounded font-medium transition ${answerSheetLayout === '4_per_page'
                        ? 'bg-indigo-50 dark:bg-monokai-bg text-indigo-700 dark:text-monokai-cyan font-bold border border-indigo-200 dark:border-monokai-border'
                        : 'text-slate-500 dark:text-monokai-comment hover:text-slate-800'
                      }`}
                    title="4 folhas por página A4 (quadrantes)"
                  >
                    4 por folha
                  </button>
                </div>
              )}

              {/* Controle de Variações de Prova Antifraude */}
              {variacoesConfig.ativo ? (
                <div className="flex items-center gap-1 bg-white dark:bg-monokai-card p-0.5 rounded-md border border-slate-200 dark:border-monokai-border shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-monokai-comment px-1.5 uppercase tracking-wider">
                    Versão:
                  </span>
                  {(['A', 'B', 'C', 'D'] as const)
                    .slice(0, variacoesConfig.quantidade)
                    .map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setActiveVariacaoTipo(tipo)}
                        className={`px-2 py-0.5 rounded font-bold text-[11px] transition ${activeVariacaoTipo === tipo
                            ? 'bg-indigo-600 text-white dark:bg-monokai-cyan dark:text-monokai-bg shadow-xs'
                            : 'text-slate-600 dark:text-monokai-comment hover:bg-slate-100 dark:hover:bg-monokai-panel'
                          }`}
                        title={`Visualizar documento da Prova Tipo ${tipo}`}
                      >
                        Tipo {tipo}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => setIsVariationsModalOpen(true)}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-monokai-cyan rounded transition ml-0.5"
                    title="Configurações de embaralhamento e semente"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsVariationsModalOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-monokai-card hover:bg-indigo-50 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg border border-slate-200 dark:border-monokai-border flex items-center gap-1.5 font-medium shadow-2xs transition group"
                  title="Gerar Provas Múltiplas (Tipos A, B, C, D) para dificultar fraudes"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan group-hover:rotate-45 transition duration-200" />
                  <span>Variações Antifraude</span>
                  <span className="text-[10px] font-bold bg-indigo-50 dark:bg-monokai-panel text-indigo-600 dark:text-monokai-cyan px-1.5 py-0.2 rounded border border-indigo-100 dark:border-monokai-border">
                    A, B, C, D
                  </span>
                </button>
              )}
            </div>

            {/* Centro/Direita: Diagramação & Escala A4 (MELH-12), Zoom e Botões de Saída */}
            <div className="flex items-center gap-2">
              {/* Botão de Configuração de Diagramação & Escala (MELH-12) */}
              <button
                type="button"
                onClick={() => setIsLayoutModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-monokai-card hover:bg-indigo-50 dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg border border-slate-200 dark:border-monokai-border flex items-center gap-1.5 font-medium shadow-2xs transition group text-xs"
                title="Ajustar Margens A4, Escala de Impressão, Densidade e Cabeçalho da Prova (MELH-12)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan group-hover:rotate-45 transition duration-200" />
                <span>Diagramação</span>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-monokai-panel text-indigo-600 dark:text-monokai-cyan px-1.5 py-0.2 rounded border border-indigo-100 dark:border-monokai-border">
                  {layoutConfig.margemPreset === 'compacta'
                    ? '10mm'
                    : layoutConfig.margemPreset === 'padrao'
                      ? '16mm'
                      : layoutConfig.margemPreset === 'ampla'
                        ? '22mm'
                        : `${layoutConfig.margemVerticalMm}mm`} &bull; {layoutConfig.escalaPercentual}%
                </span>
              </button>

              {/* Zoom da Visualização */}
              <div className="flex items-center bg-white dark:bg-monokai-card border border-slate-200 dark:border-monokai-border rounded-md p-0.5 shadow-2xs">
                <button
                  onClick={() => setPreviewZoom((z) => Math.max(z - 10, 60))}
                  className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 dark:text-monokai-comment dark:hover:text-monokai-fg transition font-bold"
                  title="Reduzir Zoom (-10%)"
                >
                  -
                </button>
                <button
                  onClick={() => setPreviewZoom(90)}
                  className="px-2 font-mono text-[11px] text-slate-700 dark:text-monokai-sub hover:text-indigo-600 transition"
                  title="Restaurar Zoom Padrão (90%)"
                >
                  {previewZoom}%
                </button>
                <button
                  onClick={() => setPreviewZoom((z) => Math.min(z + 10, 130))}
                  className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 dark:text-monokai-comment dark:hover:text-monokai-fg transition font-bold"
                  title="Aumentar Zoom (+10%)"
                >
                  +
                </button>
              </div>

              {/* Menu Agrupado de Exportação (PDF / Word .docx / LaTeX .tex - MELH-04) */}
              <div className="relative" ref={exportMenuRef}>
                <div className="flex items-center rounded-md shadow-xs overflow-hidden border border-emerald-700/30">
                  {/* Botão Principal: Exportar PDF Rápido */}
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf || isExportingDocx || isExportingLatex}
                    className={`px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition ${isExportingPdf ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    title="Exportar documento ativo diretamente para PDF nativo de 300 DPI"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Gerando PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar PDF</span>
                      </>
                    )}
                  </button>

                  {/* Gatilho do Dropdown de Formatos Adicionais (Word .docx e LaTeX .tex) */}
                  <button
                    type="button"
                    onClick={() => setIsExportMenuOpen((prev) => !prev)}
                    disabled={isExportingPdf || isExportingDocx || isExportingLatex}
                    className="px-1.5 py-1 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-emerald-100 border-l border-emerald-800/40 flex items-center justify-center transition"
                    title="Mais formatos de exportação (Word .docx, LaTeX .tex)"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${isExportMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                </div>

                {/* Dropdown Menu com Opções de Exportação */}
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-monokai-card border border-slate-200 dark:border-monokai-border rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-monokai-comment uppercase tracking-wider">
                      Formatos de Exportação
                    </div>

                    {/* Opção PDF */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportPdf();
                      }}
                      disabled={isExportingPdf}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-monokai-panel flex items-center justify-between group transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <div>
                          <div className="font-semibold text-slate-700 dark:text-monokai-fg group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            Documento PDF (.pdf)
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-monokai-comment">
                            Impressão nativa de alta fidelidade
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                        PDF
                      </span>
                    </button>

                    {/* Opção Word (.docx) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportDocx();
                      }}
                      disabled={isExportingDocx}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-monokai-panel flex items-center justify-between group transition border-t border-slate-100 dark:border-monokai-border/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                        <div>
                          <div className="font-semibold text-slate-700 dark:text-monokai-fg group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                            Microsoft Word (.docx)
                            {isExportingDocx && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-monokai-comment">
                            Editável, tabelas, fórmulas e pautas
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                        DOCX
                      </span>
                    </button>

                    {/* Opção LaTeX (.tex) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportLatex();
                      }}
                      disabled={isExportingLatex}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-monokai-panel flex items-center justify-between group transition border-t border-slate-100 dark:border-monokai-border/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                        <div>
                          <div className="font-semibold text-slate-700 dark:text-monokai-fg group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1.5">
                            Código LaTeX (.tex)
                            {isExportingLatex && <Loader2 className="w-3 h-3 animate-spin text-purple-500" />}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-monokai-comment">
                            KaTeX/amsmath, listings e caixas
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40">
                        TEX
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Imprimir */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
                title="Imprimir ou Salvar via layout A4 nativo"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Área Rolável de Visualização com Escala Dinâmica */}
        <div className="flex-1 overflow-auto flex justify-center p-6 bg-slate-200/70 dark:bg-monokai-panel transition-colors duration-200 print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
          <div
            style={{
              transform: `scale(${previewZoom / 100})`,
              transformOrigin: 'top center',
            }}
            className="preview-scale-wrapper transition-transform duration-100 print:transform-none print:w-full print:m-0 print:p-0 print:block"
          >
            {previewDocType === 'prova' ? (
              <A4Preview
                ref={printableRef}
                exam={examToDisplay}
                showAnswers={showAnswers}
                variacaoTipo={variacoesConfig.ativo ? activeVariacaoTipo : null}
                layoutConfig={layoutConfig}
              />
            ) : previewDocType === 'folha_respostas' ? (
              <AnswerSheetPreview
                ref={printableRef}
                exam={examToDisplay}
                layoutMode={answerSheetLayout}
                showAnswers={showAnswers}
                variacaoTipo={variacoesConfig.ativo ? activeVariacaoTipo : null}
              />
            ) : (
              <ConsolidatedAnswerKeyPreview
                ref={printableRef}
                exam={deferredExamState}
                config={variacoesConfig}
              />
            )}
          </div>
        </div>

        {/* Toast Notificação de Exportação de PDF */}
        {pdfToast && (
          <div
            className={`absolute bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-2xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-fadeIn ${pdfToast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500 text-emerald-200'
                : 'bg-slate-900/95 border-rose-500 text-rose-200'
              }`}
          >
            {pdfToast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="truncate max-w-md">{pdfToast.message}</span>
            <button
              onClick={() => setPdfToast(null)}
              className="text-xs opacity-70 hover:opacity-100 ml-2"
            >
              &times;
            </button>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: GERENCIAR E ABRIR AVALIAÇÕES SALVAS NO SQLITE */}
      {/* ======================================================== */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-2xl bg-white dark:bg-monokai-bg border border-slate-200 dark:border-monokai-border rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-monokai-border pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-500 dark:text-monokai-cyan" />
                <h3 className="text-base font-bold text-slate-800 dark:text-monokai-fg">
                  Avaliações Cadastradas no SQLite
                </h3>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-monokai-card text-slate-600 dark:text-monokai-comment px-2 py-0.5 rounded-full border border-slate-200 dark:border-monokai-border">
                  {avaliacoesSalvas.length} {avaliacoesSalvas.length === 1 ? 'prova' : 'provas'}
                </span>
              </div>
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-monokai-fg text-sm transition"
              >
                &times; Fechar
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {avaliacoesSalvas.length === 0 ? (
                <div className="text-center text-slate-500 py-10 text-xs space-y-2">
                  <p className="font-medium text-sm text-slate-600 dark:text-monokai-comment">Nenhuma avaliação salva encontrada no banco SQLite.</p>
                  <p className="text-[11px] text-slate-400">Monte suas questões no editor e clique no botão "Salvar" para armazená-la no banco.</p>
                </div>
              ) : (
                avaliacoesSalvas.map((av) => {
                  const isCurrent = examId === av.id;

                  return (
                    <div
                      key={av.id}
                      className={`p-3.5 border rounded-xl flex items-center justify-between transition gap-3 shadow-sm ${isCurrent
                          ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-800'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover dark:border-monokai-border'
                        }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-monokai-fg truncate">
                            {av.titulo}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold uppercase px-2 py-0.5 rounded shrink-0">
                              Em Edição
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-monokai-comment mt-0.5 truncate">
                          {av.disciplina_nome} &bull; {av.instituicao_nome}
                        </p>
                        <div className="text-[11px] text-slate-500 dark:text-monokai-comment mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {av.total_questoes} {av.total_questoes === 1 ? 'questão' : 'questões'}
                          </span>
                          <span>{av.peso_total.toFixed(1)} pts</span>
                          {av.data_aplicacao && <span>Data: {formatarDataBR(av.data_aplicacao)}</span>}
                          <span className="text-slate-400">ID #{av.id}</span>
                        </div>
                      </div>

                      {/* Botões de Ação da Avaliação: Carregar, Clonar e Excluir */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLoadSavedExam(av.id)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-medium shadow-sm flex items-center gap-1.5 transition active:scale-95"
                          title="Carregar esta avaliação no editor"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Carregar</span>
                        </button>

                        <button
                          onClick={() => handleCloneExam(av.id)}
                          disabled={isCloning}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-monokai-panel dark:hover:bg-monokai-card dark:text-monokai-fg dark:border-monokai-border text-xs rounded-lg font-medium shadow-sm flex items-center gap-1.5 transition active:scale-95"
                          title="Duplicar esta avaliação (clona a estrutura sem alterar o banco de questões)"
                        >
                          <Copy className="w-3.5 h-3.5 text-indigo-500 dark:text-monokai-cyan" />
                          <span>Clonar</span>
                        </button>

                        <button
                          onClick={() => setExamToDelete(av)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition"
                          title="Excluir avaliação (as questões permanecem preservadas no Banco de Questões)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-monokai-border flex justify-between items-center text-xs text-slate-500 dark:text-monokai-comment">
              <span>Dica: Clonar uma prova permite criar versões derivadas (ex: Exame Final ou 2ª Chamada) em 1 clique.</span>
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-monokai-card dark:hover:bg-monokai-cardHover text-slate-700 dark:text-monokai-fg font-medium transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DIÁLOGO DE CONFIRMAÇÃO: EXCLUIR AVALIAÇÃO COM SEGURANÇA */}
      {/* ======================================================== */}
      {examToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 no-print animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-monokai-bg border border-rose-300 dark:border-rose-800/80 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-monokai-fg">
                  Excluir Avaliação?
                </h4>
                <p className="text-xs text-slate-600 dark:text-monokai-comment mt-1 leading-relaxed">
                  Tem certeza que deseja excluir a avaliação <strong className="text-slate-900 dark:text-monokai-fg">"{examToDelete.titulo}"</strong>?
                </p>
                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-300 leading-normal">
                  <strong>Segurança Garantida:</strong> Esta ação remove apenas o cadastro desta prova e sua composição. <strong>Nenhuma questão será excluída</strong> do seu Banco de Questões.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-monokai-divider">
              <button
                onClick={() => setExamToDelete(null)}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-monokai-border hover:bg-slate-100 dark:hover:bg-monokai-card text-slate-700 dark:text-monokai-fg transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteExam}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition shadow flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Prova</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição Completa de Questão na Avaliação */}
      <EditExamQuestionModal
        isOpen={editingItemIndex !== null}
        onClose={() => setEditingItemIndex(null)}
        item={editingItemIndex !== null ? examItems[editingItemIndex] || null : null}
        itemIndex={editingItemIndex}
        disciplinas={disciplinas}
        onSave={handleSaveEditedQuestion}
      />

      {/* Modal de Configuração de Provas Múltiplas (Tipos A, B, C, D) - MELH-02 */}
      <VariationsConfigModal
        isOpen={isVariationsModalOpen}
        onClose={() => setIsVariationsModalOpen(false)}
        config={variacoesConfig}
        onSaveConfig={handleUpdateVariacoesConfig}
        exam={deferredExamState}
      />

      {/* Modal de Configuração de Diagramação, Margens e Escala A4 (MELH-12) */}
      <LayoutSettingsModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        config={layoutConfig}
        onChange={handleLayoutConfigChange}
      />

      {/* Injeção de Regras CSS Dinâmicas para Impressão Física (@media print) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: ${layoutConfig.margemVerticalMm}mm ${layoutConfig.margemHorizontalMm}mm !important;
          }
        }
      `}</style>
    </div>
  );
};

