CREATE OR REPLACE FUNCTION public.mask_name(p_name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN p_name IS NULL OR length(trim(p_name)) = 0 THEN 'Anonymous'
    WHEN position(' ' in trim(p_name)) = 0 THEN initcap(trim(p_name))
    ELSE initcap(split_part(trim(p_name), ' ', 1)) || ' ' ||
         upper(left(split_part(trim(p_name), ' ', 2), 1)) || '.'
  END
$function$;