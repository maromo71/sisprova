import { forwardRef } from 'react';
import type { LiveExamState } from '../types';
import { Scissors } from 'lucide-react';
import { formatarDataBR } from '../utils/date';

export type AnswerSheetLayout = '1_per_page' | '2_per_page' | '4_per_page';

interface AnswerSheetPreviewProps {
  exam: LiveExamState;
  layoutMode?: AnswerSheetLayout;
  showAnswers?: boolean; // Se true, preenche as bolhas com a resposta correta (máscara de gabarito)
}

interface SingleSheetUnitProps {
  exam: LiveExamState;
  showAnswers: boolean;
  isCompact?: boolean;
  unitIndex?: number;
}

const SingleSheetUnit: React.FC<SingleSheetUnitProps> = ({
  exam,
  showAnswers,
  isCompact = false,
  unitIndex = 1,
}) => {
  const { instituicao, disciplina, titulo, data_aplicacao, peso_total, itens } = exam;

  // Separa questões objetivas e dissertativas/código
  const questoesObjetivas = itens.filter((it) => it.questao.tipo_questao === 'OBJETIVA');
  const questoesDissertativas = itens.filter(
    (it) => it.questao.tipo_questao === 'DISSERTATIVA' || it.questao.tipo_questao === 'CODIGO'
  );

  return (
    <div
      className={`answer-sheet-unit bg-white text-black font-sans flex flex-col justify-between h-full ${
        isCompact ? 'p-3 text-[10px]' : 'p-6 text-xs'
      }`}
    >
      {/* ======================================================== */}
      {/* CABEÇALHO DA FOLHA DE RESPOSTAS */}
      {/* ======================================================== */}
      <header className="border-2 border-black p-2 mb-2 bg-white print:p-2">
        <div className="flex items-center justify-between border-b border-black pb-1.5">
          <div className="flex items-center gap-2">
            {instituicao?.logo_base64 && (
              <img
                src={instituicao.logo_base64}
                alt="Logo"
                className={`${isCompact ? 'h-6 max-w-[50px]' : 'h-10 max-w-[90px]'} object-contain`}
              />
            )}
            <div>
              <h1 className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-tight leading-tight`}>
                {instituicao?.nome || 'Instituição de Ensino Superior'}
                {instituicao?.sigla && ` (${instituicao.sigla})`}
              </h1>
              <div className="text-[10px] text-slate-700 font-medium">
                Disciplina: {disciplina?.nome || 'Geral'} {disciplina?.codigo ? `[${disciplina.codigo}]` : ''}
              </div>
            </div>
          </div>

          <div className="text-right border-l border-black pl-2 shrink-0">
            <span className="block text-[8px] uppercase tracking-wider text-slate-600 font-bold">
              Nota / Valor
            </span>
            <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-black`}>
              ___ / {peso_total.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Título e Identificação de Gabarito */}
        <div className="py-1 text-center border-b border-black bg-slate-50 print:bg-transparent flex items-center justify-between px-1">
          <span className="font-black uppercase tracking-wider text-[11px]">
            FOLHA DE RESPOSTAS / GABARITO OFICIAL
          </span>
          <span className="text-[9px] font-bold text-slate-600">
            {titulo || 'AVALIAÇÃO ACADÊMICA'}
          </span>
        </div>

        {/* Dados do Aluno */}
        <div className="grid grid-cols-12 gap-1.5 pt-1.5 text-[10px]">
          <div className="col-span-8 flex items-end">
            <span className="font-bold mr-1 whitespace-nowrap">Aluno(a):</span>
            <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
          </div>
          <div className="col-span-4 flex items-end">
            <span className="font-bold mr-1 whitespace-nowrap">Matrícula:</span>
            <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
          </div>

          <div className="col-span-4 flex items-end mt-0.5">
            <span className="font-bold mr-1 whitespace-nowrap">Turma:</span>
            <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
          </div>
          <div className="col-span-4 flex items-end mt-0.5">
            <span className="font-bold mr-1 whitespace-nowrap">Data:</span>
            <span className="border-b border-dotted border-black flex-1 h-3.5">
              {formatarDataBR(data_aplicacao)}
            </span>
          </div>
          <div className="col-span-4 flex items-end mt-0.5">
            <span className="font-bold mr-1 whitespace-nowrap">Assinatura:</span>
            <span className="border-b border-dotted border-black flex-1 h-3.5"></span>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* INSTRUÇÕES DE PREENCHIMENTO OMR */}
      {/* ======================================================== */}
      <div className="border border-black p-1.5 mb-2 bg-slate-50 print:bg-white flex items-center justify-between text-[9px] leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-bold uppercase tracking-tight">Preenchimento:</span>
          <span>Utilize caneta esferográfica preta ou azul. Preencha completamente o círculo da resposta.</span>
        </div>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-300 font-mono text-[8px] shrink-0">
          <span className="flex items-center gap-0.5">
            <span className="w-3 h-3 rounded-full bg-black text-white text-[7px] flex items-center justify-center font-bold">A</span>
            Correto
          </span>
          <span className="flex items-center gap-0.5 text-slate-500">
            <span className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[7px]">X</span>
            Incorreto
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* GRADE DE QUESTÕES OBJETIVAS (BOLHAS OMR) */}
      {/* ======================================================== */}
      {questoesObjetivas.length > 0 && (
        <section className="mb-2">
          <div className="border-b border-black pb-0.5 mb-1.5 flex items-center justify-between">
            <span className="font-bold uppercase text-[10px] tracking-wide">
              Respostas das Questões Objetivas
            </span>
            {showAnswers && (
              <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded print:border print:border-black">
                MÁSCARA DE GABARITO OFICIAL
              </span>
            )}
          </div>

          {/* Grid em múltiplas colunas de questões */}
          <div className={`grid ${questoesObjetivas.length > 15 ? 'grid-cols-3' : questoesObjetivas.length > 8 ? 'grid-cols-2' : 'grid-cols-2'} gap-x-4 gap-y-1`}>
            {questoesObjetivas.map((item) => {
              const q = item.questao;
              const numAlts = Math.max(q.alternativas?.length || 4, 4);

              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between py-0.5 px-1 rounded border border-slate-200 print:border-slate-300 bg-white"
                >
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-5 font-black text-center text-[10px] bg-black text-white rounded-sm">
                      {String(item.ordem).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">
                      ({item.valor_pontuacao.toFixed(1)}pt)
                    </span>
                  </div>

                  {/* Bolhas OMR A, B, C, D, E */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: numAlts }).map((_, aIdx) => {
                      const letter = String.fromCharCode(65 + aIdx);
                      const altCorreta = q.alternativas?.[aIdx]?.correta ?? false;
                      const isFilled = showAnswers && altCorreta;

                      return (
                        <div
                          key={letter}
                          className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] transition-all select-none ${
                            isFilled
                              ? 'bg-black text-white border border-black font-black shadow-sm'
                              : 'border border-black text-black bg-white'
                          }`}
                        >
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* ESPAÇO PARA QUESTÕES DISSERTATIVAS / CÓDIGO (SE HOUVER) */}
      {/* ======================================================== */}
      {questoesDissertativas.length > 0 && (
        <section className="flex-1 flex flex-col justify-start">
          <div className="border-b border-black pb-0.5 mb-1.5 flex items-center justify-between">
            <span className="font-bold uppercase text-[10px] tracking-wide">
              Respostas das Questões Dissertativas e Práticas
            </span>
            <span className="text-[9px] text-slate-500">
              Responda com letra legível dentro do espaço reservado
            </span>
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col justify-around">
            {questoesDissertativas.map((item) => {
              const q = item.questao;
              // Quantidade de linhas ajustada para o cartão
              const linhasEfetivas = Math.min(Math.max(q.linhas_resposta || 3, 3), isCompact ? 3 : 5);

              return (
                <div key={q.id} className="border border-black p-1.5 rounded-none bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[9px]">
                      Questão {String(item.ordem).padStart(2, '0')}: {q.titulo}
                    </span>
                    <span className="text-[8px] font-bold text-slate-700">
                      [{item.valor_pontuacao.toFixed(1)} pts]
                    </span>
                  </div>

                  {/* Linhas pautadas compactas */}
                  <div className="space-y-1">
                    {Array.from({ length: linhasEfetivas }).map((_, lIdx) => (
                      <div
                        key={lIdx}
                        className="border-b border-slate-300 print:border-black/50 h-3.5 w-full"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Rodapé institucional com número da folha */}
      <footer className="mt-1 pt-1 border-t border-dotted border-slate-400 flex items-center justify-between text-[8px] text-slate-500">
        <span>SisProva &bull; Documento Oficial de Avaliação Acadêmica</span>
        <span>Folha {unitIndex} &bull; Autenticação e Conferência</span>
      </footer>
    </div>
  );
};

export const AnswerSheetPreview = forwardRef<HTMLDivElement, AnswerSheetPreviewProps>(
  ({ exam, layoutMode = '1_per_page', showAnswers = false }, ref) => {
    return (
      <div className="w-full flex justify-center py-6 px-2 print:p-0 print:m-0 print:bg-white print:block overflow-y-auto print:overflow-visible">
        {/* Folha A4 Simulação Visual e Formato de Impressão */}
        <div
          ref={ref}
          id="printable-answer-sheet"
          className="a4-sheet bg-white text-black shadow-2xl print:shadow-none font-sans relative print:w-full print:max-w-none print:m-0 print:p-0 print:border-none print:static"
        >
          {/* MODO 1: UMA FOLHA INTEIRA POR PÁGINA A4 */}
          {layoutMode === '1_per_page' && (
            <div className="h-full flex flex-col justify-between">
              <SingleSheetUnit exam={exam} showAnswers={showAnswers} isCompact={false} unitIndex={1} />
            </div>
          )}

          {/* MODO 2: DUAS FOLHAS POR PÁGINA A4 (CORTE NA METADE HORIZONTAL) */}
          {layoutMode === '2_per_page' && (
            <div className="h-full flex flex-col justify-between gap-2">
              <div className="flex-1 overflow-hidden border border-slate-300 print:border-black rounded p-1">
                <SingleSheetUnit exam={exam} showAnswers={showAnswers} isCompact={true} unitIndex={1} />
              </div>

              {/* Linha de corte com tesoura */}
              <div className="flex items-center justify-center gap-2 py-1 text-slate-400 print:text-black text-[9px] select-none">
                <Scissors className="w-3.5 h-3.5" />
                <span className="font-mono tracking-widest text-[8px]">
                  - - - - - - - - - - - - - - - - - CORTE AQUI - - - - - - - - - - - - - - - - -
                </span>
                <Scissors className="w-3.5 h-3.5 rotate-180" />
              </div>

              <div className="flex-1 overflow-hidden border border-slate-300 print:border-black rounded p-1">
                <SingleSheetUnit exam={exam} showAnswers={showAnswers} isCompact={true} unitIndex={2} />
              </div>
            </div>
          )}

          {/* MODO 4: QUATRO FOLHAS POR PÁGINA A4 (QUADRANTES PARA CORTE EM 4) */}
          {layoutMode === '4_per_page' && (
            <div className="h-full grid grid-cols-2 grid-rows-2 gap-3">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className="border border-dashed border-slate-400 print:border-black rounded p-1 flex flex-col justify-between relative overflow-hidden"
                >
                  <SingleSheetUnit exam={exam} showAnswers={showAnswers} isCompact={true} unitIndex={num} />
                  <div className="absolute top-1 right-1 text-[7px] font-bold text-slate-400 print:text-black">
                    #{num}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
AnswerSheetPreview.displayName = 'AnswerSheetPreview';
