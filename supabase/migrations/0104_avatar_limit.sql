-- 0104_avatar_limit.sql — Avatar-Bucket-Limit auf 2 MB erhöhen
-- Phone-Selfies sind oft > 512 KB; Client komprimiert auf ~200 KB, aber wir
-- lassen Sicherheitspuffer bis 2 MB.
UPDATE storage.buckets
   SET file_size_limit = 2 * 1024 * 1024
 WHERE id = 'avatars';
