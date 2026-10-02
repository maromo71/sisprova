# SisProva - Propostas de Melhorias e Roadmap Estratégico

**Documento:** Planejamento, Histórico de Execução e Especificação de Melhorias  
**Data:** Setembro de 2026  
**Status:** 100% Concluído — Todos os 4 Ciclos Finalizados com Êxito  

---

## 1. Sumário Executivo do Roadmap

O **SisProva** evoluiu significativamente, consolidando-se como uma plataforma desktop robusta construída em Tauri v2, Rust, React 19 e SQLite. Com as melhorias prioritárias implementadas, a ferramenta oferece uma experiência completa desde a montagem tipográfica até a segurança pedagógica contra fraudes e a geração automática de espelhos de correção.

As melhorias estão estruturadas em **6 eixos estratégicos**:
1. **Folhas de Resposta Automáticas e Leitura Óptica (OMR)**
2. **Segurança Pedagógica e Variações de Avaliação (Provas A, B, C e D)**
3. **Padrão de Respostas, Espelhos de Correção e Modos de Impressão**
4. **Exportação Nativa e Interoperabilidade (PDF, Word, LaTeX e Moodle)**
5. **Curadoria, Clonagem e Gestão Avançada de Provas e Questões**
6. **Produtividade Docente, Backup e Usabilidade**

---

## 2. Matriz de Status e Priorização

```
        ▲ ALTO
        │  [MELH-01] Folha de Respostas OMR (✅)     [MELH-02] Provas Tipo A, B, C, D (✅)
        │  [MELH-03] Exportação Direta para PDF (✅) [MELH-11] Padrão Resposta/Gabarito (✅)
IMPACTO │  [MELH-06] Clonagem & Exclusão Segura (✅) [MELH-05] Importação em Lote (✅)
        │  [MELH-07] Histórico Desfazer (Ctrl+Z) (✅)[MELH-04] Exportação DOCX / Word (✅)
        │  [MELH-09] Backup Automático .sisprova (✅)[MELH-08] Templates Cabeçalho (✅)
        │  [MELH-10] Estatísticas de Questões (✅)   [MELH-12] Ajustes Escala/Margem (✅)
        ▼ BAIXO
        └────────────────────────────────────────────────────────────────────────►
          BAIXA                      MÉDIA                       ALTA
                                 COMPLEXIDADE
```

### 2.1 Resumo de Status Geral

| ID | Proposta de Melhoria | Eixo | Complexidade | Impacto | Status |
|---|---|---|---|---|---|
| **MELH-01** | Geração Automática de Folha OMR (1, 2 e 4/página) | Eixo 1 | Média | ⭐⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-02** | Variações de Provas (Tipos A, B, C, D) + Gabarito Consolidado | Eixo 2 | Média | ⭐⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-03** | Exportação Direta para PDF Nativo sem Diálogo do Navegador | Eixo 4 | Média-Alta | ⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-06** | Clonagem Rápida (Duplicar) e Exclusão Segura de Provas | Eixo 5 | Baixa-Média | ⭐⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-11** | Padrão de Resposta / Espelho (Versão Aluno vs. Gabarito) | Eixo 3 | Média | ⭐⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-05** | Importação e Exportação de Questões em Lote (JSON / Markdown) | Eixo 5 | Média | ⭐⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-07** | Histórico de Alterações com Desfazer/Refazer (`Ctrl+Z` / `Ctrl+Y`) | Eixo 6 | Baixa-Média | ⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-04** | Exportação para Word (.docx) e LaTeX (.tex) | Eixo 4 | Alta | ⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-12** | Controle Fino de Margens, Densidade e Escala de Impressão A4 | Eixo 4 | Baixa-Média | ⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-10** | Histórico de Utilização e Frequência de Questões | Eixo 5 | Baixa-Média | ⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-08** | Templates de Cabeçalho Institucional Personalizáveis | Eixo 6 | Baixa | ⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-13** | Usabilidade, Gestão Flexível de Alternativas e Fidelidade A4 | Eixos 5 e 6 | Baixa | ⭐⭐⭐⭐ | ✅ **IMPLEMENTADO** |
| **MELH-14** | Suporte Multiplataforma Mobile (Android e iOS) com Tauri v2 | Todos | Alta | ⭐⭐⭐⭐⭐ | 🔄 **EM VALIDAÇÃO** |

