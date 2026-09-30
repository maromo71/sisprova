import type { LiveExamState } from '../types';
import { formatarDataBR } from '../utils/date';
import { api, isTauriEnvironment } from './api';

export interface LatexExportOptions {
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

/**
 * Converte Markdown acadêmico com KaTeX para sintaxe nativa LaTeX compilável.
 */
export function convertMarkdownToLatex(markdown: string): string {
  if (!markdown) return '';

  // Tokeniza dividindo em blocos matemáticos, blocos de código e texto comum
  const tokens = markdown.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|```[\s\S]*?```|`[^`\n]+?`)/g);

  const converted = tokens.map((token) => {
    if (!token) return '';

    // Bloco de código delimitado por ```
    if (token.startsWith('```') && token.endsWith('```')) {
      const firstLineEnd = token.indexOf('\n');
      let lang = '';
      let code = '';
      if (firstLineEnd !== -1) {
        lang = token.slice(3, firstLineEnd).trim().toLowerCase();
        code = token.slice(firstLineEnd + 1, -3);
      } else {
        code = token.slice(3, -3);
      }
      const langParam = lang ? `[language=${lang.charAt(0).toUpperCase() + lang.slice(1)}]` : '';
      return `\\begin{lstlisting}${langParam}\n${code.trimEnd()}\n\\end{lstlisting}`;
    }

    // Código inline delimitado por `
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      const code = token.slice(1, -1);
      return `\\texttt{${code.replace(/([\\%_&#{}])/g, '\\$1')}}`;
    }

    // Equação em bloco $$ ... $$
    if (token.startsWith('$$') && token.endsWith('$$')) {
      const eq = token.slice(2, -2).trim();
      return `\n\\begin{equation*}\n${eq}\n\\end{equation*}\n`;
    }

    // Equação inline $ ... $
    if (token.startsWith('$') && token.endsWith('$')) {
      return token; // Preserva sintaxe matemática LaTeX original
    }

    // Texto livre: processa formatação Markdown comum
    let text = token;

    // Negrito e itálico combinados ***text***
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '\\textbf{\\textit{$1}}');
    // Negrito **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}');
    // Itálico *text* ou _text_
    text = text.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '\\textit{$1}');

    // Lista de itens
    text = text.replace(/^\s*[-*]\s+(.*)$/gm, '\\begin{itemize}\\item $1\\end{itemize}');
    // Une múltiplos itemizes consecutivos
    text = text.replace(/\\end\{itemize\}\n\\begin\{itemize\}/g, '');

    // Quebras de parágrafo duplas
    text = text.replace(/\n{2,}/g, '\n\n\\par\n');

    return text;
  });

  return converted.join('');
}

/**
 * Gera um documento LaTeX (.tex) completo e autocontido pronto para compilação com pdflatex.
 */
