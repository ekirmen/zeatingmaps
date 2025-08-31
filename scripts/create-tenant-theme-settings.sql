-- Create table to persist per-tenant theme settings (seat colors, etc.)
create table if not exists public.tenant_theme_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tenant_theme_settings_updated on public.tenant_theme_settings;
create trigger trg_tenant_theme_settings_updated
before update on public.tenant_theme_settings
for each row execute function public.set_updated_at();

-- RLS (optional): allow tenants to read their own settings; adapt as needed
alter table public.tenant_theme_settings enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'tenant_theme_select') then
    create policy tenant_theme_select on public.tenant_theme_settings
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'tenant_theme_upsert') then
    create policy tenant_theme_upsert on public.tenant_theme_settings
      for all using (true) with check (true);
  end if;
end $$;


