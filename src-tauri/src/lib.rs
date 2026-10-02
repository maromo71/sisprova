mod commands;
mod db;

use db::DbState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let db_path = db::resolve_db_path_with_app(app.handle());
            let conn = match db::initialize_database(&db_path) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Erro ao inicializar banco de dados SQLite em {:?}: {}", db_path, e);
                    return Err(format!("Falha crítica de persistência SQLite: {}", e).into());
                }
            };
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
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
            commands::clone_avaliacao,
            commands::get_db_path,
            commands::save_pdf_dialog,
            commands::write_binary_file,
            commands::save_questoes_lote,
            commands::export_backup_dialog,
            commands::import_backup_dialog,
            commands::save_text_file_dialog,
            commands::pick_text_file_dialog,
            commands::write_text_file,
            commands::read_text_file,
            commands::get_questoes_estatisticas_uso,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao inicializar o motor Tauri");
}
