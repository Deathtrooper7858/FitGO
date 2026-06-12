-- Update search function to also search by name
DROP FUNCTION IF EXISTS search_users_by_email_or_id(text);

CREATE OR REPLACE FUNCTION search_users_by_email_or_id(search_query text)
RETURNS TABLE(id uuid, name text, email text, avatar_url text, name_color text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url,
         CASE WHEN u.is_pro AND (u.name_color IS NULL OR u.name_color = '') THEN '#EAB308' ELSE u.name_color END as name_color
  FROM public.users u
  WHERE u.email ILIKE '%' || search_query || '%'
     OR u.name ILIKE '%' || search_query || '%'
     OR u.id::text = search_query
  LIMIT 20;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url,
         CASE WHEN u.is_pro AND (u.name_color IS NULL OR u.name_color = '') THEN '#EAB308' ELSE u.name_color END as name_color
  FROM public.users u
  WHERE u.email ILIKE '%' || search_query || '%'
     OR u.name ILIKE '%' || search_query || '%'
  LIMIT 20;
END;
$$;
