import { supabase } from '../../supabaseClient';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class GoDaddyBackupService {
  constructor() {
    this.backupConfig = {
      // Rutas específicas para GoDaddy
      hostingPath: process.env.HOSTING_PATH || '/home/omegaboletos/public_html',
      backupPath: process.env.BACKUP_PATH || '/home/omegaboletos/backups',
      publicPath: process.env.PUBLIC_PATH || '/home/omegaboletos/public_html/sistema',
      
      // Configuración de GoDaddy
      godaddyConfig: {
        domain: 'omegaboletos.com',
        cpanel_user: process.env.CPANEL_USER || 'omegaboletos',
        mysql_host: process.env.MYSQL_HOST || 'localhost',
        mysql_user: process.env.MYSQL_USER || 'omegaboletos_user',
        mysql_database: process.env.MYSQL_DATABASE || 'omegaboletos_db'
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

  // Crear backup de base de datos MySQL (GoDaddy)
  async createDatabaseBackup(type = 'daily') {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFileName = `backup_${type}_${timestamp}.sql`;
      const backupDir = path.join(this.backupConfig.backupPath, 'database', type);
      const backupPath = path.join(backupDir, backupFileName);

      // Crear directorio si no existe
      await this.ensureDirectoryExists(backupDir);

      // Comando mysqldump para GoDaddy
      const { mysql_host, mysql_user, mysql_database } = this.backupConfig.godaddyConfig;
      const mysqlPassword = process.env.MYSQL_PASSWORD;
      
      const command = `mysqldump -h ${mysql_host} -u ${mysql_user} -p${mysqlPassword} ${mysql_database} > "${backupPath}"`;

      await execAsync(command);

      // Comprimir el backup
      const compressedPath = `${backupPath}.gz`;
      await execAsync(`gzip "${backupPath}"`);

      // Crear backup en GitHub también
      await this.createGitHubBackup(compressedPath, `database/${type}/${backupFileName}.gz`);

      // Registrar en auditoría
      await this.logBackupAction('database_backup_created', {
        type,
        file: backupFileName,
        size: await this.getFileSize(compressedPath),
        location: 'godaddy_hosting_and_github'
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

  // Crear backup de archivos de tenants
  async createFilesBackup(type = 'daily') {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFileName = `files_${type}_${timestamp}.tar.gz`;
      const backupDir = path.join(this.backupConfig.backupPath, 'files', type);
      const backupPath = path.join(backupDir, backupFileName);

      // Crear directorio si no existe
      await this.ensureDirectoryExists(backupDir);

      // Obtener todos los tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, company_name');

      if (!tenants) throw new Error('No tenants found');

      // Crear backup de archivos por tenant
      const tempDir = path.join(this.backupConfig.backupPath, 'temp');
      await this.ensureDirectoryExists(tempDir);

      for (const tenant of tenants) {
        // Ruta de archivos del tenant en GoDaddy
        const tenantStoragePath = path.join(this.backupConfig.publicPath, 'storage', `tenant-${tenant.id}`);
        
        if (fs.existsSync(tenantStoragePath)) {
          const tenantBackupPath = path.join(tempDir, `tenant-${tenant.id}`);
          await execAsync(`cp -r "${tenantStoragePath}" "${tenantBackupPath}"`);
        }
      }

      // Comprimir todo
      await execAsync(`tar -czf "${backupPath}" -C "${tempDir}" .`);

      // Limpiar directorio temporal
      await execAsync(`rm -rf "${tempDir}"`);

      // Crear backup en GitHub también
      await this.createGitHubBackup(backupPath, `files/${type}/${backupFileName}`);

      // Registrar en auditoría
      await this.logBackupAction('files_backup_created', {
        type,
        file: backupFileName,
        tenants_count: tenants.length,
        size: await this.getFileSize(backupPath),
        location: 'godaddy_hosting_and_github'
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
      const backupDir = path.join(this.backupConfig.backupPath, 'configs');
      const backupPath = path.join(backupDir, backupFileName);

      // Crear directorio si no existe
      await this.ensureDirectoryExists(backupDir);

      // Obtener todas las configuraciones
      const configs = {
        email_configs: await this.getEmailConfigs(),
        payment_gateways: await this.getPaymentGatewayConfigs(),
        access_control: await this.getAccessControlConfigs(),
        system_settings: await this.getSystemSettings(),
        godaddy_config: this.backupConfig.godaddyConfig,
        backup_metadata: {
          created_at: new Date().toISOString(),
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'production',
          hosting: 'GoDaddy'
        }
      };

      // Guardar configuraciones
      fs.writeFileSync(backupPath, JSON.stringify(configs, null, 2));

      // Crear backup en GitHub también
      await this.createGitHubBackup(backupPath, `configs/${backupFileName}`);

      // Registrar en auditoría
      await this.logBackupAction('config_backup_created', {
        file: backupFileName,
        size: await this.getFileSize(backupPath),
        location: 'godaddy_hosting_and_github'
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

  // Crear backup en GitHub
  async createGitHubBackup(localPath, githubPath) {
    try {
      // Leer el archivo
      const fileContent = fs.readFileSync(localPath);
      
      // Crear commit en GitHub
      const githubToken = process.env.GITHUB_TOKEN;
      const repoOwner = process.env.GITHUB_REPO_OWNER || 'tu-usuario';
      const repoName = process.env.GITHUB_REPO_NAME || 'saas-backups';
      
      const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${githubPath}`;
      
      const response = await fetch(githubApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
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
      console.error('Error creating GitHub backup:', error);
      // No lanzar error, solo loggear
      await this.logBackupAction('github_backup_failed', {
        path: githubPath,
        error: error.message
      });
    }
  }

  // Restaurar desde backup
  async restoreFromBackup(backupType, backupFile, targetTenant = null) {
    try {
      let backupPath;

      if (backupType === 'database') {
        backupPath = path.join(this.backupConfig.backupPath, 'database', 'daily', `${backupFile}.gz`);
        await this.restoreDatabase(backupPath);
      } else if (backupType === 'files') {
        backupPath = path.join(this.backupConfig.backupPath, 'files', 'daily', backupFile);
        await this.restoreFiles(backupPath, targetTenant);
      } else if (backupType === 'config') {
        backupPath = path.join(this.backupConfig.backupPath, 'configs', backupFile);
        await this.restoreConfig(backupPath);
      }

      // Registrar en auditoría
      await this.logBackupAction('backup_restored', {
        type: backupType,
        file: backupFile,
        target_tenant: targetTenant,
        location: 'godaddy_hosting'
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
      const { mysql_host, mysql_user, mysql_database } = this.backupConfig.godaddyConfig;
      const mysqlPassword = process.env.MYSQL_PASSWORD;
      
      // Descomprimir si es necesario
      let sqlPath = backupPath;
      if (backupPath.endsWith('.gz')) {
        sqlPath = backupPath.replace('.gz', '');
        await execAsync(`gunzip "${backupPath}"`);
      }

      // Restaurar base de datos
      const command = `mysql -h ${mysql_host} -u ${mysql_user} -p${mysqlPassword} ${mysql_database} < "${sqlPath}"`;
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
      const tempDir = path.join(this.backupConfig.backupPath, 'temp');
      await this.ensureDirectoryExists(tempDir);

      // Extraer archivos
      await execAsync(`tar -xzf "${backupPath}" -C "${tempDir}"`);

      if (targetTenant) {
        // Restaurar solo un tenant específico
        const tenantPath = path.join(tempDir, `tenant-${targetTenant}`);
        const targetPath = path.join(this.backupConfig.publicPath, 'storage', `tenant-${targetTenant}`);
        
        if (fs.existsSync(tenantPath)) {
          await execAsync(`cp -r "${tenantPath}" "${targetPath}"`);
        }
      } else {
        // Restaurar todos los tenants
        const storagePath = path.join(this.backupConfig.publicPath, 'storage');
        await execAsync(`cp -r "${tempDir}"/* "${storagePath}"/`);
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
      const backupDir = path.join(this.backupConfig.backupPath, type);
      
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
      const backupPath = path.join(this.backupConfig.backupPath, backupFile);
      
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
      hosting: 'GoDaddy',
      domain: this.backupConfig.godaddyConfig.domain,
      backup_config: this.backupConfig
    };
  }
}

const godaddyBackupServiceInstance = new GoDaddyBackupService();
export default godaddyBackupServiceInstance;
