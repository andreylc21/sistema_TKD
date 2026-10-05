# Arquitectura y contratos

`docs/openapi.yaml` es el contrato público del sistema. Cualquier cambio en una ruta debe actualizar en el mismo cambio el esquema OpenAPI, el DTO del backend y el tipo o formulario consumidor del frontend.

El contrato es la fuente de verdad de transporte, no de reglas de negocio. OpenAPI define forma, obligatoriedad, códigos y autenticación; PostgreSQL y los módulos Go garantizan aislamiento, transacciones, saldos e invariantes.

## Dependencias

- `frontend/src/features/*` consume exclusivamente `shared/api`, `shared/ui`, `shared/lib` y `shared/layout`.
- `frontend/src/app` compone módulos y mantiene únicamente navegación, sesión y carga inicial.
- Cada feature expone operaciones HTTP tipadas desde su carpeta `api/`; ESLint impide que páginas y componentes importen directamente el cliente de bajo nivel.
- Las páginas seleccionan vistas y coordinan diálogos. Formularios, tablas y detalles viven en componentes con una responsabilidad reconocible.
- Los handlers HTTP traducen el contrato y delegan reglas reutilizables a los módulos de dominio.
- Los módulos de dominio no dependen de Gin.
- PostgreSQL impone relaciones, unicidad, aislamiento por escuela e invariantes que no deben depender sólo de la interfaz.
- `frontend/src/shared/api/generated.ts` se genera, no se edita. Los DTO públicos de `contracts.ts` se derivan de él.
- Los reintentos conservan `Idempotency-Key`; el backend reserva la clave en la misma transacción que crea el recurso.

## Cambiar una operación

1. Modificar primero el esquema y respuestas en `openapi.yaml`.
2. Actualizar modelo, validación y servicio del módulo Go correspondiente.
3. Actualizar handler y repositorio PostgreSQL dentro de la misma transacción cuando aplique.
4. Actualizar el contrato TypeScript y la vista consumidora.
5. Añadir o ajustar la prueba de regla, contrato o integración.
6. Ejecutar `make verify` desde la raíz.

El contrato documenta sólo operaciones de negocio; no existe CRUD genérico para eludir estados, historial o validaciones.

## Criterios de revisión

- Una operación nueva tiene `operationId` único, esquema sin propiedades extra cuando corresponde y respuestas esperadas.
- Ningún handler acepta `schoolId` como autoridad; la escuela proviene de la cookie de sesión.
- Una escritura compuesta usa una sola transacción y no confirma resultados parciales.
- `POST /orders/{id}/progress` bloquea el pedido y todos sus artículos activos, valida la lista completa de versiones antes del primer `UPDATE` y conserva recepción, entrega, solicitud al proveedor y pagos como dimensiones separadas.
- El frontend no calcula una nueva fuente de verdad; recarga el estado confirmado por la API.
- Los mensajes de error no filtran SQL, secretos ni datos de otra escuela.

## Barreras automáticas

- OpenAPI genera los DTO de escritura consumidos por las API de cada feature.
- TypeScript usa modo estricto y no permite JavaScript dentro de `src`.
- ESLint aplica reglas de React Hooks, Fast Refresh y límites de dependencias.
- Prettier evita archivos comprimidos o estilos de formato divergentes.
- Vitest cubre cálculos de presentación que pueden cambiar el significado de un estado.
- `go test` cubre reglas independientes de Gin; `go vet` revisa errores estáticos del backend.
