/**
 * Formata data no padrão brasileiro DD/MM/AAAA sem desvio de fuso horário.
 * 
 * Evita o bug comum de `new Date('YYYY-MM-DD')` que interpreta a data em UTC meia-noite
 * e, em fusos horários ocidentais como o de Brasília (UTC-3), recua 1 dia (ex: dia 30 virando dia 29).
 */
export const formatarDataBR = (dataStr?: string | null): string => {
  if (!dataStr || !dataStr.trim()) return '';

  // Extrai a parte da data se vier com timestamp ISO (YYYY-MM-DD...)
  const apenasData = dataStr.split('T')[0].trim();
  const partes = apenasData.split('-');

  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    if (ano && mes && dia) {
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }
  }

  return dataStr;
};
