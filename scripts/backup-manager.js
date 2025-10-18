#!/usr/bin/env node

/**
 * Gerenciador de Backup para Sistema de Reconhecimento Facial
 * Integração com a aplicação Node.js principal
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.logDir = path.join(__dirname, '..', 'logs');
        this.scriptDir = __dirname;
        
        // Garantir que diretórios existam
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        [this.backupDir, this.logDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    /**
     * Executar backup manual
     */
    async createBackup() {
        return new Promise((resolve, reject) => {
            const backupScript = path.join(this.scriptDir, 'backup.sh');
            
            const process = spawn('bash', [backupScript], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let error = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        output: output,
                        message: 'Backup criado com sucesso'
                    });
                } else {
                    reject({
                        success: false,
                        error: error,
                        output: output,
                        message: 'Falha ao criar backup'
                    });
                }
            });
        });
    }
    
    /**
     * Listar backups disponíveis
     */
    async listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = files
                .filter(file => file.startsWith('backup_facial_recognition_') && file.endsWith('.tar.gz'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    
                    return {
                        filename: file,
                        path: filePath,
                        size: stats.size,
                        sizeFormatted: this.formatBytes(stats.size),
                        created: stats.mtime,
                        createdFormatted: stats.mtime.toLocaleString('pt-BR')
                    };
                })
                .sort((a, b) => b.created - a.created);
            
            return {
                success: true,
                backups: backups,
                total: backups.length,
                totalSize: backups.reduce((sum, backup) => sum + backup.size, 0)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Erro ao listar backups'
            };
        }
    }
    
    /**
     * Obter estatísticas de backup
     */
    async getBackupStats() {
        try {
            const backupList = await this.listBackups();
            
            if (!backupList.success) {
                return backupList;
            }
            
            const backups = backupList.backups;
            const now = new Date();
            
            // Calcular estatísticas
            const stats = {
                totalBackups: backups.length,
                totalSize: backupList.totalSize,
                totalSizeFormatted: this.formatBytes(backupList.totalSize),
                lastBackup: backups.length > 0 ? backups[0] : null,
                oldestBackup: backups.length > 0 ? backups[backups.length - 1] : null,
                backupsLast7Days: backups.filter(backup => {
                    const daysDiff = (now - backup.created) / (1000 * 60 * 60 * 24);
                    return daysDiff <= 7;
                }).length,
                backupsLast30Days: backups.filter(backup => {
                    const daysDiff = (now - backup.created) / (1000 * 60 * 60 * 24);
                    return daysDiff <= 30;
                }).length,
                averageSize: backups.length > 0 ? backupList.totalSize / backups.length : 0
            };
            
            stats.averageSizeFormatted = this.formatBytes(stats.averageSize);
            
            return {
                success: true,
                stats: stats
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Erro ao obter estatísticas de backup'
            };
        }
    }
    
    /**
     * Restaurar backup
     */
    async restoreBackup(backupFilename, force = false) {
        return new Promise((resolve, reject) => {
            const restoreScript = path.join(this.scriptDir, 'restore.sh');
            const args = force ? ['--force', backupFilename] : [backupFilename];
            
            const process = spawn('bash', [restoreScript, ...args], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let error = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        output: output,
                        message: 'Backup restaurado com sucesso'
                    });
                } else {
                    reject({
                        success: false,
                        error: error,
                        output: output,
                        message: 'Falha ao restaurar backup'
                    });
                }
            });
        });
    }
    
    /**
     * Remover backup específico
     */
    async deleteBackup(backupFilename) {
        try {
            const backupPath = path.join(this.backupDir, backupFilename);
            
            if (!fs.existsSync(backupPath)) {
                return {
                    success: false,
                    message: 'Backup não encontrado'
                };
            }
            
            fs.unlinkSync(backupPath);
            
            return {
                success: true,
                message: 'Backup removido com sucesso'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Erro ao remover backup'
            };
        }
    }
    
    /**
     * Verificar status do cron job
     */
    async getCronStatus() {
        try {
            const { stdout } = await execAsync('crontab -l');
            const cronJobs = stdout.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            const backupJob = cronJobs.find(job => job.includes('backup.sh'));
            
            return {
                success: true,
                cronActive: !!backupJob,
                cronExpression: backupJob || null,
                allJobs: cronJobs
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Erro ao verificar status do cron'
            };
        }
    }
    
    /**
     * Ler logs de backup
     */
    async getBackupLogs(lines = 100) {
        try {
            const logFile = path.join(this.logDir, 'backup.log');
            
            if (!fs.existsSync(logFile)) {
                return {
                    success: true,
                    logs: [],
                    message: 'Arquivo de log não encontrado'
                };
            }
            
            const { stdout } = await execAsync(`tail -n ${lines} "${logFile}"`);
            const logs = stdout.split('\n').filter(line => line.trim());
            
            return {
                success: true,
                logs: logs,
                total: logs.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Erro ao ler logs de backup'
            };
        }
    }
    
    /**
     * Formatar bytes em formato legível
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    /**
     * Validar nome de arquivo de backup
     */
    isValidBackupFilename(filename) {
        const pattern = /^backup_facial_recognition_\d{8}_\d{6}\.tar\.gz$/;
        return pattern.test(filename);
    }
}

