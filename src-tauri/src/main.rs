// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;

use db::{initialize_database, resolve_db_path, DbState};
use std::sync::Mutex;

fn main() {
    let db_path = resolve_db_path();
    let conn = match initialize_database(&db_path) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Erro ao inicializar banco de dados SQLite em {:?}: {}", db_path, e);
            panic!("Falha crítica de persistência SQLite: {}", e);
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(DbState(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            commands::get_instituicoes,
            commands::save_instituicao,
            commands::delete_instituicao,
            commands::get_disciplinas,
            commands::save_disciplina,
            commands::delete_disciplina,
            commands::get_questoes,
            commands::get_questao,
            commands::save_questao,
            commands::delete_questao,
            commands::get_avaliacoes,
            commands::get_avaliacao_detalhe,
            commands::save_avaliacao,
            commands::delete_avaliacao,
            commands::get_db_path,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao inicializar o motor desktop Tauri");
}
