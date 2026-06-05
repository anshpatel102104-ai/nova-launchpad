-- Schedule the feedback-loop edge function every 30 minutes via pg_cron + pg_net.
-- pg_cron and pg_net are available on all Supabase projects.

SELECT cron.schedule(
  'feedback-loop-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url') || '/functions/v1/feedback-loop',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
