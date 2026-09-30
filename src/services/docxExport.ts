import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Footer,
  PageNumber,
} from 'docx';
import type { LiveExamState } from '../types';
import { formatarDataBR } from '../utils/date';
import { api, isTauriEnvironment } from './api';

export interface DocxExportOptions {
  showAnswers?: boolean;
  variacaoTipo?: 'A' | 'B' | 'C' | 'D' | null;
  defaultFileName?: string;
  cabecalhoEstilo?: 'padrao' | 'compacto' | 'concurso' | 'minimo';
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  cancelled?: boolean;
  error?: string;
}

// Converte texto simples com suporte a bold, italic, code inline e math em TextRuns
function parseInlineFormatting(text: string, baseOptions: { bold?: boolean; color?: string; font?: string } = {}): TextRun[] {
  if (!text) return [];

  // Tokeniza separando negrito (**texto**), itálico (*texto*), código (`code`) e matemática ($eq$)
  const tokens = text.split(/(\*\*[\s\S]+?\*\*|\*[^*]+?\*|`[^`]+?`|\$[^$\n]+?\$)/g);
  const runs: TextRun[] = [];

  for (const token of tokens) {
    if (!token) continue;

    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      runs.push(
        new TextRun({
          text: token.slice(2, -2),
          bold: true,
          font: baseOptions.font || 'Calibri',
          color: baseOptions.color || '1e293b',
        })
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          italics: true,
          font: baseOptions.font || 'Calibri',
          color: baseOptions.color || '1e293b',
        })
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          font: 'Consolas',
          color: '0f172a',
          shading: {
            fill: 'f1f5f9',
            type: ShadingType.CLEAR,
          },
        })
      );
    } else if (token.startsWith('$') && token.endsWith('$') && token.length >= 2) {
      // Notação matemática inline: estiliza com itálico e fonte Cambria Math
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          italics: true,
          font: 'Cambria Math',
          color: '0369a1',
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: token,
          bold: baseOptions.bold,
          font: baseOptions.font || 'Calibri',
          color: baseOptions.color || '1e293b',
        })
      );
    }
  }

  return runs;
}

// Converte markdown de enunciado/resposta em parágrafos docx
function convertMarkdownToDocxParagraphs(markdown: string): Paragraph[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const paragraphs: Paragraph[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Início / fim de bloco de código ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Encerra bloco de código
        paragraphs.push(
          new Paragraph({
            spacing: { before: 100, after: 100, line: 240 },
            shading: {
              fill: 'f8fafc',
              type: ShadingType.CLEAR,
            },
            border: {
              left: { color: 'cbd5e1', space: 6, style: BorderStyle.SINGLE, size: 12 },
              top: { color: 'e2e8f0', space: 4, style: BorderStyle.SINGLE, size: 4 },
              right: { color: 'e2e8f0', space: 4, style: BorderStyle.SINGLE, size: 4 },
              bottom: { color: 'e2e8f0', space: 4, style: BorderStyle.SINGLE, size: 4 },
            },
            children: [
              new TextRun({
                text: codeBuffer.join('\n'),
                font: 'Consolas',
                size: 19, // ~9.5pt
                color: '0f172a',
              }),
            ],
          })
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Linha vazia
    if (!trimmed) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [],
        })
      );
      continue;
    }

    // Equação em bloco $$ ... $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length >= 4) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: trimmed.slice(2, -2).trim(),
              italics: true,
              font: 'Cambria Math',
              size: 24, // 12pt
              color: '0369a1',
            }),
          ],
        })
      );
      continue;
    }

    // Título / Heading Markdown (### / ## / #)
    if (trimmed.startsWith('#')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      paragraphs.push(
        new Paragraph({
          spacing: { before: 140, after: 60 },
          children: parseInlineFormatting(headingText, { bold: true }),
        })
      );
      continue;
    }

    // Lista com marcadores (- ou *)
    if (/^[-*]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*]\s+/, '');
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
          children: parseInlineFormatting(bulletText),
        })
      );
      continue;
    }

    // Lista numerada (1., 2., etc.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const numPrefixMatch = trimmed.match(/^(\d+\.)\s+/);
      const prefix = numPrefixMatch ? numPrefixMatch[1] : '';
      const listText = trimmed.replace(/^\d+\.\s+/, '');
      paragraphs.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${prefix} `, bold: true, font: 'Calibri' }),
            ...parseInlineFormatting(listText),
          ],
        })
      );
      continue;
    }

    // Parágrafo de texto normal
    paragraphs.push(
      new Paragraph({
        spacing: { before: 50, after: 50, line: 260 },
        children: parseInlineFormatting(rawLine),
      })
    );
  }

  // Se bloco de código não fechou
  if (inCodeBlock && codeBuffer.length > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 100 },
        shading: { fill: 'f8fafc', type: ShadingType.CLEAR },
        children: [
          new TextRun({
            text: codeBuffer.join('\n'),
            font: 'Consolas',
            size: 19,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

/**
 * Cria a tabela de cabeçalho personalizada para exames conforme estilo selecionado (MELH-08)
 */
function createExamHeaderTable(exam: LiveExamState, options: DocxExportOptions): Table {
  const borderLight = { style: BorderStyle.SINGLE, size: 6, color: 'cbd5e1' };
  const borderPrimary = { style: BorderStyle.SINGLE, size: 12, color: '0284c7' };
  const borderDark = { style: BorderStyle.SINGLE, size: 12, color: '0f172a' };
  const borderNone = { style: BorderStyle.NONE };

  const instNome = exam.instituicao?.nome || 'Instituição de Ensino';
  const discNome = exam.disciplina?.nome || 'Disciplina Geral';
  const discCodigo = exam.disciplina?.codigo ? ` (${exam.disciplina.codigo})` : '';
  const dataFormatada = exam.data_aplicacao ? formatarDataBR(exam.data_aplicacao) : '___/___/______';
  const tipoLabel = options.variacaoTipo ? `PROVA - TIPO [ ${options.variacaoTipo} ]` : 'AVALIAÇÃO';
  const modoLabel = options.showAnswers ? ' (GABARITO)' : '';
  const estilo = options.cabecalhoEstilo || 'padrao';

  // 1. CABEÇALHO COMPACTO (ECONÔMICO)
  if (estilo === 'compacto') {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: borderDark,
        left: borderDark,
        right: borderDark,
        bottom: borderDark,
        insideHorizontal: borderLight,
        insideVertical: borderLight,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              shading: { fill: 'f8fafc', type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: instNome.toUpperCase(), bold: true, size: 19, font: 'Calibri' }),
                    new TextRun({ text: ` — ${discNome}${discCodigo}`, size: 18, font: 'Calibri', color: '475569' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: 'f1f5f9', type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `${tipoLabel}${modoLabel} | Valor: ${exam.peso_total.toFixed(1)} pts`, bold: true, size: 18, font: 'Calibri', color: '0284c7' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Aluno(a): ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '____________________________________  ', color: '94a3b8', size: 18 }),
                    new TextRun({ text: 'RA: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '____________  ', color: '94a3b8', size: 18 }),
                    new TextRun({ text: 'Data: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: `${dataFormatada}  `, size: 18, font: 'Calibri' }),
                    new TextRun({ text: 'Nota: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '________', color: '94a3b8', size: 18 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  // 2. CABEÇALHO CONCURSO / VESTIBULAR (SIMULADO FORMAL)
  if (estilo === 'concurso') {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: borderDark,
        left: borderDark,
        right: borderDark,
        bottom: borderDark,
        insideHorizontal: borderLight,
        insideVertical: borderLight,
      },
      rows: [
        // Faixa solene superior
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: '0f172a', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `CADERNO DE QUESTÕES • AVALIAÇÃO OFICIAL ${options.variacaoTipo ? `[PROVA ${options.variacaoTipo}]` : ''}${modoLabel}`,
                      bold: true,
                      size: 20,
                      font: 'Calibri',
                      color: 'ffffff',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Informações Institucionais e Valor
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: instNome.toUpperCase(), bold: true, size: 21, font: 'Calibri' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Disciplina: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: `${discNome}${discCodigo}`, size: 18, font: 'Calibri' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: 'f8fafc', type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'PONTUAÇÃO', bold: true, size: 16, font: 'Calibri', color: '64748b' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `${exam.peso_total.toFixed(1)} pts`, bold: true, size: 22, font: 'Calibri', color: '0f172a' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `Data: ${dataFormatada}`, size: 16, font: 'Calibri', color: '64748b' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Título do Exame
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: 'f1f5f9', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: (exam.titulo || 'AVALIAÇÃO OFICIAL').toUpperCase(), bold: true, size: 22, font: 'Calibri' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Identificação com Linhas de Assinatura
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: 'NOME DO(A) CANDIDATO(A): ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '________________________________________________________________', color: '94a3b8', size: 18 }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: 'INSCRIÇÃO/RA: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '____________________  ', color: '94a3b8', size: 18 }),
                    new TextRun({ text: 'SALA/TURMA: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '______________  ', color: '94a3b8', size: 18 }),
                    new TextRun({ text: 'NOTA: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: `______ / ${exam.peso_total.toFixed(1)}`, bold: true, size: 18, font: 'Calibri' }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Assinatura do Aluno: ', size: 17, color: '64748b', font: 'Calibri' }),
                    new TextRun({ text: '___________________________   ', color: '94a3b8', size: 17 }),
                    new TextRun({ text: 'Visto Fiscal / Prof.: ', size: 17, color: '64748b', font: 'Calibri' }),
                    new TextRun({ text: '___________________________', color: '94a3b8', size: 17 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  // 3. CABEÇALHO MÍNIMO (LINHA ÚNICA ULTRA-LIMPA)
  if (estilo === 'minimo') {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: borderNone,
        left: borderNone,
        right: borderNone,
        bottom: borderDark,
        insideHorizontal: borderNone,
        insideVertical: borderNone,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 60, bottom: 40, left: 40, right: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: (exam.instituicao?.sigla || instNome).toUpperCase(), bold: true, size: 20, font: 'Calibri' }),
                    new TextRun({ text: ` • ${discNome}`, bold: true, size: 19, font: 'Calibri', color: '334155' }),
                    new TextRun({ text: ` • ${exam.titulo || 'PROVA'}`, bold: true, size: 19, font: 'Calibri' }),
                    new TextRun({ text: `  [${exam.peso_total.toFixed(1)} pts]`, bold: true, size: 19, font: 'Calibri', color: '0284c7' }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({ text: 'Nome: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '_____________________________________________________  ', color: '94a3b8', size: 18 }),
                    new TextRun({ text: 'Data: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: `${dataFormatada}  `, size: 18, font: 'Calibri' }),
                    new TextRun({ text: 'Nota: ', bold: true, size: 18, font: 'Calibri' }),
                    new TextRun({ text: '________', color: '94a3b8', size: 18 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  // 4. CABEÇALHO PADRÃO (UNIVERSITÁRIO INSTITUCIONAL)
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: borderPrimary,
      left: borderPrimary,
      right: borderPrimary,
      bottom: borderPrimary,
      insideHorizontal: borderLight,
      insideVertical: borderLight,
    },
    rows: [
      // Linha 1: Dados Institucionais e Título
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { fill: 'f8fafc', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: instNome.toUpperCase(),
                    bold: true,
                    size: 21, // ~10.5pt
                    font: 'Calibri',
                    color: '0f172a',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Disciplina: `,
                    bold: true,
                    size: 19,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: `${discNome}${discCodigo}`,
                    size: 19,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: 'f1f5f9', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: `${tipoLabel}${modoLabel}`,
                    bold: true,
                    size: 19,
                    font: 'Calibri',
                    color: options.showAnswers ? '15803d' : '0369a1',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Data: ${dataFormatada} | Valor: ${exam.peso_total.toFixed(1)} pts`,
                    size: 18,
                    font: 'Calibri',
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Linha 2: Título do Exame
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: 'ffffff', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: exam.titulo.toUpperCase(),
                    bold: true,
                    size: 24, // 12pt
                    font: 'Calibri',
                    color: '0f172a',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Linha 3: Campos do Aluno
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: 'Nome do Aluno(a): ', bold: true, size: 19, font: 'Calibri' }),
                  new TextRun({
                    text: '_________________________________________________________________________',
                    color: '94a3b8',
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'R.A. / Matrícula: ', bold: true, size: 19, font: 'Calibri' }),
                  new TextRun({ text: '__________________   ', color: '94a3b8', size: 19 }),
                  new TextRun({ text: 'Turma: ', bold: true, size: 19, font: 'Calibri' }),
                  new TextRun({ text: '______________   ', color: '94a3b8', size: 19 }),
                  new TextRun({ text: 'Nota Obtida: ', bold: true, size: 19, font: 'Calibri' }),
                  new TextRun({ text: '__________ / ' + exam.peso_total.toFixed(1), color: '0f172a', size: 19, bold: true }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Cria caixa estilizada de instruções
 */
function createInstructionsBox(instrucoes: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 18, color: '0284c7' },
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'f8fafc', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'ORIENTAÇÕES E INSTRUÇÕES:',
                    bold: true,
                    size: 19,
                    font: 'Calibri',
                    color: '0369a1',
                  }),
                ],
              }),
              ...convertMarkdownToDocxParagraphs(instrucoes),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Cria linhas pautadas para resposta dissertativa
 */
function createAnswerRuledLines(count: number): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const linesCount = Math.max(count || 5, 2);

  for (let i = 0; i < linesCount; i++) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 180, after: 60 },
        border: {
          bottom: { color: 'cbd5e1', style: BorderStyle.SINGLE, size: 6, space: 1 },
        },
        children: [
          new TextRun({
            text: ' ',
            size: 18,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

/**
 * Cria a tabela de gabarito resumo no final (quando em modo professor)
 */
function createAnswerKeySummaryTable(exam: LiveExamState): Table {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const borderTable = { style: BorderStyle.SINGLE, size: 6, color: '94a3b8' };

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        shading: { fill: '1e293b', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Nº', bold: true, color: 'ffffff', size: 19 })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: '1e293b', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Tipo', bold: true, color: 'ffffff', size: 19 })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: '1e293b', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Gabarito Oficial / Resposta', bold: true, color: 'ffffff', size: 19 })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: '1e293b', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Valor', bold: true, color: 'ffffff', size: 19 })],
          }),
        ],
      }),
    ],
  });

  const rows: TableRow[] = [headerRow];

  exam.itens.forEach((item, index) => {
    let gabaritoTxt = '-';
    if (item.questao.tipo_questao === 'OBJETIVA') {
      const correctIdx = item.questao.alternativas.findIndex((a) => a.correta);
      gabaritoTxt = correctIdx !== -1 ? `Alternativa (${letters[correctIdx] || '?'})` : 'Não definido';
    } else {
      gabaritoTxt = 'Critério Dissertativo';
    }

    const rowBg = index % 2 === 0 ? 'ffffff' : 'f8fafc';

    rows.push(
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: rowBg, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(index + 1).padStart(2, '0'), bold: true, size: 18 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: rowBg, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: item.questao.tipo_questao === 'OBJETIVA' ? 'Múltipla Escolha' : 'Dissertativa',
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: rowBg, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: gabaritoTxt,
                    bold: item.questao.tipo_questao === 'OBJETIVA',
                    color: item.questao.tipo_questao === 'OBJETIVA' ? '15803d' : '334155',
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: rowBg, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `${item.valor_pontuacao.toFixed(1)} pt`, size: 18 })],
              }),
            ],
          }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: borderTable,
      left: borderTable,
      right: borderTable,
      bottom: borderTable,
      insideHorizontal: borderTable,
      insideVertical: borderTable,
    },
    rows,
  });
}

/**
 * Gera a estrutura completa de documento Word (.docx)
 */
export function generateDocxDocument(exam: LiveExamState, options: DocxExportOptions = {}): Document {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const showAnswers = options.showAnswers ?? false;

  // Monta conteúdo da seção
  const children: (Paragraph | Table)[] = [];

  // 1. Cabeçalho Institucional
  children.push(createExamHeaderTable(exam, options));
  children.push(new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }));

  // 2. Orientações / Instruções (se houver)
  if (exam.instrucoes && exam.instrucoes.trim().length > 0) {
    children.push(createInstructionsBox(exam.instrucoes.trim()));
    children.push(new Paragraph({ spacing: { before: 140, after: 60 }, children: [] }));
  }

  // 3. Questões
  exam.itens.forEach((item, index) => {
    const qNum = String(index + 1).padStart(2, '0');
    const q = item.questao;
    const pts = item.valor_pontuacao.toFixed(1);

    // Linha de cabeçalho da questão
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: `QUESTÃO ${qNum} `,
            bold: true,
            size: 22, // 11pt
            font: 'Calibri',
            color: '0369a1',
          }),
          new TextRun({
            text: `[${pts} ${item.valor_pontuacao === 1 ? 'ponto' : 'pontos'}]`,
            bold: true,
            size: 20,
            font: 'Calibri',
            color: '64748b',
          }),
          q.titulo
            ? new TextRun({
                text: ` — ${q.titulo}`,
                bold: true,
                size: 20,
                font: 'Calibri',
                color: '1e293b',
              })
            : new TextRun({ text: '' }),
        ],
      })
    );

    // Enunciado
    const enunciadoParas = convertMarkdownToDocxParagraphs(q.enunciado_markdown);
    children.push(...enunciadoParas);

    // Se tiver diagrama Mermaid
    if (q.diagrama_mermaid) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          shading: { fill: 'f1f5f9', type: ShadingType.CLEAR },
          children: [
            new TextRun({
              text: `[Diagrama Estrutural / Fluxo Mermaid: ${q.diagrama_mermaid.split('\n')[0] || ''}]`,
              italics: true,
              size: 18,
              color: '475569',
            }),
          ],
        })
      );
    }

    // Alternativas Objetivas
    if (q.tipo_questao === 'OBJETIVA' && q.alternativas && q.alternativas.length > 0) {
      q.alternativas.forEach((alt, altIdx) => {
        const letter = letters[altIdx] || `${altIdx + 1}`;
        const isCorrect = alt.correta;
        const highlightCorrect = showAnswers && isCorrect;

        const altRuns: TextRun[] = [
          new TextRun({
            text: `( ${letter} )  `,
            bold: highlightCorrect || true,
            size: 20,
            font: 'Calibri',
            color: highlightCorrect ? '15803d' : '334155',
          }),
        ];

        // Adiciona texto da alternativa
        const parsedAlt = parseInlineFormatting(alt.texto, {
          bold: highlightCorrect,
          color: highlightCorrect ? '15803d' : '1e293b',
        });
        altRuns.push(...parsedAlt);

        if (highlightCorrect) {
          altRuns.push(
            new TextRun({
              text: '  ◄ [RESPOSTA CORRETA / GABARITO]',
              bold: true,
              size: 18,
              color: '15803d',
            })
          );
        }

        children.push(
          new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: 240 },
            children: altRuns,
          })
        );
      });
    }

    // Linhas para resposta dissertativa (modo aluno)
    if (q.tipo_questao === 'DISSERTATIVA' && !showAnswers) {
      const lineParas = createAnswerRuledLines(q.linhas_resposta || 6);
      children.push(...lineParas);
    }

    // Resolução / Padrão de Resposta (modo professor)
    if (showAnswers && q.resposta_esperada) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            left: { style: BorderStyle.SINGLE, size: 18, color: '15803d' },
            top: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: 'f0fdf4', type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: 'PADRÃO DE RESPOSTA / CRITÉRIO DE CORREÇÃO:',
                          bold: true,
                          size: 19,
                          font: 'Calibri',
                          color: '15803d',
                        }),
                      ],
                    }),
                    ...convertMarkdownToDocxParagraphs(q.resposta_esperada),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    }

    // Divisor sutil entre questões
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 120 },
        border: {
          bottom: { color: 'e2e8f0', style: BorderStyle.SINGLE, size: 4 },
        },
        children: [],
      })
    );
  });

  // 4. Se estiver em modo gabarito, inclui folha de respostas resumida
  if (showAnswers) {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: 'GABARITO RESUMIDO E TABELA DE PONTUAÇÃO',
            bold: true,
            size: 26,
            font: 'Calibri',
            color: '0f172a',
          }),
        ],
      })
    );
    children.push(createAnswerKeySummaryTable(exam));
  }

  // Criação do Documento Docx
  return new Document({
    creator: 'SisProva - Sistema de Avaliação Acadêmica',
    title: exam.titulo,
    description: `Avaliação gerada pelo SisProva - ${exam.disciplina?.nome || ''}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 20mm
              bottom: 1134,
              left: 1134,
              right: 1134,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${exam.titulo} | Página `,
                    font: 'Calibri',
                    size: 18,
                    color: '64748b',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Calibri',
                    size: 18,
                    color: '64748b',
                  }),
                  new TextRun({
                    text: ' de ',
                    font: 'Calibri',
                    size: 18,
                    color: '64748b',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Calibri',
                    size: 18,
                    color: '64748b',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

/**
 * Realiza o fluxo completo de exportação para Word (.docx)
 * Abre diálogo nativo do Tauri ou efetua download direto no navegador.
 */
export async function exportExamToDocx(
  exam: LiveExamState,
  options: DocxExportOptions = {}
): Promise<ExportResult> {
  try {
    const slug = (exam.titulo || 'avaliacao')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const sufixoTipo = options.variacaoTipo ? `_tipo_${options.variacaoTipo.toLowerCase()}` : '';
    const sufixoModo = options.showAnswers ? '_gabarito' : '_aluno';
    const defaultFileName = options.defaultFileName || `${slug}${sufixoTipo}${sufixoModo}.docx`;

    // 1. Gera o documento
    const doc = generateDocxDocument(exam, options);

    // 2. No Tauri: usa diálogo de salvamento nativo e grava binário
    if (isTauriEnvironment()) {
      const selectedPath = await api.saveTextFileDialog(
        defaultFileName,
        'Documento do Microsoft Word (*.docx)',
        ['docx']
      );

      if (!selectedPath) {
        return { success: false, cancelled: true };
      }

      const arrayBuffer = await Packer.toArrayBuffer(doc);
      await api.writeBinaryFile(selectedPath, new Uint8Array(arrayBuffer));
      return { success: true, filePath: selectedPath };
    }

    // 3. Fallback no Navegador (Web/Mock): baixa via Blob URL
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filePath: defaultFileName };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Erro ao exportar avaliação para Word (.docx):', err);
    return { success: false, error: message };
  }
}
