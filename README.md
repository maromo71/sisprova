# SisProva - Avaliador Acadêmico Desktop Offline

Aplicativo desktop 100% offline para criação de avaliações acadêmicas, gestão relacional de banco de questões e geração de provas paginadas em formato A4 para impressão e PDF.

---

## 💾 Download e Instalação (Windows)

Você pode baixar os instaladores diretamente da pasta [`installers/`](installers/) deste repositório ou pela aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases):

| Tipo de Pacote | Arquivo | Público-Alvo | Tamanho |
| :--- | :--- | :--- | :--- |
| **Assistente de Instalação (.exe)** | [`AvaliadorApp_1.0.0_x64-setup.exe`](installers/AvaliadorApp_1.0.0_x64-setup.exe) | **Professores e Coordenadores** (PC pessoal ou notebook institucional) | ~5.2 MB |
| **Pacote Windows Installer (.msi)** | [`AvaliadorApp_1.0.0_x64.msi`](installers/AvaliadorApp_1.0.0_x64.msi) | **Administradores de TI** (Instalação em lote via GPO, Intune, SCCM ou scripts) | ~6.5 MB |

---

### 👨‍🏫 Guia de Instalação para o Professor (Uso Individual)

Se você é professor ou coordenador e deseja utilizar o SisProva em seu computador ou notebook:

1. **Baixar o Instalador:** Faça o download do arquivo [`AvaliadorApp_1.0.0_x64-setup.exe`](installers/AvaliadorApp_1.0.0_x64-setup.exe).
2. **Executar:** Dê um duplo clique no arquivo baixado para iniciar o assistente.
3. **Aviso do Windows SmartScreen (se exibido):**
   - Como o instalador é distribuído diretamente pela instituição sem certificado comercial pago EV, o Windows Defender pode exibir a tela *"O Windows protegeu o seu computador"*.
   - Clique no link sublinhado **"Mais informações"** e em seguida no botão **"Executar assim mesmo"**.
4. **Concluir a Instalação:**
   - Escolha o diretório de destino (ou mantenha o padrão sugerido) e clique em **Avançar** e **Instalar**.
   - O assistente criará automaticamente o atalho do **SisProva / AvaliadorApp** na Área de Trabalho e no Menu Iniciar.
5. **Pronto para Usar:**
   - Ao abrir pela primeira vez, o aplicativo já cria e inicializa o banco de dados local SQLite de forma 100% autônoma e segura.
   - O sistema funciona completamente offline — não necessita de internet nem login em nuvem.

---

### 🏛️ Guia de Instalação para o Administrador de TI da Instituição (Deploy em Massa / Laboratórios)

Se você é administrador de sistemas, analista de infraestrutura ou suporte de TI responsável por equipar laboratórios, salas de aula ou máquinas corporativas:

Utilize o pacote padrão Microsoft Installer [`AvaliadorApp_1.0.0_x64.msi`](installers/AvaliadorApp_1.0.0_x64.msi).

#### 1. Instalação Silenciosa via Linha de Comando (CMD / PowerShell / Scripts em Lote)
Para instalar em segundo plano em todas as máquinas sem interação do usuário:

```cmd
msiexec /i AvaliadorApp_1.0.0_x64.msi /quiet /qn /norestart
```

#### 2. Instalação com Geração de Log de Auditoria
Recomendado para homologação e verificação de sucesso na implantação:

```cmd
msiexec /i AvaliadorApp_1.0.0_x64.msi /quiet /qn /norestart /L*V "C:\Logs\sisprova_install.log"
```

#### 3. Desinstalação Remota Silenciosa
Para remover o aplicativo de todas as estações do parque via script:

```cmd
msiexec /x AvaliadorApp_1.0.0_x64.msi /quiet /qn /norestart
```

#### 4. Implantação via Active Directory (GPO)
O arquivo `.msi` foi compilado respeitando a estrutura do Windows Installer da Microsoft:
- Abra o **Group Policy Management Console (gpmc.msc)**.
- Crie ou edite a GPO do laboratório/unidade: `Configuração do Computador -> Políticas -> Configurações de Software -> Instalação de software`.
- Clique com o botão direito -> **Novo -> Pacote**.
- Aponte para o caminho de rede compartilhado (UNC) do `AvaliadorApp_1.0.0_x64.msi`.
- Selecione o método de implantação **Atribuído (Assigned)**.