---

## 3. Detalhamento das Melhorias Implementadas

---

### 📌 [MELH-01] Geração Automática de Folha de Respostas (Gabarito OMR) — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Live Preview A4 com suporte a 1, 2 (corte central) e 4 folhas por página e máscara de gabarito.
- **Funcionalidades Entregues:**
  - Alternador direto no topo do painel direito: **"Caderno de Prova"** vs **"Folha de Respostas (OMR)"**.
  - Grade de bolhas padronizadas `(A) (B) (C) (D) (E)` para as questões objetivas e espaço estruturado para dissertativas.
  - Seleção de layout dinâmico: **1 por folha**, **2 por folha (linha de corte no meio - economia de 50%)** e **4 por folha (quadrantes)**.
  - Alternador de **Máscara de Gabarito Oficial** com bolhas preenchidas para correção rápida perfurada pelo professor.
  - Impressão física direta e independente via `@media print`.

---

### 📌 [MELH-02] Geração de Variações de Provas (Tipos A, B, C, D) — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Editor, Live Preview e Folha OMR com matriz de gabarito consolidada e PRNG determinístico.
- **Funcionalidades Entregues:**
  - Modal dedicado com configurações dinâmicas:
    - Seleção de **2 versões (A e B)**, **3 versões (A, B e C)** ou **4 versões (A, B, C e D)**.
    - Nível 1: *Embaralhar a ordem das questões* (a Prova A permanece como matriz de referência canônica).
    - Nível 2: *Embaralhar a ordem das alternativas internas das questões objetivas* (com rastreamento de resposta correta).
    - Gerador pseudoaleatório determinístico (**Mulberry32** + Fisher-Yates) com controle de **Semente (Seed)** numérica reproduzível e botão para sortear nova semente.
  - Alternador no topo do Live Preview para visualização instantânea de cada tipo (`[Tipo A]`, `[Tipo B]`, `[Tipo C]`, `[Tipo D]`).
  - Identificação destacada no cabeçalho e rodapé do **Caderno de Prova** e da **Folha OMR**.
  - **Folha de Gabaritos do Professor (Adaptativa):**
    - *Com variações ativas:* Visualização e impressão em A4 da **Folha de Gabaritos Consolidada** com tabela comparativa de respostas cruzadas (Prova A, Prova B, C, D), mapeamento de posições de dissertativas e quadro de balanceamento estatístico por versão.
    - *Com variações inativas (versão única):* Renderização em coluna única oficial de respostas (**Gabarito Oficial do Professor**), supressão de rótulos redundantes de múltiplas versões e quadro estatístico consolidado da avaliação original.

---

### 📌 [MELH-03] Exportação Direta para PDF Nativo sem Diálogo do Navegador — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Live Preview com renderização tipográfica de alta fidelidade (300 DPI equivalente), fatiamento multi-páginas A4 e diálogo nativo do sistema operacional.
- **Funcionalidades Entregues:**
  - Botão dedicado **"Exportar PDF"** na barra de ferramentas da prévia A4.
  - Conversão de alta fidelidade via `html2canvas` (escala 2x) + motor vetorial `jsPDF` em proporção A4 exata (210 mm x 297 mm).
  - Algoritmo inteligente de fatiamento em múltiplas páginas para avaliações longas sem cortes abruptos.
  - Suporte a equações KaTeX, diagramas Mermaid, caixas de código e cabeçalhos oficiais.
  - Exportação direta de **Caderno de Prova** (incluindo Tipo A, B, C ou D), **Folha de Respostas OMR** ou **Gabarito Consolidado**.
  - Diálogo nativo do sistema operacional (`save_pdf_dialog`) via Tauri + Rust para escolha do diretório e nome do arquivo com sanitização.
  - Gravação binária direta em disco via comando nativo Rust (`write_binary_file`).
  - Nomenclatura automática inteligente baseada no tipo e na versão (ex: `..._Versao_Aluno.pdf` ou `..._Versao_Gabarito.pdf`).

