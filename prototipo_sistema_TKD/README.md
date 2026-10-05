# Sistema TKD · Prototipo navegable

Prototipo estructural de la versión B, construido con HTML, CSS y JavaScript sin framework. Utiliza únicamente datos ficticios y no incluye servidor, autenticación ni persistencia.

## Ejecutar

Desde este directorio:

```bash
python3 -m http.server 8080
```

Después abre `http://localhost:8080` en el navegador. También puede abrirse `index.html` directamente para una revisión rápida.

## Alcance simulado

- Navegación, filtros, pestañas, detalles y calendario funcionan en memoria.
- Los datos se reinician al recargar la página.
- Las acciones de alta, edición, captura, exportación y autenticación están marcadas como disponibles en una etapa posterior.
- No se realizan cobros, exportaciones, envíos, integraciones ni cambios en expedientes reales.
