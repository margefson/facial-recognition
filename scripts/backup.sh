#!/bin/bash

# Script de Backup Automático do MongoDB
# Sistema de Reconhecimento Facial
# Criado em: $(date)

# Configurações
DB_NAME="facial_recognition"
BACKUP_DIR="/home/ubuntu/facial-recognition-app/backups"
LOG_FILE="/home/ubuntu/facial-recognition-app/logs/backup.log"
RETENTION_DAYS=30
MAX_BACKUPS=50

# Criar diretórios se não existirem
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para enviar notificação (webhook opcional)
send_notification() {
    local status="$1"
    local message="$2"
    
    # Webhook URL (configurar se necessário)
    # WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    
    # if [ ! -z "$WEBHOOK_URL" ]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"Backup MongoDB [$status]: $message\"}" \
    #         "$WEBHOOK_URL" 2>/dev/null
    # fi
    
    log "Notificação: [$status] $message"
}

# Função para verificar espaço em disco
check_disk_space() {
    local required_space_mb=1000  # 1GB mínimo
    local available_space_mb=$(df "$BACKUP_DIR" | awk 'NR==2 {print int($4/1024)}')
    
    if [ "$available_space_mb" -lt "$required_space_mb" ]; then
        log "ERRO: Espaço insuficiente. Disponível: ${available_space_mb}MB, Necessário: ${required_space_mb}MB"
        send_notification "ERRO" "Espaço insuficiente para backup"
        return 1
    fi
    
    log "Espaço em disco verificado: ${available_space_mb}MB disponível"
    return 0
}

# Função para verificar se MongoDB está rodando
check_mongodb() {
    if ! pgrep mongod > /dev/null; then
        log "ERRO: MongoDB não está rodando"
        send_notification "ERRO" "MongoDB não está rodando"
        return 1
    fi
    
    log "MongoDB está rodando"
    return 0
}

# Função para realizar backup
perform_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="backup_${DB_NAME}_${timestamp}"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Iniciando backup: $backup_name"
    
    # Executar mongodump
    if mongodump --db "$DB_NAME" --out "$backup_path" --quiet; then
        log "Backup criado com sucesso: $backup_path"
        
        # Comprimir backup
        if tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR" "$backup_name"; then
            log "Backup comprimido: ${backup_path}.tar.gz"
            
            # Remover diretório não comprimido
            rm -rf "$backup_path"
            
            # Verificar integridade do arquivo comprimido
            if tar -tzf "${backup_path}.tar.gz" > /dev/null 2>&1; then
                log "Integridade do backup verificada"
                
                # Calcular tamanho do backup
                local backup_size=$(du -h "${backup_path}.tar.gz" | cut -f1)
                log "Tamanho do backup: $backup_size"
                
                send_notification "SUCESSO" "Backup criado com sucesso ($backup_size)"
                return 0
            else
                log "ERRO: Backup corrompido"
                rm -f "${backup_path}.tar.gz"
                send_notification "ERRO" "Backup corrompido"
                return 1
            fi
        else
            log "ERRO: Falha ao comprimir backup"
            rm -rf "$backup_path"
            send_notification "ERRO" "Falha ao comprimir backup"
            return 1
        fi
    else
        log "ERRO: Falha ao criar backup com mongodump"
        send_notification "ERRO" "Falha ao executar mongodump"
        return 1
    fi
}

# Função para limpar backups antigos
cleanup_old_backups() {
    log "Iniciando limpeza de backups antigos"
    
    # Remover backups mais antigos que RETENTION_DAYS
    find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Manter apenas os MAX_BACKUPS mais recentes
    local backup_count=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f | wc -l)
    
    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        local excess=$((backup_count - MAX_BACKUPS))
        find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f -printf '%T@ %p\n' | \
            sort -n | head -n "$excess" | cut -d' ' -f2- | xargs rm -f
        log "Removidos $excess backups antigos (mantendo $MAX_BACKUPS mais recentes)"
    fi
    
    # Listar backups restantes
    local remaining_backups=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f | wc -l)
    log "Backups restantes: $remaining_backups"
}

# Função para gerar relatório de status
generate_status_report() {
    local backup_count=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local last_backup=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    log "=== RELATÓRIO DE STATUS ==="
    log "Total de backups: $backup_count"
    log "Tamanho total: $total_size"
    
    if [ ! -z "$last_backup" ]; then
        local last_backup_date=$(stat -c %y "$last_backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        log "Último backup: $(basename "$last_backup") ($last_backup_date)"
    else
        log "Último backup: Nenhum backup encontrado"
    fi
    
    log "=========================="
}

# Função principal
main() {
    log "=== INICIANDO PROCESSO DE BACKUP ==="
    
    # Verificações preliminares
    if ! check_disk_space; then
        exit 1
    fi
    
    if ! check_mongodb; then
        exit 1
    fi
    
    # Realizar backup
    if perform_backup; then
        log "Backup realizado com sucesso"
    else
        log "ERRO: Falha no processo de backup"
        exit 1
    fi
    
    # Limpeza de backups antigos
    cleanup_old_backups
    
    # Gerar relatório
    generate_status_report
    
    log "=== PROCESSO DE BACKUP CONCLUÍDO ==="
}

# Verificar se o script está sendo executado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi

