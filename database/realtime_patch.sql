-- Enable Realtime for the required tables
BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'appointments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'prescriptions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quick_asks') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE quick_asks;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'alerts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
    END IF;
END $$;
COMMIT;
