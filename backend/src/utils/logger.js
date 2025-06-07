import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'error.log');

export const logger = {
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const logMessage = `
[${timestamp}] ${message}
Error: ${error.message}
Stack: ${error.stack}
`;

    try {
      // Ensure file exists before writing
      if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, '', { encoding: 'utf-8' });
      }
      
      fs.appendFileSync(logFile, logMessage + '\n', { 
        encoding: 'utf-8',
        flag: 'a' 
      });
      console.error(logMessage);
    } catch (logError) {
      console.error('Failed to write error log:', logError.message);
      // Fallback to console if file logging fails
      console.error('Original error:', error);
    }
  }
};
