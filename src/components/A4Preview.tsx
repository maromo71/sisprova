import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { MermaidRenderer } from './MermaidRenderer';
import { formatarDataBR } from '../utils/date';
import type { LiveExamState } from '../types';
import { type LayoutPrintConfig, DEFAULT_LAYOUT_CONFIG } from '../types/layout';

interface A4PreviewProps {
  exam: LiveExamState;
  showAnswers?: boolean; // Para gabarito / conferência do professor
  variacaoTipo?: 'A' | 'B' | 'C' | 'D' | null;
  layoutConfig?: LayoutPrintConfig;
}

export const A4Preview = forwardRef<HTMLDivElement, A4PreviewProps>(
  ({ exam, showAnswers = false, variacaoTipo = null, layoutConfig = DEFAULT_LAYOUT_CONFIG }, ref) => {
    const { instituicao, disciplina, titulo, instrucoes, data_aplicacao, peso_total, itens } = exam;

    // Definições visuais de densidade de espaçamento
    const densityClasses = {
      compacta: 'space-y-3 print:space-y-2',
      padrao: 'space-y-5 print:space-y-4',
      ampla: 'space-y-7 print:space-y-6',
    }[layoutConfig.densidade];

    const ruledLineHeightClass = {
      compacta: 'h-5',
      padrao: 'h-6',
      ampla: 'h-7',
    }[layoutConfig.densidade];

    // Definições visuais de tamanho tipográfico
    const typography = {
      pequena: {
        enunciado: 'text-[12px] leading-snug',
        alternativas: 'text-[11px]',
        titulo: 'text-[12.5px]',
        resposta: 'text-[11.5px]',
        cabecalhoTitulo: 'text-sm',
      },
      padrao: {
        enunciado: 'text-[13.5px] leading-relaxed',
        alternativas: 'text-xs',
        titulo: 'text-sm',
        resposta: 'text-[12.5px]',
        cabecalhoTitulo: 'text-base',
      },
      grande: {
        enunciado: 'text-[15px] leading-relaxed',
        alternativas: 'text-[13px]',
        titulo: 'text-base',
        resposta: 'text-[13.5px]',
        cabecalhoTitulo: 'text-lg',
      },
    }[layoutConfig.tamanhoFonte];

    // Estilo de zoom / escala de conteúdo
    const contentScalerStyle: React.CSSProperties = layoutConfig.escalaPercentual !== 100
      ? {
          zoom: `${layoutConfig.escalaPercentual}%`,
        }
      : {};

    // Componentes de Markdown compartilhados para manter o estilo limpo da folha impressa (fundo claro)
    // independentemente do tema do app (claro ou escuro) e em ambas as visualizações (Aluno e Gabarito)
    const markdownComponents = {
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        if (match && match[1] === 'mermaid') {
          return (
            <div className="my-2 flex justify-center bg-white p-2 rounded-lg border border-slate-200 print:border-none print:p-0 shadow-sm">
              <MermaidRenderer code={String(children).trim()} />
            </div>
          );
        }
        return match ? (
          <div className="my-2 border border-slate-300 bg-slate-50 p-2 rounded font-mono text-xs overflow-x-auto print:border-black print:bg-white print:text-black shadow-sm">
            <code className={`${className || ''} text-slate-800`} {...props}>
              {children}
            </code>
          </div>
        ) : (
          <code
            className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs print:border-slate-400 print:bg-slate-100 print:text-black"
            {...props}
          >
            {children}
          </code>
        );
      },
    };

    return (
      <div className="w-full flex justify-center py-6 px-2 print:p-0 print:m-0 print:bg-white print:block overflow-y-auto print:overflow-visible">
        {/* Folha A4 Simulação Visual e Formato de Impressão */}
        <div
          ref={ref}
          id="printable-a4-sheet"
          className="a4-sheet bg-white text-black shadow-2xl print:shadow-none font-serif relative print:w-full print:max-w-none print:m-0 print:border-none print:static"
          style={{
            paddingTop: `${layoutConfig.margemVerticalMm}mm`,
            paddingBottom: `${layoutConfig.margemVerticalMm}mm`,
            paddingLeft: `${layoutConfig.margemHorizontalMm}mm`,
            paddingRight: `${layoutConfig.margemHorizontalMm}mm`,
          }}
        >
          <div className="a4-content-scaler flex flex-col justify-between min-h-full" style={contentScalerStyle}>
            <div>
              {/* CABEÇALHO PADRONIZADO DA AVALIAÇÃO ACADÊMICA */}
              {layoutConfig.cabecalhoEstilo === 'padrao' && (
                <header
                  className="exam-header border-2 border-black p-4 mb-4 rounded-none bg-white print:p-3 print:mb-3"
                  style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                >
                  <div className="flex items-center justify-between border-b border-black pb-2.5">
                    {instituicao?.logo_base64 ? (
                      <img
                        src={instituicao.logo_base64}
                        alt="Logo Instituição"
                        className="h-12 w-auto max-w-[130px] object-contain mr-3"
                      />
                    ) : null}

                    <div className="flex-1 text-center font-sans">
                      <h1 className="text-sm font-bold uppercase leading-tight">
                        {instituicao?.nome || 'Instituição de Ensino Superior'}
                      </h1>
                      {instituicao?.sigla && (
                        <span className="text-xs font-semibold text-slate-700">
                          ({instituicao.sigla})
                        </span>
                      )}
                      <div className="text-xs font-semibold mt-1">
                        <span>Disciplina: </span>
                        <span className="font-medium">{disciplina?.nome || 'Disciplina não selecionada'}</span>
                        {disciplina?.codigo ? <span className="font-medium"> ({disciplina.codigo})</span> : ''}
                      </div>
                    </div>

                    <div className="text-right border-l border-black pl-3 min-w-[85px] font-sans">
                      <div className="text-[10px] uppercase text-slate-600 font-bold">
                        Valor Total
                      </div>
                      <div className="text-lg font-black text-slate-900">
                        {peso_total.toFixed(1)} pts
                      </div>
                    </div>
                  </div>

                  {/* Título da Avaliação e Identificação da Variação de Prova */}
                  <div className="py-2 text-center border-b border-black bg-slate-50 print:bg-transparent flex items-center justify-between px-3">
                    <div className="w-36 text-left flex items-center gap-1.5">
                      {variacaoTipo && (
                        <span className="inline-block bg-black text-white text-[11px] font-bold uppercase px-2.5 py-1 rounded print:border print:border-black leading-none">
                          PROVA {variacaoTipo}
                        </span>
                      )}
                      {showAnswers && (
                        <span className="inline-block bg-amber-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded print:border print:border-black leading-none">
                          GABARITO
                        </span>
                      )}
                    </div>
                    <h2 className={`${typography.cabecalhoTitulo} font-bold uppercase font-sans flex-1 text-center`}>
                      {titulo || 'AVALIAÇÃO ACADÊMICA'}
                      {showAnswers ? ' — GABARITO DO PROFESSOR' : ''}
                    </h2>
                    <div className="w-36 text-right">
                      <span className="text-[10px] font-bold text-slate-700 print:text-black font-sans uppercase">
                        {showAnswers ? 'Versão Gabarito' : 'Versão do Aluno'}
                        {variacaoTipo ? ` (Tipo ${variacaoTipo})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Campos Preenchíveis pelo Aluno */}
                  <div className="grid grid-cols-12 gap-2 pt-2.5 text-xs font-sans">
                    <div className="col-span-8 flex items-end">
                      <span className="font-bold mr-2 whitespace-nowrap">Aluno(a):</span>
                      <span className="border-b border-dotted border-black flex-1 h-4"></span>
                    </div>
                    <div className="col-span-4 flex items-end">
                      <span className="font-bold mr-2 whitespace-nowrap">Matrícula/RA:</span>
                      <span className="border-b border-dotted border-black flex-1 h-4"></span>
                    </div>

                    <div className="col-span-4 flex items-end mt-1">
                      <span className="font-bold mr-2 whitespace-nowrap">Data:</span>
                      <span className="border-b border-dotted border-black flex-1 h-4 pl-1 font-medium">
                        {formatarDataBR(data_aplicacao)}
                      </span>
                    </div>
                    <div className="col-span-4 flex items-end mt-1">
                      <span className="font-bold mr-2 whitespace-nowrap">Turma:</span>
                      <span className="border-b border-dotted border-black flex-1 h-4"></span>
                    </div>
                    <div className="col-span-4 flex items-end mt-1">
                      <span className="font-bold mr-2 whitespace-nowrap">Nota Obtida:</span>
                      <span className="border-b border-black flex-1 h-4 font-bold text-center"></span>
                    </div>
                  </div>

                  {/* Instruções Gerais */}
                  {instrucoes && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-slate-400 text-[11px] leading-relaxed italic text-slate-700 font-sans">
                      <span className="font-bold not-italic mr-1.5 text-slate-900">Instruções: </span>
                      {instrucoes}
                    </div>
                  )}
                </header>
              )}

              {/* CABEÇALHO COMPACTO (ECONÔMICO - POUPANÇA DE 60% DE ALTURA) */}
              {layoutConfig.cabecalhoEstilo === 'compacto' && (
                <header
                  className="exam-header-compact border-2 border-black p-2.5 mb-3 rounded-none bg-white font-sans text-xs"
                  style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                >
                  <div className="flex items-center justify-between border-b border-black pb-1.5 gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {instituicao?.logo_base64 && (
                        <img
                          src={instituicao.logo_base64}
                          alt="Logo"
                          className="h-7 w-auto max-w-[80px] object-contain"
                        />
                      )}
                      <div>
                        <div className="font-bold uppercase text-[11.5px] leading-tight">
                          {instituicao?.nome || 'Instituição de Ensino'}
                          {instituicao?.sigla ? ` (${instituicao.sigla})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-700 font-medium truncate">
                          {disciplina?.nome || 'Disciplina'}
                          {disciplina?.codigo ? ` (${disciplina.codigo})` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {variacaoTipo && (
                        <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                          PROVA {variacaoTipo}
                        </span>
                      )}
                      {showAnswers && (
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none">
                          GABARITO
                        </span>
                      )}
                      <div className="text-right border-l border-black pl-2 font-mono">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block leading-tight">Valor</span>
                        <span className="font-bold text-xs">{peso_total.toFixed(1)} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1 text-center font-bold uppercase text-xs border-b border-black">
                    {titulo || 'AVALIAÇÃO ACADÊMICA'}
                    {showAnswers ? ' — GABARITO DO PROFESSOR' : ''}
                  </div>

                  {/* Campos do Estudante em Linha Única */}
                  <div className="flex items-end justify-between gap-3 pt-1.5 text-[11px]">
                    <div className="flex-1 flex items-end">
                      <span className="font-bold mr-1.5 shrink-0">Aluno(a):</span>
                      <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
                    </div>
                    <div className="w-28 flex items-end">
                      <span className="font-bold mr-1 shrink-0">RA:</span>
                      <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
                    </div>
                    <div className="w-24 flex items-end">
                      <span className="font-bold mr-1 shrink-0">Data:</span>
                      <span className="border-b border-dotted border-black flex-1 h-3.5 font-medium pl-0.5 text-[10px]">
                        {formatarDataBR(data_aplicacao)}
                      </span>
                    </div>
                    <div className="w-16 flex items-end">
                      <span className="font-bold mr-1 shrink-0">Nota:</span>
                      <span className="border-b border-black flex-1 h-3.5"></span>
                    </div>
                  </div>

                  {instrucoes && (
                    <div className="mt-1 pt-1 border-t border-dashed border-slate-300 text-[10px] italic text-slate-600 truncate">
                      <span className="font-bold not-italic">Obs: </span>{instrucoes}
                    </div>
                  )}
                </header>
              )}

              {/* CABEÇALHO VESTIBULAR / CONCURSO (SIMULADO FORMAL COM REGRAS - MELH-08) */}
              {layoutConfig.cabecalhoEstilo === 'concurso' && (
                <header
                  className="exam-header-concurso border-2 border-black mb-4 rounded-none bg-white font-sans text-xs"
                  style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                >
                  {/* Faixa Superior Solene */}
                  <div className="bg-black text-white px-3 py-1 flex items-center justify-between font-bold uppercase text-[11px] tracking-wider">
                    <span>CADERNO DE QUESTÕES &bull; AVALIAÇÃO OFICIAL</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-black px-1.5 py-0.2 rounded text-[10px]">
                        {variacaoTipo ? `PROVA ${variacaoTipo}` : 'CADERNO REGULAR'}
                      </span>
                      {showAnswers && (
                        <span className="bg-amber-500 text-black px-1.5 py-0.2 rounded text-[10px]">
                          GABARITO OFICIAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações Institucionais */}
                  <div className="p-3 border-b border-black flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {instituicao?.logo_base64 && (
                        <img
                          src={instituicao.logo_base64}
                          alt="Logo"
                          className="h-10 w-auto max-w-[100px] object-contain"
                        />
                      )}
                      <div>
                        <div className="font-black text-sm uppercase leading-tight">
                          {instituicao?.nome || 'Instituição de Ensino Superior'}
                          {instituicao?.sigla ? ` (${instituicao.sigla})` : ''}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          Disciplina: {disciplina?.nome || 'Avaliação Acadêmica'}
                          {disciplina?.codigo ? ` [${disciplina.codigo}]` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right border-l-2 border-black pl-3 min-w-[100px] font-mono">
                      <div className="text-[9px] uppercase font-bold text-slate-600">PONTUAÇÃO</div>
                      <div className="text-lg font-black">{peso_total.toFixed(1)} pts</div>
                      <div className="text-[9.5px] text-slate-500 font-sans">
                        Data: {formatarDataBR(data_aplicacao)}
                      </div>
                    </div>
                  </div>

                  {/* Título da Avaliação */}
                  <div className="py-1.5 bg-slate-100 text-center font-bold uppercase text-xs border-b border-black">
                    {titulo || 'AVALIAÇÃO OFICIAL'}
                    {showAnswers ? ' — ESPELHO DE CORREÇÃO DOCENTE' : ''}
                  </div>

                  {/* Identificação Formal do Candidato */}
                  <div className="p-2.5 bg-white border-b border-black space-y-2 text-[11px]">
                    <div className="flex items-end">
                      <span className="font-bold mr-2 shrink-0">NOME DO(A) CANDIDATO(A):</span>
                      <span className="border-b border-black flex-1 h-3.5"></span>
                    </div>

                    <div className="grid grid-cols-12 gap-3 pt-0.5">
                      <div className="col-span-5 flex items-end">
                        <span className="font-bold mr-1.5 shrink-0">INSCRIÇÃO / RA:</span>
                        <span className="border-b border-black flex-1 h-3.5"></span>
                      </div>
                      <div className="col-span-3 flex items-end">
                        <span className="font-bold mr-1.5 shrink-0">SALA / TURMA:</span>
                        <span className="border-b border-black flex-1 h-3.5"></span>
                      </div>
                      <div className="col-span-4 flex items-end">
                        <span className="font-bold mr-1.5 shrink-0">NOTA:</span>
                        <span className="border-b-2 border-black flex-1 h-3.5 font-bold text-center"></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="flex items-end">
                        <span className="text-[10px] text-slate-600 mr-1.5 shrink-0">Assinatura do Aluno:</span>
                        <span className="border-b border-dotted border-black flex-1 h-3"></span>
                      </div>
                      <div className="flex items-end">
                        <span className="text-[10px] text-slate-600 mr-1.5 shrink-0">Visto do Professor / Fiscal:</span>
                        <span className="border-b border-dotted border-black flex-1 h-3"></span>
                      </div>
                    </div>
                  </div>

                  {/* Quadro Solene de Instruções / Orientações */}
                  <div className="p-2 bg-slate-50 text-[10px] leading-relaxed text-slate-800">
                    <div className="font-bold uppercase tracking-wider text-[10px] text-black mb-1">
                      LEIA ATENTAMENTE AS INSTRUÇÕES ABAIXO:
                    </div>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Verifique se este caderno contém todas as questões e se a impressão está legível e completa.</li>
                      <li>Utilize apenas caneta esferográfica de tinta azul ou preta. Respostas a lápis poderão não ser aceitas para revisão.</li>
                      <li>É estritamente vedada a comunicação entre estudantes ou a utilização de aparelhos eletrônicos sem autorização.</li>
                      {instrucoes && (
                        <li className="font-medium text-black">
                          <strong>Observações específicas: </strong>{instrucoes}
                        </li>
                      )}
                    </ol>
                  </div>
                </header>
              )}

              {/* CABEÇALHO MÍNIMO (LINHA ÚNICA ULTRA-LIMPA) */}
              {layoutConfig.cabecalhoEstilo === 'minimo' && (
                <header
                  className="exam-header-minimo border-b-2 border-black pb-2 mb-3.5 font-sans"
                  style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-2">
                      <span>{instituicao?.sigla || instituicao?.nome || 'Avaliação'}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-slate-700">{disciplina?.nome || 'Disciplina'}</span>
                      <span>&bull;</span>
                      <span>{titulo || 'PROVA'}</span>
                      {showAnswers && (
                        <span className="bg-amber-600 text-white text-[9px] px-1 py-0.5 rounded ml-1">
                          GABARITO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      {variacaoTipo && (
                        <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded">
                          TIPO {variacaoTipo}
                        </span>
                      )}
                      <span>[{peso_total.toFixed(1)} pts]</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4 mt-2 text-[11px]">
                    <div className="flex-1 flex items-end">
                      <span className="font-bold mr-1.5 shrink-0">Nome do Estudante:</span>
                      <span className="border-b border-black flex-1 h-4"></span>
                    </div>
                    <div className="w-28 flex items-end">
                      <span className="font-bold mr-1.5 shrink-0">Data:</span>
                      <span className="border-b border-black flex-1 h-4 font-medium pl-1 text-[10.5px]">
                        {formatarDataBR(data_aplicacao)}
                      </span>
                    </div>
                    <div className="w-20 flex items-end">
                      <span className="font-bold mr-1.5 shrink-0">Nota:</span>
                      <span className="border-b border-black flex-1 h-4 font-bold text-center"></span>
                    </div>
                  </div>
                </header>
              )}

              {/* LISTA DE QUESTÕES DA AVALIAÇÃO */}
              <section className={`exam-questions-list ${densityClasses}`}>
                {itens.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded p-8 text-center text-slate-400 font-sans my-8 print:hidden">
                    <p className="font-medium text-sm">Nenhuma questão adicionada à avaliação.</p>
                    <p className="text-xs mt-1 text-slate-500">
                      Selecione questões do banco ou crie novas questões no painel lateral esquerdo.
                    </p>
                  </div>
                ) : (
                  itens.map((item, index) => {
                    const q = item.questao;
                    const pontuacaoFormatada = item.valor_pontuacao.toFixed(1);

                    return (
                      <article
                        key={`${q.id}-${index}`}
                        className="question-block"
                      >
                        {/* Cabeçalho da Questão */}
                        <div
                          className="question-title-row flex items-baseline justify-between mb-1.5 font-sans"
                          style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                        >
                          <div className={`font-bold ${typography.titulo} text-black flex items-center gap-2`}>
                            <span className="inline-flex items-center justify-center bg-black text-white min-w-[20px] h-5 px-1.5 rounded-sm text-xs font-bold shrink-0 print:border print:border-black">
                              {item.ordem || index + 1}
                            </span>
                            <span>{q.titulo}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded print:border-black print:bg-white shrink-0">
                            [{pontuacaoFormatada} {item.valor_pontuacao === 1 ? 'pt' : 'pts'}]
                          </span>
                        </div>

                        {/* Enunciado Formatado em Markdown + Fórmulas KaTeX */}
                        <div className={`markdown-body font-serif ${typography.enunciado} text-black my-1.5`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                          >
                            {q.enunciado_markdown}
                          </ReactMarkdown>
                        </div>

                        {/* Diagrama Mermaid Se Existente */}
                        {q.diagrama_mermaid && q.diagrama_mermaid.trim() !== '' && (
                          <div className="my-2 flex justify-center bg-white p-2 rounded-lg border border-slate-200 print:border-none print:p-0 shadow-sm">
                            <MermaidRenderer code={q.diagrama_mermaid} />
                          </div>
                        )}

                        {/* Alternativas (Para Questões Objetivas) */}
                        {q.tipo_questao === 'OBJETIVA' && q.alternativas && q.alternativas.length > 0 && (
                          <div className={`mt-2 space-y-1 pl-2 font-sans ${typography.alternativas}`}>
                            {q.alternativas.map((alt, aIdx) => {
                              const letter = String.fromCharCode(65 + aIdx); // A, B, C, D, E...
                              const isCorreta = alt.correta && showAnswers;

                              return (
                                <div
                                  key={alt.id || aIdx}
                                  className={`flex items-start gap-2 py-0.5 px-1 rounded ${
                                    isCorreta
                                      ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-medium'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  <div className="w-4.5 h-4.5 rounded-full border border-black flex items-center justify-center font-bold shrink-0 text-[10px] bg-white mt-0.5">
                                    {letter}
                                  </div>
                                  <span className="pt-0.5 leading-snug">{alt.texto}</span>
                                  {isCorreta && (
                                    <span className="ml-auto text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">
                                      Gabarito
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Exibição da Resposta Esperada / Padrão de Resolução (Versão Gabarito - Professor) */}
                        {showAnswers && q.resposta_esperada && (
                          <div
                            className="mt-2.5 p-2.5 bg-emerald-50/90 border-2 border-emerald-600 rounded print:border-black print:bg-slate-50 font-sans text-xs"
                            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                          >
                            <div className="font-bold text-[10.5px] text-emerald-950 print:text-black uppercase mb-1 flex items-center justify-between border-b border-emerald-300 print:border-black pb-1">
                              <span>[Padrão de Resposta Esperado — Gabarito do Professor]</span>
                              <span className="text-[9.5px] font-semibold text-emerald-700 print:text-black">
                                {q.tipo_questao === 'OBJETIVA' ? 'Justificativa' : 'Critério / Resolução'}
                              </span>
                            </div>
                            <div className={`markdown-body font-serif ${typography.resposta} leading-relaxed text-black mt-1`}>
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={markdownComponents}
                              >
                                {q.resposta_esperada}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Espaçamento de Resposta Pautada (Para Questões Dissertativas na Versão Aluno ou se não houver resposta esperada) */}
                        {q.tipo_questao === 'DISSERTATIVA' && q.linhas_resposta > 0 && (!showAnswers || !q.resposta_esperada) && (
                          <div className="mt-2.5 ruled-lines-container">
                            {Array.from({ length: q.linhas_resposta }).map((_, lIdx) => (
                              <div
                                key={lIdx}
                                className={`${ruledLineHeightClass} border-b border-slate-300 print:border-black/50 w-full`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Caixa de Código (Para Questões Tipo Código na Versão Aluno ou se não houver resposta esperada) */}
                        {q.tipo_questao === 'CODIGO' && q.linhas_resposta > 0 && (!showAnswers || !q.resposta_esperada) && (
                          <div className="mt-2.5 border border-slate-300 rounded p-2 bg-slate-50 print:bg-white print:border-black">
                            <div className="text-[9.5px] uppercase font-sans font-bold text-slate-600 mb-1 border-b border-slate-200 pb-1 print:text-black">
                              Área de Código / Implementação:
                            </div>
                            <div
                              style={{
                                minHeight: `${Math.max(
                                  q.linhas_resposta * (layoutConfig.densidade === 'compacta' ? 16 : 20),
                                  60
                                )}px`,
                              }}
                              className="font-mono text-xs text-slate-500 flex flex-col justify-between"
                            >
                              {Array.from({ length: q.linhas_resposta }).map((_, lIdx) => (
                                <div
                                  key={lIdx}
                                  className="border-b border-dashed border-slate-200 print:border-slate-300 h-4.5 flex items-center text-[9.5px] text-slate-400 select-none"
                                >
                                  <span className="w-5 text-right pr-2 text-slate-400 font-mono">
                                    {lIdx + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </section>
            </div>

            {/* Rodapé da Prova */}
            <footer className="mt-6 pt-2 border-t border-black text-[9.5px] text-slate-600 font-sans flex justify-between items-center print:mt-4 print:pt-1.5">
              <span>
                {disciplina?.nome || 'Avaliação'} &bull; {titulo}
                {variacaoTipo ? ` (Tipo ${variacaoTipo})` : ''}
                {showAnswers ? ' \u2022 GABARITO DO PROFESSOR' : ''}
              </span>
              <span>
                Avaliador Acadêmico Offline{variacaoTipo ? ` \u2022 Vers\u00e3o ${variacaoTipo}` : ''}
                {showAnswers ? ' \u2022 Espelho' : ''}
              </span>
            </footer>
          </div>
        </div>
      </div>
    );
  }
);

A4Preview.displayName = 'A4Preview';
