-- Catálogo de artículos para pedidos: nombre, tallas disponibles y un precio por artículo.
-- El precio de cada pedido se guarda en el pedido, así que cambiar el catálogo no altera los anteriores.
CREATE TABLE IF NOT EXISTS catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  sizes text[] NOT NULL DEFAULT '{}',
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS catalog_items_name_unique ON catalog_items (school_id, lower(name));
