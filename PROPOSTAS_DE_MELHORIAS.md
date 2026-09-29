# SisProva - Propostas de Melhorias e Roadmap Estratégico

**Documento:** Planejamento e Especificação de Melhorias  
**Data:** Setembro de 2026  
**Status:** Propostas Abertas para Priorização  

---

## 1. Sumário Executivo do Roadmap

Com a consolidação da versão 1.0.0 do **SisProva** — arquitetada em Tauri v2, Rust, React 19 e SQLite com suporte a KaTeX, diagramas Mermaid, temas Claro/Monokai e edição flexível de questões —, o presente documento apresenta um plano estruturado de melhorias de curto, médio e longo prazo.

As melhorias propostas estão divididas em **6 eixos estratégicos**:
1. **Folhas de Resposta Automáticas e Correção (OMR)**
2. **Geração de Versões de Avaliação (Provas A, B, C e D)**
3. **Exportação Nativa e Interoperabilidade (PDF, Word, LaTeX e Moodle)**
4. **Curadoria e Gestão Avançada do Banco de Questões**
5. **Produtividade Docente, Interface e Usabilidade**
6. **Segurança, Backup e Portabilidade do Banco de Dados**

---

## 2. Matriz de Priorização (Esforço x Impacto)

```
        ▲ ALTO
        │  [MELH-01] Folha de Respostas OMR      [MELH-02] Provas Tipo A, B, C, D
        │  [MELH-03] Exportação Direta para PDF  [MELH-05] Importação em Lote
IMPACTO │
        │  [MELH-07] Histórico Desfazer (Ctrl+Z) [MELH-04] Exportação DOCX / Word
        │  [MELH-09] Backup Automático .sisprova [MELH-08] Templates de Cabeçalho
        │  [MELH-06] Tags e Taxonomia de Bloom   [MELH-10] Criptografia de Dados
        ▼ BAIXO
        └────────────────────────────────────────────────────────────────────────►
          BAIXA                      MÉDIA                       ALTA
                                 COMPLEXIDADE
```

---

## 3. Detalhamento das Propostas

---

### Eixo 1: Folhas de Resposta e Avaliação

#### 📌 [MELH-01] Geração Automática de Folha de Respostas (Gabarito OMR) — ✅ **IMPLEMENTADO**
- **Status:** Concluído e integrado ao Live Preview A4 com suporte a 1, 2 (corte) e 4 folhas por página e máscara de gabarito.
- **Motivação:** Como o SisProva já permite configurar `linhas_resposta = 0` para questões dissertativas e suporta questões objetivas, a geração de uma folha de respostas padronizada economiza papel e tempo de aplicação.
- **Funcionalidades Implementadas:**
  - Alternador direto no topo do painel direito: **"Caderno de Prova"** vs **"Folha de Respostas (OMR)"**.
  - Grade de bolhas padronizadas `(A) (B) (C) (D) (E)` para as questões objetivas e espaço estruturado para dissertativas.
  - Seleção de layout dinâmico: **1 por folha**, **2 por folha (linha de corte no meio - economia de 50%)** e **4 por folha (quadrantes)**.
  - Alternador de **Máscara de Gabarito Oficial** com bolhas preenchidas para correção rápida perfurada pelo professor.
  - Impressão física direta e independente via `@media print`.
- **Impacto:** ⭐⭐⭐⭐⭐ (Altíssimo valor para professores com turmas grandes)
- **Complexidade:** Média.

---

### Eixo 2: Segurança Pedagógica e Aplicação

#### 📌 [MELH-02] Geração de Variações de Provas (Embaralhamento Tipos A, B, C, D)
- **Motivação:** Dificultar a "cola" e fraudes em salas de aula com alta densidade de estudantes.
- **Descrição da Funcionalidade:**
  - Opção no painel do editor: **"Gerar Provas Múltiplas (Tipos A, B, C, D)"**.
  - Dois níveis de embaralhamento configuráveis:
    1. *Embaralhar ordem das questões.*
    2. *Embaralhar ordem das alternativas internas das questões objetivas.*
  - Geração automática de uma **Folha de Gabaritos do Professor Consolidada**, contendo a matriz de respostas corretas para cada tipo de prova lado a lado:
    | Questão | Prova A | Prova B | Prova C | Prova D |
    |:---:|:---:|:---:|:---:|:---:|
    | 1 | C | A | D | B |
    | 2 | A | C | B | D |
