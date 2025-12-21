-- Table: afiliados (Empty, structure unknown)
CREATE TABLE afiliados ();

CREATE TABLE audit_logs (
    id UUID,
    action TEXT,
    details TEXT,
    metadata TEXT,
    resource_id UUID,
    resource_type TEXT,
    severity TEXT,
    tenant_id UUID,
    user_id UUID,
    session_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    url TEXT,
    referrer JSONB,
    created_at TIMESTAMP
);

CREATE TABLE canales_venta (
    id INTEGER,
    nombre TEXT,
    url TEXT,
    activo BOOLEAN,
    created_at TIMESTAMP,
    tenant_id UUID,
    tipo TEXT,
    updated_at TIMESTAMP
);

CREATE TABLE cms_pages (
    id INTEGER,
    slug TEXT,
    nombre TEXT,
    descripcion TEXT,
    tipo TEXT,
    estado TEXT,
    meta_title JSONB,
    meta_description JSONB,
    meta_keywords JSONB,
    og_image JSONB,
    configuracion JSONB,
    widgets JSONB,
    css_custom JSONB,
    js_custom JSONB,
    usuario_creador JSONB,
    fecha_publicacion JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    tenant_id UUID
);

CREATE TABLE comisiones_tasas (
    id UUID,
    name TEXT,
    tipo TEXT,
    valor FLOAT,
    fijo FLOAT,
    activo BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    type TEXT,
    value JSONB,
    is_active BOOLEAN,
    description JSONB,
    tenant_id UUID
);