export function generateLatexDocument(
  exam: LiveExamState,
  options: LatexExportOptions = {}
): string {
  const { showAnswers = false, variacaoTipo = null } = options;
  const { instituicao, disciplina, titulo, instrucoes, data_aplicacao, peso_total, itens } = exam;

  const dataFormatada = formatarDataBR(data_aplicacao);
  const tipoStr = variacaoTipo ? ` -- Prova ${variacaoTipo}` : '';
  const gabaritoStr = showAnswers ? ' -- GABARITO DO PROFESSOR' : '';

  let tex = `% ==============================================================================
% Documento Gerado Automaticamente pelo SisProva (Avaliador Academico Offline)
% Data de Geracao: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
% ==============================================================================
\\documentclass[11pt,a4paper]{article}

% Pacotes Essenciais de Tipografia e Idioma
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[brazil]{babel}
\\usepackage{lmodern}

% Pacotes Matematicos Avancados (KaTeX / AMS-LaTeX)
\\usepackage{amsmath,amssymb,amsfonts,amsthm}
\\usepackage{mathtools}

% Diagramacao e Margens A4 Exatas
\\usepackage{geometry}
\\geometry{a4paper, top=20mm, bottom=20mm, left=20mm, right=20mm}

% Cores e Caixas Estilizadas
\\usepackage{xcolor}
\\usepackage{tcolorbox}
\\usepackage{enumitem}
\\usepackage{fancyhdr}
\\usepackage{listings}

% Configuracao de Caixas e Codigo Fonte
\\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\\definecolor{codeback}{rgb}{0.96,0.97,0.98}
\\definecolor{gabaritoback}{rgb}{0.94,0.98,0.95}
\\definecolor{gabaritoframe}{rgb}{0.13,0.55,0.28}

\\lstdefinestyle{sisprovaCode}{
    backgroundcolor=\\color{codeback},
    basicstyle=\\ttfamily\\footnotesize,
    breakatwhitespace=false,
    breaklines=true,
    numbers=left,
    numbersep=6pt,
    numberstyle=\\tiny\\color{codegray},
    showspaces=false,
    showstringspaces=false,
    tabsize=2,
    frame=single,
    rulecolor=\\color{gray!30}
}
\\lstset{style=sisprovaCode}

% Cabecalho e Rodape
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0.4pt}
\\fancyfoot[L]{\\footnotesize ${disciplina?.nome || 'Avaliação Acadêmica'}${tipoStr}${gabaritoStr}}
\\fancyfoot[R]{\\footnotesize Página \\thepage}

\\begin{document}

`;

  const estilo = options.cabecalhoEstilo || 'padrao';

  // ==============================================================================
  // CABECALHO CONFORME TEMPLATE SELECIONADO (MELH-08)
  // ==============================================================================
  if (estilo === 'compacto') {
    tex += `\\noindent
\\begin{tcolorbox}[colback=white,colframe=black,arc=0mm,boxrule=1pt,top=1.5mm,bottom=1.5mm,left=2.5mm,right=2.5mm]
{\\small \\textbf{${instituicao?.sigla || instituicao?.nome || 'INSTITUIÇÃO DE ENSINO'}} -- ${disciplina?.nome || 'Disciplina'}} \\hfill {\\small \\textbf{Valor: ${peso_total.toFixed(1)} pts}} \\par
\\vspace{1mm}\\hrule\\vspace{1mm}
{\\centering \\textbf{${titulo ? titulo.toUpperCase() : 'AVALIAÇÃO ACADÊMICA'}${tipoStr}}${gabaritoStr} \\par}
\\vspace{1mm}
\\noindent{\\footnotesize \\textbf{Aluno(a):} \\underline{\\hspace{7.5cm}} \\quad \\textbf{RA:} \\underline{\\hspace{2.5cm}} \\quad \\textbf{Data:} ${dataFormatada} \\quad \\textbf{Nota:} \\fbox{\\rule{0pt}{3.5mm}\\hspace{8mm}}}
\\end{tcolorbox}
\\vspace{2mm}
`;
  } else if (estilo === 'concurso') {
    tex += `\\noindent
\\begin{tcolorbox}[colback=black,colframe=black,arc=0mm,boxrule=1pt,top=1.5mm,bottom=1.5mm]
\\color{white}\\centering\\textbf{\\large CADERNO DE QUESTÕES $\\bullet$ AVALIAÇÃO OFICIAL}${tipoStr ? ` \\quad [\\textbf{PROVA ${variacaoTipo}}]` : ''}${showAnswers ? ' \\quad [\\textbf{GABARITO OFICIAL}]' : ''}
\\end{tcolorbox}
\\vspace{-2mm}
\\noindent
\\begin{tcolorbox}[colback=white,colframe=black,arc=0mm,boxrule=1pt]
{\\large \\textbf{${instituicao?.nome ? instituicao.nome.toUpperCase() : 'INSTITUIÇÃO DE ENSINO'}}} \\hfill {\\textbf{PONTUAÇÃO:} \\textbf{${peso_total.toFixed(1)} pts}} \\par
{\\footnotesize \\textbf{Disciplina:} ${disciplina?.nome || 'Geral'} ${disciplina?.codigo ? `[${disciplina.codigo}]` : ''} \\hfill \\textbf{Data de Aplicação:} ${dataFormatada}} \\par
\\vspace{1.5mm}\\hrule\\vspace{1.5mm}
{\\centering \\textbf{\\large ${titulo ? titulo.toUpperCase() : 'AVALIAÇÃO OFICIAL'}} \\par}
\\vspace{1.5mm}\\hrule\\vspace{1.5mm}
\\noindent\\textbf{NOME DO(A) CANDIDATO(A):} \\underline{\\hspace{11cm}} \\par
\\vspace{2mm}
\\noindent\\textbf{INSCRIÇÃO/RA:} \\underline{\\hspace{3.8cm}} \\textbf{SALA/TURMA:} \\underline{\\hspace{2.5cm}} \\hfill \\textbf{NOTA:} \\fbox{\\rule{0pt}{4mm}\\hspace{14mm}} \\par
\\vspace{2mm}
\\noindent{\\footnotesize \\textit{Assinatura do Aluno:} \\underline{\\hspace{5.5cm}} \\hfill \\textit{Visto do Fiscal/Prof.:} \\underline{\\hspace{4.5cm}}} \\par
\\vspace{2mm}
\\hrule
\\vspace{1.5mm}
{\\footnotesize \\textbf{LEIA ATENTAMENTE AS INSTRUÇÕES:} \\par
\\begin{enumerate}[leftmargin=*,itemsep=0pt,topsep=1pt]
  \\item Verifique se este caderno contém todas as questões e se a impressão está legível.
  \\item Utilize caneta esferográfica de tinta azul ou preta. Respostas a lápis poderão inviabilizar recursos.
  ${instrucoes && instrucoes.trim() ? `\\item \\textbf{Orientações específicas:} \\textit{${instrucoes.replace(/\n/g, ' ')}}` : ''}
\\end{enumerate}}
\\end{tcolorbox}
\\vspace{3mm}
`;
  } else if (estilo === 'minimo') {
    tex += `\\noindent
{\\large \\textbf{${instituicao?.sigla || instituicao?.nome || 'AVALIAÇÃO'}}} $\\bullet$ \\textbf{${disciplina?.nome || 'Disciplina'}} $\\bullet$ \\textbf{${titulo ? titulo.toUpperCase() : 'PROVA'}}${tipoStr ? ` [\\textbf{${variacaoTipo}}]` : ''} \\hfill \\textbf{[${peso_total.toFixed(1)} pts]} \\par
\\vspace{1mm}\\hrule\\vspace{2mm}
\\noindent\\textbf{Aluno(a):} \\underline{\\hspace{8.5cm}} \\hfill \\textbf{Data:} ${dataFormatada} \\hfill \\textbf{Nota:} \\underline{\\hspace{1.5cm}} \\par
\\vspace{2mm}\\hrule
\\vspace{3mm}
`;
  } else {
    // PADRÃO (UNIVERSITÁRIO INSTITUCIONAL)
    tex += `\\noindent
\\begin{tcolorbox}[colback=white,colframe=black,arc=0mm,boxrule=1.2pt]
\\begin{center}
    {\\large \\textbf{${instituicao?.nome ? instituicao.nome.toUpperCase() : 'INSTITUIÇÃO DE ENSINO'}}} \\par
    \\vspace{1mm}
    {\\footnotesize ${instituicao?.sigla ? `(${instituicao.sigla}) \\quad ` : ''}\\textbf{Disciplina:} ${disciplina?.nome || 'Geral'} ${disciplina?.codigo ? `[${disciplina.codigo}]` : ''} \\hfill \\textbf{Valor Total:} ${peso_total.toFixed(1)} pts} \\par
    \\vspace{2mm}
    \\hrule
    \\vspace{2mm}
    {\\large \\textbf{${titulo ? titulo.toUpperCase() : 'AVALIAÇÃO ACADÊMICA'}}${tipoStr ? ` \\quad [\\textbf{PROVA ${variacaoTipo}}]` : ''}${showAnswers ? ' \\quad [\\textbf{GABARITO DO PROFESSOR}]' : ''}} \\par
    \\vspace{2mm}
    \\hrule
    \\vspace{2mm}
    \\noindent\\textbf{Aluno(a):} \\underline{\\hspace{8.5cm}} \\hfill \\textbf{Data:} ${dataFormatada} \\par
    \\vspace{2mm}
    \\noindent\\textbf{Matrícula/RA:} \\underline{\\hspace{4.2cm}} \\textbf{Turma:} \\underline{\\hspace{2.5cm}} \\hfill \\textbf{Nota:} \\fbox{\\rule{0pt}{4mm}\\hspace{12mm}}
\\end{center}
`;

    if (instrucoes && instrucoes.trim()) {
      tex += `\\vspace{1mm}
\\noindent\\rule{\\linewidth}{0.4pt} \\par
\\vspace{1mm}
{\\footnotesize \\textbf{Instruções:} \\textit{${instrucoes.replace(/\n/g, ' ')}}}
`;
    }

    tex += `\\end{tcolorbox}
\\vspace{4mm}
`;
  }

  tex += `
% ==============================================================================
% CADERNO DE QUESTOES
% ==============================================================================
`;

  if (itens.length === 0) {
    tex += `\\begin{center}\\textit{Nenhuma questão adicionada a esta avaliação.}\\end{center}\n`;
  } else {
    itens.forEach((item, index) => {
      const q = item.questao;
      const pontuacao = item.valor_pontuacao.toFixed(1);
      const ordem = item.ordem || index + 1;

      tex += `\n% --- Questao ${ordem} ---\n`;
      tex += `\\noindent\\textbf{\\large ${ordem}. ${q.titulo}} \\hfill \\fbox{\\textbf{${pontuacao} pt${item.valor_pontuacao === 1 ? '' : 's'}}} \\par\n`;
      tex += `\\vspace{1.5mm}\n`;

      // Enunciado
      tex += `${convertMarkdownToLatex(q.enunciado_markdown)} \\par\n\\vspace{2mm}\n`;

      // Se for questão OBJETIVA com alternativas
      if (q.tipo_questao === 'OBJETIVA' && q.alternativas && q.alternativas.length > 0) {
        tex += `\\begin{enumerate}[label=\\textbf{(\\Alph*)}, leftmargin=8mm]\n`;
        q.alternativas.forEach((alt) => {
          if (showAnswers && alt.correta) {
            tex += `  \\item \\textbf{${alt.texto}} \\quad \\colorbox{gabaritoback}{\\textcolor{gabaritoframe}{\\textbf{[GABARITO]}}}\n`;
          } else {
            tex += `  \\item ${alt.texto}\n`;
          }
        });
        tex += `\\end{enumerate}\n\\vspace{2mm}\n`;
      }

      // Se for versão gabarito e tiver resposta esperada
      if (showAnswers && q.resposta_esperada && q.resposta_esperada.trim()) {
        tex += `\\begin{tcolorbox}[colback=gabaritoback,colframe=gabaritoframe,title={\\footnotesize \\textbf{Padrão de Resposta Esperado -- Gabarito}},arc=1mm]
{\\small ${convertMarkdownToLatex(q.resposta_esperada)}}
\\end{tcolorbox}
\\vspace{2mm}
`;
      }

      // Se for questão DISSERTATIVA na versão aluno (linhas pautadas)
      if (
        q.tipo_questao === 'DISSERTATIVA' &&
        q.linhas_resposta > 0 &&
        (!showAnswers || !q.resposta_esperada)
      ) {
        tex += `\\vspace{1mm}\n`;
        for (let l = 0; l < q.linhas_resposta; l++) {
          tex += `\\noindent\\rule{\\linewidth}{0.3pt} \\par\\vspace{6mm}\n`;
        }
        tex += `\\vspace{1mm}\n`;
      }

      // Se for questão tipo CÓDIGO na versão aluno (espaço para algoritmo)
      if (
        q.tipo_questao === 'CODIGO' &&
        q.linhas_resposta > 0 &&
        (!showAnswers || !q.resposta_esperada)
      ) {
        const heightMm = Math.max(q.linhas_resposta * 7, 30);
        tex += `\\begin{tcolorbox}[colback=codeback,colframe=gray!40,title={\\tiny ESPAÇO PARA IMPLEMENTAÇÃO / CÓDIGO-FONTE},height=${heightMm}mm]
\\end{tcolorbox}
\\vspace{2mm}
`;
      }

      tex += `\\vspace{3mm}\n`;
    });
  }

  tex += `
\\end{document}
`;

  return tex;
}

