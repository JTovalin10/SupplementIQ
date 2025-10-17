-- Create audit_logs table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    details JSONB,
    success BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON public.audit_logs (operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON public.audit_logs (success);

-- RLS policies for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view audit logs
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('owner', 'admin')
        )
    );

-- Only system can insert audit logs (via service role)
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create a function to clean up old audit logs (keep last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.audit_logs 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Log the cleanup operation
    INSERT INTO public.audit_logs (
        user_id, 
        operation, 
        details, 
        success, 
        ip_address
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, -- System user
        'AUDIT_CLEANUP',
        jsonb_build_object('deleted_count', ROW_COUNT),
        true,
        'system'
    );
END;
$$;

-- Create a scheduled job to run cleanup daily (this would need to be set up in Supabase)
-- For now, you can run it manually: SELECT public.cleanup_old_audit_logs();

