create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'career-direct-operations-monitor';

select cron.schedule(
  'career-direct-operations-monitor',
  '0 0 * * *',
  $$
  select net.http_get(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'career_direct_site_url'
      limit 1
    ) || '/api/cron/operations-monitor',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'career_direct_cron_secret'
        limit 1
      )
    ),
    timeout_milliseconds := 20000
  );
  $$
);

select jobid, jobname, schedule, active
from cron.job
where jobname = 'career-direct-operations-monitor';
