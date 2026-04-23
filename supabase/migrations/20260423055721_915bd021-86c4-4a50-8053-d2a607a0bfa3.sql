-- Grant admin role to the project owner (Dhruv)
INSERT INTO public.user_roles (user_id, role)
VALUES ('45ef1276-bd0b-4c38-b876-cd93c8ba3241', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;