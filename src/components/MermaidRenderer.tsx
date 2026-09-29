import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { AlertTriangle } from 'lucide-react';

interface MermaidRendererProps {
  code: string;
  className?: string;
}

let mermaidInitialized = false;

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, '_');

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        themeVariables: {
          primaryColor: '#e0e7ff',
          primaryTextColor: '#1e1b4b',
          primaryBorderColor: '#6366f1',
          lineColor: '#475569',
          secondaryColor: '#f1f5f9',
          tertiaryColor: '#ffffff',
        },
      });
      mermaidInitialized = true;
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!code || !code.trim()) {
      setSvgContent('');
      setError(null);
      return;
    }

    const renderDiagram = async () => {
      setIsRendering(true);
      setError(null);

      try {
        const renderId = `mermaid_${uniqueId}_${Date.now()}`;
        // Testa validação prévia de sintaxe do Mermaid
        const isValid = await mermaid.parse(code.trim()).catch(() => false);

        if (!isValid) {
          if (!isCancelled) {
            setError('Sintaxe do diagrama incompleta ou inválida durante a edição.');
            setIsRendering(false);
          }
          return;
        }

        const { svg } = await mermaid.render(renderId, code.trim());
        if (!isCancelled) {
          setSvgContent(svg);
          setError(null);
          setIsRendering(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const errMsg = err instanceof Error ? err.message : 'Erro ao processar diagrama Mermaid';
          setError(errMsg);
          setIsRendering(false);
        }
      }
    };

    const timer = setTimeout(() => {
      renderDiagram();
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [code, uniqueId]);

  if (!code || !code.trim()) {
    return null;
  }

  return (
    <div className={`mermaid-container my-3 ${className}`}>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 print:hidden">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {svgContent ? (
        <div
          ref={containerRef}
          className="mermaid-svg-wrapper flex justify-center items-center overflow-x-auto p-2 rounded bg-white print:p-0 print:m-0"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : isRendering ? (
        <div className="flex items-center justify-center p-4 text-xs text-slate-400 animate-pulse print:hidden">
          Renderizando diagrama vetorial...
        </div>
      ) : null}
    </div>
  );
};
