import { supabase } from '../../supabaseClient';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class GitHubGodaddyBackupService {
  constructor() {
    this.backupConfig = {
      // Configuración de GitHub (donde está el código)
      github: {
        repo_owner: process.env.GITHUB_REPO_OWNER || 'tu-usuario',
        repo_name: process.env.GITHUB_REPO_NAME || 'saas-sistema',
        token: process.env.GITHUB_TOKEN,
        branch: 'main'
      },
      
      // Configuración de GoDaddy (donde se guardan los backups)
      godaddy: {
        domain: 'omegaboletos.com',
        backup_path: process.env.GODADDY_BACKUP_PATH || '/home/omegaboletos/backups',
        mysql_host: process.env.GODADDY_MYSQL_HOST || 'localhost',
        mysql_user: process.env.GODADDY_MYSQL_USER || 'omegaboletos_user',
        mysql_database: process.env.GODADDY_MYSQL_DATABASE || 'omegaboletos_db',
        mysql_password: process.env.GODADDY_MYSQL_PASSWORD
      },
      
      // Configuración de Supabase (donde está la BD en producción)
      supabase: {
        url: process.env.SUPABASE_URL,
        anon_key: process.env.SUPABASE_ANON_KEY,
        service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      
      // Configuración de frecuencia
      schedules: {
        database: {
          daily: { hour: 2, minute: 0 }, // 2:00 AM
          weekly: { day: 0, hour: 3, minute: 0 }, // Domingo 3:00 AM
          monthly: { day: 1, hour: 4, minute: 0 } // Primer día del mes 4:00 AM
        },
        files: {
          daily: { hour: 1, minute: 30 }, // 1:30 AM
          weekly: { day: 0, hour: 2, minute: 30 } // Domingo 2:30 AM
        }
      },
      
      // Configuración de retención
      retention: {
        daily: 7, // Mantener 7 días
        weekly: 4, // Mantener 4 semanas
        monthly: 12 // Mantener 12 meses
      }
    };
  }

  // Crear backup de base de datos desde Supabase hacia GoDaddy
  async createDatabaseBackup(type = 'daily') {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFileName = `backup_${type}_${timestamp}.sql`;
      const backupDir = path.join(this.backupConfig.godaddy.backup_path, 'database', type);
      const backupPath = path.join(backupDir, backupFileName);

      // Crear directorio en GoDaddy si no existe
      await this.ensureDirectoryExists(backupDir);

      // Exportar desde Supabase usando pg_dump
      const supabaseUrl = this.backupConfig.supabase.url;
      const command = `pg_dump "${supabaseUrl}" > "${backupPath}"`;

      await execAsync(command);

      // Comprimir el backup
      const compressedPath = `${backupPath}.gz`;
      await execAsync(`gzip "${backupPath}"`);

      // Subir backup a GitHub también (como respaldo)
      await this.uploadBackupToGitHub(compressedPath, `backups/database/${type}/${backupFileName}.gz`);

      // Registrar en auditoría
      await this.logBackupAction('database_backup_created', {
        type,
        file: backupFileName,
        size: await this.getFileSize(compressedPath),
        source: 'supabase',
        destination: 'godaddy_hosting_and_github'
      });

      return {
        success: true,
        file: backupFileName,
        path: compressedPath,
        size: await this.getFileSize(compressedPath),
        location: 'godaddy_hosting'
      };
    } catch (error) {
      console.error('Error creating database backup:', error);
      await this.logBackupAction('database_backup_failed', {
        type,
        error: error.message
      });
      throw error;
    }
  }

  // Crear backup de archivos de tenants desde Supabase Storage hacia GoDaddy
  async createFilesBackup(type = 'daily') {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFileName = `files_${type}_${timestamp}.tar.gz`;
      const backupDir = path.join(this.backupConfig.godaddy.backup_path, 'files', type);
      const backupPath = path.join(backupDir, backupFileName);

      // Crear directorio en GoDaddy si no existe
      await this.ensureDirectoryExists(backupDir);

      // Obtener todos los tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, company_name');

      if (!tenants) throw new Error('No tenants found');

      // Crear backup de archivos por tenant
      const tempDir = path.join(this.backupConfig.godaddy.backup_path, 'temp');
      await this.ensureDirectoryExists(tempDir);

      for (const tenant of tenants) {
        // Descargar archivos desde Supabase Storage
        const tenantFiles = await this.downloadTenantFiles(tenant.id);
        
        if (tenantFiles.length > 0) {
          const tenantBackupPath = path.join(tempDir, `tenant-${tenant.id}`);
          await this.ensureDirectoryExists(tenantBackupPath);
          
          // Guardar archivos en GoDaddy
          for (const file of tenantFiles) {
            const filePath = path.join(tenantBackupPath, file.name);
            fs.writeFileSync(filePath, file.data);
          }
        }
      }

      // Comprimir todo
      await execAsync(`tar -czf "${backupPath}" -C "${tempDir}" .`);

      // Limpiar directorio temporal
      await execAsync(`rm -rf "${tempDir}"`);

      // Subir backup a GitHub también
      await this.uploadBackupToGitHub(backupPath, `backups/files/${type}/${backupFileName}`);

      // Registrar en auditoría
      await this.logBackupAction('files_backup_created', {
        type,
        file: backupFileName,
        tenants_count: tenants.length,
        size: await this.getFileSize(backupPath),
        source: 'supabase_storage',
        destination: 'godaddy_hosting_and_github'
      });

      return {
        success: true,
        file: backupFileName,
        path: backupPath,
        size: await this.getFileSize(backupPath),
        tenants_count: tenants.length,
        location: 'godaddy_hosting'
      };
    } catch (error) {
      console.error('Error creating files backup:', error);
      await this.logBackupAction('files_backup_failed', {
        type,
        error: error.message
      });
      throw error;
    }
  }

  // Crear backup de configuraciones
  async createConfigBackup() {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFileName = `config_${timestamp}.json`;
      const backupDir = path.join(this.backupConfig.godaddy.backup_path, 'configs');
      const backupPath = path.join(backupDir, backupFileName);

      // Crear directorio en GoDaddy si no existe
      await this.ensureDirectoryExists(backupDir);

      // Obtener todas las configuraciones
      const configs = {
        email_configs: await this.getEmailConfigs(),
        payment_gateways: await this.getPaymentGatewayConfigs(),
        access_control: await this.getAccessControlConfigs(),
        system_settings: await this.getSystemSettings(),
        github_config: this.backupConfig.github,
        godaddy_config: this.backupConfig.godaddy,
        backup_metadata: {
          created_at: new Date().toISOString(),
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'production',
          source: 'github_repository',
          backup_destination: 'godaddy_hosting'
        }
      };

      // Guardar configuraciones en GoDaddy
      fs.writeFileSync(backupPath, JSON.stringify(configs, null, 2));

      // Subir backup a GitHub también
      await this.uploadBackupToGitHub(backupPath, `backups/configs/${backupFileName}`);

      // Registrar en auditoría
      await this.logBackupAction('config_backup_created', {
        file: backupFileName,
        size: await this.getFileSize(backupPath),
        source: 'github_repository',
        destination: 'godaddy_hosting_and_github'
      });

      return {
        success: true,
        file: backupFileName,
        path: backupPath,
        size: await this.getFileSize(backupPath),
        location: 'godaddy_hosting'
      };
    } catch (error) {
      console.error('Error creating config backup:', error);
      await this.logBackupAction('config_backup_failed', {
        error: error.message
      });
      throw error;
    }
  }

  // Subir backup a GitHub
  async uploadBackupToGitHub(localPath, githubPath) {
    try {
      const { repo_owner, repo_name, token } = this.backupConfig.github;
      
      // Leer el archivo
      const fileContent = fs.readFileSync(localPath);
      
      // Crear commit en GitHub
      const githubApiUrl = `https://api.github.com/repos/${repo_owner}/${repo_name}/contents/${githubPath}`;
      
      const response = await fetch(githubApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Backup: ${githubPath}`,
          content: Buffer.from(fileContent).toString('base64'),
          branch: 'main'
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading backup to GitHub:', error);
      // No lanzar error, solo loggear
      await this.logBackupAction('github_backup_upload_failed', {
        path: githubPath,
        error: error.message
      });
    }
  }

  // Descargar archivos de un tenant desde Supabase Storage
  async downloadTenantFiles(tenantId) {
    try {
      const { data, error } = await supabase.storage
        .from(`tenant-${tenantId}`)
        .list('', { limit: 1000 });

      if (error) throw error;

      const files = [];
      for (const file of data) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(`tenant-${tenantId}`)
          .download(file.name);

        if (!downloadError) {
          files.push({
            name: file.name,
            data: await fileData.arrayBuffer()
          });
        }
      }

      return files;
    } catch (error) {
      console.error(`Error downloading files for tenant ${tenantId}:`, error);
      return [];
    }
  }

  // Restaurar desde backup
  async restoreFromBackup(backupType, backupFile, targetTenant = null) {
    try {
      let backupPath;

      if (backupType === 'database') {
        backupPath = path.join(this.backupConfig.godaddy.backup_path, 'database', 'daily', `${backupFile}.gz`);
        await this.restoreDatabase(backupPath);
      } else if (backupType === 'files') {
        backupPath = path.join(this.backupConfig.godaddy.backup_path, 'files', 'daily', backupFile);
        await this.restoreFiles(backupPath, targetTenant);
      } else if (backupType === 'config') {
        backupPath = path.join(this.backupConfig.godaddy.backup_path, 'configs', backupFile);
        await this.restoreConfig(backupPath);
      }

      // Registrar en auditoría
      await this.logBackupAction('backup_restored', {
        type: backupType,
        file: backupFile,
        target_tenant: targetTenant,
        source: 'godaddy_hosting',
        destination: 'supabase'
      });

      return { success: true, restored_file: backupFile };
    } catch (error) {
      console.error('Error restoring backup:', error);
      await this.logBackupAction('backup_restore_failed', {
        type: backupType,
        file: backupFile,
        error: error.message
      });
      throw error;
    }
  }

  // Restaurar base de datos
  async restoreDatabase(backupPath) {
    try {
      const supabaseUrl = this.backupConfig.supabase.url;
      
      // Descomprimir si es necesario
      let sqlPath = backupPath;
      if (backupPath.endsWith('.gz')) {
        sqlPath = backupPath.replace('.gz', '');
        await execAsync(`gunzip "${backupPath}"`);
      }

      // Restaurar base de datos
      const command = `psql "${supabaseUrl}" < "${sqlPath}"`;
      await execAsync(command);

      return { success: true };
    } catch (error) {
      console.error('Error restoring database:', error);
      throw error;
    }
  }

  // Restaurar archivos
  async restoreFiles(backupPath, targetTenant = null) {
    try {
      const tempDir = path.join(this.backupConfig.godaddy.backup_path, 'temp');
      await this.ensureDirectoryExists(tempDir);

      // Extraer archivos
      await execAsync(`tar -xzf "${backupPath}" -C "${tempDir}"`);

      if (targetTenant) {
        // Restaurar solo un tenant específico
        const tenantPath = path.join(tempDir, `tenant-${targetTenant}`);
        
        if (fs.existsSync(tenantPath)) {
          const files = fs.readdirSync(tenantPath);
          
          for (const file of files) {
            const filePath = path.join(tenantPath, file);
            const fileData = fs.readFileSync(filePath);
            
            // Subir a Supabase Storage
            const { error } = await supabase.storage
              .from(`tenant-${targetTenant}`)
              .upload(file, fileData);
              
            if (error) {
              console.error(`Error uploading file ${file}:`, error);
            }
          }
        }
      } else {
        // Restaurar todos los tenants
        const tenantDirs = fs.readdirSync(tempDir);
        
        for (const tenantDir of tenantDirs) {
          if (tenantDir.startsWith('tenant-')) {
            const tenantId = tenantDir.replace('tenant-', '');
            const tenantPath = path.join(tempDir, tenantDir);
            const files = fs.readdirSync(tenantPath);
            
            for (const file of files) {
              const filePath = path.join(tenantPath, file);
              const fileData = fs.readFileSync(filePath);
              
              // Subir a Supabase Storage
              const { error } = await supabase.storage
                .from(`tenant-${tenantId}`)
                .upload(file, fileData);
                
              if (error) {
                console.error(`Error uploading file ${file} for tenant ${tenantId}:`, error);
              }
            }
          }
        }
      }

      // Limpiar directorio temporal
      await execAsync(`rm -rf "${tempDir}"`);

      return { success: true };
    } catch (error) {
      console.error('Error restoring files:', error);
      throw error;
    }
  }

  // Restaurar configuraciones
  async restoreConfig(backupPath) {
    try {
      const configData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      // Restaurar configuraciones de email
      if (configData.email_configs) {
        for (const config of configData.email_configs) {
          await supabase
            .from('global_email_config')
            .upsert([config]);
        }
      }

      // Restaurar configuraciones de pasarelas de pago
      if (configData.payment_gateways) {
        for (const config of configData.payment_gateways) {
          await supabase
            .from('payment_gateway_configs')
            .upsert([config]);
        }
      }

      // Restaurar configuraciones de control de acceso
      if (configData.access_control) {
        for (const config of configData.access_control) {
          await supabase
            .from('custom_roles')
            .upsert([config]);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error restoring config:', error);
      throw error;
    }
  }

  // Limpiar backups antiguos
  async cleanupOldBackups() {
    try {
      const { retention } = this.backupConfig;
      
      // Limpiar backups diarios
      await this.cleanupBackupsByType('daily', retention.daily);
      
      // Limpiar backups semanales
      await this.cleanupBackupsByType('weekly', retention.weekly);
      
      // Limpiar backups mensuales
      await this.cleanupBackupsByType('monthly', retention.monthly);

      await this.logBackupAction('backup_cleanup_completed', {
        retention_policy: retention,
        location: 'godaddy_hosting'
      });
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      throw error;
    }
  }

  // Limpiar backups por tipo
  async cleanupBackupsByType(type, retentionDays) {
    try {
      const backupDir = path.join(this.backupConfig.godaddy.backup_path, type);
      
      if (!fs.existsSync(backupDir)) return;

      const files = fs.readdirSync(backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up ${type} backups:`, error);
      throw error;
    }
  }

  // Verificar integridad de backups
  async verifyBackupIntegrity(backupFile) {
    try {
      const backupPath = path.join(this.backupConfig.godaddy.backup_path, backupFile);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      // Verificar tamaño del archivo
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // Verificar checksum
      const checksum = await this.calculateChecksum(backupPath);
      
      return {
        valid: true,
        size: stats.size,
        checksum,
        last_modified: stats.mtime,
        location: 'godaddy_hosting'
      };
    } catch (error) {
      console.error('Error verifying backup integrity:', error);
      return { valid: false, error: error.message };
    }
  }

  // Métodos auxiliares
  async ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async logBackupAction(action, details) {
    try {
      await supabase
        .from('audit_logs')
        .insert([{
          action: `backup_${action}`,
          details: JSON.stringify(details),
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging backup action:', error);
    }
  }

  // Métodos para obtener configuraciones
  async getEmailConfigs() {
    const { data } = await supabase.from('global_email_config').select('*');
    return data;
  }

  async getPaymentGatewayConfigs() {
    const { data } = await supabase.from('payment_gateway_configs').select('*');
    return data;
  }

  async getAccessControlConfigs() {
    const { data } = await supabase.from('custom_roles').select('*');
    return data;
  }

  async getSystemSettings() {
    return {
      app_version: process.env.APP_VERSION,
      node_env: process.env.NODE_ENV,
      source: 'github_repository',
      backup_destination: 'godaddy_hosting',
      backup_config: this.backupConfig
    };
  }
}

const githubGodaddyBackupServiceInstance = new GitHubGodaddyBackupService();
export default githubGodaddyBackupServiceInstance;