---

### 📌 [MELH-06] Duplicação Rápida (Clonar Prova) e Exclusão Segura de Avaliações — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Editor e ao Gerenciador de Avaliações Salvas no SQLite com suporte a transações atômicas e preservação 100% íntegra do Banco de Questões.
- **Funcionalidades Entregues:**
  - **Ação "Nova Prova":** Botão `FilePlus` na barra de ferramentas para inicializar avaliação limpa em branco com diálogo de proteção contra descarte acidental.
  - **Ação "Clonar Avaliação":**
    - Disponível no Gerenciador de Avaliações Salvas (`Abrir`) e na barra de ferramentas do editor (`examId`).
    - Duplicação atômica via Rust/SQLite (`clone_avaliacao`): duplica cabeçalho, instruções, itens e pontuações com prefixo "Cópia de...".
    - As questões na tabela `questao` permanecem compartilhadas e intactas no Banco de Questões.
    - Carregamento instantâneo da prova clonada com notificação de confirmação.
  - **Ação "Excluir Avaliação com Segurança":**
    - Botão de lixeira (`Trash2`) em cada linha da lista de avaliações.
    - Modal de confirmação explícito reforçando que **"Nenhuma questão será excluída do seu Banco de Questões"**.
    - Transação atômica que remove os vínculos em `avaliacao_item` e o registro da avaliação em `avaliacao`.

---

### 📌 [MELH-11] Padrão de Resposta / Espelho de Correção (Versão Aluno vs. Versão Gabarito) — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Banco de Dados SQLite, Backend Rust, Modais de Questões, Editor e Live Preview A4 com renderização condicional tipográfica.
- **Funcionalidades Entregues:**
  - **Coluna no SQLite (`resposta_esperada TEXT`)** na tabela `questao` com migração retrocompatível automática.
  - **Campo de Resposta Esperada com Markdown/LaTeX:**
    - Disponível no Banco de Questões (`QuestionBankModal`), na Edição Direta da Prova (`EditExamQuestionModal`) e na Criação Rápida Inline (`ExamBuilder`).
    - Permite resoluções passo a passo, fórmulas matemáticas KaTeX e critérios de pontuação docente.
  - **Seletor de Modo Segmentado no Live Preview:**
    - Botão de duplo estado: `[ 🎓 Versão Aluno ]` vs `[ 👨‍🏫 Versão Gabarito ]` (ou `[ Folha Aluno ]` vs `[ Máscara Gabarito ]`).
  - **Diferenciação Estrita de Impressão:**
    - **Versão Aluno:** Padrão de resposta 100% ocultado; pautas e caixas de código vazias para escrita manual; alternativas desmarcadas.
    - **Versão Gabarito (Professor):**
      - Cabeçalho com selo `[GABARITO]` e subtítulo `— GABARITO DO PROFESSOR / ESPELHO DE CORREÇÃO`.
      - Alternativas objetivas destacadas com etiqueta `(CORRETA)`.
      - Questões dissertativas/código exibem o bloco estilizado `[Padrão de Resposta Esperado — Gabarito do Professor]` renderizado com KaTeX e Markdown, suprimindo as linhas em branco para economia de papel.
      - Rodapé com carimbo explicativo docente.
  - **Exportação Direta em PDF com Sufixo Automático:** Arquivos gerados com sufixo `_Versao_Aluno.pdf` ou `_Versao_Gabarito.pdf`.

---

