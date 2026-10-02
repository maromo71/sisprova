use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

pub fn resolve_db_path() -> PathBuf {
    if let Ok(app_data) = std::env::var("APPDATA") {
        PathBuf::from(app_data).join("AvaliadorApp").join("data.db")
    } else if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
        PathBuf::from(home)
            .join(".avaliadorapp")
            .join("data.db")
    } else {
        PathBuf::from("data.db")
    }
}

pub fn initialize_database(db_path: &Path) -> Result<Connection, rusqlite::Error> {
    if let Some(parent) = db_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let conn = Connection::open(db_path)?;

    // Configurações de integridade e desempenho
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;",
    )?;

    // Migrações do esquema relacional
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS instituicao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            sigla TEXT,
            logo_base64 TEXT
        );

        CREATE TABLE IF NOT EXISTS disciplina (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instituicao_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            codigo TEXT,
            FOREIGN KEY (instituicao_id) REFERENCES instituicao(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS questao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disciplina_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            enunciado_markdown TEXT NOT NULL,
            diagrama_mermaid TEXT,
            grau_dificuldade TEXT CHECK(grau_dificuldade IN ('FACIL', 'MEDIO', 'DIFICIL')) DEFAULT 'MEDIO',
            tipo_questao TEXT CHECK(tipo_questao IN ('DISSERTATIVA', 'OBJETIVA', 'CODIGO')) DEFAULT 'DISSERTATIVA',
            linhas_resposta INTEGER DEFAULT 6,
            resposta_esperada TEXT,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (disciplina_id) REFERENCES disciplina(id)
        );

        CREATE TABLE IF NOT EXISTS alternativa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            questao_id INTEGER NOT NULL,
            texto TEXT NOT NULL,
            correta BOOLEAN NOT NULL DEFAULT 0,
            FOREIGN KEY (questao_id) REFERENCES questao(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS avaliacao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disciplina_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            instrucoes TEXT,
            data_aplicacao DATE,
            peso_total REAL DEFAULT 10.0,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (disciplina_id) REFERENCES disciplina(id)
        );

        CREATE TABLE IF NOT EXISTS avaliacao_item (
            avaliacao_id INTEGER NOT NULL,
            questao_id INTEGER NOT NULL,
            ordem INTEGER NOT NULL,
            valor_pontuacao REAL NOT NULL,
            PRIMARY KEY (avaliacao_id, questao_id),
            FOREIGN KEY (avaliacao_id) REFERENCES avaliacao(id) ON DELETE CASCADE,
            FOREIGN KEY (questao_id) REFERENCES questao(id)
        );
        ",
    )?;

    // Migração de compatibilidade retroativa: adiciona resposta_esperada em bancos existentes
    {
        let mut stmt = conn.prepare("PRAGMA table_info(questao)")?;
        let mut has_resposta_esperada = false;
        let col_rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
        for col in col_rows {
            if let Ok(name) = col {
                if name == "resposta_esperada" {
                    has_resposta_esperada = true;
                    break;
                }
            }
        }
        if !has_resposta_esperada {
            let _ = conn.execute("ALTER TABLE questao ADD COLUMN resposta_esperada TEXT", []);
        }
    }

    // Inserção de dados iniciais caso a tabela de instituições esteja vazia
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM instituicao", [], |row| row.get(0))?;

    if count == 0 {
        conn.execute(
            "INSERT INTO instituicao (id, nome, sigla, logo_base64) VALUES (?1, ?2, ?3, ?4)",
            params![
                1,
                "Universidade Tecnológica Federal / Departamento Acadêmico",
                "UTF",
                ""
            ],
        )?;

        conn.execute(
            "INSERT INTO disciplina (id, instituicao_id, nome, codigo) VALUES (?1, ?2, ?3, ?4)",
            params![1, 1, "Algoritmos e Estruturas de Dados", "CC201"],
        )?;

        // Exemplo inicial de questão de código/matemática para demonstração instantânea
        conn.execute(
            "INSERT INTO questao (id, disciplina_id, titulo, enunciado_markdown, diagrama_mermaid, grau_dificuldade, tipo_questao, linhas_resposta)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                1,
                1,
                "Complexidade Assintótica e Teorema Mestre",
                "Analise a equação de recorrência $T(n) = 2T(n/2) + O(n)$.\n\n1. Encontre a complexidade assintótica utilizando o **Teorema Mestre**.\n2. Demonstre os passos matemáticos sabendo que $c = \\log_b a$.\n\n```python\ndef merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\n```",
                "graph TD\n    A[Problema T(n)] --> B[Subproblema T(n/2)]\n    A --> C[Subproblema T(n/2)]\n    B --> D[Base O(1)]\n    B --> E[Base O(1)]\n    C --> F[Base O(1)]\n    C --> G[Base O(1)]",
                "MEDIO",
                "DISSERTATIVA",
                8
            ],
        )?;
    }

    Ok(conn)
}