- **Impacto:** ⭐⭐⭐⭐⭐ (Recurso essencial para colégios, vestibulares e universidades)
- **Complexidade:** Média (algoritmo determinístico de shuffle com seed gravada no banco).

---

### Eixo 3: Exportação e Interoperabilidade

#### 📌 [MELH-03] Exportação Direta para PDF Nativo sem Diálogo do Navegador
- **Motivação:** Atualmente a exportação depende do diálogo do sistema operacional (`window.print()`). Alguns professores necessitam de um botão "Exportar PDF" que salve diretamente o arquivo no disco em um clique.
- **Descrição da Funcionalidade:**
  - Integração no Rust via biblioteca nativa headless (ex: `headless_chrome` ou motor em Rust `lopdf` / `genpdf` / Chromium headless print-to-pdf).
  - Caixa de diálogo nativa do Tauri para escolher o destino (`Salvar como...`).
  - Metadados embutidos no PDF: Título do documento, autor (nome do docente) e data de criação.
- **Impacto:** ⭐⭐⭐⭐
- **Complexidade:** Média-Alta.

#### 📌 [MELH-04] Exportação para Word (.docx) e LaTeX (.tex)
- **Motivação:** Permitir que o professor compartilhe a prova com colegas de departamento que utilizam o Microsoft Word ou editores LaTeX (Overleaf/TeXstudio).
- **Descrição da Funcionalidade:**
  - Exportação para `.docx` convertendo o Markdown e fórmulas matemáticas KaTeX em equações nativas do Word (OMML - *Office Math Markup Language*).
  - Exportação para `.tex` com template acadêmico pronto para compilação com `pdflatex` ou `xelatex`.
- **Impacto:** ⭐⭐⭐⭐
- **Complexidade:** Alta.

---

### Eixo 4: Curadoria e Gestão do Banco de Questões

#### 📌 [MELH-05] Importação e Exportação de Questões em Lote (Markdown, CSV, JSON e Moodle XML)
- **Motivação:** Professores que já possuem centenas de questões em arquivos de texto ou plataformas EAD não querem recadastrar questão por questão manualmente.
- **Descrição da Funcionalidade:**
  - **Importação via Markdown:** Leitor inteligente de arquivo `.md` que detecta padrões:
    ```markdown
    # Questão: Teorema de Tales
    [DIFICULDADE: MEDIO] [TIPO: OBJETIVA]
    Enunciado da questão...
    - [x] Alternativa A (Correta)
    - [ ] Alternativa B
    ```
  - **Importação e Exportação Moodle XML:** Padrão ouro dos sistemas de gestão de aprendizagem.
  - **Exportação do Banco de Questões em JSON estruturado** para compartilhamento entre computadores de professores.
- **Impacto:** ⭐⭐⭐⭐⭐
- **Complexidade:** Média.

#### 📌 [MELH-06] Tags Temáticas, Competências BNCC e Taxonomia de Bloom
- **Motivação:** Melhorar a busca de questões além do filtro básico por disciplina.
- **Descrição da Funcionalidade:**
  - Sistema de etiquetas (*tags*) livres (ex: `#cinematica`, `#estruturas-de-repeticao`, `#revolucao-industrial`).
  - Classificação pedagógica conforme a **Taxonomia de Bloom**:
    - *Lembrar, Compreender, Aplicar, Analisar, Avaliar, Criar.*
  - Campo opcional para código de habilidade da BNCC (ex: `EM13MAT101`).
- **Impacto:** ⭐⭐⭐
- **Complexidade:** Baixa.

---

### Eixo 5: Produtividade Docente e Usabilidade

#### 📌 [MELH-07] Histórico de Alterações com Desfazer/Refazer (`Ctrl+Z` / `Ctrl+Y`)
- **Motivação:** Se o docente excluir acidentalmente uma questão da avaliação ou alterar pontuações, deve ser capaz de reverter a ação sem perder trabalho.
- **Descrição da Funcionalidade:**
  - Pilha de estados (*undo/redo stack*) em memória para as operações do `ExamBuilder`.
  - Botões visuais de "Desfazer" e "Refazer" com atalhos de teclado convencionais `Ctrl+Z` e `Ctrl+Shift+Z` / `Ctrl+Y`.
