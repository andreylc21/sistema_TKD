-- Hora real de cada clase: se marca al darla (started_at) y al terminarla (ended_at). Si nadie la termina,
-- se considera terminada cuando pasa la duración de su horario contada desde started_at.
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS ended_at timestamptz;
