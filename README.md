# 📝 SisProva — Avaliador Acadêmico Desktop

> **Plataforma desktop 100% offline para criação de avaliações acadêmicas, diagramação A4 profissional em tempo real, gestão relacional de banco de questões e correção ágil com folhas de resposta OMR.**

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-24C8DB?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_ACID-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Multiplataforma](https://img.shields.io/badge/Plataformas-Windows%20%7C%20macOS%20%7C%20Linux-4CAF50?style=flat-square)](#-download-e-instalacao-multiplataforma)
[![100% Offline](https://img.shields.io/badge/Rede-100%25%20Offline%20%26%20Privado-blueviolet?style=flat-square)](#)
[![Licença MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg?style=flat-square)](LICENSE)

---

### 🌟 Destaques para o Professor:
- 🔒 **Privacidade Total (Zero-Cloud):** Nenhuma prova, questão ou dado de aluno trafega pela internet. Seu acervo intelectual permanece 100% seguro e armazenado localmente no seu computador.
- 📐 **Diagramação A4 em Tempo Real:** Edite no painel esquerdo e visualize no painel direito exatamente a folha física A4 que sairá na impressora, com proporção milimétrica a 60 FPS.
- 🔀 **Prevenção Antifraude (Provas A, B, C e D):** Embaralhamento inteligente com semente reproduzível e geração automática da **Folha de Gabaritos Consolidada** do professor.
- 📋 **Folhas de Resposta Automáticas (Gabarito OMR):** Cartões de bolhas gerados com 1 toque, com opções econômicas (2 por folha com linha de corte para 50% de economia de papel ou 4 por folha) e máscara perfurada de conferência.
- 📤 **Interoperabilidade Completa:** Exporte diretamente para **PDF Nativo (300 DPI)** sem diálogo de navegador, **Microsoft Word (.docx)** totalmente editável e **LaTeX acadêmico (.tex)**.

---

## 💾 Download e Instalação Multiplataforma

O SisProva é distribuído para **Windows**, **macOS** e **Linux**. Escolha o pacote adequado para o seu sistema:

| Sistema Operacional | Formato | Indicação de Uso | Download |
| :--- | :---: | :--- | :---: |
| **🪟 Windows (10 / 11)** | `.exe` | **Recomendado para Professores** (Assistente de instalação completo) | [**Baixar (.exe)**](installers/AvaliadorApp_1.1.0_x64-setup.exe) |
| **🪟 Windows (Corporativo / TI)** | `.msi` | Administradores de Redes, Laboratórios, GPO e Microsoft Intune | [**Baixar (.msi)**](installers/AvaliadorApp_1.1.0_x64.msi) |
| **🍎 macOS (Apple Silicon / Intel)** | `.dmg` | Universal Binary nativo para Macs M1/M2/M3/M4 e processadores Intel | [**GitHub Releases**](https://github.com/maromo71/sisprova/releases) |
| **🐧 Linux (Universal)** | `.AppImage` | Portátil para qualquer distribuição (Ubuntu, Fedora, Arch, Mint, etc.) | [**GitHub Releases**](https://github.com/maromo71/sisprova/releases) |
| **🐧 Linux (Debian / Ubuntu)** | `.deb` | Pacote nativo com integração no menu gráfico e gerenciador APT | [**GitHub Releases**](https://github.com/maromo71/sisprova/releases) |

---

### 🪟 Guia de Instalação no Windows

#### 👨‍🏫 Uso Individual (Professores e Coordenadores)
1. **Baixar o Instalador:** Clique no link para baixar o assistente [`AvaliadorApp_1.1.0_x64-setup.exe`](installers/AvaliadorApp_1.1.0_x64-setup.exe).
2. **Executar:** Dê um duplo clique no arquivo baixado para iniciar a instalação.
3. **Aviso do Windows SmartScreen (se exibido):**
   - Por ser um aplicativo acadêmico independente distribuído diretamente sem certificado comercial corporativo anual, o Windows pode exibir a mensagem *"O Windows protegeu o seu computador"*.
   - Basta clicar no link sublinhado **"Mais informações"** e depois no botão **"Executar assim mesmo"**.
4. **Concluir:** Siga o assistente de instalação. O atalho do **SisProva** será adicionado automaticamente à Área de Trabalho e ao Menu Iniciar.
5. **Persistência de Dados:** O banco SQLite é mantido em segurança no seu perfil de usuário em `%APPDATA%\AvaliadorApp\data.db`.

---

### 🍎 Guia de Instalação no macOS

O aplicativo para macOS é distribuído como **Universal Binary**, garantindo velocidade máxima tanto em Macs com chips **Apple Silicon (M1, M2, M3, M4)** quanto em computadores **Intel**.

1. **Baixar:** Acesse a aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases) e baixe o arquivo `SisProva_*.dmg`.
2. **Instalar:** Abra o arquivo `.dmg` com duplo clique e arraste o ícone do **SisProva** para a pasta **Aplicativos (Applications)**.
3. **Primeira Execução & Gatekeeper da Apple:**
   - Na primeira abertura, o macOS pode exibir um aviso de segurança.
   - Abra o **Finder** > pasta **Aplicativos**.
   - Clique com o **botão direito** (ou segure `Control` e clique) no **SisProva** e selecione **"Abrir"**.
   - Na caixa de diálogo de confirmação, clique em **"Abrir"**. (Esta confirmação é necessária apenas na primeira vez).
4. **Persistência de Dados:** Os dados locais são salvos em `~/Library/Application Support/com.avaliadorapp.desktop/data.db`.

---

### 🐧 Guia de Instalação no Linux

#### Opção 1: `.AppImage` (Universal — Todas as Distribuições)
1. Baixe o arquivo `SisProva_*.AppImage` na aba [Releases do GitHub](https://github.com/maromo71/sisprova/releases).
2. Dê permissão de execução:
   - **Pelo Terminal:** `chmod +x SisProva_*.AppImage && ./SisProva_*.AppImage`
   - **Pela Interface:** Botão direito no arquivo ➔ **Propriedades** ➔ aba **Permissões** ➔ marque **"Permitir execução do arquivo como um programa"**.
3. Dê um duplo clique para usar o aplicativo imediatamente.

#### Opção 2: `.deb` (Debian, Ubuntu, Linux Mint, Pop!_OS)
1. Baixe o pacote `SisProva_*_amd64.deb` nas [Releases](https://github.com/maromo71/sisprova/releases).
2. Instale com duplo clique pela Central de Programas ou via terminal:
   ```bash
   sudo apt install ./SisProva_*_amd64.deb
   ```
3. O atalho do SisProva aparecerá diretamente no seu menu de aplicativos.

---

## 🎯 Funcionalidades Principais em Detalhes

### 1. 📐 Montagem Tipográfica & Visualização A4
- **Editor Split-Pane Sincronizado:** Painel esquerdo com formulários dinâmicos e painel direito com renderização A4 contínua a 60 FPS com `useDeferredValue`.
- **Fórmulas e Matemática em LaTeX:** Suporte nativo a equações inline `$E = mc^2$` e em bloco `$$\int_{a}^{b} f(x) dx$$` com KaTeX integrado offline.
- **Diagramas de Fluxo e Engenharia:** Renderização client-side de diagramas Mermaid (fluxogramas, diagramas de classe, sequência, ER, etc.).
- **Código-Fonte Formatado:** Blocos de código com destaque sintático profissional para cursos de computação e exatas.
- **4 Modelos de Cabeçalho Institucional:**
  1. *Universitário / Padrão:* Completo com brasão, metadados e regras de aplicação.
  2. *Compacto / Econômico:* Reduz 60% do espaço vertical para economizar papel.
  3. *Vestibular / Concurso:* Solene com visto do fiscal e campos formais.
  4. *Mínimo / Simulado:* Linha única minimalista e limpa.
- **Pontuação Reativa em Tempo Real:** A nota total da avaliação é recalculada dinamicamente conforme você altera o valor de cada questão.

### 2. 🛡️ Segurança Pedagógica & Variações de Provas (Tipos A, B, C, D)
- **Embaralhamento Determinístico com Semente:** Embaralhe questões e/ou alternativas com o algoritmo **Mulberry32**, garantindo total reprodutibilidade.
- **Alternador de Prévia:** Alterne instantaneamente entre `[Tipo A]`, `[Tipo B]`, `[Tipo C]` e `[Tipo D]` na barra de ferramentas.
- **Folha de Gabaritos Consolidada do Professor:** Gera uma folha impressa comparativa lado a lado com todas as respostas cruzadas por versão e conferência estatística de balanceamento de alternativas (quantas questões deram A, B, C, D ou E).

### 3. 📋 Correção Ágil, Espelhos de Resposta e Folhas OMR
- **Padrão de Resposta / Versão Gabarito:** Alterne entre **"Versão do Aluno"** (com pautas limpas para resolução manual) e **"Versão Gabarito"** (onde a resposta esperada, critérios de pontuação e alternativas corretas são impressos para guiar a equipe de correção).
- **Folhas de Resposta Automáticas (Gabarito OMR):** Grade de bolhas padronizadas `(A) (B) (C) (D) (E)` gerada automaticamente com layouts:
  - *1 por página:* Para provas extensas de vestibular/concurso.
  - *2 por página:* Com linha de corte central tracejada (economia imediata de 50% de cópias).
  - *4 por página:* Quadrantes compactos para testes rápidos e simulados.
- **Máscara de Gabarito Perfurada:** Preenchimento com círculos pretos sólidos para correção rápida com gabarito vazado pelo professor.

### 4. 🗃️ Banco de Questões, Histórico & Interoperabilidade
- **Auditoria e Frequência de Questões:** Sistema inteligente de alertas pedagógicos:
  - `✨ Inéditas:` Questões novas nunca usadas em nenhuma prova.
  - `⚠️ Recentes (< 6 meses):` Alerta visual para prevenir repetição involuntária em turmas consecutivas ou dependências.
  - `📋 Já Utilizadas:` Histórico completo de em quais provas e turmas a questão foi aplicada.
- **Exportação Direta para PDF Nativo:** Gera arquivos PDF com 300 DPI equivalente, fatiamento multi-página inteligente e diálogo nativo do Windows/Mac/Linux.
- **Exportação para Word (.docx) e LaTeX (.tex):** Arquivos totalmente editáveis para compartilhamento departamental.
- **Importação/Exportação em Lote:** Importe ou exporte dezenas de questões de uma só vez utilizando formatos padronizados JSON ou Markdown.
- **Backup e Restauração em Arquivo Único (`.sisprova`):** Cópia de segurança atômica gerada com o comando seguro SQLite `VACUUM INTO`.

---

## 🏛️ Administração de TI & Deploy Corporativo (Windows)

Para laboratórios de informática, redes escolares e computadores institucionais gerenciados via **Active Directory (GPO)** ou **Microsoft Intune**, utilize o pacote Microsoft Installer [`AvaliadorApp_1.1.0_x64.msi`](installers/AvaliadorApp_1.1.0_x64.msi).

```cmd
:: Instalação silenciosa em massa (sem interface gráfica e sem reiniciar)
msiexec /i AvaliadorApp_1.1.0_x64.msi /quiet /qn /norestart

:: Instalação silenciosa gerando arquivo de log detalhado
msiexec /i AvaliadorApp_1.1.0_x64.msi /quiet /qn /norestart /L*V "C:\Logs\sisprova_install.log"

:: Desinstalação remota silenciosa
msiexec /x AvaliadorApp_1.1.0_x64.msi /quiet /qn /norestart
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Desktop Core** | [Tauri v2](https://v2.tauri.app/) | Framework nativo ultraleve com WebKit nativo do SO e consumo mínimo de memória RAM |
| **Backend Nativo** | Rust (Edição 2021) | Motor nativo de alta performance com `rusqlite` bundled, `serde` e plugins de sistema de arquivos |
| **Persistência** | SQLite local ACID | Banco de dados relacional embarcado com chaves estrangeiras ativas e integridade garantida |
| **Frontend** | React 19 + TypeScript | Interface reativa moderna com hooks de renderização concorrente |
| **Tipografia & Estilos** | Tailwind CSS + Lucide Icons | Design refinado, modo claro/escuro e regras estritas `@media print` para papel A4 |
| **Fórmulas e Notação** | KaTeX + Remark Math | Renderização matemática vetorial offline rápida e sem sobrecarga |
| **Diagramas** | Mermaid.js | Diagramação automatizada client-side para fluxogramas e estruturas lógicas |

---

## 🚀 Ambiente de Desenvolvimento

Caso deseje clonar o projeto e compilar o código-fonte por conta própria:

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Rust & Cargo](https://rustup.rs/) (versão 1.75 ou superior)

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/maromo71/sisprova.git
cd sisprova
npm install
```

### 2. Executar em Modo de Desenvolvimento
```bash
npm run tauri dev
```

### 3. Compilar os Binários de Produção
```bash
npm run tauri build
```
Os executáveis e instaladores finais serão gerados automaticamente na pasta `src-tauri/target/release/bundle/`.

---

## 🤖 Compilação Automatizada na Nuvem (CI/CD)

O repositório possui fluxos de trabalho no **GitHub Actions** para compilar automaticamente os instaladores para todas as plataformas:

- **macOS (.dmg Universal):** [`.github/workflows/build-mac.yml`](.github/workflows/build-mac.yml)
- **Linux (.AppImage e .deb):** [`.github/workflows/build-linux.yml`](.github/workflows/build-linux.yml)

---

## 📚 Documentação Técnica Adicional

- 📖 [**Especificação Técnica do Software (ESPECIFICACAO.md)**](file:///c:/sisprova/ESPECIFICACAO.md): Arquitetura interna, modelo relacional ERD, dicionário de tabelas SQLite e requisitos funcionais.
- 💡 [**Catálogo de Melhorias e Roadmap (PROPOSTAS_DE_MELHORIAS.md)**](file:///c:/sisprova/PROPOSTAS_DE_MELHORIAS.md): Histórico completo de ciclos implementados e planejamento evolutivo.

---

## 📄 Licença

Este projeto é um software acadêmico livre distribuído sob os termos da **[Licença MIT](LICENSE)**.
