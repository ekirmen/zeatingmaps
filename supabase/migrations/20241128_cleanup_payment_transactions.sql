-- Normalize canonical fields before dropping legacy duplicates
UPDATE public.payment_transactions pt
SET
  user_id = COALESCE(pt.user_id, pt.usuario_id, pt."user"),
  amount = COALESCE(pt.amount, pt.monto),
  evento_id = COALESCE(pt.evento_id, pt.event),
  funcion_id = COALESCE(pt.funcion_id, pt.funcion),
  created_at = COALESCE(pt.created_at, pt.fecha, NOW())
WHERE
  pt.user_id IS NULL
  OR pt.amount IS NULL
  OR pt.evento_id IS NULL
  OR pt.funcion_id IS NULL
  OR pt.created_at IS NULL;

-- Ensure processed_by only contains valid profile references
UPDATE public.payment_transactions pt
SET processed_by = NULL
WHERE processed_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = pt.processed_by
  );

-- Add foreign key to link processed_by with profiles
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_processed_by_fkey
  FOREIGN KEY (processed_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Keep legacy columns in sync with canonical fields for backward compatibility
CREATE OR REPLACE FUNCTION public.sync_payment_transaction_legacy_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.usuario_id := COALESCE(NEW.user_id, NEW.usuario_id);
  NEW."user" := COALESCE(NEW.user_id, NEW."user");
  NEW.monto := COALESCE(NEW.amount, NEW.monto);
  NEW.event := COALESCE(NEW.evento_id, NEW.event);
  NEW.funcion := COALESCE(NEW.funcion_id, NEW.funcion);
  NEW.fecha := COALESCE(NEW.created_at, NEW.fecha, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_payment_transactions_legacy ON public.payment_transactions;

CREATE TRIGGER tr_sync_payment_transactions_legacy
BEFORE INSERT OR UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_payment_transaction_legacy_columns();
