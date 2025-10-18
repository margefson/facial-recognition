#!/bin/bash

# Script de Restauração do MongoDB
# Sistema de Reconhecimento Facial
# Criado em: $(date)

# Configurações
DB_NAME="facial_recognition"
BACKUP_DIR="/home/ubuntu/facial-recognition-app/backups"
LOG_FILE="/home/ubuntu/facial-recognition-app/logs/restore.log"

# Criar diretório de logs se não existir
mkdir -p "$(dirname "$LOG_FILE")"

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para exibir uso
show_usage() {
    echo "Uso: $0 [OPÇÕES] [ARQUIVO_BACKUP]"
    echo ""
    echo "Opções:"
    echo "  -l, --list          Listar backups disponíveis"
    echo "  -i, --interactive   Modo interativo para seleção de backup"
    echo "  -f, --force         Forçar restauração sem confirmação"
    echo "  -h, --help          Exibir esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 --list"
    echo "  $0 --interactive"
    echo "  $0 backup_facial_recognition_20240918_120000.tar.gz"
    echo "  $0 --force backup_facial_recognition_20240918_120000.tar.gz"
}

# Função para listar backups disponíveis
list_backups() {
    log "Listando backups disponíveis"
    
    local backups=($(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "Nenhum backup encontrado em $BACKUP_DIR"
        return 1
    fi
    
    echo "Backups disponíveis:"
    echo "===================="
    
    for i in "${!backups[@]}"; do
        local backup="${backups[$i]}"
        local filename=$(basename "$backup")
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        
        printf "%2d. %-50s %8s %s\n" $((i+1)) "$filename" "$size" "$date"
    done
    
    echo "===================="
    echo "Total: ${#backups[@]} backup(s)"
}

# Função para seleção interativa
interactive_selection() {
    local backups=($(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "Nenhum backup encontrado em $BACKUP_DIR"
        return 1
    fi
    
    list_backups
    echo ""
    
    while true; do
        read -p "Selecione o número do backup (1-${#backups[@]}) ou 'q' para sair: " choice
        
        if [ "$choice" = "q" ] || [ "$choice" = "Q" ]; then
            echo "Operação cancelada"
            return 1
        fi
        
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#backups[@]} ]; then
            local selected_backup="${backups[$((choice-1))]}"
            echo "Backup selecionado: $(basename "$selected_backup")"
            
            if confirm_restore; then
                restore_backup "$selected_backup"
                return $?
            else
                return 1
            fi
        else
            echo "Seleção inválida. Digite um número entre 1 e ${#backups[@]} ou 'q' para sair."
        fi
    done
}

# Função para confirmar restauração
confirm_restore() {
    echo ""
    echo "ATENÇÃO: Esta operação irá:"
    echo "1. Parar a aplicação (se estiver rodando)"
    echo "2. Remover todos os dados atuais do banco '$DB_NAME'"
    echo "3. Restaurar os dados do backup selecionado"
    echo ""
    
    while true; do
        read -p "Tem certeza que deseja continuar? (sim/não): " confirm
        case $confirm in
            [Ss]im|[Ss]|[Yy]es|[Yy])
                return 0
                ;;
            [Nn]ão|[Nn]ao|[Nn]|[Nn]o)
                echo "Operação cancelada"
                return 1
                ;;
            *)
                echo "Digite 'sim' ou 'não'"
                ;;
        esac
    done
}

# Função para verificar se MongoDB está rodando
check_mongodb() {
    if ! pgrep mongod > /dev/null; then
        log "AVISO: MongoDB não está rodando"
        return 1
    fi
    
    log "MongoDB está rodando"
    return 0
}

# Função para parar aplicação
stop_application() {
    log "Verificando se a aplicação está rodando"
    
    local app_pid=$(pgrep -f "node.*server.js")
    if [ ! -z "$app_pid" ]; then
        log "Parando aplicação (PID: $app_pid)"
        kill "$app_pid"
        sleep 3
        
        # Verificar se parou
        if pgrep -f "node.*server.js" > /dev/null; then
            log "Forçando parada da aplicação"
            pkill -9 -f "node.*server.js"
        fi
        
        log "Aplicação parada"
    else
        log "Aplicação não está rodando"
    fi
}

# Função para iniciar aplicação
start_application() {
    log "Iniciando aplicação"
    
    cd /home/ubuntu/facial-recognition-app
    nohup node server.js > /dev/null 2>&1 &
    
    sleep 3
    
    if pgrep -f "node.*server.js" > /dev/null; then
        log "Aplicação iniciada com sucesso"
        return 0
    else
        log "ERRO: Falha ao iniciar aplicação"
        return 1
    fi
}

# Função para realizar restauração
restore_backup() {
    local backup_file="$1"
    local temp_dir="/tmp/restore_$$"
    
    log "=== INICIANDO RESTAURAÇÃO ==="
    log "Backup: $(basename "$backup_file")"
    
    # Verificar se arquivo existe
    if [ ! -f "$backup_file" ]; then
        log "ERRO: Arquivo de backup não encontrado: $backup_file"
        return 1
    fi
    
    # Verificar integridade do backup
    log "Verificando integridade do backup"
    if ! tar -tzf "$backup_file" > /dev/null 2>&1; then
        log "ERRO: Backup corrompido ou inválido"
        return 1
    fi
    
    # Verificar MongoDB
    if ! check_mongodb; then
        log "ERRO: MongoDB deve estar rodando para restauração"
        return 1
    fi
    
    # Parar aplicação
    stop_application
    
    # Criar diretório temporário
    mkdir -p "$temp_dir"
    
    # Extrair backup
    log "Extraindo backup"
    if ! tar -xzf "$backup_file" -C "$temp_dir"; then
        log "ERRO: Falha ao extrair backup"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Encontrar diretório do banco
    local db_dir=$(find "$temp_dir" -name "$DB_NAME" -type d | head -1)
    if [ -z "$db_dir" ]; then
        log "ERRO: Banco '$DB_NAME' não encontrado no backup"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Remover banco atual
    log "Removendo dados atuais do banco '$DB_NAME'"
    mongo "$DB_NAME" --eval "db.dropDatabase()" --quiet
    
    # Restaurar backup
    log "Restaurando dados do backup"
    if mongorestore --db "$DB_NAME" "$db_dir" --quiet; then
        log "Restauração concluída com sucesso"
        
        # Verificar dados restaurados
        local user_count=$(mongo "$DB_NAME" --eval "db.users.count()" --quiet)
        local attendance_count=$(mongo "$DB_NAME" --eval "db.attendances.count()" --quiet)
        
        log "Dados restaurados:"
        log "- Usuários: $user_count"
        log "- Presenças: $attendance_count"
        
        # Limpar diretório temporário
        rm -rf "$temp_dir"
        
        # Reiniciar aplicação
        start_application
        
        log "=== RESTAURAÇÃO CONCLUÍDA COM SUCESSO ==="
        return 0
    else
        log "ERRO: Falha na restauração com mongorestore"
        rm -rf "$temp_dir"
        
        # Tentar reiniciar aplicação mesmo com erro
        start_application
        
        return 1
    fi
}

# Função principal
main() {
    local force_mode=false
    local interactive_mode=false
    local backup_file=""
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--list)
                list_backups
                exit $?
                ;;
            -i|--interactive)
                interactive_mode=true
                shift
                ;;
            -f|--force)
                force_mode=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                echo "Opção desconhecida: $1"
                show_usage
                exit 1
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    # Modo interativo
    if [ "$interactive_mode" = true ]; then
        interactive_selection
        exit $?
    fi
    
    # Verificar se arquivo foi especificado
    if [ -z "$backup_file" ]; then
        echo "Erro: Arquivo de backup não especificado"
        echo ""
        show_usage
        exit 1
    fi
    
    # Verificar se arquivo existe (com e sem caminho completo)
    if [ ! -f "$backup_file" ] && [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        echo "Erro: Arquivo de backup não encontrado: $backup_file"
        echo ""
        echo "Use '$0 --list' para ver backups disponíveis"
        exit 1
    fi
    
    # Usar caminho completo se necessário
    if [ ! -f "$backup_file" ]; then
        backup_file="$BACKUP_DIR/$backup_file"
    fi
    
    # Confirmar restauração (a menos que force_mode esteja ativo)
    if [ "$force_mode" = false ]; then
        echo "Arquivo selecionado: $(basename "$backup_file")"
        if ! confirm_restore; then
            exit 1
        fi
    fi
    
    # Realizar restauração
    restore_backup "$backup_file"
    exit $?
}

# Verificar se o script está sendo executado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi

