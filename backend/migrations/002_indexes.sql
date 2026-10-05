CREATE INDEX IF NOT EXISTS notes_student_date_idx ON student_notes(school_id, student_id, note_date DESC);
CREATE INDEX IF NOT EXISTS sessions_group_date_idx ON class_sessions(school_id, group_id, session_date DESC);
CREATE INDEX IF NOT EXISTS participants_session_idx ON session_participants(school_id, session_id);
CREATE INDEX IF NOT EXISTS charges_student_due_idx ON charges(school_id, student_id, due_date);
CREATE INDEX IF NOT EXISTS payments_charge_idx ON payments(school_id, charge_id, status);
CREATE INDEX IF NOT EXISTS payments_received_idx ON payments(school_id, received_on, status);
CREATE INDEX IF NOT EXISTS orders_student_idx ON orders(school_id, student_id, created_at DESC);