- **Impacto:** ⭐⭐⭐⭐
- **Complexidade:** Baixa-Média.

#### 📌 [MELH-08] Templates de Cabeçalho Institucional Personalizáveis
- **Motivação:** Diferentes universidades e escolas possuem normas próprias de cabeçalho (algumas exigem grade com data, assinatura, código de barras, nota por extenso ou critérios de pontuação por competência).
- **Descrição da Funcionalidade:**
  - Gerenciador visual de modelos de cabeçalho:
    1. *Modelo Universitário Tradicional* (com caixa de nota e turma).
    2. *Modelo Compacto* (1 linha com dados essenciais).
    3. *Modelo Concurso / Vestibular* (com instruções formais e campo para código de barras do aluno).
  - Seletor de template nas configurações da prova.
- **Impacto:** ⭐⭐⭐⭐
- **Complexidade:** Baixa.

---

### Eixo 6: Segurança, Backup e Portabilidade de Dados

#### 📌 [MELH-09] Backup e Restauração em Arquivo Único (`.sisprova` / `.zip`)
- **Motivação:** Garantir que o docente possa trocar de computador ou fazer cópia de segurança de todo o seu banco de questões e provas sem precisar localizar manualmente pastas ocultas do sistema (`%APPDATA%`).
- **Descrição da Funcionalidade:**
  - Menu: **"Fazer Backup do Banco de Dados"** -> gera arquivo compactado com timestamp (ex: `sisprova_backup_2026-09-29.sisprova`).
  - Menu: **"Restaurar Banco de Dados"** -> valida integridade do SQLite e substitui ou mescla (*merge*) os registros com confirmação de segurança.
- **Impacto:** ⭐⭐⭐⭐⭐
- **Complexidade:** Baixa (operações de cópia de arquivo e integridade via Rust).

#### 📌 [MELH-10] Estatísticas e Histórico de Utilização de Questões
- **Motivação:** Evitar que o professor repita acidentalmente a mesma questão para turmas do mesmo ano ou no mesmo semestre.
- **Descrição da Funcionalidade:**
  - No banco de questões, cada questão exibe:
    - *Quantas vezes foi utilizada em avaliações.*
    - *Data da última aplicação.*
    - *Nome das provas em que foi incluída.*
  - Alerta sutil: *"Esta questão já foi aplicada nesta disciplina há menos de 6 meses"*.
- **Impacto:** ⭐⭐⭐⭐
- **Complexidade:** Baixa (consulta SQL agregada com `LEFT JOIN avaliacao_item`).

---

## 4. Cronograma de Implementação Sugerido

| Fase | Prazo Sugerido | Funcionalidades Prioritárias |
|---|---|---|
| **Fase 1 (Próximo Ciclo)** | 2 a 3 semanas | **MELH-01** (Folha de Respostas OMR) + **MELH-09** (Backup e Restauração) + **MELH-07** (Desfazer/Refazer) |
| **Fase 2 (Segurança & Escala)** | 4 semanas | **MELH-02** (Provas Tipo A/B/C/D com Gabarito Cruzado) + **MELH-10** (Histórico de Aplicações) |
| **Fase 3 (Interoperabilidade)** | 4 a 6 semanas | **MELH-05** (Importação em lote Markdown/CSV) + **MELH-08** (Templates de Cabeçalhos) |
| **Fase 4 (Exportação Nativa)** | 6 a 8 semanas | **MELH-03** (PDF Nativo sem diálogo de navegador) + **MELH-04** (Exportação Word/DOCX) |

---

## 5. Conclusão

A implementação gradual destas propostas elevará o **SisProva** de uma ferramenta de diagramação de excelência a uma plataforma completa de **gestão pedagógica de avaliações**, consolidando sua proposta de valor única: **100% offline, ágil, com rigor acadêmico, suporte matemático/gráfico de ponta e zero dependência de nuvem**.
