import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { MermaidRenderer } from './MermaidRenderer';
import type { LiveExamState } from '../types';

interface A4PreviewProps {
  exam: LiveExamState;
  showAnswers?: boolean; // Para gabarito / conferência do professor
}

export const A4Preview = forwardRef<HTMLDivElement, A4PreviewProps>(
  ({ exam, showAnswers = false }, ref) => {
    const { instituicao, disciplina, titulo, instrucoes, data_aplicacao, peso_total, itens } = exam;

    return (
      <div className="w-full flex justify-center py-6 px-2 print:p-0 print:m-0 print:bg-white print:block overflow-y-auto print:overflow-visible">
        {/* Folha A4 Simulação Visual e Formato de Impressão */}
        <div
          ref={ref}
          id="printable-a4-sheet"
          className="a4-sheet bg-white text-black shadow-2xl print:shadow-none font-serif relative print:w-full print:max-w-none print:m-0 print:p-0 print:border-none print:static"
        >
          {/* CABEÇALHO PADRONIZADO DA AVALIAÇÃO ACADÊMICA */}
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
                <h1 className="text-sm font-bold uppercase tracking-wide leading-tight">
                  {instituicao?.nome || 'Instituição de Ensino Superior'}
                </h1>
                {instituicao?.sigla && (
                  <span className="text-xs font-semibold text-slate-700">
                    ({instituicao.sigla})
                  </span>
                )}
                <div className="text-xs font-semibold mt-0.5">
                  Disciplina: {disciplina?.nome || 'Disciplina não selecionada'}
                  {disciplina?.codigo ? ` (${disciplina.codigo})` : ''}
                </div>
              </div>

              <div className="text-right border-l border-black pl-3 min-w-[85px] font-sans">
                <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                  Valor Total
                </div>
                <div className="text-lg font-black text-slate-900">
                  {peso_total.toFixed(1)} pts
                </div>
              </div>
            </div>

            {/* Título da Avaliação */}
            <div className="py-1.5 text-center border-b border-black bg-slate-50 print:bg-transparent">
              <h2 className="text-base font-bold uppercase tracking-wider font-sans">
                {titulo || 'AVALIAÇÃO ACADÊMICA'}
              </h2>
            </div>

            {/* Campos Preenchíveis pelo Aluno */}
            <div className="grid grid-cols-12 gap-2 pt-2.5 text-xs font-sans">
              <div className="col-span-8 flex items-end">
                <span className="font-bold mr-1.5 whitespace-nowrap">Aluno(a):</span>
                <span className="border-b border-dotted border-black flex-1 h-4"></span>
              </div>
              <div className="col-span-4 flex items-end">
                <span className="font-bold mr-1.5 whitespace-nowrap">Matrícula/RA:</span>
                <span className="border-b border-dotted border-black flex-1 h-4"></span>
              </div>

              <div className="col-span-4 flex items-end mt-1">
                <span className="font-bold mr-1.5 whitespace-nowrap">Data:</span>
                <span className="border-b border-dotted border-black flex-1 h-4">
                  {data_aplicacao ? new Date(data_aplicacao).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
              <div className="col-span-4 flex items-end mt-1">
                <span className="font-bold mr-1.5 whitespace-nowrap">Turma:</span>
                <span className="border-b border-dotted border-black flex-1 h-4"></span>
              </div>
              <div className="col-span-4 flex items-end mt-1">
                <span className="font-bold mr-1.5 whitespace-nowrap">Nota Obtida:</span>
                <span className="border-b border-black flex-1 h-4 font-bold text-center"></span>
              </div>
            </div>

            {/* Instruções Gerais */}
            {instrucoes && (
              <div className="mt-2.5 pt-2 border-t border-dashed border-slate-400 text-[11px] leading-relaxed italic text-slate-700 font-sans">
                <span className="font-bold not-italic mr-1 text-slate-900">Instruções:</span>
                {instrucoes}
              </div>
            )}
          </header>

          {/* LISTA DE QUESTÕES DA AVALIAÇÃO */}
          <section className="exam-questions-list space-y-5 print:space-y-4">
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
                    className="question-block text-sm"
                  >
                    {/* Cabeçalho da Questão */}
                    <div
                      className="question-title-row flex items-baseline justify-between mb-1.5 font-sans"
                      style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                    >
                      <div className="font-bold text-sm text-black flex items-center gap-1.5">
                        <span className="bg-black text-white px-2 py-0.5 rounded-sm text-xs font-black print:border print:border-black">
                          {item.ordem || index + 1}
                        </span>
                        <span>{q.titulo}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded print:border-black print:bg-white">
                        [{pontuacaoFormatada} {item.valor_pontuacao === 1 ? 'pt' : 'pts'}]
                      </span>
                    </div>

                    {/* Enunciado Formatado em Markdown + Fórmulas KaTeX */}
                    <div className="markdown-body font-serif text-[13.5px] leading-relaxed text-black my-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <div className="my-2 border border-slate-400 bg-slate-50 p-2.5 rounded font-mono text-xs overflow-x-auto print:border-black print:bg-white">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            ) : (
                              <code
                                className="bg-slate-100 border border-slate-300 px-1 py-0.5 rounded font-mono text-xs text-slate-900 print:border-slate-400"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {q.enunciado_markdown}
                      </ReactMarkdown>
                    </div>

                    {/* Diagrama Mermaid Se Existente */}
                    {q.diagrama_mermaid && q.diagrama_mermaid.trim() !== '' && (
                      <div className="my-2 flex justify-center">
                        <MermaidRenderer code={q.diagrama_mermaid} />
                      </div>
                    )}

                    {/* Alternativas (Para Questões Objetivas) */}
                    {q.tipo_questao === 'OBJETIVA' && q.alternativas && q.alternativas.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 pl-2 font-sans text-xs">
                        {q.alternativas.map((alt, aIdx) => {
                          const letter = String.fromCharCode(65 + aIdx); // A, B, C, D, E...
                          const isCorreta = alt.correta && showAnswers;

                          return (
                            <div
                              key={alt.id || aIdx}
                              className={`flex items-start gap-2 py-1 px-1.5 rounded ${
                                isCorreta
                                  ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-medium'
                                  : 'text-slate-900'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold shrink-0 text-[11px] bg-white">
                                {letter}
                              </div>
                              <span className="pt-0.5 leading-snug">{alt.texto}</span>
                              {isCorreta && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">
                                  Gabarito
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Espaçamento de Resposta Pautada (Para Questões Dissertativas) */}
                    {q.tipo_questao === 'DISSERTATIVA' && q.linhas_resposta > 0 && (
                      <div className="mt-3 ruled-lines-container">
                        {Array.from({ length: q.linhas_resposta }).map((_, lIdx) => (
                          <div
                            key={lIdx}
                            className="h-6 border-b border-slate-300 print:border-black/50 w-full"
                          />
                        ))}
                      </div>
                    )}

                    {/* Caixa de Código (Para Questões Tipo Código) */}
                    {q.tipo_questao === 'CODIGO' && q.linhas_resposta > 0 && (
                      <div className="mt-3 border border-slate-400 print:border-black rounded-none p-2 bg-slate-50/50 print:bg-white">
                        <div className="text-[10px] uppercase font-sans font-bold text-slate-500 mb-1 border-b border-slate-300 pb-0.5">
                          Área de Código / Implementação:
                        </div>
                        <div
                          style={{ minHeight: `${Math.max(q.linhas_resposta * 20, 80)}px` }}
                          className="font-mono text-xs text-slate-400 flex flex-col justify-between"
                        >
                          {Array.from({ length: q.linhas_resposta }).map((_, lIdx) => (
                            <div
                              key={lIdx}
                              className="border-b border-dashed border-slate-200 print:border-slate-300 h-5 flex items-center text-[10px] text-slate-400 select-none"
                            >
                              <span className="w-6 text-right pr-2 text-slate-300 font-mono">
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

          {/* Rodapé da Prova */}
          <footer className="mt-6 pt-2.5 border-t border-black text-[10px] text-slate-600 font-sans flex justify-between items-center print:mt-4 print:pt-2">
            <span>
              {disciplina?.nome || 'Avaliação'} &bull; {titulo}
            </span>
            <span>Avaliador Acadêmico Offline</span>
          </footer>
        </div>
      </div>
    );
  }
);

A4Preview.displayName = 'A4Preview';
