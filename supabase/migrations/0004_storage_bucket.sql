-- =====================================================================
-- 0004_storage_bucket.sql — privater Storage-Bucket für Avatare
-- =====================================================================

-- Privater Bucket — kein direkter Public-Read.
-- Auslieferung läuft ausschließlich über die /api/avatar/*-Routen,
-- die mit Service-Role-Key auf den Bucket zugreifen.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 524288, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 524288,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];
