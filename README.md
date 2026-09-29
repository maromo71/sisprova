# SisProva - Avaliador Acadêmico Desktop Offline

Aplicativo desktop 100% offline para criação de avaliações acadêmicas, gestão relacional de banco de questões e geração de provas paginadas em formato A4 para impressão e PDF.

---

## 🛠️ Stack Tecnológica

- **Desktop Framework:** [Tauri v2](https://v2.tauri.app/)
- **Backend Nativo:** Rust 2021 edition (`rusqlite` bundled, `serde`, `tauri-plugin-dialog`, `tauri-plugin-fs`)
- **Persistência:** SQLite local (`%APPDATA%\AvaliadorApp\data.db`) com integridade referencial ACID e chaves estrangeiras ativas
- **Frontend Core:** React 19 + TypeScript + Vite + Tailwind CSS + Lucide React
- **Equações e Fórmulas:** `react-markdown` + `remark-math` + `rehype-katex` com estilos e fontes KaTeX empacotados localmente
- **Diagramas Vetoriais:** `mermaid.js` client-side com validação e fallback não-bloqueante
- **Exportação & Impressão:** Regras padronizadas `@media print` para folhas A4 com proporção milimétrica

---

## 🚀 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (v1.75+)

### Instalação de Dependências
```bash
npm install
```

### Modo de Desenvolvimento
```bash
npm run tauri dev
```

### Compilação do Executável (.exe) e Instaladores (MSI / NSIS)
```bash
npm run tauri build
```

Os instaladores e o binário standalone serão gerados em `src-tauri/target/release/bundle/`.

---

## 📋 Principais Funcionalidades

1. **Zero-Cloud & 100% Offline:** Nenhuma chamada externa à rede; fontes, ícones e diagramas funcionam sem conexão à internet.
2. **Editor Split-Pane:** Edição dinâmica no painel esquerdo com Live Preview A4 sincronizado a 60 FPS com `useDeferredValue` no painel direito.
3. **Suporte Multiformato:** Enunciados com Markdown, código com syntax highlight, matemática em LaTeX `$f(x)$` e diagramas de fluxo Mermaid.
4. **Banco de Questões Relacional:** CRUD de instituições, disciplinas e questões (dissertativas, objetivas e de código) no SQLite.
5. **Gabarito Automático:** Alternância de visualização de gabarito para conferência do professor.
6. **Impressão A4 Impecável:** Diagramação vetorial preservada, cabeçalho acadêmico oficial e linhas pautadas proporcionais.

---

## 📚 Documentação Técnica e Planejamento

- 📖 [**Especificação Técnica e de Requisitos do Software (ESPECIFICACAO.md)**](file:///c:/sisprova/ESPECIFICACAO.md): Documento completo com arquitetura de software, modelo relacional ERD, dicionário de dados SQLite, requisitos funcionais e não-funcionais, e matriz de comandos IPC.
- 💡 [**Propostas de Melhorias e Roadmap (PROPOSTAS_DE_MELHORIAS.md)**](file:///c:/sisprova/PROPOSTAS_DE_MELHORIAS.md): Catálogo de melhorias priorizadas (Folhas de Resposta OMR, Provas Tipo A/B/C/D, Exportação PDF/Word nativa, Importação em lote e Backup).

---

## 📄 Licença
Distribuído sob a licença MIT.