CREATE TABLE cuotas_pagos (
    id UUID,
    payment_transaction_id UUID,
    locator TEXT,
    numero_cuota INTEGER,
    total_cuotas INTEGER,
    monto_cuota FLOAT,
    monto_pagado INTEGER,
    fecha_vencimiento TIMESTAMP,
    fecha_pago JSONB,
    estado TEXT,
    metodo_pago JSONB,
    transaction_id_cuota JSONB,
    user_id UUID,
    funcion_id INTEGER,
    evento_id UUID,
    tenant_id UUID,
    notas JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Table: cupos (Empty, structure unknown)
CREATE TABLE cupos ();

-- Table: cupos_butacas (Empty, structure unknown)
CREATE TABLE cupos_butacas ();

-- Table: cupos_zonas_no_numeradas (Empty, structure unknown)
CREATE TABLE cupos_zonas_no_numeradas ();

CREATE TABLE email_campaigns (
    id INTEGER,
    nombre TEXT,
    tipo TEXT,
    estado TEXT,
    configuracion JSONB,
    total_enviados INTEGER,
    total_fallidos INTEGER,
    fecha_envio JSONB,
    fecha_actualizacion TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    tenant_id UUID
);

CREATE TABLE email_templates (
    id UUID,
    nombre TEXT,
    tipo_reporte TEXT,
    tenant_id UUID,
    configuracion_diseno JSONB,
    estructura_contenido JSONB,
    activo BOOLEAN,
    es_predeterminado BOOLEAN,
    version TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE TABLE entradas (
    id UUID,
    nombre_entrada TEXT,
    min INTEGER,
    max INTEGER,
    tipo_producto TEXT,
    recinto INTEGER,
    created_at TIMESTAMP,
    iva INTEGER,
    tenant_id UUID,
    precio_base INTEGER,
    quantity_step JSONB,
    activo_boleteria BOOLEAN,
    activo_store BOOLEAN
);

-- Table: event_theme_settings (Empty, structure unknown)
CREATE TABLE event_theme_settings ();

CREATE TABLE eventos (
    id UUID,
    nombre TEXT,
    recinto INTEGER,
    usuario_id JSONB,
    activo BOOLEAN,
    analytics TEXT,
    datosBoleto TEXT,
    datosComprador TEXT,
    desactivado BOOLEAN,
    descripcionEstado TEXT,
    estadoPersonalizado TEXT,
    estadoVenta TEXT,
    mostrarDatosBoleto TEXT,
    mostrarDatosComprador TEXT,
    oculto BOOLEAN,
    otrasOpciones TEXT,
    sala INTEGER,
    sector TEXT,
    descripcion JSONB,
    slug TEXT,
    tags TEXT,
    descripcionHTML TEXT,
    resumenDescripcion TEXT,
    created_at TIMESTAMP,
    imagenes TEXT,
    tenant_id UUID,
    plantilla_precios_id JSONB,
    recinto_id JSONB,
    modoVenta TEXT,
    sectorPersonalizado TEXT
);

-- Table: eventos_con_funciones_activas (Empty, structure unknown)
CREATE TABLE eventos_con_funciones_activas ();

-- Table: funcion_cupos (Empty, structure unknown)
CREATE TABLE funcion_cupos ();

CREATE TABLE funciones (
    id INTEGER,
    evento_id UUID,
    sala_id INTEGER,
    plantilla INTEGER,
    fecha_celebracion TIMESTAMP,
    inicio_venta TIMESTAMP,
    fin_venta TIMESTAMP,
    pago_a_plazos BOOLEAN,
    permitir_reservas_web BOOLEAN,
    creadopor UUID,
    created_at TIMESTAMP,
    plantilla_comisiones JSONB,
    plantilla_producto JSONB,
    tiempo_caducidad_reservas INTEGER,
    fecha_liberacion_reservas JSONB,
    tenant_id UUID,
    es_principal BOOLEAN,
    zona_horaria TEXT,
    lit_sesion TEXT,
    utiliza_lit_sesion BOOLEAN,
    apertura_puertas TIMESTAMP,
    promotional_session_label TEXT,
    session_belongs_season_pass BOOLEAN,
    id_abono_sala JSONB,
    streaming_mode BOOLEAN,
    overwrite_streaming_setup BOOLEAN,
    streaming_type TEXT,
    streaming_url TEXT,
    streaming_id TEXT,
    streaming_password TEXT,
    streaming_only_one_session_by_ticket BOOLEAN,
    streaming_show_url BOOLEAN,
    streaming_transmission_start JSONB,
    streaming_transmission_stop JSONB,
    plantilla_entradas INTEGER,
    plantilla_cupos JSONB,
    id_barcode_pool JSONB,
    permite_pago_plazos BOOLEAN,
    num_plazos_pago JSONB,
    permite_reserva BOOLEAN,
    misma_fecha_canales BOOLEAN,
    canales JSONB,
    cancellation_date_selected BOOLEAN,
    end_date_cancellation JSONB,
    ticket_printing_release_date_selected BOOLEAN,
    ticket_printing_release_date INTEGER,
    custom_printing_ticket_date JSONB,
    custom_ses1 TEXT,
    custom_ses2 TEXT,
    visible_en_boleteria BOOLEAN,
    visible_en_store BOOLEAN,
    recinto_id INTEGER,
    updated_at TIMESTAMP,
    activo BOOLEAN,
    cantidad_cuotas INTEGER,
    dias_entre_pagos INTEGER,
    fecha_inicio_pagos_plazos TIMESTAMP,
    fecha_fin_pagos_plazos TIMESTAMP
);

CREATE TABLE global_email_config (
    id UUID,
    provider TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_secure BOOLEAN,
    smtp_user TEXT,
    smtp_pass TEXT,
    from_email TEXT,
    from_name TEXT,
    reply_to TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE ivas (
    id INTEGER,
    nombre TEXT,
    porcentaje INTEGER,
    tenant_id JSONB
);

CREATE TABLE mapas (
    id INTEGER,
    sala_id INTEGER,
    contenido JSONB,
    tenant_id UUID,
    updated_at TIMESTAMP,
    nombre TEXT,
    estado TEXT,
    created_at TIMESTAMP,
    descripcion TEXT,
    imagen_fondo TEXT,
    configuracion JSONB
);

CREATE TABLE notifications (
    id UUID,
    user_id JSONB,
    tenant_id UUID,
    title TEXT,
    message TEXT,
    type TEXT,
    status TEXT,
    data JSONB,
    sent_at JSONB,
    read_at JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    read BOOLEAN
);

CREATE TABLE payment_methods (
    id UUID,
    method_id TEXT,
    name TEXT,
    type TEXT,
    enabled BOOLEAN,
    config JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    tenant_id UUID,
    processing_time TEXT,
    fee_structure JSONB,
    supported_currencies JSONB,
    supported_countries JSONB,
    is_recommended BOOLEAN,
    icon JSONB,
    description TEXT
);

CREATE TABLE payment_transactions (
    id UUID,
    order_id TEXT,
    gateway_id JSONB,
    amount INTEGER,
    currency TEXT,
    status TEXT,
    gateway_transaction_id JSONB,
    gateway_response JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    user_id UUID,
    evento_id UUID,
    tenant_id UUID,
    locator TEXT,
    funcion_id INTEGER,
    payment_method TEXT,
    gateway_name TEXT,
    seats JSONB,
    monto INTEGER,
    usuario_id UUID,
    event UUID,
    funcion INTEGER,
    processed_by UUID,
    payment_gateway_id UUID,
    fecha TIMESTAMP,
    payments JSONB,
    referrer JSONB,
    discountCode JSONB,
    reservationDeadline JSONB,
    user UUID,
    metadata JSONB,
    afiliado_id JSONB,
    comision_afiliado INTEGER
);

-- Table: payments (Empty, structure unknown)
CREATE TABLE payments ();

CREATE TABLE plantillas (
    id INTEGER,
    nombre TEXT,
    detalles TEXT,
    recinto INTEGER,
    sala INTEGER,
    tenant_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    descripcion TEXT
);

-- Table: plantillas_cupos (Empty, structure unknown)
CREATE TABLE plantillas_cupos ();

CREATE TABLE plantillas_productos (
    id UUID,
    nombre TEXT,
    descripcion TEXT,
    imagen_url TEXT,
    precio_base INTEGER,
    categoria TEXT,
    activo BOOLEAN,
    evento_id UUID,
    tenant_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE plantillas_productos_templates (
    id UUID,
    nombre TEXT,
    descripcion TEXT,
    productos JSONB,
    evento_id JSONB,
    tenant_id UUID,
    activo BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Table: productos (Empty, structure unknown)
CREATE TABLE productos ();

CREATE TABLE profiles (
    id UUID,
    login TEXT,
    telefono TEXT,
    permisos JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    role JSONB,
    nombre TEXT,
    apellido TEXT,
    activo BOOLEAN,
    canales JSONB,
    metodospago JSONB,
    tenant_id JSONB,
    tags JSONB,
    recintos JSONB
);

-- Table: push_subscriptions (Empty, structure unknown)
CREATE TABLE push_subscriptions ();

CREATE TABLE recintos (
    id INTEGER,
    nombre TEXT,
    direccion TEXT,
    ciudad TEXT,
    pais TEXT,
    capacidad INTEGER,
    codigopostal TEXT,
    comollegar TEXT,
    direccionlinea1 TEXT,
    estado TEXT,
    latitud TEXT,
    longitud TEXT,
    usuario_id JSONB,
    new_id UUID,
    tenant_id UUID,
    updated_at TIMESTAMP
);

CREATE TABLE salas (
    id INTEGER,
    nombre TEXT,
    recinto_id INTEGER,
    capacidad INTEGER,
    fecha_creacion TIMESTAMP,
    usuario_id JSONB,
    tenant_id UUID
);

-- Table: seat_locks (Empty, structure unknown)
CREATE TABLE seat_locks ();

CREATE TABLE settings (
    id INTEGER,
    key TEXT,
    value TEXT,
    tenant_id UUID
);

CREATE TABLE system_alerts (
    id UUID,
    alert_type TEXT,
    severity TEXT,
    title TEXT,
    message TEXT,
    tenant_id UUID,
    is_resolved BOOLEAN,
    resolved_by JSONB,
    resolved_at JSONB,
    created_at TIMESTAMP,
    metadata JSONB
);

CREATE TABLE tags (
    id INTEGER,
    name TEXT,
    tenant_id UUID,
    description JSONB,
    color TEXT,
    type TEXT,
    updated_at TIMESTAMP
);

CREATE TABLE tenant_email_config (
    id UUID,
    tenant_id UUID,
    provider TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_secure BOOLEAN,
    smtp_user TEXT,
    smtp_pass TEXT,
    from_email TEXT,
    from_name TEXT,
    reply_to TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE tenants (
    id UUID,
    subdomain TEXT,
    company_name TEXT,
    contact_email TEXT,
    contact_phone JSONB,
    plan_type TEXT,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    settings JSONB,
    billing_info JSONB,
    stripe_customer_id JSONB,
    logo_url JSONB,
    primary_color TEXT,
    secondary_color TEXT,
    max_users INTEGER,
    max_events INTEGER,
    total_revenue INTEGER,
    monthly_revenue INTEGER,
    yearly_revenue INTEGER,
    subscription_status TEXT,
    domain TEXT,
    full_url TEXT,
    theme_config JSONB,
    feature_flags JSONB,
    branding_config JSONB,
    custom_routes JSONB,
    is_main_domain BOOLEAN,
    tenant_type TEXT
);

CREATE TABLE ticket_downloads (
    id UUID,
    payment_id UUID,
    locator TEXT,
    user_id UUID,
    tenant_id UUID,
    downloaded_at TIMESTAMP,
    download_method TEXT,
    user_agent TEXT,
    ip_address TEXT,
    metadata JSONB,
    created_at TIMESTAMP
);

-- Table: ticket_validations (Empty, structure unknown)
CREATE TABLE ticket_validations ();

-- Table: user_activity_log (Empty, structure unknown)
CREATE TABLE user_activity_log ();

-- Table: user_recinto_assignments (Empty, structure unknown)
CREATE TABLE user_recinto_assignments ();

-- Table: user_recinto_assignments_view (Empty, structure unknown)
CREATE TABLE user_recinto_assignments_view ();

CREATE TABLE user_tags (
    id INTEGER,
    name TEXT,
    description TEXT,
    color TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    tenant_id UUID
);

-- Table: user_tenant_assignments (Empty, structure unknown)
CREATE TABLE user_tenant_assignments ();

CREATE TABLE user_tenant_info (
    id UUID,
    user_id UUID,
    tenant_id UUID,
    is_active BOOLEAN,
    last_login TIMESTAMP,
    login_count INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE user_tenants (
    id UUID,
    user_id UUID,
    tenant_id UUID,
    role TEXT,
    active BOOLEAN,
    last_login TIMESTAMP,
    login_count INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE zonas (
    id INTEGER,
    nombre TEXT,
    aforo INTEGER,
    color TEXT,
    numerada BOOLEAN,
    sala_id TEXT,
    tenant_id UUID
);
