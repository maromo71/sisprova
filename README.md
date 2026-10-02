# SisProva - Avaliador Acadêmico Desktop Offline

Aplicativo desktop 100% offline para criação de avaliações acadêmicas, gestão relacional de banco de questões e geração de provas paginadas em formato A4 para impressão e PDF.

---

## 💾 Download e Instalação Multiplataforma

O SisProva está disponível para **Windows**, **macOS** e **Linux**. Você pode obter os instaladores compilados na aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases) ou na pasta local [`installers/`](installers/) (para Windows):

| Plataforma | Pacote / Formato | Descrição & Compatibilidade |
| :--- | :--- | :--- |
| **🪟 Windows** | [`.exe` (Assistente)](installers/AvaliadorApp_1.1.0_x64-setup.exe) | Instalação individual com atalhos para professores (Win 10/11 64-bit) |
| **🪟 Windows** | [`.msi` (Installer)](installers/AvaliadorApp_1.1.0_x64.msi) | Pacote corporativo para administradores de TI (GPO, Intune, SCCM) |
| **🍎 macOS** | `.dmg` (Universal) | Imagem de disco compatível com Apple Silicon (M1/M2/M3/M4) e Intel |
| **🐧 Linux** | `.AppImage` (Universal) | Executável portátil para qualquer distribuição (Ubuntu, Fedora, Arch, Mint, etc.) |
| **🐧 Linux** | `.deb` (Debian / Ubuntu) | Pacote de instalação nativo para Debian, Ubuntu, Linux Mint e Pop!_OS |
| **🤖 Android** | `.apk` (Instalação Direta) | Pacote instalador para smartphones e tablets Android (Android 7.0+) |
| **📱 iOS** | `.ipa` / Projeto Xcode | Pacote móvel para iPhone e iPad (via TestFlight ou Xcode) |

---

### 🪟 Guia de Instalação no Windows

#### 👨‍🏫 Uso Individual (Professores e Coordenadores)
1. **Baixar o Instalador:** Faça o download do arquivo [`AvaliadorApp_1.1.0_x64-setup.exe`](installers/AvaliadorApp_1.1.0_x64-setup.exe).
2. **Executar:** Dê um duplo clique no arquivo baixado para iniciar o assistente.
3. **Aviso do Windows SmartScreen (se exibido):**
   - Como o instalador é distribuído diretamente sem certificado comercial pago EV, o Windows Defender pode exibir a tela *"O Windows protegeu o seu computador"*.
   - Clique no link sublinhado **"Mais informações"** e em seguida no botão **"Executar assim mesmo"**.
4. **Concluir a Instalação:**
   - Escolha o diretório de destino (ou mantenha o padrão sugerido) e clique em **Avançar** e **Instalar**.
   - O assistente criará automaticamente o atalho do **SisProva / AvaliadorApp** na Área de Trabalho e no Menu Iniciar.
5. **Dados Locais:** O banco SQLite é salvo de forma isolada em `%APPDATA%\AvaliadorApp\data.db`.

#### 🏛️ Deploy em Massa / Laboratórios (Administradores de TI)
Utilize o pacote padrão Microsoft Installer [`AvaliadorApp_1.1.0_x64.msi`](installers/AvaliadorApp_1.1.0_x64.msi).

1. **Instalação Silenciosa via Linha de Comando:**
   ```cmd
   msiexec /i AvaliadorApp_1.1.0_x64.msi /quiet /qn /norestart
   ```
2. **Instalação com Log de Auditoria:**
   ```cmd
   msiexec /i AvaliadorApp_1.1.0_x64.msi /quiet /qn /norestart /L*V "C:\Logs\sisprova_install.log"
   ```
3. **Desinstalação Remota Silenciosa:**
   ```cmd
   msiexec /x AvaliadorApp_1.1.0_x64.msi /quiet /qn /norestart
   ```
4. **Active Directory (GPO) e Microsoft Intune:**
   - Compatível com GPO via *Instalação de software (Atribuído)*.
   - Compatível com Intune/SCCM via *Aplicativo de Linha de Negócios (LOB)* com argumento `/quiet /qn /norestart`.

---

### 🍎 Guia de Instalação no macOS

O instalador para Mac é distribuído como **Universal Binary**, compatível nativamente tanto com os processadores **Apple Silicon (M1, M2, M3, M4)** quanto com Macs legados com processadores **Intel**.

1. **Baixar o arquivo `.dmg`:** Acesse a aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases) e baixe o arquivo `SisProva_*.dmg`.
2. **Montar e Instalar:**
   - Dê um duplo clique no arquivo `.dmg` para abri-lo.
   - Arraste o ícone do **SisProva / AvaliadorApp** para a pasta **Aplicativos (Applications)**.
3. **Primeira Abertura & Gatekeeper (Segurança do macOS):**
   - Como o aplicativo é acadêmico e compilado diretamente pelo GitHub Actions sem assinatura comercial anual da Apple Developer, o macOS exibirá uma mensagem de segurança (*"AvaliadorApp não pode ser aberto porque a Apple não pode verificar se há software mal-intencionado"*).
   - **Opção 1 (Interface Gráfica — Recomendado):**
     1. Abra a pasta **Aplicativos** no Finder.
     2. Clique com o **botão direito** (ou segure `Control` e clique) no **SisProva** e selecione **"Abrir"**.
     3. Na caixa de diálogo que surgir, clique em **"Abrir"** para confirmar. Essa autorização é necessária apenas na primeira execução.
   - **Opção 2 (Ajustes do Sistema):**
     - Vá em **Ajustes do Sistema > Privacidade e Segurança**, role até a seção **Segurança** e clique em **"Abrir Mesmo Assim"**.
   - **Opção 3 (Terminal):**
     ```bash
     xattr -d com.apple.quarantine /Applications/AvaliadorApp.app
     ```
