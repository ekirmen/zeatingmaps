-- Crea la tabla para almacenar la configuración de correo SMTP por tenant
create table if not exists public.tenant_email_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null default 'smtp',
  smtp_host text not null,
  smtp_port integer not null default 587,
  smtp_secure boolean not null default false,
  smtp_user text not null,
  smtp_pass text not null,
  from_email text not null,
  from_name text not null,
  reply_to text,
  is_active boolean not null default true,
  is_global boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices de soporte
create index if not exists tenant_email_config_tenant_id_idx
  on public.tenant_email_config(tenant_id);

-- Habilita RLS para proteger la configuración
alter table public.tenant_email_config enable row level security;

-- Permite a los usuarios autenticados del mismo tenant ver su configuración
create policy if not exists "tenant_email_config_select"
  on public.tenant_email_config
  for select
  using (auth.uid() in (
    select id
    from public.profiles
    where tenant_id = tenant_email_config.tenant_id
  ));

-- Permite a administradores del tenant gestionar la configuración
create policy if not exists "tenant_email_config_manage"
  on public.tenant_email_config
  for all
  using (auth.uid() in (
    select id
    from public.profiles
    where tenant_id = tenant_email_config.tenant_id
      and role in ('admin', 'owner', 'super_admin')
  ));

-- Trigger para mantener updated_at al día
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenant_email_config_set_updated_at
  before update on public.tenant_email_config
  for each row
  execute function public.set_updated_at();
