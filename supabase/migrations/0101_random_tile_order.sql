-- 0101 — Echte Zufallspermutation via array_agg + ORDER BY random()
CREATE OR REPLACE FUNCTION public.random_tile_order() RETURNS INT[] AS $$
DECLARE
  result INT[];
BEGIN
  SELECT array_agg(i ORDER BY random()) INTO result
    FROM generate_series(1, 9) AS i;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;
