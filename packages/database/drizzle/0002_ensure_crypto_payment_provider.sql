DO $$
DECLARE
  enum_schema text;
BEGIN
  SELECT n.nspname
    INTO enum_schema
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typname = 'PaymentProvider'
  ORDER BY CASE
    WHEN n.nspname = current_schema() THEN 0
    WHEN n.nspname = 'public' THEN 1
    ELSE 2
  END
  LIMIT 1;

  IF enum_schema IS NULL THEN
    RAISE EXCEPTION 'PaymentProvider enum type does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PaymentProvider'
      AND n.nspname = enum_schema
      AND e.enumlabel = 'CRYPTO'
  ) THEN
    EXECUTE format('ALTER TYPE %I.%I ADD VALUE %L', enum_schema, 'PaymentProvider', 'CRYPTO');
  END IF;
END $$;