#### 5. Implantação via Microsoft Intune ou MECM/SCCM
- No portal do Intune, adicione um aplicativo do tipo **Aplicativo de linha de negócios (Line-of-business app)**.
- Carregue o arquivo `AvaliadorApp_1.0.0_x64.msi`.
- Argumentos de linha de comando: `/quiet /qn /norestart`.
- Contexto de instalação: **Dispositivo (Device)**.

#### 6. Pré-requisitos nas Estações
- Windows 10 (64-bit) versão 1809+ ou Windows 11.
- Microsoft Edge WebView2 Runtime (já presente nativamente nas versões atuais do Windows 10 e Windows 11).
- Os dados do banco SQLite de cada usuário são armazenados de forma isolada em `%APPDATA%\AvaliadorApp\data.db`.

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
5. **Variações de Provas (Tipos A, B, C, D) [MELH-02]:** Embaralhamento determinístico de questões e alternativas via PRNG (Mulberry32) com seed reproduzível e identificação visual por versão.
6. **Matriz de Gabaritos Consolidada do Professor [MELH-02]:** Folha de conferência com respostas cruzadas lado a lado e resumo estatístico de balanceamento para impressão A4.
7. **Padrão de Resposta / Espelho de Correção (Versão Aluno vs. Versão Gabarito) [MELH-11]:** Cadastro de resposta esperada com suporte a Markdown/LaTeX. Alternância imediata entre Versão Aluno (com pautas limpas) e Versão Gabarito do Professor (com critérios de correção renderizados no lugar das linhas e alternativas destacadas).
8. **Folhas de Resposta Automáticas (Gabarito OMR) [MELH-01]:** Grade de bolhas com layouts 1 por página, 2 por página (corte com 50% de economia) e 4 por página (quadrantes) com máscara de gabarito oficial.
9. **Duplicação Rápida e Exclusão Segura de Avaliações [MELH-06]:** Ação "Nova Prova", clonagem atômica de provas existentes e exclusão com proteção integral do Banco de Questões.
10. **Exportação Direta para PDF Nativo [MELH-03]:** Exportação em 1 clique com diálogo nativo de *Salvar Como*, fatiamento multi-página A4, metadados embutidos e fidelidade 300 DPI sem abrir diálogo de navegador.
11. **Importação e Exportação de Questões em Lote [MELH-05]:** Exportação de acervos em JSON ou Markdown estruturados; importação em lote com pré-visualização interativa por cards e gravação atômica no SQLite.
12. **Histórico de Alterações com Desfazer / Refazer [MELH-07]:** Controle total com botões na barra de ferramentas e atalhos de teclado `Ctrl+Z` e `Ctrl+Y` para reverter edições, inclusões ou remoções acidentais.
13. **Backup e Restauração em Arquivo Único (.sisprova) [MELH-09]:** Exportação atômica do banco via comando `VACUUM INTO` e restauração segura com validação de schema e backup preventivo.
14. **Impressão A4 Impecável:** Diagramação vetorial preservada, cabeçalho acadêmico oficial e linhas pautadas proporcionais via `@media print`.

---

## 📚 Documentação Técnica e Planejamento

- 📖 [**Especificação Técnica e de Requisitos do Software (ESPECIFICACAO.md)**](file:///c:/sisprova/ESPECIFICACAO.md): Documento completo com arquitetura de software, modelo relacional ERD, dicionário de dados SQLite, requisitos funcionais e não-funcionais, e matriz de comandos IPC.
- 💡 [**Propostas de Melhorias e Roadmap (PROPOSTAS_DE_MELHORIAS.md)**](file:///c:/sisprova/PROPOSTAS_DE_MELHORIAS.md): Catálogo de melhorias priorizadas (Folhas de Resposta OMR, Provas Tipo A/B/C/D, Exportação PDF/Word nativa, Importação em lote e Backup).

---

## 📄 Licença
Distribuído sob a licença MIT.
