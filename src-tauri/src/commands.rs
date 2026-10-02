use crate::db::DbState;
use rusqlite::{params, Connection, Transaction};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

// ==========================================
// MODELOS DE DADOS
// ==========================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Instituicao {
    pub id: i64,
    pub nome: String,
    pub sigla: Option<String>,
    pub logo_base64: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstituicaoInput {
    pub id: Option<i64>,
    pub nome: String,
    pub sigla: Option<String>,
    pub logo_base64: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Disciplina {
    pub id: i64,
    pub instituicao_id: i64,
    pub nome: String,
    pub codigo: Option<String>,
    pub instituicao_nome: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DisciplinaInput {
    pub id: Option<i64>,
    pub instituicao_id: i64,
    pub nome: String,
    pub codigo: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Alternativa {
    pub id: i64,
    pub questao_id: i64,
    pub texto: String,
    pub correta: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AlternativaInput {
    pub id: Option<i64>,
    pub texto: String,
    pub correta: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuestaoCompleta {
    pub id: i64,
    pub disciplina_id: i64,
    pub disciplina_nome: Option<String>,
    pub titulo: String,
    pub enunciado_markdown: String,
    pub diagrama_mermaid: Option<String>,
    pub grau_dificuldade: String,
    pub tipo_questao: String,
    pub linhas_resposta: i64,
    pub resposta_esperada: Option<String>,
    pub criado_em: Option<String>,
    pub alternativas: Vec<Alternativa>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuestaoInput {
    pub id: Option<i64>,
    pub disciplina_id: i64,
    pub titulo: String,
    pub enunciado_markdown: String,
    pub diagrama_mermaid: Option<String>,
    pub grau_dificuldade: String,
    pub tipo_questao: String,
    pub linhas_resposta: i64,
    pub resposta_esperada: Option<String>,
    pub alternativas: Vec<AlternativaInput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuestaoUsoItem {
    pub avaliacao_id: i64,
    pub avaliacao_titulo: String,
    pub disciplina_nome: String,
    pub data_aplicacao: Option<String>,
    pub valor_pontuacao: f64,
    pub dias_atras: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuestaoEstatisticasUso {
    pub questao_id: i64,
    pub total_usos: usize,
    pub ultima_aplicacao: Option<String>,
    pub dias_desde_ultima_aplicacao: Option<i64>,
    pub usada_recentemente: bool,
    pub historico: Vec<QuestaoUsoItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AvaliacaoItemInput {
    pub questao_id: i64,
    pub ordem: i64,
    pub valor_pontuacao: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AvaliacaoItemDetalhe {
    pub avaliacao_id: i64,
    pub questao_id: i64,
    pub ordem: i64,
    pub valor_pontuacao: f64,
    pub questao: QuestaoCompleta,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvaliacaoInput {
    pub id: Option<i64>,
    pub disciplina_id: i64,
    pub titulo: String,
    pub instrucoes: Option<String>,
    pub data_aplicacao: Option<String>,
    pub peso_total: f64,
    pub itens: Vec<AvaliacaoItemInput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AvaliacaoResumo {
    pub id: i64,
    pub disciplina_id: i64,
    pub disciplina_nome: String,
    pub instituicao_nome: String,
    pub titulo: String,
    pub instrucoes: Option<String>,
    pub data_aplicacao: Option<String>,
    pub peso_total: f64,
    pub total_questoes: i64,
    pub criado_em: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AvaliacaoDetalhe {
    pub id: i64,
    pub disciplina_id: i64,
    pub disciplina_nome: String,
    pub disciplina_codigo: Option<String>,
    pub instituicao_id: i64,
    pub instituicao_nome: String,
    pub instituicao_sigla: Option<String>,
    pub instituicao_logo_base64: Option<String>,
    pub titulo: String,
    pub instrucoes: Option<String>,
    pub data_aplicacao: Option<String>,
    pub peso_total: f64,
    pub criado_em: Option<String>,
    pub itens: Vec<AvaliacaoItemDetalhe>,
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

fn carregar_alternativas_questao(
    conn: &Connection,
    questao_id: i64,
) -> Result<Vec<Alternativa>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, questao_id, texto, correta FROM alternativa WHERE questao_id = ?1 ORDER BY id ASC",
    )?;
    let rows = stmt.query_map(params![questao_id], |row| {
        let correta_int: i64 = row.get(3)?;
        Ok(Alternativa {
            id: row.get(0)?,
            questao_id: row.get(1)?,
            texto: row.get(2)?,
            correta: correta_int == 1,
        })
    })?;

    let mut result = Vec::new();
    for r in rows {
        result.push(r?);
    }
    Ok(result)
}

fn carregar_questao_por_id(conn: &Connection, id: i64) -> Result<QuestaoCompleta, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT q.id, q.disciplina_id, q.titulo, q.enunciado_markdown, q.diagrama_mermaid,
                q.grau_dificuldade, q.tipo_questao, q.linhas_resposta, q.resposta_esperada, q.criado_em,
                d.nome as disciplina_nome
         FROM questao q
         LEFT JOIN disciplina d ON d.id = q.disciplina_id
         WHERE q.id = ?1",
    )?;

    let mut questao = stmt.query_row(params![id], |row| {
        Ok(QuestaoCompleta {
            id: row.get(0)?,
            disciplina_id: row.get(1)?,
            titulo: row.get(2)?,
            enunciado_markdown: row.get(3)?,
            diagrama_mermaid: row.get(4)?,
            grau_dificuldade: row.get(5)?,
            tipo_questao: row.get(6)?,
            linhas_resposta: row.get(7)?,
            resposta_esperada: row.get(8)?,
            criado_em: row.get(9)?,
            disciplina_nome: row.get(10)?,
            alternativas: Vec::new(),
        })
    })?;

    questao.alternativas = carregar_alternativas_questao(conn, questao.id)?;
    Ok(questao)
}

// ==========================================
// INSTITUIÇÃO IPC COMMANDS
// ==========================================

#[tauri::command]
pub fn get_instituicoes(state: State<'_, DbState>) -> Result<Vec<Instituicao>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, nome, sigla, logo_base64 FROM instituicao ORDER BY nome ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Instituicao {
                id: row.get(0)?,
                nome: row.get(1)?,
                sigla: row.get(2)?,
                logo_base64: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn save_instituicao(
    state: State<'_, DbState>,
    instituicao: InstituicaoInput,
) -> Result<Instituicao, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    if let Some(id) = instituicao.id {
        conn.execute(
            "UPDATE instituicao SET nome = ?1, sigla = ?2, logo_base64 = ?3 WHERE id = ?4",
            params![
                instituicao.nome,
                instituicao.sigla,
                instituicao.logo_base64,
                id
            ],
        )
        .map_err(|e| e.to_string())?;

        Ok(Instituicao {
            id,
            nome: instituicao.nome,
            sigla: instituicao.sigla,
            logo_base64: instituicao.logo_base64,
        })
    } else {
        conn.execute(
            "INSERT INTO instituicao (nome, sigla, logo_base64) VALUES (?1, ?2, ?3)",
            params![
                instituicao.nome,
                instituicao.sigla,
                instituicao.logo_base64
            ],
        )
        .map_err(|e| e.to_string())?;

        let id = conn.last_insert_rowid();
        Ok(Instituicao {
            id,
            nome: instituicao.nome,
            sigla: instituicao.sigla,
            logo_base64: instituicao.logo_base64,
        })
    }
}

#[tauri::command]
pub fn delete_instituicao(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM instituicao WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ==========================================
// DISCIPLINA IPC COMMANDS
// ==========================================

#[tauri::command]
pub fn get_disciplinas(
    state: State<'_, DbState>,
    instituicao_id: Option<i64>,
) -> Result<Vec<Disciplina>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let mapper = |row: &rusqlite::Row| {
        Ok(Disciplina {
            id: row.get(0)?,
            instituicao_id: row.get(1)?,
            nome: row.get(2)?,
            codigo: row.get(3)?,
            instituicao_nome: row.get(4)?,
        })
    };

    let sql = "SELECT d.id, d.instituicao_id, d.nome, d.codigo, i.nome as instituicao_nome
               FROM disciplina d
               JOIN instituicao i ON i.id = d.instituicao_id";

    let mut list = Vec::new();
    if let Some(iid) = instituicao_id {
        let mut stmt = conn
            .prepare(&format!("{} WHERE d.instituicao_id = ?1 ORDER BY d.nome ASC", sql))
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![iid], mapper).map_err(|e| e.to_string())?;
        for r in rows {
            list.push(r.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn
            .prepare(&format!("{} ORDER BY d.nome ASC", sql))
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], mapper).map_err(|e| e.to_string())?;
        for r in rows {
            list.push(r.map_err(|e| e.to_string())?);
        }
    }

    Ok(list)
}

#[tauri::command]
pub fn save_disciplina(
    state: State<'_, DbState>,
    disciplina: DisciplinaInput,
) -> Result<Disciplina, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    if let Some(id) = disciplina.id {
        conn.execute(
            "UPDATE disciplina SET instituicao_id = ?1, nome = ?2, codigo = ?3 WHERE id = ?4",
            params![
                disciplina.instituicao_id,
                disciplina.nome,
                disciplina.codigo,
                id
            ],
        )
        .map_err(|e| e.to_string())?;

        let inst_nome: Option<String> = conn
            .query_row(
                "SELECT nome FROM instituicao WHERE id = ?1",
                params![disciplina.instituicao_id],
                |r| r.get(0),
            )
            .ok();

        Ok(Disciplina {
            id,
            instituicao_id: disciplina.instituicao_id,
            nome: disciplina.nome,
            codigo: disciplina.codigo,
            instituicao_nome: inst_nome,
        })
    } else {
        conn.execute(
            "INSERT INTO disciplina (instituicao_id, nome, codigo) VALUES (?1, ?2, ?3)",
            params![
                disciplina.instituicao_id,
                disciplina.nome,
                disciplina.codigo
            ],
        )
        .map_err(|e| e.to_string())?;

        let id = conn.last_insert_rowid();
        let inst_nome: Option<String> = conn
            .query_row(
                "SELECT nome FROM instituicao WHERE id = ?1",
                params![disciplina.instituicao_id],
                |r| r.get(0),
            )
            .ok();

        Ok(Disciplina {
            id,
            instituicao_id: disciplina.instituicao_id,
            nome: disciplina.nome,
            codigo: disciplina.codigo,
            instituicao_nome: inst_nome,
        })
    }
}

#[tauri::command]
pub fn delete_disciplina(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM disciplina WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ==========================================
// QUESTÕES IPC COMMANDS
// ==========================================

#[tauri::command]
pub fn get_questoes(
    state: State<'_, DbState>,
    disciplina_id: Option<i64>,
) -> Result<Vec<QuestaoCompleta>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let mapper = |row: &rusqlite::Row| {
        Ok(QuestaoCompleta {
            id: row.get(0)?,
            disciplina_id: row.get(1)?,
            titulo: row.get(2)?,
            enunciado_markdown: row.get(3)?,
            diagrama_mermaid: row.get(4)?,
            grau_dificuldade: row.get(5)?,
            tipo_questao: row.get(6)?,
            linhas_resposta: row.get(7)?,
            resposta_esperada: row.get(8)?,
            criado_em: row.get(9)?,
            disciplina_nome: row.get(10)?,
            alternativas: Vec::new(),
        })
    };

    let sql = "SELECT q.id, q.disciplina_id, q.titulo, q.enunciado_markdown, q.diagrama_mermaid,
                      q.grau_dificuldade, q.tipo_questao, q.linhas_resposta, q.resposta_esperada, q.criado_em,
                      d.nome as disciplina_nome
               FROM questao q
               LEFT JOIN disciplina d ON d.id = q.disciplina_id";

    let mut questoes = Vec::new();
    if let Some(did) = disciplina_id {
        let mut stmt = conn
            .prepare(&format!("{} WHERE q.disciplina_id = ?1 ORDER BY q.id DESC", sql))
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![did], mapper).map_err(|e| e.to_string())?;
        for item in rows {
            let mut q = item.map_err(|e| e.to_string())?;
            q.alternativas = carregar_alternativas_questao(&conn, q.id).map_err(|e| e.to_string())?;
            questoes.push(q);
        }
    } else {
        let mut stmt = conn
            .prepare(&format!("{} ORDER BY q.id DESC", sql))
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], mapper).map_err(|e| e.to_string())?;
        for item in rows {
            let mut q = item.map_err(|e| e.to_string())?;
            q.alternativas = carregar_alternativas_questao(&conn, q.id).map_err(|e| e.to_string())?;
            questoes.push(q);
        }
    }

    Ok(questoes)
}

#[tauri::command]
pub fn get_questao(state: State<'_, DbState>, id: i64) -> Result<QuestaoCompleta, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    carregar_questao_por_id(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_questao(
    state: State<'_, DbState>,
    questao: QuestaoInput,
) -> Result<QuestaoCompleta, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let questao_id = if let Some(id) = questao.id {
        tx.execute(
            "UPDATE questao
             SET disciplina_id = ?1, titulo = ?2, enunciado_markdown = ?3, diagrama_mermaid = ?4,
                 grau_dificuldade = ?5, tipo_questao = ?6, linhas_resposta = ?7, resposta_esperada = ?8
             WHERE id = ?9",
            params![
                questao.disciplina_id,
                questao.titulo,
                questao.enunciado_markdown,
                questao.diagrama_mermaid,
                questao.grau_dificuldade,
                questao.tipo_questao,
                questao.linhas_resposta,
                questao.resposta_esperada,
                id
            ],
        )
        .map_err(|e| e.to_string())?;

        // Remove alternativas antigas para reinserir atualizadas
        tx.execute(
            "DELETE FROM alternativa WHERE questao_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;

        id
    } else {
        tx.execute(
            "INSERT INTO questao (disciplina_id, titulo, enunciado_markdown, diagrama_mermaid,
                                  grau_dificuldade, tipo_questao, linhas_resposta, resposta_esperada)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                questao.disciplina_id,
                questao.titulo,
                questao.enunciado_markdown,
                questao.diagrama_mermaid,
                questao.grau_dificuldade,
                questao.tipo_questao,
                questao.linhas_resposta,
                questao.resposta_esperada
            ],
        )
        .map_err(|e| e.to_string())?;

        tx.last_insert_rowid()
    };

    // Insere alternativas se a questão for objetiva
    if questao.tipo_questao == "OBJETIVA" {
        for alt in questao.alternativas {
            tx.execute(
                "INSERT INTO alternativa (questao_id, texto, correta) VALUES (?1, ?2, ?3)",
                params![questao_id, alt.texto, if alt.correta { 1 } else { 0 }],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    carregar_questao_por_id(&conn, questao_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_questao(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM questao WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ==========================================
// AVALIAÇÕES IPC COMMANDS
// ==========================================

#[tauri::command]
pub fn get_avaliacoes(state: State<'_, DbState>) -> Result<Vec<AvaliacaoResumo>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT a.id, a.disciplina_id, d.nome as disciplina_nome, i.nome as instituicao_nome,
                    a.titulo, a.instrucoes, a.data_aplicacao, a.peso_total, a.criado_em,
                    (SELECT COUNT(*) FROM avaliacao_item ai WHERE ai.avaliacao_id = a.id) as total_questoes
             FROM avaliacao a
             JOIN disciplina d ON d.id = a.disciplina_id
             JOIN instituicao i ON i.id = d.instituicao_id
             ORDER BY a.id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AvaliacaoResumo {
                id: row.get(0)?,
                disciplina_id: row.get(1)?,
                disciplina_nome: row.get(2)?,
                instituicao_nome: row.get(3)?,
                titulo: row.get(4)?,
                instrucoes: row.get(5)?,
                data_aplicacao: row.get(6)?,
                peso_total: row.get(7)?,
                criado_em: row.get(8)?,
                total_questoes: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

fn carregar_avaliacao_detalhe_interna(
    conn: &Connection,
    avaliacao_id: i64,
) -> Result<AvaliacaoDetalhe, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT a.id, a.disciplina_id, d.nome as disciplina_nome, d.codigo as disciplina_codigo,
                i.id as instituicao_id, i.nome as instituicao_nome, i.sigla as instituicao_sigla, i.logo_base64 as instituicao_logo_base64,
                a.titulo, a.instrucoes, a.data_aplicacao, a.peso_total, a.criado_em
         FROM avaliacao a
         JOIN disciplina d ON d.id = a.disciplina_id
         JOIN instituicao i ON i.id = d.instituicao_id
         WHERE a.id = ?1",
    )?;

    let mut header = stmt.query_row(params![avaliacao_id], |row| {
        Ok(AvaliacaoDetalhe {
            id: row.get(0)?,
            disciplina_id: row.get(1)?,
            disciplina_nome: row.get(2)?,
            disciplina_codigo: row.get(3)?,
            instituicao_id: row.get(4)?,
            instituicao_nome: row.get(5)?,
            instituicao_sigla: row.get(6)?,
            instituicao_logo_base64: row.get(7)?,
            titulo: row.get(8)?,
            instrucoes: row.get(9)?,
            data_aplicacao: row.get(10)?,
            peso_total: row.get(11)?,
            criado_em: row.get(12)?,
            itens: Vec::new(),
        })
    })?;

    let mut item_stmt = conn.prepare(
        "SELECT avaliacao_id, questao_id, ordem, valor_pontuacao
         FROM avaliacao_item
         WHERE avaliacao_id = ?1
         ORDER BY ordem ASC",
    )?;

    let item_rows = item_stmt.query_map(params![avaliacao_id], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, f64>(3)?,
        ))
    })?;

    for item in item_rows {
        let (aid, qid, ordem, pontuacao) = item?;
        if let Ok(questao) = carregar_questao_por_id(conn, qid) {
            header.itens.push(AvaliacaoItemDetalhe {
                avaliacao_id: aid,
                questao_id: qid,
                ordem,
                valor_pontuacao: pontuacao,
                questao,
            });
        }
    }

    Ok(header)
}

#[tauri::command]
pub fn get_avaliacao_detalhe(
    state: State<'_, DbState>,
    id: i64,
) -> Result<AvaliacaoDetalhe, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    carregar_avaliacao_detalhe_interna(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_avaliacao(
    state: State<'_, DbState>,
    payload: AvaliacaoInput,
) -> Result<AvaliacaoDetalhe, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx: Transaction = conn.transaction().map_err(|e| e.to_string())?;

    let avaliacao_id = if let Some(id) = payload.id {
        tx.execute(
            "UPDATE avaliacao
             SET disciplina_id = ?1, titulo = ?2, instrucoes = ?3, data_aplicacao = ?4, peso_total = ?5
             WHERE id = ?6",
            params![
                payload.disciplina_id,
                payload.titulo,
                payload.instrucoes,
                payload.data_aplicacao,
                payload.peso_total,
                id
            ],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "DELETE FROM avaliacao_item WHERE avaliacao_id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;

        id
    } else {
        tx.execute(
            "INSERT INTO avaliacao (disciplina_id, titulo, instrucoes, data_aplicacao, peso_total)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                payload.disciplina_id,
                payload.titulo,
                payload.instrucoes,
                payload.data_aplicacao,
                payload.peso_total
            ],
        )
        .map_err(|e| e.to_string())?;

        tx.last_insert_rowid()
    };

    // Insere itens associados com ordem e pontuação
    for item in payload.itens {
        tx.execute(
            "INSERT INTO avaliacao_item (avaliacao_id, questao_id, ordem, valor_pontuacao)
             VALUES (?1, ?2, ?3, ?4)",
            params![avaliacao_id, item.questao_id, item.ordem, item.valor_pontuacao],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    carregar_avaliacao_detalhe_interna(&conn, avaliacao_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_avaliacao(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Exclui os vínculos de itens da avaliação. As questões no Banco de Questões permanecem 100% intactas.
    tx.execute("DELETE FROM avaliacao_item WHERE avaliacao_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM avaliacao WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clone_avaliacao(
    state: State<'_, DbState>,
    id: i64,
    novo_titulo: Option<String>,
) -> Result<AvaliacaoDetalhe, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Busca os metadados da avaliação de origem
    let (disciplina_id, titulo, instrucoes, data_aplicacao, peso_total): (
        i64,
        String,
        Option<String>,
        Option<String>,
        f64,
    ) = tx
        .query_row(
            "SELECT disciplina_id, titulo, instrucoes, data_aplicacao, peso_total FROM avaliacao WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .map_err(|e| format!("Avaliação não encontrada para duplicação: {}", e))?;

    let titulo_clonado = novo_titulo
        .filter(|t| !t.trim().is_empty())
        .unwrap_or_else(|| format!("Cópia de {}", titulo));

    // 2. Insere o novo registro de avaliação clonada
    tx.execute(
        "INSERT INTO avaliacao (disciplina_id, titulo, instrucoes, data_aplicacao, peso_total)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![disciplina_id, titulo_clonado, instrucoes, data_aplicacao, peso_total],
    )
    .map_err(|e| format!("Erro ao criar avaliação clonada: {}", e))?;

    let novo_avaliacao_id = tx.last_insert_rowid();

    // 3. Clona todos os itens associados mantendo ordem e pontuações originais.
    // As questões originais do Banco de Questões são apenas referenciadas (não duplicadas).
    tx.execute(
        "INSERT INTO avaliacao_item (avaliacao_id, questao_id, ordem, valor_pontuacao)
         SELECT ?1, questao_id, ordem, valor_pontuacao FROM avaliacao_item WHERE avaliacao_id = ?2",
        params![novo_avaliacao_id, id],
    )
    .map_err(|e| format!("Erro ao copiar itens da avaliação: {}", e))?;

    tx.commit().map_err(|e| e.to_string())?;

    // 4. Retorna a avaliação clonada completa
    carregar_avaliacao_detalhe_interna(&conn, novo_avaliacao_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_questoes_lote(
    state: State<'_, DbState>,
    questoes: Vec<QuestaoInput>,
) -> Result<usize, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Coleta todas as disciplinas cadastradas para validação segura de chave estrangeira
    let valid_disc_ids: Vec<i64> = {
        let mut stmt = tx.prepare("SELECT id FROM disciplina").map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| row.get(0)).map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect()
    };

    if valid_disc_ids.is_empty() {
        return Err("Nenhuma disciplina cadastrada no banco de dados. Cadastre ao menos uma disciplina antes de importar questões.".to_string());
    }

    let default_disc_id = valid_disc_ids[0];
    let mut total_inseridas = 0;

    for q in &questoes {
        let disc_id = if valid_disc_ids.contains(&q.disciplina_id) {
            q.disciplina_id
        } else {
            default_disc_id
        };

        tx.execute(
            "INSERT INTO questao (disciplina_id, titulo, enunciado_markdown, diagrama_mermaid, grau_dificuldade, tipo_questao, linhas_resposta, resposta_esperada)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                disc_id,
                q.titulo,
                q.enunciado_markdown,
                q.diagrama_mermaid,
                q.grau_dificuldade,
                q.tipo_questao,
                q.linhas_resposta,
                q.resposta_esperada,
            ],
        ).map_err(|e| format!("Erro ao inserir questão '{}': {}", q.titulo, e))?;

        let questao_id = tx.last_insert_rowid();

        for alt in &q.alternativas {
            tx.execute(
                "INSERT INTO alternativa (questao_id, texto, correta) VALUES (?1, ?2, ?3)",
                params![questao_id, alt.texto, alt.correta],
            ).map_err(|e| format!("Erro ao inserir alternativa: {}", e))?;
        }

        total_inseridas += 1;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(total_inseridas)
}

#[tauri::command]
pub fn export_backup_dialog(
    app: tauri::AppHandle,
    state: State<'_, DbState>,
    default_name: String,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let file_path = app
        .dialog()
        .file()
        .add_filter("Backup SisProva (*.sisprova)", &["sisprova", "db"])
        .set_file_name(&default_name)
        .blocking_save_file();

    if let Some(dest) = file_path {
        let dest_path = dest.to_string();
        // O SQLite VACUUM INTO exige que o arquivo destino não exista
        if std::path::Path::new(&dest_path).exists() {
            let _ = std::fs::remove_file(&dest_path);
        }
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute("VACUUM INTO ?1", params![dest_path])
            .map_err(|e| format!("Erro ao gerar backup com VACUUM: {}", e))?;
        return Ok(Some(dest_path));
    }

    Ok(None)
}

#[tauri::command]
pub fn import_backup_dialog(
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let file_path = app
        .dialog()
        .file()
        .add_filter("Backup SisProva (*.sisprova, *.db)", &["sisprova", "db"])
        .blocking_pick_file();

    if let Some(src) = file_path {
        let src_path = src.to_string();

        // 1. Validação prévia de integridade no arquivo selecionado
        {
            let test_conn = Connection::open_with_flags(
                &src_path,
                rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
            )
            .map_err(|e| format!("Arquivo de backup inválido ou ilegível: {}", e))?;

            let mut check_stmt = test_conn
                .prepare("PRAGMA quick_check")
                .map_err(|e| e.to_string())?;
            let status: String = check_stmt
                .query_row([], |r| r.get(0))
                .map_err(|e| e.to_string())?;
            if status != "ok" {
                return Err(format!(
                    "O arquivo de backup falhou no teste de integridade: {}",
                    status
                ));
            }

            let questao_count: Result<i64, _> = test_conn.query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='questao'",
                [],
                |r| r.get(0),
            );
            if questao_count.unwrap_or(0) == 0 {
                return Err(
                    "O arquivo selecionado não contém a estrutura do SisProva (tabela 'questao' ausente)."
                        .to_string(),
                );
            }
        }

        // 2. Libera o lock do arquivo no disco trocando temporariamente a conexão para in-memory
        let mut conn_guard = state.0.lock().map_err(|e| e.to_string())?;
        *conn_guard = Connection::open_in_memory().map_err(|e| e.to_string())?;

        let db_path = crate::db::resolve_db_path();

        // 3. Cria backup do arquivo atual caso exista
        if db_path.exists() {
            let backup_path = db_path.with_extension("db.bak");
            let _ = std::fs::copy(&db_path, &backup_path);
        }

        // 4. Copia o arquivo importado para a localização oficial
        std::fs::copy(&src_path, &db_path)
            .map_err(|e| format!("Erro ao restaurar arquivo de backup: {}", e))?;

        // 5. Inicializa a nova conexão oficial e roda eventuais migrações pendentes
        let new_conn = crate::db::initialize_database(&db_path)
            .map_err(|e| format!("Erro ao inicializar banco restaurado: {}", e))?;
        *conn_guard = new_conn;

        return Ok(Some(src_path));
    }

    Ok(None)
}

#[tauri::command]
pub fn save_text_file_dialog(
    app: tauri::AppHandle,
    default_name: String,
    filter_name: String,
    extensions: Vec<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let exts_str: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
    let file_path = app
        .dialog()
        .file()
        .add_filter(&filter_name, &exts_str)
        .set_file_name(&default_name)
        .blocking_save_file();

    Ok(file_path.map(|p| p.to_string()))
}

#[tauri::command]
pub fn pick_text_file_dialog(
    app: tauri::AppHandle,
    filter_name: String,
    extensions: Vec<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let exts_str: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
    let file_path = app
        .dialog()
        .file()
        .add_filter(&filter_name, &exts_str)
        .blocking_pick_file();

    Ok(file_path.map(|p| p.to_string()))
}

#[tauri::command]
pub fn write_text_file(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content.as_bytes())
        .map_err(|e| format!("Erro ao gravar arquivo de texto '{}': {}", file_path, e))?;
    Ok(())
}

#[tauri::command]
pub fn read_text_file(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Erro ao ler arquivo de texto '{}': {}", file_path, e))
}

#[tauri::command]
pub fn get_db_path() -> Result<String, String> {
    let path = crate::db::resolve_db_path();
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn save_pdf_dialog(app: tauri::AppHandle, default_name: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let file_path = app
        .dialog()
        .file()
        .add_filter("Documento PDF", &["pdf"])
        .set_file_name(&default_name)
        .blocking_save_file();

    Ok(file_path.map(|p| p.to_string()))
}

#[tauri::command]
pub fn write_binary_file(file_path: String, bytes: Vec<u8>) -> Result<(), String> {
    std::fs::write(&file_path, &bytes)
        .map_err(|e| format!("Erro ao gravar arquivo em '{}': {}", file_path, e))?;
    Ok(())
}

// ==========================================
// ESTATÍSTICAS E AUDITORIA DE USO (MELH-10)
// ==========================================

#[tauri::command]
pub fn get_questoes_estatisticas_uso(
    state: State<'_, DbState>,
) -> Result<HashMap<i64, QuestaoEstatisticasUso>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let sql = "SELECT 
                   ai.questao_id,
                   a.id as avaliacao_id,
                   a.titulo as avaliacao_titulo,
                   a.data_aplicacao,
                   ai.valor_pontuacao,
                   d.nome as disciplina_nome,
                   CAST((julianday('now') - julianday(COALESCE(a.data_aplicacao, a.criado_em))) AS INTEGER) as dias_atras
               FROM avaliacao_item ai
               JOIN avaliacao a ON a.id = ai.avaliacao_id
               JOIN disciplina d ON d.id = a.disciplina_id
               ORDER BY COALESCE(a.data_aplicacao, a.criado_em) DESC";

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let questao_id: i64 = row.get(0)?;
            let avaliacao_id: i64 = row.get(1)?;
            let avaliacao_titulo: String = row.get(2)?;
            let data_aplicacao: Option<String> = row.get(3)?;
            let valor_pontuacao: f64 = row.get(4)?;
            let disciplina_nome: String = row.get(5)?;
            let dias_atras: Option<i64> = row.get(6)?;

            Ok((
                questao_id,
                QuestaoUsoItem {
                    avaliacao_id,
                    avaliacao_titulo,
                    disciplina_nome,
                    data_aplicacao,
                    valor_pontuacao,
                    dias_atras,
                },
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut mapa: HashMap<i64, QuestaoEstatisticasUso> = HashMap::new();

    for item in rows {
        let (qid, uso) = item.map_err(|e| e.to_string())?;
        let entry = mapa.entry(qid).or_insert_with(|| QuestaoEstatisticasUso {
            questao_id: qid,
            total_usos: 0,
            ultima_aplicacao: None,
            dias_desde_ultima_aplicacao: None,
            usada_recentemente: false,
            historico: Vec::new(),
        });

        if entry.ultima_aplicacao.is_none() {
            entry.ultima_aplicacao = uso.data_aplicacao.clone();
            entry.dias_desde_ultima_aplicacao = uso.dias_atras;
            if let Some(dias) = uso.dias_atras {
                if dias <= 180 {
                    entry.usada_recentemente = true;
                }
            }
        }

        entry.total_usos += 1;
        entry.historico.push(uso);
    }

    Ok(mapa)
}
