-- Teléfono propio del alumno (opcional), distinto de los contactos principal y de emergencia.
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone text;
