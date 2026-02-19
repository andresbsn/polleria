# Sistema POS Pollería con Facturación Electrónica (AFIP)

Sistema de Punto de Venta (POS) moderno diseñado para Pollerías, con integración directa a AFIP para facturación electrónica (Factura A y B).

## Stack Tecnológico 🛠️
- **Frontend**: React + Vite + Vanilla CSS (Modern Glassmorphism)
- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL
- **Facturación**: Integración directa WSAA (SOAP) + WSFEv1
- **Contenedores**: Docker Compose

## Requisitos Previos
- Docker & Docker Compose
- Node.js v18+ (para desarrollo local sin docker)

## Instrucciones de Instalación 🚀

1. **Clonar el repositorio** y navegar a la carpeta raíz.

2. **Configuración de Variables de Entorno**:
   - Backend: Revisar `backend/.env`
   - Frontend: Revisar `frontend/.env` (o `docker-compose.yml` environment)

3. **Ejecutar con Docker**:
   ```bash
   docker-compose up --build
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - BD: Puerto 5432

## Configuración AFIP (Homologación vs Producción) 🧾

El sistema está configurado por defecto para **Homologación** (Testing) con un MOCK interno si no se encuentran certificados.

### Paso 1: Generar Certificados (Para Homologación o Producción)
Necesitas generar un par de claves (Privada/Pública) y obtener el certificado CSR.

1. **Generar Key Privada**:
   ```bash
   openssl genrsa -out backend/certs/key.key 2048
   ```

2. **Generar CSR (Certificate Signing Request)**:
   ```bash
   openssl req -new -key backend/certs/key.key -out backend/certs/request.csr
   ```
   *Nota: Completa los datos requeridos (O=NombreEmpresa, C=AR, serialNumber=CUIT xxxxxxxxxxx)*

### Paso 2: Obtener Certificado en AFIP
1. Ingresar a AFIP con Clave Fiscal.
2. Ir a "Administración de Certificados Digitales".
3. Seleccionar el Alias y subir el `request.csr`.
4. Descargar el certificado `.crt` o `.pem`.
5. Guardarlo en `backend/certs/cert.pem`.

### Paso 3: Autorizar Puntos de Venta
1. En AFIP, ir a "Administración de Puntos de Venta y Domicilios".
2. Crear un nuevo Punto de Venta para "Web Services" (Factura Electrónica).
3. Tomar nota del número (ej. 1, 2, 5).
4. Configurar este número en la llamada al servicio de facturación (Por defecto está en 1 en el código).

### Paso 4: Configurar .env
En `backend/.env`:
```env
AFIP_PRODUCTION=false  # true para Producción
AFIP_CUIT=20xxxxxxxx1
AFIP_CERT_PATH=./certs/cert.pem
AFIP_KEY_PATH=./certs/key.key
```

### Paso 5: Producción ⚠️
Para pasar a producción:
1. Cambiar `AFIP_PRODUCTION=true`.
2. Repetir el proceso de certificados en el entorno de Producción de AFIP (wsaa.afip.gov.ar).
3. Asegurarse de tener el Punto de Venta de Producción habilitado.

## Uso del Sistema
1. **Productos**: Cargar productos en la DB (ya hay seeds iniciales).
2. **Venta**: Seleccionar productos > Cobrar.
3. **Facturar**: En el modal de cobro, tildar "Emitir Factura AFIP".
   - Si se deja CUIT vacío: Consumidor Final (Factura B < Monto Limite).
   - Si se ingresa CUIT: Intenta Factura A/B según condición fiscal (Simplificado).

## Solución de Problemas
- **Error "Certificates not found"**: El sistema usará un Mock y no emitirá facturas reales.
- **Error de Conexión AFIP**: Revisar firewall y validez del certificado (duran 2 años).
