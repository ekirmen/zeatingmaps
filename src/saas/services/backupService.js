import { supabase } from '../../supabaseClient';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupConfig = {
      // Configuración de rutas
      localBackupPath: process.env.BACKUP_PATH || '/backups',
      cloudStorage: {
        provider: 'aws-s3', // aws-s3, google-cloud, azure
        bucket: process.env.BACKUP_BUCKET || 'saas-backups',
        region: process.env.BACKUP_REGION || 'us-east-1'
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

  // Crear backup de base de datos
  async createDatabaseBackup(type = 'daily') {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFileName = `backup_${type}_${timestamp}.sql`;
      const backupPath = path.join(this.backupConfig.localBackupPath, 'database', type, backupFileName);

      // Crear directorio si no existe
      await this.ensureDirectoryExists(path.dirname(backupPath));

      // Comando pg_dump para Supabase
      const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
      const command = `pg_dump "${dbUrl}" > "${backupPath}"`;

      await execAsync(command);

      // Comprimir el backup
      const compressedPath = `${backupPath}.gz`;
      await execAsync(`gzip "${backupPath}"`);

      // Subir a la nube
      await this.uploadToCloud(compressedPath, `database/${type}/${backupFileName}.gz`);

      // Registrar en auditoría
      await this.logBackupAction('database_backup_created', {
        type,
        file: backupFileName,
        size: await this.getFileSize(compressedPath),
        location: 'local_and_cloud'
      });

      return {
        success: true,
        file: backupFileName,
        path: compressedPath,
        size: await this.getFileSize(compressedPath)
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
      const backupPath = path.join(this.backupConfig.localBackupPath, 'files', type, backupFileName);

      // Crear directorio si no existe
      await this.ensureDirectoryExists(path.dirname(backupPath));

      // Obtener todos los tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, company_name');

      if (!tenants) throw new Error('No tenants found');

      // Crear backup de archivos por tenant
      const tempDir = path.join(this.backupConfig.localBackupPath, 'temp');
      await this.ensureDirectoryExists(tempDir);

      for (const tenant of tenants) {
        const tenantStoragePath = path.join(process.env.STORAGE_PATH || '/storage', `tenant-${tenant.id}`);
        
        if (fs.existsSync(tenantStoragePath)) {
          const tenantBackupPath = path.join(tempDir, `tenant-${tenant.id}`);
          await execAsync(`cp -r "${tenantStoragePath}" "${tenantBackupPath}"`);
        }
      }

      // Comprimir todo
      await execAsync(`tar -czf "${backupPath}" -C "${tempDir}" .`);

      // Limpiar directorio temporal
      await execAsync(`rm -rf "${tempDir}"`);

      // Subir a la nube
      await this.uploadToCloud(backupPath, `files/${type}/${backupFileName}`);

      // Registrar en auditoría
      await this.logBackupAction('files_backup_created', {
        type,
        file: backupFileName,
        tenants_count: tenants.length,
        size: await this.getFileSize(backupPath),
        location: 'local_and_cloud'
      });

      return {
        success: true,
        file: backupFileName,
        path: backupPath,
        size: await this.getFileSize(backupPath),
        tenants_count: tenants.length
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
      const backupPath = path.join(this.backupConfig.localBackupPath, 'configs', backupFileName);

      // Crear directorio si no existe
      await this.ensureDirectoryExists(path.dirname(backupPath));

      // Obtener todas las configuraciones
      const configs = {
        email_configs: await this.getEmailConfigs(),
        payment_gateways: await this.getPaymentGatewayConfigs(),
        access_control: await this.getAccessControlConfigs(),
        system_settings: await this.getSystemSettings(),
        backup_metadata: {
          created_at: new Date().toISOString(),
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'production'
        }
      };

      // Guardar configuraciones
      fs.writeFileSync(backupPath, JSON.stringify(configs, null, 2));

      // Subir a la nube
      await this.uploadToCloud(backupPath, `configs/${backupFileName}`);

      // Registrar en auditoría
      await this.logBackupAction('config_backup_created', {
        file: backupFileName,
        size: await this.getFileSize(backupPath),
        location: 'local_and_cloud'
      });

      return {
        success: true,
        file: backupFileName,
        path: backupPath,
        size: await this.getFileSize(backupPath)
      };
    } catch (error) {
      console.error('Error creating config backup:', error);
      await this.logBackupAction('config_backup_failed', {
        error: error.message
      });
      throw error;
    }
  }

  // Subir backup a la nube
  async uploadToCloud(localPath, cloudPath) {
    try {
      const { provider, bucket, region } = this.backupConfig.cloudStorage;

      switch (provider) {
        case 'aws-s3':
          await this.uploadToS3(localPath, cloudPath, bucket, region);
          break;
        case 'google-cloud':
          await this.uploadToGoogleCloud(localPath, cloudPath, bucket);
          break;
        case 'azure':
          await this.uploadToAzure(localPath, cloudPath, bucket);
          break;
        default:
          console.log('Cloud upload not configured');
      }
    } catch (error) {
      console.error('Error uploading to cloud:', error);
      throw error;
    }
  }

  // Subir a AWS S3
  async uploadToS3(localPath, cloudPath, bucket, region) {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    const fileContent = fs.readFileSync(localPath);
    
    const params = {
      Bucket: bucket,
      Key: cloudPath,
      Body: fileContent,
      ServerSideEncryption: 'AES256'
    };

    await s3.upload(params).promise();
  }

  // Restaurar desde backup
  async restoreFromBackup(backupType, backupFile, targetTenant = null) {
    try {
      let backupPath;

      if (backupType === 'database') {
        backupPath = await this.downloadFromCloud(`database/daily/${backupFile}`);
        await this.restoreDatabase(backupPath);
      } else if (backupType === 'files') {
        backupPath = await this.downloadFromCloud(`files/daily/${backupFile}`);
        await this.restoreFiles(backupPath, targetTenant);
      } else if (backupType === 'config') {
        backupPath = await this.downloadFromCloud(`configs/${backupFile}`);
        await this.restoreConfig(backupPath);
      }

      // Registrar en auditoría
      await this.logBackupAction('backup_restored', {
        type: backupType,
        file: backupFile,
        target_tenant: targetTenant
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

  // Limpiar backups antiguos
  async cleanupOldBackups() {
    try {
      const { retention } = this.backupConfig;
      const now = new Date();

      // Limpiar backups diarios
      await this.cleanupBackupsByType('daily', retention.daily);
      
      // Limpiar backups semanales
      await this.cleanupBackupsByType('weekly', retention.weekly);
      
      // Limpiar backups mensuales
      await this.cleanupBackupsByType('monthly', retention.monthly);

      await this.logBackupAction('backup_cleanup_completed', {
        retention_policy: retention
      });
    } catch (error) {
      console.error('Error cleaning up backups:', error);
      throw error;
    }
  }

  // Verificar integridad de backups
  async verifyBackupIntegrity(backupFile) {
    try {
      const backupPath = path.join(this.backupConfig.localBackupPath, backupFile);
      
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
        last_modified: stats.mtime
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
    // Obtener configuraciones del sistema
    return {
      app_version: process.env.APP_VERSION,
      node_env: process.env.NODE_ENV,
      backup_config: this.backupConfig
    };
  }
}

const backupServiceInstance = new BackupService();
export default backupServiceInstance;
