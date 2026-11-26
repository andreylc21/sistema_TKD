-- Los artículos se agrupan como en la lista de precios: Uniformes y Equipo de protección.
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Equipo de protección'
  CHECK (category IN ('Uniformes','Equipo de protección'));
UPDATE catalog_items SET category='Uniformes'
WHERE lower(name) ~ '^(uniforme|cinta|karategui|pants|tenis|dobok)';
