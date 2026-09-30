import type { QuestaoCompleta, QuestaoInput, GrauDificuldade, TipoQuestao, AlternativaInput } from '../types';

/**
 * Utilitários para Importação e Exportação de Questões em Lote (MELH-05)
 * Suporta formatos JSON estruturado e Markdown limpo com fórmulas e padrões de resposta.
 */

export interface ParsedQuestionCandidate extends QuestaoInput {
  valida: boolean;
  erros: string[];
}

/**
 * Serializa uma lista de questões para JSON com formatação legível.
 */
export function exportQuestionsToJson(questions: QuestaoCompleta[]): string {
  const exportPayload = {
    formato: 'sisprova_questoes_v1',
    data_exportacao: new Date().toISOString(),
    total: questions.length,
    questoes: questions.map((q) => ({
      titulo: q.titulo,
      enunciado_markdown: q.enunciado_markdown,
      diagrama_mermaid: q.diagrama_mermaid || null,
      grau_dificuldade: q.grau_dificuldade,
      tipo_questao: q.tipo_questao,
      linhas_resposta: q.linhas_resposta,
      resposta_esperada: q.resposta_esperada || null,
      alternativas: q.alternativas.map((a) => ({
        texto: a.texto,
        correta: a.correta,
      })),
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Serializa uma lista de questões para Markdown acadêmico padronizado.
 */
export function exportQuestionsToMarkdown(questions: QuestaoCompleta[], disciplinaNome?: string): string {
  let md = `# Banco de Questões SisProva\n`;
  if (disciplinaNome) {
    md += `**Disciplina:** ${disciplinaNome}\n`;
  }
  md += `**Data de Exportação:** ${new Date().toLocaleDateString('pt-BR')}\n`;
  md += `**Total de Questões:** ${questions.length}\n\n`;
  md += `---\n\n`;

  questions.forEach((q, idx) => {
    md += `## Questão ${idx + 1}: ${q.titulo}\n`;
    md += `- **Dificuldade:** ${q.grau_dificuldade}\n`;
    md += `- **Tipo:** ${q.tipo_questao}\n`;
    md += `- **Linhas:** ${q.linhas_resposta}\n\n`;

    md += `### Enunciado\n${q.enunciado_markdown.trim()}\n\n`;

    if (q.diagrama_mermaid && q.diagrama_mermaid.trim()) {
      md += `\`\`\`mermaid\n${q.diagrama_mermaid.trim()}\n\`\`\`\n\n`;
    }

    if (q.tipo_questao === 'OBJETIVA' && q.alternativas.length > 0) {
      md += `### Alternativas\n`;
      q.alternativas.forEach((alt) => {
        const mark = alt.correta ? '[x]' : '[ ]';
        md += `- ${mark} ${alt.texto}\n`;
      });
      md += `\n`;
    }

    if (q.resposta_esperada && q.resposta_esperada.trim()) {
      md += `### Resposta Esperada / Gabarito\n`;
      const lines = q.resposta_esperada.split('\n');
      lines.forEach((l) => {
        md += `> ${l}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

export interface JsonImportPackage {
  instituicao?: { id?: number; nome: string; sigla?: string; logo_base64?: string };
  disciplina?: { id?: number; nome: string; codigo?: string };
  avaliacao?: {
    id?: number;
    titulo: string;
    instrucoes?: string;
    data_aplicacao?: string;
    peso_total?: number;
  };
  candidates: ParsedQuestionCandidate[];
}

/**
 * Converte string JSON em pacote estruturado contendo metadados e candidatos a questões.
 */
export function parsePackageFromJson(
  jsonText: string,
  targetDisciplinaId: number
): JsonImportPackage {
  let raw: any;
  try {
    raw = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`JSON malformado ou inválido: ${(e as Error).message}`);
  }

  const rawList: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.questoes)
    ? raw.questoes
    : Array.isArray(raw?.questions)
    ? raw.questions
    : [raw];

  const candidates: ParsedQuestionCandidate[] = rawList.map((item, idx) => {
    const erros: string[] = [];

    const titulo = (item.titulo || item.title || `Questão Importada ${idx + 1}`).toString().trim();
    const enunciado = (
      item.enunciado_markdown ||
      item.enunciado ||
      item.content ||
      item.description ||
      item.texto ||
      ''
    )
      .toString()
      .trim();

    if (!enunciado) {
      erros.push('Enunciado vazio ou não encontrado.');
    }

    let grau: GrauDificuldade = 'MEDIO';
    const rawGrau = (item.grau_dificuldade || item.dificuldade || item.difficulty || '')
      .toString()
      .toUpperCase();
    if (rawGrau.includes('FAC') || rawGrau === 'EASY') grau = 'FACIL';
    else if (rawGrau.includes('DIF') || rawGrau === 'HARD') grau = 'DIFICIL';

    let tipo: TipoQuestao = 'DISSERTATIVA';
    const rawTipo = (item.tipo_questao || item.tipo || item.type || '').toString().toUpperCase();
    if (rawTipo.includes('OBJ') || rawTipo.includes('MULT') || (item.alternativas && item.alternativas.length > 0)) {
      tipo = 'OBJETIVA';
    } else if (rawTipo.includes('COD')) {
      tipo = 'CODIGO';
    }

    let linhas = typeof item.linhas_resposta === 'number' ? item.linhas_resposta : tipo === 'OBJETIVA' ? 0 : 6;
    if (linhas < 0) linhas = 0;

    const diagrama = item.diagrama_mermaid || item.mermaid || null;
    const respostaEsperada = item.resposta_esperada || item.gabarito || item.feedback || item.resolucao || null;

    const alternativas: AlternativaInput[] = [];
    if (Array.isArray(item.alternativas)) {
      item.alternativas.forEach((alt: any) => {
        alternativas.push({
          texto: (alt.texto || alt.text || '').toString().trim(),
          correta: Boolean(alt.correta || alt.correct || alt.is_correct),
        });
      });
    }

    // Se for objetiva e não tiver pelo menos uma correta, aponta aviso
    if (tipo === 'OBJETIVA' && alternativas.length > 0 && !alternativas.some((a) => a.correta)) {
      erros.push('Questão objetiva sem nenhuma alternativa correta marcada.');
    }

    return {
      disciplina_id: targetDisciplinaId,
      titulo,
      enunciado_markdown: enunciado,
      diagrama_mermaid: diagrama,
      grau_dificuldade: grau,
      tipo_questao: tipo,
      linhas_resposta: linhas,
      resposta_esperada: respostaEsperada ? String(respostaEsperada).trim() : null,
      alternativas,
      valida: erros.length === 0,
      erros,
    };
  });

  const instituicao = raw?.instituicao && typeof raw.instituicao === 'object'
    ? {
        id: typeof raw.instituicao.id === 'number' ? raw.instituicao.id : undefined,
        nome: String(raw.instituicao.nome || '').trim(),
        sigla: raw.instituicao.sigla ? String(raw.instituicao.sigla).trim() : undefined,
        logo_base64: raw.instituicao.logo_base64 || undefined,
      }
    : undefined;

  const disciplina = raw?.disciplina && typeof raw.disciplina === 'object'
    ? {
        id: typeof raw.disciplina.id === 'number' ? raw.disciplina.id : undefined,
        nome: String(raw.disciplina.nome || '').trim(),
        codigo: raw.disciplina.codigo ? String(raw.disciplina.codigo).trim() : undefined,
      }
    : undefined;

  const avaliacao = raw?.avaliacao && typeof raw.avaliacao === 'object'
    ? {
        id: typeof raw.avaliacao.id === 'number' ? raw.avaliacao.id : undefined,
        titulo: String(raw.avaliacao.titulo || '').trim(),
        instrucoes: raw.avaliacao.instrucoes ? String(raw.avaliacao.instrucoes).trim() : undefined,
        data_aplicacao: raw.avaliacao.data_aplicacao ? String(raw.avaliacao.data_aplicacao).trim() : undefined,
        peso_total: typeof raw.avaliacao.peso_total === 'number' ? raw.avaliacao.peso_total : undefined,
      }
    : undefined;

  return {
    instituicao,
    disciplina,
    avaliacao,
    candidates,
  };
}

/**
 * Converte string JSON em candidatos a questões do SisProva.
 */
export function parseQuestionsFromJson(
  jsonText: string,
  targetDisciplinaId: number
): ParsedQuestionCandidate[] {
  return parsePackageFromJson(jsonText, targetDisciplinaId).candidates;
}

/**
 * Parser inteligente de Markdown para extrair questões delimitadas por headers ou divisores.
 */
export function parseQuestionsFromMarkdown(
  mdText: string,
  targetDisciplinaId: number
): ParsedQuestionCandidate[] {
  const sections = mdText.split(/\n(?=(?:##+\s+|---\s*\n))/g);
  const candidates: ParsedQuestionCandidate[] = [];

  for (let s of sections) {
    const rawSection = s.trim();
    if (!rawSection || rawSection === '---') continue;

    // Ignora headers gerais de documento
    if (rawSection.startsWith('# Banco de Questões') || rawSection.startsWith('# Avaliação')) {
      continue;
    }

    const lines = rawSection.split('\n');
    let titulo = '';
    let dificuldade: GrauDificuldade = 'MEDIO';
    let tipo: TipoQuestao = 'DISSERTATIVA';
    let linhasResposta = 6;
    let respostaEsperada: string | null = null;
    const alternativas: AlternativaInput[] = [];
    const enunciadoLines: string[] = [];
    let mermaidLines: string[] = [];
    let inMermaid = false;
    let inRespostaEsperada = false;
    let inAlternativas = false;
    const respostaLines: string[] = [];

    for (let line of lines) {
      const trimmed = line.trim();

      // Detecta bloco Mermaid
      if (trimmed.startsWith('```mermaid')) {
        inMermaid = true;
        continue;
      }
      if (inMermaid) {
        if (trimmed.startsWith('```')) {
          inMermaid = false;
        } else {
          mermaidLines.push(line);
        }
        continue;
      }

      // Título
      if (!titulo && (trimmed.startsWith('## ') || trimmed.startsWith('### '))) {
        titulo = trimmed.replace(/^#+\s*(?:Questão\s*\d*[:\.-]?\s*)?/i, '').trim();
        continue;
      }

      // Metadados
      const difMatch = trimmed.match(/[-*]\s*\*\*Dificuldade:\*\*\s*(FACIL|MEDIO|DIFICIL|FÁCIL|MÉDIO|DIFÍCIL)/i);
      if (difMatch) {
        const d = difMatch[1].toUpperCase();
        if (d.includes('FAC')) dificuldade = 'FACIL';
        else if (d.includes('DIF')) dificuldade = 'DIFICIL';
        else dificuldade = 'MEDIO';
        continue;
      }

      const tipoMatch = trimmed.match(/[-*]\s*\*\*Tipo:\*\*\s*(DISSERTATIVA|OBJETIVA|CODIGO|CÓDIGO)/i);
      if (tipoMatch) {
        const t = tipoMatch[1].toUpperCase();
        if (t.includes('OBJ')) tipo = 'OBJETIVA';
        else if (t.includes('COD')) tipo = 'CODIGO';
        else tipo = 'DISSERTATIVA';
        continue;
      }

      const linhasMatch = trimmed.match(/[-*]\s*\*\*Linhas:\*\*\s*(\d+)/i);
      if (linhasMatch) {
        linhasResposta = parseInt(linhasMatch[1], 10);
        continue;
      }

      // Seções
      if (trimmed.match(/^###\s*(Resposta Esperada|Gabarito|Espelho)/i)) {
        inRespostaEsperada = true;
        inAlternativas = false;
        continue;
      }
      if (trimmed.match(/^###\s*Alternativas/i)) {
        inAlternativas = true;
        inRespostaEsperada = false;
        tipo = 'OBJETIVA';
        continue;
      }
      if (trimmed.match(/^###\s*Enunciado/i)) {
        inRespostaEsperada = false;
        inAlternativas = false;
        continue;
      }

      // Citação de resposta esperada
      if (inRespostaEsperada || trimmed.startsWith('>')) {
        const cleanQuote = trimmed.replace(/^>\s?/, '');
        respostaLines.push(cleanQuote);
        continue;
      }

      // Alternativas com checkboxes [x] ou [ ]
      const altMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.+)/);
      if (altMatch) {
        tipo = 'OBJETIVA';
        alternativas.push({
          texto: altMatch[2].trim(),
          correta: altMatch[1].toLowerCase() === 'x',
        });
        continue;
      }

      // Alternativas estilo a) b) c) ou A. B.
      const altLetterMatch = trimmed.match(/^([a-eA-E])[\)\.]\s*(.+)/);
      if (altLetterMatch && (inAlternativas || tipo === 'OBJETIVA')) {
        tipo = 'OBJETIVA';
        alternativas.push({
          texto: altLetterMatch[2].trim(),
          correta: false, // se não estiver indicado, o professor ajusta na prévia
        });
        continue;
      }

      if (trimmed === '---') continue;

      enunciadoLines.push(line);
    }

    const enunciado = enunciadoLines.join('\n').trim();
    if (respostaLines.length > 0) {
      respostaEsperada = respostaLines.join('\n').trim();
    }

    const erros: string[] = [];
    if (!enunciado && alternativas.length === 0) {
      continue; // Ignora blocos vazios
    }

    if (!titulo) {
      titulo = `Questão Importada ${candidates.length + 1}`;
    }

    if (tipo === 'OBJETIVA') {
      linhasResposta = 0;
      if (alternativas.length > 0 && !alternativas.some((a) => a.correta)) {
        erros.push('Questão objetiva sem gabarito marcado (marque ao menos uma alternativa).');
      }
    }

    candidates.push({
      disciplina_id: targetDisciplinaId,
      titulo,
      enunciado_markdown: enunciado,
      diagrama_mermaid: mermaidLines.length > 0 ? mermaidLines.join('\n').trim() : null,
      grau_dificuldade: dificuldade,
      tipo_questao: tipo,
      linhas_resposta: linhasResposta,
      resposta_esperada: respostaEsperada,
      alternativas,
      valida: erros.length === 0,
      erros,
    });
  }

  return candidates;
}