### 📌 [MELH-05] Importação e Exportação de Questões em Lote (JSON e Markdown) — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Banco de Questões (`QuestionBankModal` e `ImportQuestionsModal`) com parser inteligente e transação atômica no SQLite.
- **Funcionalidades Entregues:**
  - **Exportação em Lote:**
    - Exportação em **JSON estruturado** (`.json`) preservando metadados, fórmulas KaTeX, diagramas Mermaid, alternativas e padrão de resposta docente.
    - Exportação em **Markdown padronizado** (`.md`) com formatação limpa e blocos de citação de resposta esperada.
    - Suporte a filtro por disciplina ou acervo geral.
  - **Importação em Lote com Pré-visualização Interativa:**
    - Modal dedicado com suporte a arquivos `.json` e `.md` (via diálogo nativo ou seleção de arquivo local).
    - Parser com detecção automática de dificuldade, tipologia, alternativas com marcação `[x]` e espelho de resposta.
    - Seletor da disciplina de destino para vincular as questões importadas.
    - Cards visuais com seleção individual via checkbox e botão "Selecionar Todas / Desmarcar Todas".
    - Validação prévia de integridade e inserção atômica em lote no SQLite via comando Rust `save_questoes_lote`.

---

### 📌 [MELH-07] Histórico de Alterações com Desfazer/Refazer (`Ctrl+Z` / `Ctrl+Y`) — ✅ **CONCLUÍDO**
- **Status:** Integrado ao `ExamBuilder` com hook reativo de snapshots e botões na barra de ferramentas.
- **Funcionalidades Entregues:**
  - Gerenciamento de histórico (*past*, *present*, *future*) com limite de segurança em memória.
  - Captura automática de snapshots antes de inclusão, remoção, reordenação de questões e ajustes de pontuação.
  - Botões visuais de **Desfazer** e **Refazer** com indicadores de estado habilitado/desabilitado na barra superior do editor.
  - Atalhos de teclado globais no aplicativo:
    - `Ctrl+Z` (ou `Cmd+Z`): Desfazer alteração.
    - `Ctrl+Y` (ou `Ctrl+Shift+Z` / `Cmd+Y`): Refazer alteração.
  - Proteção inteligente para não interceptar a digitação comum do usuário dentro de inputs e textareas.

---

### 📌 [MELH-09] Backup e Restauração em Arquivo Único (`.sisprova` / SQLite) — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Backend Rust, barra de ferramentas global (`App.tsx`) e aba de Banco de Dados (`SettingsModal.tsx`).
- **Funcionalidades Entregues:**
  - **Fazer Backup Completo (`.sisprova`):**
    - Executa comando SQLite `VACUUM INTO` nativo gerando uma réplica consistente e compactada do banco sem travar operações ativas.
    - Diálogo nativo do sistema operacional (`export_backup_dialog`) com nomenclatura automática (`SisProva_Backup_YYYY-MM-DD.sisprova`).
  - **Restaurar Backup do Sistema:**
    - Diálogo nativo para seleção do arquivo `.sisprova` ou `.db` (`import_backup_dialog`).
    - Validação prévia de integridade (`PRAGMA quick_check` e verificação da estrutura relacional do SisProva).
    - Liberação atômica do lock de arquivo do Windows, geração de cópia de segurança (`data.db.bak`), restauração dos dados e reexecução de migrações.
    - Notificação com feedback visual em tempo real e atualização de todos os componentes da interface.

---

