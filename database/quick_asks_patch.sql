CREATE TABLE IF NOT EXISTS public.quick_asks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'text',
    is_urgent BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending',
    doctor_reply TEXT,
    asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.quick_asks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert their own quick asks"
    ON public.quick_asks FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can view their own quick asks"
    ON public.quick_asks FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view all quick asks"
    ON public.quick_asks FOR SELECT
    USING ( EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor') );

CREATE POLICY "Doctors can update quick asks"
    ON public.quick_asks FOR UPDATE
    USING ( EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor') );
