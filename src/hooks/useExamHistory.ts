import { useState, useCallback, useEffect, useRef } from 'react';
import type { QuestaoCompleta } from '../types';

export interface ExamSnapshot {
  examItems: Array<{ ordem: number; valor_pontuacao: number; questao: QuestaoCompleta }>;
  titulo: string;
  instrucoes: string;
  dataAplicacao: string;
  pesoTotal: number;
}

const MAX_HISTORY_LENGTH = 30;

export function useExamHistory(initialSnapshot: ExamSnapshot) {
  const [past, setPast] = useState<ExamSnapshot[]>([]);
  const [present, setPresent] = useState<ExamSnapshot>(initialSnapshot);
  const [future, setFuture] = useState<ExamSnapshot[]>([]);

  // Referência atualizada para atalhos de teclado sem recriar listeners
  const stateRef = useRef({ past, present, future });
  useEffect(() => {
    stateRef.current = { past, present, future };
  }, [past, present, future]);

  /**
   * Registra um novo estado na pilha de histórico.
   */
  const recordChange = useCallback((newSnapshot: ExamSnapshot) => {
    setPast((prevPast) => {
      const currentPresent = stateRef.current.present;
      // Evita duplicatas idênticas consecutivas
      if (
        JSON.stringify(currentPresent.examItems) === JSON.stringify(newSnapshot.examItems) &&
        currentPresent.titulo === newSnapshot.titulo &&
        currentPresent.pesoTotal === newSnapshot.pesoTotal &&
        currentPresent.dataAplicacao === newSnapshot.dataAplicacao &&
        currentPresent.instrucoes === newSnapshot.instrucoes
      ) {
        return prevPast;
      }

      const updated = [...prevPast, currentPresent];
      if (updated.length > MAX_HISTORY_LENGTH) {
        return updated.slice(updated.length - MAX_HISTORY_LENGTH);
      }
      return updated;
    });

    setPresent(newSnapshot);
    setFuture([]); // Qualquer nova ação invalida a pilha de refazer
  }, []);

  /**
   * Desfaz a última ação (Ctrl+Z).
   */
  const undo = useCallback((): ExamSnapshot | null => {
    const { past: currentPast, present: currentPresent } = stateRef.current;
    if (currentPast.length === 0) return null;

    const previous = currentPast[currentPast.length - 1];
    const newPast = currentPast.slice(0, currentPast.length - 1);

    setPast(newPast);
    setFuture((prevFuture) => [currentPresent, ...prevFuture]);
    setPresent(previous);

    return previous;
  }, []);

  /**
   * Refaz a ação previamente desfeita (Ctrl+Y ou Ctrl+Shift+Z).
   */
  const redo = useCallback((): ExamSnapshot | null => {
    const { present: currentPresent, future: currentFuture } = stateRef.current;
    if (currentFuture.length === 0) return null;

    const next = currentFuture[0];
    const newFuture = currentFuture.slice(1);

    setPast((prevPast) => [...prevPast, currentPresent]);
    setPresent(next);
    setFuture(newFuture);

    return next;
  }, []);

  /**
   * Reinicia o histórico (usado ao carregar ou iniciar nova avaliação).
   */
  const resetHistory = useCallback((snapshot: ExamSnapshot) => {
    setPast([]);
    setPresent(snapshot);
    setFuture([]);
  }, []);

  return {
    present,
    recordChange,
    undo,
    redo,
    resetHistory,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyDepth: past.length,
  };
}
