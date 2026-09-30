import { forwardRef } from 'react';
import type { LiveExamState } from '../types';
import {
  calcularMatrizGabarito,
  type VariacoesConfig,
} from '../utils/shuffle';
import { formatarDataBR } from '../utils/date';
import { Award, FileSpreadsheet, Shuffle } from 'lucide-react';

interface ConsolidatedAnswerKeyPreviewProps {
  exam: LiveExamState;
  config: VariacoesConfig;
}

export const ConsolidatedAnswerKeyPreview = forwardRef<
  HTMLDivElement,
  ConsolidatedAnswerKeyPreviewProps
>(({ exam, config }, ref) => {
  const { instituicao, disciplina, titulo, data_aplicacao, peso_total } = exam;
  const { tiposHabilitados, itens, distribuicaoGabarito } = calcularMatrizGabarito(
    exam,
    config
  );

  const totalObjetivas = itens.filter((it) => it.tipoQuestao === 'OBJETIVA').length;
  const totalDissertativas = itens.filter(
    (it) => it.tipoQuestao === 'DISSERTATIVA' || it.tipoQuestao === 'CODIGO'
  ).length;

  return (
    <div className="w-full flex justify-center py-6 px-2 print:p-0 print:m-0 print:bg-white print:block overflow-y-auto print:overflow-visible">
      {/* Folha A4 Simulação Visual e Formato de Impressão */}
      <div
        ref={ref}
        id="printable-consolidated-key"
        className="a4-sheet bg-white text-black shadow-2xl print:shadow-none font-sans relative print:w-full print:max-w-none print:m-0 print:p-0 print:border-none print:static"
      >
        {/* ======================================================== */}
        {/* CABEÇALHO OFICIAL DO GABARITO DO PROFESSOR */}
        {/* ======================================================== */}
        <header
          className="border-2 border-black p-4 mb-4 bg-white print:p-3 print:mb-3"
          style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
        >
          <div className="flex items-center justify-between border-b border-black pb-2.5">
            {instituicao?.logo_base64 && (
              <img
                src={instituicao.logo_base64}
                alt="Logo Instituição"
                className="h-12 w-auto max-w-[130px] object-contain mr-3"
              />
            )}

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
                <span className="font-medium">{disciplina?.nome || 'Geral'}</span>
                {disciplina?.codigo ? <span className="font-medium"> ({disciplina.codigo})</span> : ''}
              </div>
            </div>

            <div className="text-right border-l border-black pl-3 min-w-[100px] font-sans">
              <div className="text-[10px] uppercase text-slate-600 font-bold">
                Valor Total
              </div>
              <div className="text-lg font-black text-slate-900">
                {peso_total.toFixed(1)} pts
              </div>
            </div>
          </div>

          {/* Faixa Título do Gabarito Consolidado */}
          <div className="py-2 text-center border-b border-black bg-slate-100 print:bg-transparent flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-black print:hidden" />
              <span className="text-sm font-bold uppercase">
                Gabarito Consolidado do Professor
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block text-xs font-bold bg-black text-white px-2.5 py-0.5 rounded-sm uppercase leading-tight">
                Múltiplas Versões ({tiposHabilitados.map((t) => `Tipo ${t}`).join(' &bull; ')})
              </span>
            </div>
          </div>

          {/* Metadados e Informações de Aplicação */}
          <div className="grid grid-cols-12 gap-2 pt-2.5 text-xs font-sans">
            <div className="col-span-6 flex items-center">
              <span className="font-bold mr-1.5">Avaliação:</span>
              <span className="font-medium text-slate-800">{titulo || 'Avaliação Bimestral'}</span>
            </div>
            <div className="col-span-3 flex items-center">
              <span className="font-bold mr-1.5">Data:</span>
              <span>{formatarDataBR(data_aplicacao)}</span>
            </div>
            <div className="col-span-3 flex items-center justify-end">
              <span className="font-bold mr-1.5">Semente (Seed):</span>
              <span className="font-mono bg-slate-150 px-1.5 py-0.5 rounded border border-slate-300 text-[11px]">
                #{config.seed}
              </span>
            </div>
          </div>

          {/* Regras de Embaralhamento Aplicadas */}
          <div className="mt-2 pt-1.5 border-t border-dashed border-slate-300 text-[11px] text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Shuffle className="w-3 h-3 text-slate-600" />
                Ordem das Questões:
                <strong className={config.embaralharQuestoes ? 'text-black' : 'text-slate-500'}>
                  {config.embaralharQuestoes ? 'Embaralhada' : 'Original Fixa'}
                </strong>
              </span>
              <span className="flex items-center gap-1">
                <Shuffle className="w-3 h-3 text-slate-600" />
                Alternativas Internas:
                <strong className={config.embaralharAlternativas ? 'text-black' : 'text-slate-500'}>
                  {config.embaralharAlternativas ? 'Embaralhadas' : 'Originais Fixas'}
                </strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              Total: {itens.length} questões ({totalObjetivas} obj / {totalDissertativas} diss)
            </span>
          </div>
        </header>

        {/* ======================================================== */}
        {/* TABELA MATRIZ CONSOLIDADA DE GABARITOS */}
        {/* ======================================================== */}
        <section className="mb-4">
          <table className="w-full text-left border-collapse border-2 border-black text-xs">
            <thead>
              <tr className="bg-slate-200 print:bg-slate-100 text-black border-b-2 border-black">
                <th className="p-2 border-r border-black text-center w-12 font-black">
                  Ref (A)
                </th>
                <th className="p-2 border-r border-black font-bold">
                  Questão / Tópico Avaliado
                </th>
                <th className="p-2 border-r border-black text-center w-16 font-bold">
                  Tipo
                </th>
                <th className="p-2 border-r border-black text-center w-14 font-bold">
                  Valor
                </th>

                {/* Colunas para cada Prova */}
                {tiposHabilitados.map((tipo) => (
                  <th
                    key={tipo}
                    className="p-2 border-r border-black text-center w-24 font-black bg-slate-300/80 print:bg-slate-200 text-sm"
                  >
                    Prova {tipo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => {
                const isObjetiva = item.tipoQuestao === 'OBJETIVA';

                return (
                  <tr
                    key={item.questaoId}
                    className={`border-b border-black ${
                      index % 2 === 1 ? 'bg-slate-50 print:bg-white' : 'bg-white'
                    }`}
                  >
                    {/* Número de Referência Canônica (Prova A) */}
                    <td className="p-2 border-r border-black text-center font-black bg-slate-100 print:bg-transparent text-sm">
                      {String(item.ordemOriginal).padStart(2, '0')}
                    </td>

                    {/* Título da Questão */}
                    <td className="p-2 border-r border-black font-medium">
                      <div className="font-bold text-slate-900 leading-snug">
                        {item.questaoTitulo}
                      </div>
                      {/* Se objetiva, mostra texto resumido da resposta correta na Prova A */}
                      {isObjetiva && item.respostas.A.textoAlternativa && (
                        <div className="text-[10px] text-slate-600 mt-0.5 truncate max-w-xs italic">
                          Gabarito: {item.respostas.A.textoAlternativa}
                        </div>
                      )}
                    </td>

                    {/* Tipo da Questão */}
                    <td className="p-2 border-r border-black text-center text-[10px] font-semibold text-slate-700">
                      {item.tipoQuestao === 'OBJETIVA'
                        ? 'Objetiva'
                        : item.tipoQuestao === 'CODIGO'
                        ? 'Código'
                        : 'Dissert.'}
                    </td>

                    {/* Pontuação */}
                    <td className="p-2 border-r border-black text-center font-bold text-slate-800">
                      {item.valorPontuacao.toFixed(1)}
                    </td>

                    {/* Respostas para cada Tipo de Prova */}
                    {tiposHabilitados.map((tipo) => {
                      const resp = item.respostas[tipo];

                      return (
                        <td
                          key={tipo}
                          className="p-2 border-r border-black text-center align-middle"
                        >
                          {isObjetiva ? (
                            <div className="flex flex-col items-center justify-center">
                              {/* Bolha com a letra do gabarito */}
                              <div className="w-7 h-7 rounded-full bg-black text-white font-black text-sm flex items-center justify-center shadow-sm print:border print:border-black">
                                {resp.letraGabarito || '-'}
                              </div>

                              {/* Posição desta questão na Prova caso tenha havido shuffle de questões */}
                              {config.embaralharQuestoes && (
                                <span className="text-[9px] font-bold text-slate-600 mt-0.5">
                                  Questão {String(resp.ordemNaProva).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-[10px] text-slate-600">
                              <span className="font-bold text-slate-800 italic">Pautada</span>
                              {config.embaralharQuestoes && (
                                <span className="text-[9px] font-bold text-slate-500">
                                  Q.{String(resp.ordemNaProva).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ======================================================== */}
        {/* RESUMO ESTATÍSTICO DE BALANCEAMENTO DE GABARITOS */}
        {/* ======================================================== */}
        {totalObjetivas > 0 && (
          <section
            className="border-2 border-black p-3 bg-slate-50 print:bg-white mb-4"
            style={{ breakInside: 'avoid' }}
          >
            <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] mb-2 border-b border-black pb-1">
              <Award className="w-3.5 h-3.5 text-black" />
              <span>Distribuição de Respostas Corretas por Versão de Prova</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              {tiposHabilitados.map((tipo) => {
                const dist = distribuicaoGabarito[tipo] || {};
                const letras = ['A', 'B', 'C', 'D', 'E'];

                return (
                  <div
                    key={tipo}
                    className="border border-black p-2 bg-white rounded-none"
                  >
                    <div className="font-black text-center text-xs border-b border-slate-300 pb-1 mb-1.5 bg-slate-100">
                      Prova {tipo}
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center font-mono text-[11px]">
                      {letras.map((l) => (
                        <div key={l} className="flex flex-col">
                          <span className="font-bold text-slate-500 text-[10px]">{l}</span>
                          <span
                            className={`font-black rounded py-0.5 ${
                              (dist[l] || 0) > 0 ? 'bg-slate-200 text-black' : 'text-slate-300'
                            }`}
                          >
                            {dist[l] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Rodapé da Matriz Consolidada */}
        <footer className="mt-4 pt-2 border-t-2 border-black text-[10px] text-slate-600 font-sans flex justify-between items-center print:mt-3">
          <span>
            SisProva &bull; Documento Sigiloso do Docente &bull; Matriz de Correção
          </span>
          <span>
            {disciplina?.nome || 'Avaliação'} &bull; {titulo}
          </span>
        </footer>
      </div>
    </div>
  );
});

ConsolidatedAnswerKeyPreview.displayName = 'ConsolidatedAnswerKeyPreview';