4. **Dados Locais:** O banco SQLite no macOS fica armazenado em `~/Library/Application Support/com.avaliadorapp.desktop/data.db`.

---

### 🐧 Guia de Instalação no Linux

O SisProva para Linux é distribuído em duas opções para atender a qualquer distribuição:

#### Opção 1: `.AppImage` (Universal — Qualquer Distribuição)
O formato AppImage é auto-contido e portátil. Não exige privilégios de administrador (`root`/`sudo`) nem instalação de pacotes adicionais.

1. Baixe o arquivo `SisProva_*.AppImage` na aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases).
2. Dê permissão de execução ao arquivo:
   - **Pelo Terminal:**
     ```bash
     chmod +x SisProva_*.AppImage
     ./SisProva_*.AppImage
     ```
   - **Pela Interface Gráfica:** Clique com o botão direito no arquivo baixado -> **Propriedades** -> aba **Permissões** -> marque a opção **"Permitir execução do arquivo como um programa"**.
3. Dê um duplo clique para abrir o aplicativo diretamente.

#### Opção 2: `.deb` (Debian, Ubuntu, Linux Mint, Pop!_OS)
Para quem prefere integração nativa com o gerenciador de pacotes do sistema:

1. Baixe o arquivo `SisProva_*_amd64.deb` na aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases).
2. Instale com um duplo clique pela Central de Aplicativos ou via terminal:
   ```bash
   sudo apt install ./SisProva_*_amd64.deb
   ```
3. O atalho do SisProva aparecerá diretamente no menu de aplicativos do seu ambiente gráfico (GNOME, KDE, Cinnamon, etc.).

#### 📦 Pré-requisitos de Execução no Linux:
- Distribuição x86_64 moderna (Ubuntu 20.04+, Debian 11+, Fedora 36+, etc.).
- Biblioteca `WebKit2GTK 4.1` (já presente por padrão em ambientes desktop atuais). Caso necessário:
  ```bash
  # Ubuntu / Debian / Linux Mint:
  sudo apt install libwebkit2gtk-4.1-0 libappindicator3-1
  # Fedora:
  sudo dnf install webkit2gtk4.1 libappindicator-gtk3
  ```
- **Dados Locais:** O banco SQLite no Linux fica armazenado em `~/.local/share/com.avaliadorapp.desktop/data.db`.

---

### 🤖 Guia de Instalação no Android (.apk)

O SisProva para Android permite levar o banco de questões e montagem de avaliações diretamente no bolso ou tablet:

1. **Baixar o APK:** Acesse a aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases) ou baixe o artefato gerado na aba **Actions**.
2. **Transferir para o Celular:** Você pode baixar diretamente pelo navegador do smartphone ou transferir via cabo USB, Google Drive ou WhatsApp.
3. **Instalar:**
   - Abra o arquivo `.apk` baixado através do gerenciador de arquivos do aparelho.
   - Caso o Android solicite permissão, habilite a opção **"Permitir desta fonte"** (Instalação de fontes desconhecidas).
   - Confirme a instalação tocando em **"Instalar"**.
4. **Armazenamento Seguro:** O banco de dados SQLite é mantido no sandbox privado do app no Android, isolado de outros aplicativos.

---

### 📱 Guia de Execução no iPhone / iPad (iOS)

O projeto iOS é gerado nativamente pelo Tauri v2 para execução no ecossistema Apple:

1. Baixe o pacote compactado `SisProva-iOS-Xcode.tar.gz` na aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases) ou na aba **Actions**.
2. Descompacte no seu Mac e abra a pasta gerada no **Xcode**.
3. Conecte seu iPhone via cabo, selecione seu dispositivo no seletor do Xcode e clique em **Run** (ou publique via **TestFlight** para distribuição a professores).

---

### 🤖 Compilação Automatizada Multiplataforma (GitHub Actions CI/CD)

O repositório possui fluxos de trabalho automatizados no GitHub Actions para compilar em nuvem e gerar todos os binários oficiais sem necessidade de ambiente local complexo:

- **Windows:** Instaladores `.exe` e `.msi` disponíveis diretamente no repositório.
- **macOS:** [`.github/workflows/build-mac.yml`](.github/workflows/build-mac.yml) — Compila em runner macOS gerando o pacote `.dmg` Universal (Intel + Apple Silicon).
- **Linux:** [`.github/workflows/build-linux.yml`](.github/workflows/build-linux.yml) — Compila em runner Ubuntu gerando os pacotes `.AppImage` e `.deb`.
- **Android:** [`.github/workflows/build-android.yml`](.github/workflows/build-android.yml) — Compila em runner Ubuntu com Android SDK/NDK gerando o arquivo `.apk` pronto para instalar.
- **iOS / iPhone:** [`.github/workflows/build-ios.yml`](.github/workflows/build-ios.yml) — Compila em runner macOS Apple Silicon gerando o projeto Xcode e `.ipa`.

Os fluxos podem ser acionados manualmente na aba **Actions** do GitHub (botão *"Run workflow"*) ou automaticamente ao publicar uma tag de versão (`git tag vX.Y.Z && git push origin vX.Y.Z`).

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
