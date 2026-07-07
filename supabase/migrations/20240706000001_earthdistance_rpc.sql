CREATE OR REPLACE FUNCTION get_nearby_centers(
  p_service_id uuid,
  p_lat double precision,
  p_lng double precision
)
RETURNS TABLE (
  id uuid,
  name text,
  district text,
  mandal text,
  village_or_town text,
  address text,
  latitude double precision,
  longitude double precision,
  distance_miles double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.name, c.district, c.mandal, c.village_or_town, c.address, c.latitude, c.longitude,
    -- point(longitude, latitude) is the syntax for earthdistance
    (point(c.longitude, c.latitude) <@> point(p_lng, p_lat)) as distance_miles
  FROM service_centers c
  INNER JOIN service_center_mappings m ON c.id = m.center_id
  WHERE m.service_id = p_service_id AND c.is_active = true
  ORDER BY distance_miles ASC;
END;
$$;
