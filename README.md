# Sistema TKD

Aplicación web en desarrollo para la administración de una escuela de taekwondo. Utiliza una identidad visual basada en azul, amarillo, blanco y negro; el rojo queda reservado para errores y acciones destructivas. La interfaz se conecta a una API REST en Go con PostgreSQL como fuente de verdad.

## Carpetas

- `prototipo_sistema_TKD/`: prototipo visual estático de referencia. No consume la API.
- `frontend/`: aplicación real en React, TypeScript y Vite. No depende de `prototipo_sistema_TKD/app.js`.
- `backend/`: API REST en Go/Gin, reglas de negocio, PostgreSQL, migraciones, semilla y pruebas.
- `docs/openapi.yaml`: contrato OpenAPI 3.1 que guía solicitudes, respuestas y errores.
- `docs/architecture.md`: límites entre módulos y proceso para cambiar el contrato.

El frontend y `/api` se sirven desde el mismo origen. No se necesita configurar CORS.

## Inicio rápido con Docker

Requisitos: Docker con el daemon activo y Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Abre <http://localhost:8080> e inicia sesión con:

- Correo: `maestra@sistematkd.local`
- Contraseña: `SistemaTKD2026!`

PostgreSQL usa un volumen persistente. La aplicación aplica migraciones y carga la semilla idempotente al iniciar cuando `SEED_DEMO=true`.

## Ejecución sin Docker

Con Go 1.24+ y PostgreSQL 18 disponible:

```bash
cd frontend
npm ci
npm run build
cd ..

createdb tkd
cd backend
DATABASE_URL='postgres://localhost/tkd?sslmode=disable' \
MIGRATIONS_DIR=migrations SEED_FILE=seed/001_demo.sql \
go run ./cmd/seed

go build -o ../tkd-server ./cmd/server
cd ..
DATABASE_URL='postgres://localhost/tkd?sslmode=disable' \
MIGRATIONS_DIR=backend/migrations SEED_FILE=backend/seed/001_demo.sql \
SEED_DEMO=false ./tkd-server
```

## Flujos implementados

- Sesión local con cookie `HttpOnly`, `SameSite=Lax`, vencimiento y protección CSRF.
- Aislamiento de cada consulta y mutación por `school_id`.
- Alumnos activos e inactivos, expediente, alta, edición API, notas, desactivación y reactivación con periodos de actividad.
- Grupos, sesiones por fecha, alumno invitado y cuatro estados de asistencia.
- Cobros en centavos, pagos parciales, anulación con historial, descuentos y saldos.
- Pedidos y artículos con avance independiente de solicitado, recibido, entregado y pagado.
- Generación idempotente de mensualidades por periodo; el día 31 cae en el último día de febrero y vuelve al 31 en marzo.
- Versionado optimista para evitar sobrescrituras silenciosas.
- Inicio, calendario y reportes alimentados por los registros persistidos principales; los exámenes históricos permanecen como antecedente visual de solo lectura.
- Clases del día seleccionables por fecha, separadas de los grupos y horarios recurrentes; comentarios de asistencia confirmados y notas de seguimiento vinculadas al expediente.
- Cobros con avance de pago y vencimiento independientes, filtros por cargo y registro de pago guiado por alumno, saldo actual y saldo resultante.
- Recepción y entrega de pedidos por cantidad, más operaciones globales atómicas que nunca entregan mercancía no recibida.

## Criterios de interfaz

- La interfaz carga localmente Noto Sans variable (pesos 400–700). SUIT se evaluó y se descartó porque el archivo oficial revisado no cubría los caracteres españoles requeridos; la licencia de Noto Sans se conserva junto al WOFF2 en `frontend/public/fonts/`.
- “Comentario de asistencia” pertenece a un alumno en una clase concreta; “nota de seguimiento” pertenece al expediente y puede conservar el origen de clase; “comentario del pago” no sustituye el motivo obligatorio de corrección o anulación.
- La ayuda general aparece junto al título. Fecha, horario, alumno, pedido, periodo, estado y restricciones necesarias permanecen visibles en su contexto operativo.
- Inicio ofrece accesos al registro concreto para pasar lista, registrar un pago, revisar un pedido o abrir el expediente, sin prometer funciones que no existen.

## Verificación

```bash
make verify
```

También puede ejecutarse cada parte por separado:

```bash
cd frontend && npm run contract:check && npm run typecheck && npm run build
cd backend && go test ./... && go vet ./...
docker compose config
```

`npm run contract:check` regenera los tipos TypeScript desde OpenAPI y falla si el archivo generado no coincide. Las pruebas Go comprueban reglas financieras y que cada operación pública esté documentada una sola vez. Las creaciones y pagos relevantes usan `Idempotency-Key`; el frontend conserva la misma clave al reintentar un formulario fallido.

Las pruebas de integración de `backend/internal/app` necesitan una base desechable y se omiten sin ella: `TEST_DATABASE_URL='postgres://usuario@localhost/tkd_test?sslmode=disable' go test ./internal/app`. Reinician los datos demo de esa base.

En el frontend, `npm run verify` ejecuta en orden contrato, Prettier, ESLint, TypeScript estricto, Vitest y la compilación de producción. No se considera válido un cambio que sólo compile pero incumpla formato, reglas de React o pruebas.

## Reglas de desarrollo

- Cambiar primero `docs/openapi.yaml`; después adaptar DTO, regla/servicio, persistencia y consumidor React.
- Validar siempre en el servidor. La validación del navegador es sólo ayuda inmediata.
- Guardar dinero como centavos enteros y agrupar escrituras relacionadas en una transacción.
- Obtener `school_id` de la sesión, nunca del cuerpo enviado por el navegador.
- Usar versión optimista al editar e idempotencia al crear.
- Mantener el prototipo estático separado del frontend ejecutable.
- Las páginas coordinan; los componentes renderizan formularios y tablas; `features/*/api` es la única capa que usa el cliente HTTP de bajo nivel.
- No editar `frontend/src/shared/api/generated.ts`: se regenera con `npm run contract:generate`.

## Heurísticas de Nielsen aplicadas

La interfaz muestra estados de carga, éxito y error; usa el mismo vocabulario en navegación y contenido; conserva datos de formularios ante un fallo; solicita confirmación para anulaciones y eliminaciones; previene sobrepagos y cantidades imposibles; permite volver desde detalles; evita repetir títulos en la barra global; muestra instrucciones breves en pagos manuales; y ofrece estados vacíos y mensajes comprensibles. Los diálogos administran foco, Escape, recorrido contenido de Tab y Shift+Tab, y retorno al control que los abrió.

## Decisiones del entorno local

- `DEMO_MODE=true` fija la fecha operativa en `DEMO_DATE` para producir resultados repetibles. En un entorno real debe desactivarse.
- Los consentimientos son simulados y no sustituyen documentos legales.
- La imagen no publica ni despliega el sistema; sólo prepara una ejecución local.
- Cambia `SESSION_SECRET`, las credenciales y `SECURE_COOKIES=true` antes de cualquier uso fuera de desarrollo.
