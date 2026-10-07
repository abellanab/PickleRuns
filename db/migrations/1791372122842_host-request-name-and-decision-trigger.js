export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql("ALTER TABLE public.host_requests ADD COLUMN display_name text NOT NULL;");

  pgm.sql("DROP TRIGGER IF EXISTS trg_auto_approve_host_request ON public.host_requests;");
  pgm.sql("DROP FUNCTION IF EXISTS public.auto_approve_host_request();");

  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.stamp_host_request_decision()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.status = 'pending' AND NEW.status IN ('approved', 'denied') THEN
        NEW.decided_at = now();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_stamp_host_request_decision
      BEFORE UPDATE OF status ON public.host_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.stamp_host_request_decision();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS trg_stamp_host_request_decision ON public.host_requests;");
  pgm.sql("DROP FUNCTION IF EXISTS public.stamp_host_request_decision();");

  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.auto_approve_host_request()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Logic for automatic approval could go here
      -- For now, this is a placeholder to enable the dashboard-driven flow
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER trg_auto_approve_host_request
      BEFORE INSERT ON public.host_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_approve_host_request();
  `);

  pgm.sql("ALTER TABLE public.host_requests DROP COLUMN display_name;");
};
