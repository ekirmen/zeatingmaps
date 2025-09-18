create table public.canales_venta (
  id serial not null,
  nombre character varying(255) not null,
  url character varying(500) not null,
  activo boolean null default true,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  tenant_id uuid null,
  tipo character varying(50) null default 'web'::character varying,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint canales_venta_pkey primary key (id),
  constraint canales_venta_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_canales_venta_tenant_id_fk on public.canales_venta using btree (tenant_id) TABLESPACE pg_default;

create table public.cms_pages (
  id serial not null,
  slug character varying(255) not null,
  nombre character varying(255) not null,
  descripcion text null,
  tipo character varying(50) null default 'custom'::character varying,
  estado character varying(20) null default 'draft'::character varying,
  meta_title character varying(255) null,
  meta_description text null,
  meta_keywords text null,
  og_image character varying(500) null,
  configuracion jsonb null default '{}'::jsonb,
  widgets jsonb null default '{"footer": [], "header": [], "content": []}'::jsonb,
  css_custom text null,
  js_custom text null,
  usuario_creador uuid null,
  fecha_publicacion timestamp without time zone null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  tenant_id uuid null,
  constraint cms_pages_pkey primary key (id),
  constraint cms_pages_slug_key unique (slug),
  constraint cms_pages_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_cms_pages_slug on public.cms_pages using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_cms_pages_tenant_id on public.cms_pages using btree (tenant_id) TABLESPACE pg_default;

create trigger update_cms_pages_updated_at BEFORE
update on cms_pages for EACH row
execute FUNCTION update_updated_at_column ();

create table public.comisiones_tasas (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  tipo character varying(20) not null,
  valor numeric(10, 2) not null default 0,
  fijo numeric(10, 2) not null default 0,
  activo boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  type character varying(50) null default 'percentage'::character varying,
  value jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  description text null,
  tenant_id uuid null,
  constraint comisiones_tasas_pkey primary key (id),
  constraint comisiones_tasas_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint comisiones_tasas_tipo_check check (
    (
      (tipo)::text = any (
        (
          array[
            'porcentaje'::character varying,
            'fijo'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_comisiones_tasas_tenant_id_fk on public.comisiones_tasas using btree (tenant_id) TABLESPACE pg_default;

create table public.email_campaigns (
  id serial not null,
  nombre character varying(255) not null,
  tipo character varying(50) not null default 'newsletter'::character varying,
  estado character varying(20) not null default 'draft'::character varying,
  configuracion jsonb null default '{}'::jsonb,
  total_enviados integer null default 0,
  total_fallidos integer null default 0,
  fecha_envio timestamp without time zone null,
  fecha_actualizacion timestamp without time zone null default CURRENT_TIMESTAMP,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  tenant_id uuid null,
  constraint email_campaigns_pkey primary key (id),
  constraint email_campaigns_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_email_campaigns_tenant_id on public.email_campaigns using btree (tenant_id) TABLESPACE pg_default;

create trigger update_email_campaigns_updated_at BEFORE
update on email_campaigns for EACH row
execute FUNCTION update_updated_at_column ();

create table public.email_templates (
  id uuid not null default gen_random_uuid (),
  nombre character varying(255) not null,
  tipo_reporte character varying(50) not null,
  tenant_id uuid null,
  configuracion_diseno jsonb null default '{"body": {"fontSize": "14px", "textColor": "#333333", "fontFamily": "Arial, sans-serif", "lineHeight": "1.6", "backgroundColor": "#ffffff"}, "colors": {"info": "#1890ff", "error": "#ff4d4f", "primary": "#1890ff", "success": "#52c41a", "warning": "#faad14", "secondary": "#52c41a"}, "footer": {"text": "© 2024 Tu Empresa. Todos los derechos reservados.", "links": [], "textColor": "#666666", "backgroundColor": "#f5f5f5"}, "header": {"logo": null, "title": "Reporte de Ventas", "subtitle": null, "textColor": "#ffffff", "backgroundColor": "#1890ff"}, "layout": {"padding": "20px", "maxWidth": "600px", "boxShadow": "0 2px 8px rgba(0,0,0,0.1)", "borderRadius": "8px"}}'::jsonb,
  estructura_contenido jsonb null default '{"sections": [{"type": "header", "content": "Resumen del Reporte"}, {"type": "summary", "content": "Estadísticas principales"}, {"type": "table", "content": "Datos detallados"}, {"type": "footer", "content": "Información adicional"}]}'::jsonb,
  activo boolean null default true,
  es_predeterminado boolean null default false,
  version character varying(10) null default '1.0'::character varying,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  created_by uuid null,
  constraint email_templates_pkey primary key (id),
  constraint email_templates_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint email_templates_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_email_templates_tenant_id on public.email_templates using btree (tenant_id) TABLESPACE pg_default;

create table public.entradas (
  id uuid not null default extensions.uuid_generate_v4 (),
  nombre_entrada text null,
  min integer null,
  max integer null,
  tipo_producto text null,
  recinto integer not null,
  created_at timestamp with time zone null default now(),
  iva integer not null,
  tenant_id uuid null,
  constraint entradas_pkey primary key (id),
  constraint entradas_iva_fkey foreign KEY (iva) references ivas (id),
  constraint entradas_recinto_fkey foreign KEY (recinto) references recintos (id),
  constraint entradas_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_entradas_recinto_fk on public.entradas using btree (recinto) TABLESPACE pg_default;

create index IF not exists idx_entradas_tenant_id on public.entradas using btree (tenant_id) TABLESPACE pg_default;

create table public.eventos (
  id uuid not null default extensions.uuid_generate_v4 (),
  nombre character varying(255) not null,
  recinto integer not null,
  usuario_id uuid null,
  activo boolean null,
  analytics text null,
  "datosBoleto" text null,
  "datosComprador" text null,
  desactivado boolean null,
  "descripcionEstado" text null,
  "estadoPersonalizado" text null,
  "estadoVenta" text null,
  "mostrarDatosBoleto" text null,
  "mostrarDatosComprador" text null,
  oculto boolean null,
  "otrasOpciones" text null,
  sala integer null,
  sector text null,
  descripcion text null,
  slug text null,
  tags text null,
  "descripcionHTML" text null,
  "resumenDescripcion" text null,
  created_at timestamp with time zone null default now(),
  imagenes text null,
  tenant_id uuid null,
  plantilla_precios_id uuid null,
  recinto_id integer null,
  "modoVenta" text null default 'normal'::text,
  "sectorPersonalizado" text null,
  constraint eventos_pkey primary key (id),
  constraint eventos_recinto_fkey foreign KEY (recinto) references recintos (id) on delete CASCADE,
  constraint eventos_recinto_id_fkey foreign KEY (recinto_id) references recintos (id) on delete CASCADE,
  constraint eventos_sala_fkey foreign KEY (sala) references salas (id) on update CASCADE,
  constraint eventos_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint eventos_usuario_id_fkey foreign KEY (usuario_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_eventos_recinto_fk on public.eventos using btree (recinto) TABLESPACE pg_default;

create index IF not exists idx_eventos_recinto_id_fk on public.eventos using btree (recinto_id) TABLESPACE pg_default;

create index IF not exists idx_eventos_sala_fk on public.eventos using btree (sala) TABLESPACE pg_default;

create index IF not exists idx_eventos_usuario_id_fk on public.eventos using btree (usuario_id) TABLESPACE pg_default;

create index IF not exists idx_eventos_modo_venta on public.eventos using btree ("modoVenta") TABLESPACE pg_default;

create index IF not exists idx_eventos_tenant_id on public.eventos using btree (tenant_id) TABLESPACE pg_default;

create table public.funciones (
  id serial not null,
  evento_id uuid not null,
  sala_id integer not null,
  plantilla integer null,
  fecha_celebracion timestamp with time zone not null,
  inicio_venta timestamp with time zone not null,
  fin_venta timestamp with time zone not null,
  pago_a_plazos boolean null default false,
  permitir_reservas_web boolean null default false,
  creadopor uuid null,
  created_at timestamp with time zone null default now(),
  plantilla_comisiones integer null,
  plantilla_producto uuid null,
  tiempo_caducidad_reservas integer null default '-120'::integer,
  fecha_liberacion_reservas timestamp with time zone null,
  tenant_id uuid null,
  es_principal boolean null default true,
  zona_horaria text null default 'America/Mexico_City'::text,
  lit_sesion text null,
  utiliza_lit_sesion boolean null default false,
  apertura_puertas timestamp with time zone null,
  promotional_session_label text null,
  session_belongs_season_pass boolean null default false,
  id_abono_sala uuid[] null,
  streaming_mode boolean null default false,
  overwrite_streaming_setup boolean null default false,
  streaming_type text null default 'ENETRES'::text,
  streaming_url text null,
  streaming_id text null,
  streaming_password text null,
  streaming_only_one_session_by_ticket boolean null default false,
  streaming_show_url boolean null default false,
  streaming_transmission_start timestamp with time zone null,
  streaming_transmission_stop timestamp with time zone null,
  plantilla_entradas integer null,
  plantilla_cupos integer null,
  id_barcode_pool integer null,
  permite_pago_plazos boolean null default false,
  num_plazos_pago integer null default 0,
  permite_reserva boolean null default false,
  misma_fecha_canales boolean null default true,
  canales jsonb null default '{"internet": {"fin": "", "activo": true, "inicio": ""}, "boxOffice": {"fin": "", "activo": true, "inicio": ""}}'::jsonb,
  cancellation_date_selected boolean null default false,
  end_date_cancellation timestamp with time zone null,
  ticket_printing_release_date_selected boolean null default false,
  ticket_printing_release_date integer null default 120,
  custom_printing_ticket_date timestamp with time zone null,
  custom_ses1 text null,
  custom_ses2 text null,
  visible_en_boleteria boolean null default true,
  visible_en_store boolean null default true,
  recinto_id integer null,
  updated_at timestamp with time zone null default now(),
  activo boolean null default true,
  constraint funciones_pkey primary key (id),
  constraint funciones_evento_id_fkey foreign KEY (evento_id) references eventos (id) on update CASCADE on delete set null,
  constraint funciones_creadopor_fkey foreign KEY (creadopor) references auth.users (id),
  constraint funciones_plantilla_fkey foreign KEY (plantilla) references plantillas (id) on delete set null,
  constraint funciones_sala_id_fkey foreign KEY (sala_id) references salas (id) on update CASCADE on delete set null,
  constraint funciones_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint funciones_plantilla_entradas_fkey foreign KEY (plantilla_entradas) references plantillas (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_funciones_sala_id on public.funciones using btree (sala_id) TABLESPACE pg_default;

create unique INDEX IF not exists funciones_sala_fecha_tenant_principal_uniq on public.funciones using btree (sala_id, fecha_celebracion, tenant_id) TABLESPACE pg_default
where
  es_principal;

create index IF not exists idx_funciones_tenant_id on public.funciones using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_funciones_fecha_celebracion on public.funciones using btree (fecha_celebracion) TABLESPACE pg_default;

create index IF not exists idx_funciones_visible_en_boleteria on public.funciones using btree (visible_en_boleteria) TABLESPACE pg_default;

create index IF not exists idx_funciones_visible_en_store on public.funciones using btree (visible_en_store) TABLESPACE pg_default;

create index IF not exists idx_funciones_evento_id on public.funciones using btree (evento_id) TABLESPACE pg_default;

create trigger update_funciones_updated_at BEFORE
update on funciones for EACH row
execute FUNCTION update_updated_at_column ();

create table public.global_email_config (
  id uuid not null default gen_random_uuid (),
  provider character varying(50) null default 'smtp'::character varying,
  smtp_host character varying(255) null,
  smtp_port integer null default 587,
  smtp_secure boolean null default false,
  smtp_user character varying(255) null,
  smtp_pass text null,
  from_email character varying(255) null,
  from_name character varying(255) null,
  reply_to character varying(255) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint global_email_config_pkey primary key (id)
) TABLESPACE pg_default;

create table public.ivas (
  id serial not null,
  nombre character varying(255) not null,
  porcentaje numeric not null,
  tenant_id uuid null,
  constraint ivas_pkey primary key (id),
  constraint ivas_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.mapas (
  id serial not null,
  sala_id integer not null,
  contenido jsonb not null,
  tenant_id uuid null,
  updated_at timestamp with time zone null default now(),
  nombre text null default 'Nuevo Mapa'::text,
  estado text null default 'draft'::text,
  created_at timestamp with time zone null default now(),
  descripcion text null,
  imagen_fondo text null,
  configuracion jsonb null default '{}'::jsonb,
  constraint mapas_pkey primary key (id),
  constraint fk_sala foreign KEY (sala_id) references salas (id) on delete CASCADE,
  constraint mapas_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_mapas_sala_id on public.mapas using btree (sala_id) TABLESPACE pg_default;

create unique INDEX IF not exists idx_sala_id on public.mapas using btree (sala_id) TABLESPACE pg_default;

create index IF not exists idx_mapas_tenant_id on public.mapas using btree (tenant_id) TABLESPACE pg_default;

create trigger update_mapas_updated_at BEFORE
update on mapas for EACH row
execute FUNCTION update_updated_at_column ();

create table public.payment_gateway_configs (
  id uuid not null default gen_random_uuid (),
  gateway_name character varying(50) not null,
  tenant_id uuid null,
  config jsonb not null,
  is_active boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint payment_gateway_configs_pkey primary key (id),
  constraint payment_gateway_configs_gateway_name_tenant_id_key unique (gateway_name, tenant_id),
  constraint payment_gateway_configs_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_payment_gateway_configs_tenant_id_fk on public.payment_gateway_configs using btree (tenant_id) TABLESPACE pg_default;

create trigger update_payment_gateway_configs_updated_at BEFORE
update on payment_gateway_configs for EACH row
execute FUNCTION update_updated_at_column ();

create table public.payment_methods (
  id uuid not null default gen_random_uuid (),
  method_id character varying(50) not null,
  name character varying(100) not null,
  type character varying(50) not null,
  enabled boolean null default true,
  config jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  tenant_id uuid null,
  processing_time character varying(50) null default 'Instantáneo'::character varying,
  fee_structure jsonb null default '{"fixed": 0, "percentage": 0}'::jsonb,
  supported_currencies jsonb null default '["USD"]'::jsonb,
  supported_countries jsonb null default '["US"]'::jsonb,
  is_recommended boolean null default false,
  icon character varying(100) null,
  description text null,
  constraint payment_methods_pkey primary key (id),
  constraint payment_methods_method_id_tenant_id_key unique (method_id, tenant_id),
  constraint payment_methods_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_tenant_id on public.payment_methods using btree (tenant_id) TABLESPACE pg_default;

create table public.payment_transactions (
  id uuid not null default gen_random_uuid (),
  order_id character varying(255) null,
  gateway_id uuid null,
  amount numeric(10, 2) not null,
  currency character varying(3) null default 'USD'::character varying,
  status character varying(50) not null,
  gateway_transaction_id character varying(255) null,
  gateway_response jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  user_id uuid null,
  evento_id uuid null,
  tenant_id uuid null,
  locator character varying(255) null,
  funcion_id integer null,
  payment_method character varying(100) null,
  gateway_name character varying(100) null,
  seats jsonb null,
  monto numeric(10, 2) null,
  usuario_id uuid null,
  event uuid null,
  funcion integer null,
  processed_by uuid null,
  payment_gateway_id uuid null,
  fecha timestamp with time zone null,
  payments jsonb null,
  referrer text null,
  "discountCode" text null,
  "reservationDeadline" timestamp with time zone null,
  "user" uuid null,
  constraint payment_transactions_pkey primary key (id),
  constraint fk_payment_transactions_funcion_id foreign KEY (funcion_id) references funciones (id),
  constraint fk_payment_transactions_tenant_id foreign KEY (tenant_id) references tenants (id),
  constraint fk_payment_transactions_user_id foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint payment_transactions_evento_id_fkey foreign KEY (evento_id) references eventos (id) on delete set null,
  constraint payment_transactions_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint fk_payment_transactions_evento_id foreign KEY (evento_id) references eventos (id) on delete set null,
  constraint payment_transactions_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_funcion_id_fk on public.payment_transactions using btree (funcion_id) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_tenant_id_fk on public.payment_transactions using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_status on public.payment_transactions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_user_id on public.payment_transactions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_evento_id on public.payment_transactions using btree (evento_id) TABLESPACE pg_default;

create table public.plantillas (
  id serial not null,
  nombre character varying(255) not null,
  detalles text null,
  recinto integer null,
  sala integer null,
  tenant_id uuid null,
  constraint plantillas_pkey primary key (id),
  constraint plantillas_recinto_fkey foreign KEY (recinto) references recintos (id),
  constraint plantillas_sala_fkey foreign KEY (sala) references salas (id)
) TABLESPACE pg_default;

create index IF not exists idx_plantillas_recinto_fk on public.plantillas using btree (recinto) TABLESPACE pg_default;

create index IF not exists idx_plantillas_sala_fk on public.plantillas using btree (sala) TABLESPACE pg_default;

create table public.plantillas_productos_template (
  id uuid not null default gen_random_uuid (),
  nombre character varying(255) not null,
  descripcion text null,
  productos jsonb null,
  evento_id uuid null,
  tenant_id uuid null,
  activo boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint plantillas_productos_template_pkey primary key (id),
  constraint plantillas_productos_template_evento_id_fkey foreign KEY (evento_id) references eventos (id),
  constraint plantillas_productos_template_tenant_id_fkey foreign KEY (tenant_id) references tenants (id)
) TABLESPACE pg_default;

create index IF not exists idx_plantillas_productos_template_tenant_id on public.plantillas_productos_template using btree (tenant_id) TABLESPACE pg_default;

create trigger update_plantillas_productos_template_updated_at BEFORE
update on plantillas_productos_template for EACH row
execute FUNCTION update_plantillas_productos_template_updated_at ();

create table public.profiles (
  id uuid not null,
  login text null,
  telefono text null,
  permisos jsonb null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  role text null,
  nombre character varying(255) null,
  apellido character varying(255) null,
  activo boolean null default true,
  canales jsonb null default '{"test": false, "internet": false, "boxOffice": false, "marcaBlanca": false}'::jsonb,
  metodospago jsonb null default '{"zelle": false, "paypal": false, "efectivo": false, "pagoMovil": false, "puntoVenta": false, "procesadorPago": false}'::jsonb,
  recintos uuid[] null default '{}'::uuid[],
  email character varying(255) null,
  tenant_id uuid null,
  tags text[] null default array[]::text[],
  constraint profiles_pkey primary key (id),
  constraint profiles_login_key unique (login),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_profiles_apellido on public.profiles using btree (apellido) TABLESPACE pg_default;

create index IF not exists idx_profiles_activo on public.profiles using btree (activo) TABLESPACE pg_default;

create index IF not exists idx_profiles_tenant_id on public.profiles using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_profiles_role on public.profiles using btree (role) TABLESPACE pg_default;

create trigger update_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION update_profiles_updated_at ();

create table public.recintos (
  id serial not null,
  nombre character varying(255) not null,
  direccion text null,
  ciudad character varying(255) null,
  pais character varying(255) null,
  capacidad numeric null,
  codigopostal text null,
  comollegar text null,
  direccionlinea1 text null,
  estado text null,
  latitud character varying null,
  longitud character varying null,
  usuario_id uuid null,
  new_id uuid null default extensions.uuid_generate_v4 (),
  tenant_id uuid null,
  updated_at timestamp with time zone null default now(),
  constraint recintos_pkey primary key (id),
  constraint fk_usuario foreign KEY (usuario_id) references profiles (id) on delete CASCADE,
  constraint recintos_tenant_id_fkey foreign KEY (tenant_id) references tenants (id)
) TABLESPACE pg_default;

create index IF not exists idx_recintos_fk_usuario on public.recintos using btree (usuario_id) TABLESPACE pg_default;

create index IF not exists idx_recintos_tenant_id on public.recintos using btree (tenant_id) TABLESPACE pg_default;

create trigger trigger_assign_recintos_to_admin_gerente
after INSERT on recintos for EACH row
execute FUNCTION assign_recintos_to_admin_gerente ();

create trigger update_recintos_updated_at BEFORE
update on recintos for EACH row
execute FUNCTION update_recintos_updated_at ();

create table public.salas (
  id serial not null,
  nombre character varying(255) not null,
  recinto_id integer not null,
  capacidad integer not null default 0,
  fecha_creacion timestamp without time zone null default CURRENT_TIMESTAMP,
  usuario_id uuid null,
  tenant_id uuid null,
  constraint salas_pkey primary key (id),
  constraint fk_recinto foreign KEY (recinto_id) references recintos (id) on delete CASCADE,
  constraint fk_usuario foreign KEY (usuario_id) references profiles (id) on delete CASCADE,
  constraint salas_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_salas_fk_recinto on public.salas using btree (recinto_id) TABLESPACE pg_default;

create index IF not exists idx_salas_fk_usuario on public.salas using btree (usuario_id) TABLESPACE pg_default;

create index IF not exists idx_salas_tenant_id_fk on public.salas using btree (tenant_id) TABLESPACE pg_default;

create table public.seat_locks (
  id uuid not null default gen_random_uuid (),
  seat_id text null,
  table_id text null,
  funcion_id integer not null,
  locked_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null,
  status text null default 'locked'::text,
  lock_type text null default 'seat'::text,
  created_at timestamp with time zone null default now(),
  tenant_id uuid null,
  locator character varying(255) null,
  user_id uuid null,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  zona_id character varying(255) null,
  constraint seat_locks_pkey primary key (id),
  constraint seat_locks_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint seat_locks_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_seat_locks_tenant_id_fk on public.seat_locks using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_seat_locks_user_id_fk on public.seat_locks using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_seat_locks_funcion_id on public.seat_locks using btree (funcion_id) TABLESPACE pg_default;

create index IF not exists idx_seat_locks_seat_id on public.seat_locks using btree (seat_id) TABLESPACE pg_default;

create index IF not exists idx_seat_locks_expires_at on public.seat_locks using btree (expires_at) TABLESPACE pg_default;

create index IF not exists idx_seat_locks_lock_type on public.seat_locks using btree (lock_type) TABLESPACE pg_default;

create index IF not exists idx_seat_locks_locator on public.seat_locks using btree (locator) TABLESPACE pg_default;

create trigger trigger_update_seat_lock_zone_info BEFORE INSERT
or
update on seat_locks for EACH row
execute FUNCTION update_seat_lock_zone_info ();

create table public.settings (
  id bigint generated always as identity not null,
  key text not null,
  value text not null,
  tenant_id uuid null,
  constraint settings_pkey primary key (id),
  constraint settings_key_key unique (key),
  constraint settings_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.system_alerts (
  id uuid not null default gen_random_uuid (),
  alert_type character varying(100) not null,
  severity character varying(20) null default 'normal'::character varying,
  title character varying(255) not null,
  message text not null,
  tenant_id uuid null,
  is_resolved boolean null default false,
  resolved_by uuid null,
  resolved_at timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  metadata jsonb null default '{}'::jsonb,
  constraint system_alerts_pkey primary key (id),
  constraint system_alerts_resolved_by_fkey foreign KEY (resolved_by) references auth.users (id) on delete set null,
  constraint system_alerts_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_system_alerts_tenant_id on public.system_alerts using btree (tenant_id) TABLESPACE pg_default;

create table public.tags (
  id serial not null,
  name character varying(255) not null,
  tenant_id uuid null,
  description text null,
  color character varying(7) null default '#3B82F6'::character varying,
  type character varying(50) null default 'event'::character varying,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint tags_pkey primary key (id),
  constraint tags_name_tenant_id_key unique (name, tenant_id),
  constraint tags_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_tags_tenant_id_fk on public.tags using btree (tenant_id) TABLESPACE pg_default;

create table public.tenants (
  id uuid not null default gen_random_uuid (),
  subdomain character varying(100) not null,
  company_name character varying(255) not null,
  contact_email character varying(255) not null,
  contact_phone character varying(50) null,
  plan_type character varying(50) null default 'basic'::character varying,
  status character varying(50) null default 'active'::character varying,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  settings jsonb null default '{}'::jsonb,
  billing_info jsonb null default '{}'::jsonb,
  stripe_customer_id character varying(255) null,
  logo_url character varying(500) null,
  primary_color character varying(7) null default '#1890ff'::character varying,
  secondary_color character varying(7) null default '#52c41a'::character varying,
  max_users integer null default 10,
  max_events integer null default 50,
  total_revenue numeric(10, 2) null default 0.00,
  monthly_revenue numeric(10, 2) null default 0.00,
  yearly_revenue numeric(10, 2) null default 0.00,
  subscription_status character varying(50) null default 'active'::character varying,
  domain character varying(255) null,
  full_url character varying(500) null,
  theme_config jsonb null default '{}'::jsonb,
  feature_flags jsonb null default '{}'::jsonb,
  branding_config jsonb null default '{}'::jsonb,
  custom_routes jsonb null default '[]'::jsonb,
  is_main_domain boolean null default false,
  tenant_type character varying(50) null default 'company'::character varying,
  constraint tenants_pkey primary key (id),
  constraint tenants_subdomain_key unique (subdomain)
) TABLESPACE pg_default;

create index IF not exists idx_tenants_subdomain on public.tenants using btree (subdomain) TABLESPACE pg_default;

create index IF not exists idx_tenants_status on public.tenants using btree (status) TABLESPACE pg_default;

create index IF not exists idx_tenants_plan_type on public.tenants using btree (plan_type) TABLESPACE pg_default;

create trigger trigger_set_default_subdomain BEFORE INSERT on tenants for EACH row
execute FUNCTION set_default_subdomain ();

create trigger update_tenants_updated_at BEFORE
update on tenants for EACH row
execute FUNCTION update_updated_at_column ();

create table public.user_activity_log (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  tenant_id uuid null,
  action character varying(100) not null,
  details jsonb null,
  ip_address inet null,
  user_agent text null,
  created_at timestamp with time zone null default now(),
  constraint user_activity_log_pkey primary key (id),
  constraint user_activity_log_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint user_activity_log_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_activity_log_user_id on public.user_activity_log using btree (user_id) TABLESPACE pg_default;

create table public.user_recinto_assignments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  recinto_id integer not null,
  assigned_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_recinto_assignments_pkey primary key (id),
  constraint user_recinto_assignments_user_id_recinto_id_key unique (user_id, recinto_id),
  constraint user_recinto_assignments_assigned_by_fkey foreign KEY (assigned_by) references auth.users (id) on delete set null,
  constraint user_recinto_assignments_recinto_id_fkey foreign KEY (recinto_id) references recintos (id) on delete CASCADE,
  constraint user_recinto_assignments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_recinto_assignments_recinto_id_fk on public.user_recinto_assignments using btree (recinto_id) TABLESPACE pg_default;

create index IF not exists idx_user_recinto_assignments_user_id on public.user_recinto_assignments using btree (user_id) TABLESPACE pg_default;

create table public.user_tags (
  id serial not null,
  name character varying(255) not null,
  description text null,
  color character varying(7) null default '#1890ff'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  tenant_id uuid null,
  constraint user_tags_pkey primary key (id),
  constraint user_tags_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_tags_tenant_id_fk on public.user_tags using btree (tenant_id) TABLESPACE pg_default;

create table public.user_tenant_assignments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  tenant_id uuid not null,
  assigned_at timestamp with time zone null default now(),
  assigned_by uuid null,
  permissions jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_tenant_assignments_pkey primary key (id),
  constraint user_tenant_assignments_user_id_tenant_id_key unique (user_id, tenant_id),
  constraint user_tenant_assignments_assigned_by_fkey foreign KEY (assigned_by) references profiles (id),
  constraint user_tenant_assignments_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE,
  constraint user_tenant_assignments_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_tenant_assignments_tenant_id_fk on public.user_tenant_assignments using btree (tenant_id) TABLESPACE pg_default;

create trigger trigger_update_user_tenant_assignments_updated_at BEFORE
update on user_tenant_assignments for EACH row
execute FUNCTION update_user_tenant_assignments_updated_at ();

create table public.user_tenant_info (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  tenant_id uuid not null,
  is_active boolean null default true,
  last_login timestamp with time zone null,
  login_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_tenant_info_pkey primary key (id),
  constraint user_tenant_info_user_id_tenant_id_key unique (user_id, tenant_id),
  constraint user_tenant_info_tenant_id_fkey foreign KEY (tenant_id) references tenants (id),
  constraint user_tenant_info_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_user_tenant_info_tenant_id_fk on public.user_tenant_info using btree (tenant_id) TABLESPACE pg_default;

create table public.zonas (
  id serial not null,
  nombre character varying(255) not null,
  aforo numeric null,
  color text null,
  numerada boolean null,
  sala_id text null,
  tenant_id uuid null,
  constraint zonas_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_zonas_tenant_id on public.zonas using btree (tenant_id) TABLESPACE pg_default;