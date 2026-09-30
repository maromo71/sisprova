import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { api, isTauriEnvironment } from './api';

export interface PdfExportOptions {
  title: string;
  author?: string;
  subject?: string;
  defaultFileName?: string;
}

export interface PdfExportResult {
  success: boolean;
  filePath?: string;
  cancelled?: boolean;
  error?: string;
}

/**
 * Converte um elemento do DOM paginado A4 (Caderno de Prova, Folha OMR ou Gabarito)
 * diretamente em um arquivo PDF nativo de alta resolução (300 DPI equivalente),
 * preservando equações KaTeX, diagramas Mermaid, cabeçalhos e pautas sem passar
 * pelo diálogo de impressão do navegador (MELH-03).
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<PdfExportResult> {
  let isolatedContainer: HTMLDivElement | null = null;

  try {
    // 1. Aguarda carregamento completo das fontes tipográficas e KaTeX
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2. Cria container off-screen isolado com largura física A4 fixa (794px = 210mm a 96 DPI)
    // Isso elimina completamente qualquer interferência de 'transform: scale(...)',
    // classes de zoom do preview ou estilos escuros do tema.
    isolatedContainer = document.createElement('div');
    isolatedContainer.id = 'pdf-export-isolated-host';
    isolatedContainer.style.position = 'fixed';
    isolatedContainer.style.left = '-10000px';
    isolatedContainer.style.top = '0';
    isolatedContainer.style.width = '794px';
    isolatedContainer.style.minHeight = '1123px';
    isolatedContainer.style.backgroundColor = '#ffffff';
    isolatedContainer.style.zIndex = '-999999';
    isolatedContainer.style.overflow = 'visible';
    isolatedContainer.style.pointerEvents = 'none';

    // Regras CSS estritas aplicadas ao clone para eliminar o bug de kerning/tracking do html2canvas
    const styleOverride = document.createElement('style');
    styleOverride.textContent = `
      #pdf-export-isolated-host,
      #pdf-export-isolated-host * {
        letter-spacing: normal !important;
        word-spacing: normal !important;
        transform: none !important;
        box-sizing: border-box !important;
        text-rendering: geometricPrecision !important;
        -webkit-font-smoothing: antialiased !important;
      }
      #pdf-export-isolated-host .a4-sheet,
      #pdf-export-isolated-host .answer-sheet,
      #pdf-export-isolated-host #printable-a4-sheet,
      #pdf-export-isolated-host #printable-answer-sheet,
      #pdf-export-isolated-host #printable-consolidated-key {
        width: 794px !important;
        max-width: 794px !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        transform: none !important;
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      #pdf-export-isolated-host img {
        max-width: 100% !important;
      }
    `;
    isolatedContainer.appendChild(styleOverride);

    // 3. Clona o elemento alvo e monta no container isolado
    const clonedNode = element.cloneNode(true) as HTMLElement;
    clonedNode.style.transform = 'none';
    clonedNode.style.boxShadow = 'none';
    clonedNode.style.margin = '0';
    clonedNode.style.width = '794px';
    clonedNode.style.maxWidth = '794px';

    // Remove qualquer inline letterSpacing residual que possa colapsar caracteres
    const allDescendants = clonedNode.querySelectorAll<HTMLElement>('*');
    allDescendants.forEach((child) => {
      if (child.style) {
        child.style.letterSpacing = 'normal';
        child.style.wordSpacing = 'normal';
      }
    });

    isolatedContainer.appendChild(clonedNode);
    document.body.appendChild(isolatedContainer);

    // Pequeno intervalo para permitir layout estável no DOM
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 4. Renderiza o DOM clonado e isolado para Canvas com escala 2.5x (qualidade nítida)
    const canvas = await html2canvas(clonedNode, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 1024,
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Altura proporcional de uma página A4 (210 x 297 mm) em pixels do canvas
    const a4PageHeightPx = Math.floor(canvasWidth * (297 / 210));

    // 5. Inicializa documento jsPDF em A4 portrait (unidade: mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Embutir Metadados Oficiais no PDF
    pdf.setProperties({
      title: options.title,
      subject: options.subject || 'Avaliação Acadêmica Oficial - SisProva',
      author: options.author || 'SisProva',
      creator: 'SisProva Desktop Offline (Tauri v2 + Rust)',
    });

    // 6. Fatiamento em Páginas A4 com imagens PNG nítidas (sem artefatos de compressão JPEG)
    if (canvasHeight <= a4PageHeightPx + 10) {
      // Página Única
      const imgData = canvas.toDataURL('image/png');
      const imgHeightMm = (canvasHeight * 210) / canvasWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, 210, Math.min(imgHeightMm, 297), undefined, 'FAST');
    } else {
      // Múltiplas Páginas A4
      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvasHeight) {
        const sliceHeight = Math.min(a4PageHeightPx, canvasHeight - currentY);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasWidth;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasWidth, sliceHeight);
          ctx.drawImage(
            canvas,
            0,
            currentY,
            canvasWidth,
            sliceHeight,
            0,
            0,
            canvasWidth,
            sliceHeight
          );

          if (pageIndex > 0) {
            pdf.addPage('a4', 'portrait');
          }

          const imgData = sliceCanvas.toDataURL('image/png');
          const sliceHeightMm = (sliceHeight * 210) / canvasWidth;
          pdf.addImage(imgData, 'PNG', 0, 0, 210, Math.min(sliceHeightMm, 297), undefined, 'FAST');
        }

        currentY += a4PageHeightPx;
        pageIndex++;
      }
    }

    // 7. Gera o buffer binário do PDF gerado
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const bytes = Array.from(new Uint8Array(pdfArrayBuffer));

    // Nome padrão do arquivo sanitizado
    const sanitizedTitle = (options.title || 'Avaliacao')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim();
    const defaultName = options.defaultFileName || `${sanitizedTitle}.pdf`;

    // 8. Salva nativamente pelo diálogo do Tauri ou download direto no navegador
    if (isTauriEnvironment()) {
      const selectedPath = await api.savePdfDialog(defaultName);

      if (!selectedPath) {
        return { success: false, cancelled: true };
      }

      await api.writeBinaryFile(selectedPath, bytes);
      return { success: true, filePath: selectedPath };
    } else {
      // Fallback para navegador web convencional
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = defaultName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);

      return { success: true, filePath: defaultName };
    }
  } catch (err) {
    console.error('Erro durante a exportação de PDF nativo:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    // Remove o container isolado do DOM
    if (isolatedContainer && isolatedContainer.parentNode) {
      isolatedContainer.parentNode.removeChild(isolatedContainer);
    }
  }
}
