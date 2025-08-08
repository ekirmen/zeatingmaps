# 🔒 Configuración SSL Wildcard para SaaS Multi-Tenant

## 📋 Requisitos Previos

1. **Dominio registrado** (ej: `ticketera.com`)
2. **Acceso al panel de DNS** de tu proveedor
3. **Servidor con acceso SSH** (VPS, AWS, DigitalOcean, etc.)
4. **Certbot instalado** (para Let's Encrypt)

---

## 🌐 Paso 1: Configuración DNS Wildcard

### 1.1 Registrar Dominio Principal
```
Dominio: ticketera.com
```

### 1.2 Configurar Registro DNS Wildcard
En tu panel de DNS, agregar:

```
Tipo: A
Nombre: *
Valor: [IP de tu servidor]
TTL: 3600 (o automático)
```

**Ejemplo:**
```
* → 123.456.789.10
```

### 1.3 Verificar Configuración DNS
```bash
# Verificar que el wildcard DNS funciona
dig *.ticketera.com
nslookup *.ticketera.com
```

---

## 🔐 Paso 2: Obtener Certificado SSL Wildcard

### Opción A: Let's Encrypt (Gratis)

#### 2.1 Instalar Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# macOS
brew install certbot
```

#### 2.2 Obtener Certificado Wildcard
```bash
# Comando para obtener certificado wildcard
sudo certbot certonly --manual --preferred-challenges=dns \
  -d *.ticketera.com -d ticketera.com \
  --email tu-email@ticketera.com \
  --agree-tos \
  --no-eff-email
```

#### 2.3 Proceso de Verificación DNS
1. Certbot te pedirá crear un registro TXT
2. Agregar el registro TXT en tu panel DNS:
   ```
   Tipo: TXT
   Nombre: _acme-challenge
   Valor: [valor proporcionado por certbot]
   ```
3. Esperar 1-2 minutos para propagación
4. Presionar Enter en certbot para continuar

### Opción B: Certificado Comercial (Pago)

#### 2.1 Comprar Certificado Wildcard
- **Comodo**: ~$200/año
- **DigiCert**: ~$300/año
- **GlobalSign**: ~$250/año

#### 2.2 Instalar Certificado Comercial
```bash
# Crear directorio para certificados
sudo mkdir -p /etc/ssl/certs/ticketera.com
sudo mkdir -p /etc/ssl/private/ticketera.com

# Copiar archivos del certificado
sudo cp certificate.crt /etc/ssl/certs/ticketera.com/
sudo cp private.key /etc/ssl/private/ticketera.com/
sudo cp ca_bundle.crt /etc/ssl/certs/ticketera.com/
```

---

## ⚙️ Paso 3: Configuración del Servidor Web

### 3.1 Configuración Nginx

#### Crear archivo de configuración
```bash
sudo nano /etc/nginx/sites-available/ticketera.com
```

#### Configuración completa
```nginx
# Configuración para HTTP (redirigir a HTTPS)
server {
    listen 80;
    server_name *.ticketera.com ticketera.com;
    return 301 https://$server_name$request_uri;
}

# Configuración para HTTPS
server {
    listen 443 ssl http2;
    server_name *.ticketera.com ticketera.com;
    
    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/ticketera.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ticketera.com/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Configuración de proxy para Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Configuración para archivos estáticos
    location /_next/static {
        alias /path/to/your/app/.next/static;
        expires 365d;
        access_log off;
    }
    
    # Configuración para API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Configuración para el dominio principal
server {
    listen 443 ssl http2;
    server_name ticketera.com;
    
    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/ticketera.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ticketera.com/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Redirigir a la aplicación principal
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

#### Habilitar el sitio
```bash
sudo ln -s /etc/nginx/sites-available/ticketera.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.2 Configuración Apache (Alternativa)

#### Crear archivo de configuración
```bash
sudo nano /etc/apache2/sites-available/ticketera.com.conf
```

#### Configuración Apache
```apache
<VirtualHost *:80>
    ServerName ticketera.com
    ServerAlias *.ticketera.com
    Redirect permanent / https://%{SERVER_NAME}%{REQUEST_URI}
</VirtualHost>

<VirtualHost *:443>
    ServerName ticketera.com
    ServerAlias *.ticketera.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/ticketera.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/ticketera.com/privkey.pem
    
    # Headers de seguridad
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Proxy para Next.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Configuración de logs
    ErrorLog ${APACHE_LOG_DIR}/ticketera_error.log
    CustomLog ${APACHE_LOG_DIR}/ticketera_access.log combined
</VirtualHost>
```

#### Habilitar módulos y sitio
```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2ensite ticketera.com.conf
sudo systemctl reload apache2
```

---

## 🔄 Paso 4: Renovación Automática (Let's Encrypt)

### 4.1 Crear script de renovación
```bash
sudo nano /etc/cron.daily/renew-ssl
```

### 4.2 Contenido del script
```bash
#!/bin/bash

# Renovar certificados SSL
certbot renew --quiet

# Recargar Nginx si los certificados fueron renovados
if [ $? -eq 0 ]; then
    systemctl reload nginx
fi
```

### 4.3 Hacer ejecutable el script
```bash
sudo chmod +x /etc/cron.daily/renew-ssl
```

### 4.4 Verificar renovación manual
```bash
sudo certbot renew --dry-run
```

---

## 🧪 Paso 5: Verificación y Testing

### 5.1 Verificar Certificado SSL
```bash
# Verificar certificado
openssl s_client -connect ticketera.com:443 -servername ticketera.com

# Verificar wildcard
openssl s_client -connect empresa1.ticketera.com:443 -servername empresa1.ticketera.com
```

### 5.2 Testing Online
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html

### 5.3 Verificar Subdominios
```bash
# Probar diferentes subdominios
curl -I https://empresa1.ticketera.com
curl -I https://empresa2.ticketera.com
curl -I https://test.ticketera.com
```

---

## 🚨 Paso 6: Monitoreo y Mantenimiento

### 6.1 Configurar Monitoreo
```bash
# Crear script de monitoreo
sudo nano /usr/local/bin/ssl-monitor.sh
```

### 6.2 Script de Monitoreo
```bash
#!/bin/bash

DOMAIN="ticketera.com"
SUBDOMAINS=("empresa1" "empresa2" "test")

check_ssl() {
    local domain=$1
    local result=$(echo | openssl s_client -connect ${domain}:443 -servername ${domain} 2>/dev/null | openssl x509 -noout -dates)
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL OK: ${domain}"
    else
        echo "❌ SSL ERROR: ${domain}"
        # Enviar alerta por email
        echo "SSL certificate error for ${domain}" | mail -s "SSL Alert" admin@ticketera.com
    fi
}

# Verificar dominio principal
check_ssl $DOMAIN

# Verificar subdominios
for subdomain in "${SUBDOMAINS[@]}"; do
    check_ssl "${subdomain}.${DOMAIN}"
done
```

### 6.3 Configurar Cron para Monitoreo
```bash
# Agregar al crontab
sudo crontab -e

# Verificar SSL cada hora
0 * * * * /usr/local/bin/ssl-monitor.sh
```

---

## 🔧 Paso 7: Configuración para Vercel (Alternativa)

Si usas Vercel, puedes configurar SSL automáticamente:

### 7.1 Configurar Dominio en Vercel
```bash
# En el dashboard de Vercel
1. Ir a Settings > Domains
2. Agregar dominio: ticketera.com
3. Agregar wildcard: *.ticketera.com
4. Configurar DNS según instrucciones de Vercel
```

### 7.2 vercel.json para Subdominios
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/tenant-handler?path=$1"
    }
  ],
  "functions": {
    "api/tenant-handler.js": {
      "maxDuration": 30
    }
  }
}
```

---

## 📊 Paso 8: Métricas y Logs

### 8.1 Configurar Logs de SSL
```nginx
# En la configuración de Nginx
error_log /var/log/nginx/ssl_error.log;
access_log /var/log/nginx/ssl_access.log;
```

### 8.2 Monitoreo de Certificados
```bash
# Verificar fecha de expiración
openssl x509 -in /etc/letsencrypt/live/ticketera.com/fullchain.pem -text -noout | grep "Not After"

# Verificar renovación automática
sudo certbot certificates
```

---

## 🎯 Resumen de Comandos Rápidos

```bash
# 1. Obtener certificado wildcard
sudo certbot certonly --manual --preferred-challenges=dns -d *.ticketera.com -d ticketera.com

# 2. Verificar configuración Nginx
sudo nginx -t

# 3. Recargar Nginx
sudo systemctl reload nginx

# 4. Verificar certificado
openssl s_client -connect ticketera.com:443 -servername ticketera.com

# 5. Renovación de prueba
sudo certbot renew --dry-run

# 6. Verificar logs
sudo tail -f /var/log/nginx/error.log
```

---

## ⚠️ Consideraciones Importantes

### Seguridad
- **HSTS**: Configurado automáticamente
- **CSP**: Considerar implementar Content Security Policy
- **Rate Limiting**: Implementar para prevenir abuso

### Rendimiento
- **OCSP Stapling**: Habilitado por defecto en configuraciones modernas
- **Session Resumption**: Configurado para mejor rendimiento
- **HTTP/2**: Habilitado automáticamente

### Backup
- **Certificados**: Backup automático en `/etc/letsencrypt/`
- **Configuración**: Backup de archivos de configuración
- **Logs**: Rotación automática de logs

---

¿Necesitas ayuda con algún paso específico o tienes preguntas sobre la configuración?