### 📌 [MELH-04] Exportação para Word (.docx) e LaTeX (.tex) — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Live Preview do `ExamBuilder` com geradores nativos de alta fidelidade e suporte completo a equações matemáticas e blocos de código.
- **Funcionalidades Entregues:**
  - **Exportação para Microsoft Word (`.docx`):**
    - Geração client-side nativa sem dependência de serviços externos via biblioteca `docx`.
    - Cabeçalho institucional padronizado em tabela com identificação de instituição, disciplina, título, data, valor e campos do estudante.
    - Caixa estilizada para orientações e instruções da prova.
    - Suporte a formatação rica de enunciado: negrito, itálico, código monospaçado com fundo sombreado e fórmulas matemáticas formatadas com fonte *Cambria Math*.
    - Suporte a questões objetivas com formatação de alternativas e destaque automático para gabarito do professor.
    - Suporte a questões dissertativas com pautas para resposta manual (modo aluno) e bloco de padrão de resposta esperado / espelho de correção (modo professor).
    - Tabela consolidada de gabarito e pontuação gerada na folha final quando em modo gabarito.
    - Numeração dinâmica de páginas no rodapé (*Página X de Y*).
  - **Exportação para LaTeX Compilável (`.tex`):**
    - Documento LaTeX standalone pronto para compilação direta com `pdflatex` ou `xelatex` (Overleaf, TeXstudio, VS Code LaTeX Workshop).
    - Pré-requisitos e pacotes essenciais incluídos: `lmodern`, `amsmath`, `amssymb`, `geometry` (margens de 20mm), `listings` (syntax highlighting de código), `tcolorbox`, `enumitem` e `fancyhdr`.
    - Tokenizer inteligente que preserva equações KaTeX inline (`$...$`) e em display (`$$...$$`), convertendo markdown formatado para sintaxe LaTeX pura.
    - Cabeçalho acadêmico completo com campos do aluno e identificador de caderno (Tipo A, B, C, D).
    - Tratamento de caracteres reservados do LaTeX (`\`, `%`, `_`, `&`, `#`, `{`, `}`) em textos livres sem corromper fórmulas matemáticas.
  - **Interface Unificada no Live Preview (`ExamBuilder`):**
    - Menu agrupado com botão principal de acesso rápido ao PDF e dropdown seletor com as 3 opções:
      - 🟢 **Documento PDF (.pdf)** — Layout de alta fidelidade a 300 DPI
      - 🔵 **Microsoft Word (.docx)** — Documento editável com tabelas e pautas
      - 🟣 **Código LaTeX (.tex)** — Código fonte acadêmico com amsmath e listings
    - Diálogos nativos do sistema operacional via Tauri ou download direto via Blob URL no navegador.

---

### 📌 [MELH-12] Controle Fino de Margens, Densidade, Cabeçalho e Escala de Impressão A4 — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Editor (`ExamBuilder.tsx`), Live Preview (`A4Preview.tsx`), Modal de Configurações (`LayoutSettingsModal.tsx`), motor de PDF e regras `@media print`.
- **Funcionalidades Entregues:**
  - **Presenças e Controle de Margens da Folha A4:**
    - **Compacta (10mm v / 12mm h):** Economia máxima de folhas e papel, ideal para provas densas.
    - **Padrão (16mm v / 18mm h):** Diagramação acadêmica canônica e equilibrada.
    - **Ampla (22mm v / 24mm h):** Margem espaçosa ideal para correções e pareceres docentes laterais.
    - **Ajuste Fino Personalizado:** Sliders em milímetros (de 6mm a 30mm) tanto na vertical quanto na horizontal com resposta visual imediata.
  - **Escala Percentual de Conteúdo (80% a 110%):**
    - Controle deslizante e chips de atalho rápido: `80%`, `85%`, `90%`, `95%`, `100%`, `105%`.
    - Elimina o problema crônico de **páginas órfãs** (questões que transbordam por 1 ou 2 linhas para uma página adicional).
  - **Densidade de Espaçamento Vertical:**
    - Modo `Compacto` (redução de ~30% nos gaps entre questões, margens de parágrafos e pautas de resposta manual).
    - Modo `Padrão` (espaçamento regular arejado).
    - Modo `Amplo` (mais espaço para resolução e rascunho).
  - **Tamanho da Fonte Tipográfica da Prova:**
    - `Pequeno (12px)` para provas longas ou estilo vestibular.
    - `Padrão (13.5px)` para leitura acadêmica ótima.
    - `Grande (15px)` para turmas de ciclo inicial ou acessibilidade visual.
  - **Templates de Cabeçalho Institucional Integrados:**
    - `Universitário / Padrão`: Cabeçalho completo institucional com brasão, dados da disciplina, campos de matrícula/turma/nota e instruções.
    - `Compacto / Econômico`: Cabeçalho horizontal enxuto que economiza mais de 60mm de altura na primeira folha.
    - `Mínimo / Simulado`: Cabeçalho linear ultra-limpo em linha única.
  - **Sincronização Nativa:**
    - Reflete instantaneamente no Live Preview do monitor.
    - Injeta dinamicamente `@page { size: A4 portrait; margin: ... }` para impressão física sem necessidade de ajustes manuais no diálogo do sistema operacional.
    - Preserva estilos na exportação nativa direta para PDF.
    - Persistência automática das preferências no armazenamento local (`localStorage`).

---

### 📌 [MELH-10] Estatísticas, Auditoria e Histórico de Utilização de Questões — ✅ **CONCLUÍDO**
- **Status:** Integrado ao SQLite Relacional, Backend Rust (`commands.rs`), Banco de Questões (`QuestionBankModal.tsx`), Modal de Linha do Tempo (`QuestionUsageHistoryModal.tsx`) e Editor de Provas (`ExamBuilder.tsx`).
- **Funcionalidades Entregues:**
  - **Consulta Relacional Atômica em Rust/SQLite (`get_questoes_estatisticas_uso`):**
    - Agrupamento inteligente cruzando `avaliacao_item`, `avaliacao` e `disciplina`.
    - Cálculo nativo da quantidade total de utilizações, data mais recente de aplicação e contagem de dias corridos desde a última aplicação.
    - Classificação automática de recência: questões aplicadas nos últimos 180 dias (~6 meses) são sinalizadas como "Recentes" para auditoria pedagógica.
  - **Auditoria Visual no Banco de Questões (`QuestionBankModal`):**
    - **Filtros Rápidos por Frequência:**
      - `Todas as Questões`
      - `✨ Inéditas` (nunca utilizadas em nenhuma avaliação)
      - `📋 Já Utilizadas` (questões já testadas com turmas anteriores)
      - `⚠️ Recentes (< 6 meses)` (questões aplicadas recentemente)
    - **Badges Semânticos nos Cards de Questão:**
      - *Inédita:* badge verde com ícone `Sparkles` para localização imediata de questões novas.
      - *Recente (< 6m):* badge âmbar interativo com alerta de dias decorridos (ex: `⚠️ Usada 2x (há 45d)`).
      - *Uso Seguro (> 6m):* badge azul indicando a contagem de provas.
  - **Modal Dedicado de Histórico e Auditoria (`QuestionUsageHistoryModal`):**
    - Cards de KPI: Total de utilizações, Última aplicação formatada em padrão brasileiro (DD/MM/AAAA) e parecer pedagógico.
    - Alerta explicativo de cautela preventiva para turmas consecutivas ou dependências.
    - Linha do tempo completa listando cada avaliação, disciplina, data de aplicação, pontuação atribuída e tempo transcorrido.
  - **Prevenção Ativa no Montador de Provas (`ExamBuilder`):**
    - Seletor rápido de questões exibe o status de uso em cada opção (`[DISSERTATIVA] ... — ✨ Inédita` vs `⚠️ Recente (há 30d)`).
    - Itens adicionados à prova em edição recebem etiquetas instantâneas de auditoria para visualização docente.

---

### 📌 [MELH-08] Templates de Cabeçalho Personalizáveis, Gestão de Brasão e Pontuação Dinâmica — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Editor (`ExamBuilder.tsx`), Live Preview (`A4Preview.tsx`), Modais de Configuração (`SettingsModal.tsx` e `LayoutSettingsModal.tsx`), exportador Word (`docxExport.ts`) e exportador LaTeX (`latexExport.ts`).
- **Funcionalidades Entregues:**
  - **4 Modelos de Cabeçalho Institucional Selecionáveis:**
    1. **Universitário / Padrão:** Cabeçalho institucional amplo com logotipo, metadados, identificação completa do estudante e instruções.
    2. **Compacto / Econômico:** Reduz em mais de 60% a altura do cabeçalho, condensando nome, RA, data e nota em linha única para economizar espaço vertical.
    3. **Vestibular / Concurso:** Cabeçalho solene com faixa superior destacada, identificação do caderno, regras formais de aplicação, campos para assinatura do candidato e visto do fiscal/professor.
    4. **Mínimo / Simulado:** Linha única limpa e minimalista com divisores textuais e linhas de preenchimento essenciais.
  - **Gestão e Otimização do Brasão / Logotipo da Instituição:**
    - Upload direto de imagens (`PNG`, `JPG`, `SVG`, `WebP`) no cadastro geral de instituições e diretamente no painel de metadados da avaliação.
    - Otimizador client-side (`processImageFileToBase64`) com renderização em canvas a 400px para garantir impressão nítida em 300 DPI sem sobrecarregar o banco SQLite nem backups.
    - Visualização instantânea no Live Preview A4, Folha de Respostas OMR e Espelho de Gabaritos Consolidados.
  - **Cálculo Reativo e Dinâmico da Pontuação da Prova:**
    - A pontuação total no Live Preview A4 e no painel lateral agora reflete em tempo real a soma das notas atribuídas a cada questão individual.
    - Ao adicionar, remover ou editar pontos de questões, a pontuação no Preview, na Impressão e nas exportações (PDF, Word, LaTeX) atualiza automaticamente, eliminando o valor estático prévio de 10.0 pts.

---

### 📌 [MELH-13] Usabilidade, Gestão Flexível de Alternativas e Fidelidade Tipográfica A4 — ✅ **CONCLUÍDO**
- **Status:** Integrado ao Editor (`ExamBuilder.tsx`), Banco de Questões (`QuestionBankModal.tsx`), Live Preview (`A4Preview.tsx`) e folhas de estilo (`index.css`).
- **Funcionalidades Entregues:**
  - **Confinamento e Truncamento no Seletor Rápido de Questões do SQLite:**
    - Correção do overflow horizontal do botão `+ Adicionar` causado pelo dimensionamento intrínseco de opções longas em tags `<select>` dentro de flexbox.
    - Aplicação de `min-w-0 max-w-full truncate` no seletor e `shrink-0 whitespace-nowrap` no botão, garantindo alinhamento perfeito sem ultrapassar os limites do card ou da janela.
  - **Gestão Flexível e Dinâmica de Alternativas (Banco e Criador Rápido):**
    - Remoção do limite estático de 4 opções (A, B, C, D) no cadastro de questões objetivas do Banco de Questões (`QuestionBankModal`) e na aba de inserção rápida (`+ Nova Questão Rápida`).
    - Inclusão do botão `+ Alternativa` com geração sequencial de letras (E, F, etc.).
    - Botão de exclusão individual (`Trash2`) com validação de número mínimo (mínimo de 2 alternativas) e realocação automática da alternativa correta caso a opção excluída fosse a assinalada.
  - **Acessibilidade e Alto Contraste no Modo Claro:**
    - Correção do bloco informativo na aba `+ Nova Questão Rápida`, substituindo estilos estáticos escuros por cores semânticas com alto contraste WCAG (`bg-indigo-50 border-indigo-200 text-indigo-800` no modo claro e `dark:bg-indigo-950/40 dark:border-indigo-800/40 dark:text-indigo-300` no modo escuro).
  - **Fidelidade Tipográfica Canônica no Preview A4 ao Vivo (Independente do Tema):**
    - Desacoplamento do tema escuro da interface (`dark:bg-monokai-bg` e `dark:text-monokai-fg`) dentro da folha física A4 (`A4Preview.tsx`).
    - Unificação dos componentes de código Markdown (tanto no enunciado quanto no gabarito/resposta esperada) e na área de implementação manual de questões de programação.
    - Blocos de código no Live Preview A4 agora mantêm fundo claro e texto escuro profissional (`bg-slate-50 border-slate-300 text-slate-800`), assegurando que a pré-visualização seja sempre idêntica à impressão física em papel, tanto no Modo Claro quanto no Modo Escuro e em ambas as visualizações (Versão do Aluno e Versão Gabarito).

---

### 📌 [MELH-14] Suporte Multiplataforma Mobile (Android e iOS) com Tauri v2 — 🔄 **EM VALIDAÇÃO**
- **Status:** Arquitetura do backend Rust adaptada para o padrão de biblioteca mobile do Tauri v2, com abstração de diretórios sandboxed para SQLite e validação de compilação desktop/mobile.
- **Funcionalidades Entregues e Especificação Técnica:**
  - **Reestruturação Arquitetural Rust (`lib.rs` + `main.rs`):**
    - Configuração de crate como biblioteca dinâmica e estática no `Cargo.toml` (`[lib] name = "avaliador_app_lib" crate-type = ["staticlib", "cdylib", "rlib"]`).
    - Criação de `src-tauri/src/lib.rs` com ponto de entrada canônico `#[cfg_attr(mobile, tauri::mobile_entry_point)]` e função executora `pub fn run()`.
    - `src-tauri/src/main.rs` desacoplado para simples despachante da biblioteca, garantindo compatibilidade binária nativa tanto em sistemas Desktop (Windows/macOS/Linux) quanto em sistemas móveis (Android NDK / iOS Xcode).
  - **Abstração Sandboxed de Persistência SQLite (`resolve_db_path_with_app`):**
    - No ambiente mobile (Android/iOS), caminhos absolutos como `%APPDATA%` não existem e o sistema operacional bloqueia escritas fora do container da aplicação.
    - Implementação de `resolve_db_path_with_app(&app)`, consultando o diretório de dados canônico via Tauri (`app.path().app_data_dir()`), mantendo a compatibilidade retroativa com arquivos legados do Windows.
    - Injeção automática da referência de aplicação nos comandos de exportação e restauração de backup (`import_backup_dialog` e `get_db_path`).
  - **Ciclo de Distribuição e Empacotamento:**
    - **Android:** Suporte a compilação de APKs diretos para instalação e AABs para publicação na Google Play Store via `npx tauri android build`.
    - **iOS:** Suporte a geração de projeto Xcode e pacote `.ipa` via `npx tauri ios build` integrado com GitHub Actions macOS runners.

---

## 4. Síntese dos Ciclos de Entrega

| Ciclo | Eixo Principal | Status | Entregas Chave |
|---|---|:---:|---|
| **Ciclo 1** | Produtividade e Avaliação Essencial | **100% CONCLUÍDO** | **MELH-01** (Folha OMR 1, 2 e 4/folha com máscara perfurada) + **MELH-02** (Variações A, B, C, D com gabarito consolidado) + **MELH-03** (PDF Nativo 300 DPI) + **MELH-06** (Clonar/Excluir com segurança) + **MELH-11** (Versão Aluno vs. Gabarito com KaTeX/Mermaid) |
| **Ciclo 2** | Interoperabilidade e Backup | **100% CONCLUÍDO** | **MELH-05** (Importação/Exportação JSON e Markdown em lote) + **MELH-07** (Desfazer/Refazer `Ctrl+Z`/`Ctrl+Y`) + **MELH-09** (Backup atômico `.sisprova` via SQLite VACUUM) |
| **Ciclo 3** | Formatação Avançada e Auditoria | **100% CONCLUÍDO** | **MELH-12** (Controle fino de escala 80-105%, densidade e margens A4) + **MELH-10** (Histórico, kpis de uso e auditoria de recência <6m) + **MELH-08** (4 Templates de cabeçalho, upload de brasão e pontuação reativa) |
| **Ciclo 4** | Ecossistema Externo e Interoperabilidade | **100% CONCLUÍDO** | **MELH-04** (Exportação completa para Microsoft Word `.docx` editável e LaTeX `.tex` acadêmico com pacotes AMS e listings) |
| **Ciclo 5** | Expansão Multiplataforma Mobile (Android & iOS) | **EM EXECUÇÃO** | **MELH-14** (Arquitetura Tauri 2 Mobile, lib.rs compilável, SQLite em sandbox móvel, geração de APK/AAB e IPA) |

> 🏆 **Resultado Geral do Roadmap SisProva:** **100% das 11 melhorias essenciais de desktop entregues**, com a expansão mobile (Ciclo 5) em processo ativo de teste e validação de empacotamento Android.



