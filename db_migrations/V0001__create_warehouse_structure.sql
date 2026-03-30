
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS racks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id),
  name TEXT NOT NULL,
  rows_count INT NOT NULL DEFAULT 4,
  cols_count INT NOT NULL DEFAULT 5,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id UUID NOT NULL REFERENCES racks(id),
  zone_id UUID NOT NULL REFERENCES zones(id),
  row_num INT NOT NULL,
  col_num INT NOT NULL,
  label TEXT NOT NULL,
  barcode TEXT NOT NULL UNIQUE,
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rack_id, row_num, col_num)
);

CREATE INDEX IF NOT EXISTS idx_racks_zone ON racks(zone_id);
CREATE INDEX IF NOT EXISTS idx_cells_rack ON cells(rack_id);
CREATE INDEX IF NOT EXISTS idx_cells_zone ON cells(zone_id);
CREATE INDEX IF NOT EXISTS idx_cells_barcode ON cells(barcode);