// Exportar classe para uso em outros módulos
module.exports = BackupManager;

// Se executado diretamente, fornecer interface CLI
if (require.main === module) {
    const manager = new BackupManager();
    const command = process.argv[2];
    
    switch (command) {
        case 'create':
            manager.createBackup()
                .then(result => {
                    console.log('✅ Backup criado com sucesso');
                    console.log(result.output);
                })
                .catch(error => {
                    console.error('❌ Erro ao criar backup');
                    console.error(error.error || error.message);
                    process.exit(1);
                });
            break;
            
        case 'list':
            manager.listBackups()
                .then(result => {
                    if (result.success) {
                        console.log(`📋 ${result.total} backup(s) encontrado(s):`);
                        result.backups.forEach((backup, index) => {
                            console.log(`${index + 1}. ${backup.filename} (${backup.sizeFormatted}) - ${backup.createdFormatted}`);
                        });
                    } else {
                        console.error('❌ Erro ao listar backups:', result.message);
                    }
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                });
            break;
            
        case 'stats':
            manager.getBackupStats()
                .then(result => {
                    if (result.success) {
                        const stats = result.stats;
                        console.log('📊 Estatísticas de Backup:');
                        console.log(`Total de backups: ${stats.totalBackups}`);
                        console.log(`Tamanho total: ${stats.totalSizeFormatted}`);
                        console.log(`Tamanho médio: ${stats.averageSizeFormatted}`);
                        console.log(`Backups (7 dias): ${stats.backupsLast7Days}`);
                        console.log(`Backups (30 dias): ${stats.backupsLast30Days}`);
                        
                        if (stats.lastBackup) {
                            console.log(`Último backup: ${stats.lastBackup.filename} (${stats.lastBackup.createdFormatted})`);
                        }
                    } else {
                        console.error('❌ Erro ao obter estatísticas:', result.message);
                    }
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                });
            break;
            
        case 'logs':
            const logLines = process.argv[3] || 50;
            manager.getBackupLogs(logLines)
                .then(result => {
                    if (result.success) {
                        console.log(`📄 Últimas ${result.total} linhas do log:`);
                        result.logs.forEach(line => console.log(line));
                    } else {
                        console.error('❌ Erro ao ler logs:', result.message);
                    }
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                });
            break;
            
        default:
            console.log('Uso: node backup-manager.js <comando>');
            console.log('');
            console.log('Comandos disponíveis:');
            console.log('  create    - Criar novo backup');
            console.log('  list      - Listar backups disponíveis');
            console.log('  stats     - Exibir estatísticas de backup');
            console.log('  logs [n]  - Exibir últimas n linhas do log (padrão: 50)');
            console.log('');
            console.log('Exemplos:');
            console.log('  node backup-manager.js create');
            console.log('  node backup-manager.js list');
            console.log('  node backup-manager.js logs 100');
            break;
    }
}