/**
 * Exporta a avaliação atual diretamente para arquivo LaTeX (.tex), acionando o diálogo nativo ou download.
 */
export async function exportExamToLatex(
  exam: LiveExamState,
  options: LatexExportOptions = {}
): Promise<ExportResult> {
  try {
    const { showAnswers = false, variacaoTipo = null } = options;
    const texContent = generateLatexDocument(exam, options);

    // Sanitiza nome do arquivo padrão
    const discNome = (exam.disciplina?.nome || 'Avaliacao').replace(/[^a-zA-Z0-9_-]/g, '_');
    const tipoSufixo = variacaoTipo ? `_Tipo_${variacaoTipo}` : '';
    const versaoSufixo = showAnswers ? '_Versao_Gabarito' : '_Versao_Aluno';
    const defaultFileName = `SisProva_${discNome}${tipoSufixo}${versaoSufixo}.tex`;

    if (isTauriEnvironment()) {
      const savePath = await api.saveTextFileDialog(
        defaultFileName,
        'Código-Fonte LaTeX (*.tex)',
        ['tex']
      );

      if (!savePath) {
        return { success: false, cancelled: true };
      }

      await api.writeTextFile(savePath, texContent);
      return { success: true, filePath: savePath };
    }

    // Fallback navegador Web (Download via Blob)
    const blob = new Blob([texContent], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filePath: defaultFileName };
  } catch (err: any) {
    console.error('Erro ao exportar LaTeX:', err);
    return { success: false, error: err.message || String(err) };
  }
}
