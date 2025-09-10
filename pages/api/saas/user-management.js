import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGetUsers(req, res);
      case 'POST':
        return await handleCreateUser(req, res);
      case 'PUT':
        return await handleUpdateUser(req, res);
      case 'DELETE':
        return await handleDeleteUser(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error en user-management:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

// Obtener usuarios
async function handleGetUsers(req, res) {
  const { 
    tenant_id, 
    limit = 50, 
    offset = 0,
    search,
    role,
    status = 'active'
  } = req.query;

  if (!tenant_id) {
    return res.status(400).json({
      success: false,
      message: 'tenant_id es requerido'
    });
  }

  let query = supabase
    .from('profiles')
    .select(`
      *,
      user_tenant_info:user_tenant_info(*),
      custom_roles:role_id(*)
    `)
    .eq('tenant_id', tenant_id)
    .eq('is_active', status === 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtros opcionales
  if (search) {
    query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (role) {
    query = query.eq('role', role);
  }

  const { data: usuarios, error, count } = await query;

  if (error) throw error;

  res.status(200).json({
    success: true,
    data: {
      usuarios: usuarios || [],
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: usuarios?.length === parseInt(limit)
      }
    }
  });
}

// Crear usuario
async function handleCreateUser(req, res) {
  const { 
    tenant_id, 
    email, 
    nombre, 
    telefono, 
    role = 'user',
    is_active = true 
  } = req.body;

  if (!tenant_id || !email || !nombre) {
    return res.status(400).json({
      success: false,
      message: 'tenant_id, email y nombre son requeridos'
    });
  }

  // Crear perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert([{
      tenant_id,
      email,
      nombre,
      telefono,
      role,
      is_active,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (profileError) throw profileError;

  // Crear información adicional del tenant
  const { error: tenantInfoError } = await supabase
    .from('user_tenant_info')
    .insert([{
      user_id: profile.id,
      tenant_id,
      is_active,
      created_at: new Date().toISOString()
    }]);

  if (tenantInfoError) {
    console.warn('Error creando user_tenant_info:', tenantInfoError);
  }

  res.status(201).json({
    success: true,
    data: { usuario: profile },
    message: 'Usuario creado exitosamente'
  });
}

// Actualizar usuario
async function handleUpdateUser(req, res) {
  const { 
    user_id, 
    tenant_id,
    email, 
    nombre, 
    telefono, 
    role,
    is_active 
  } = req.body;

  if (!user_id || !tenant_id) {
    return res.status(400).json({
      success: false,
      message: 'user_id y tenant_id son requeridos'
    });
  }

  // Actualizar perfil
  const updateData = {};
  if (email) updateData.email = email;
  if (nombre) updateData.nombre = nombre;
  if (telefono) updateData.telefono = telefono;
  if (role) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user_id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();

  if (profileError) throw profileError;

  // Actualizar información del tenant
  if (is_active !== undefined) {
    const { error: tenantInfoError } = await supabase
      .from('user_tenant_info')
      .update({ is_active })
      .eq('user_id', user_id)
      .eq('tenant_id', tenant_id);

    if (tenantInfoError) {
      console.warn('Error actualizando user_tenant_info:', tenantInfoError);
    }
  }

  res.status(200).json({
    success: true,
    data: { usuario: profile },
    message: 'Usuario actualizado exitosamente'
  });
}

// Eliminar usuario
async function handleDeleteUser(req, res) {
  const { user_id, tenant_id } = req.body;

  if (!user_id || !tenant_id) {
    return res.status(400).json({
      success: false,
      message: 'user_id y tenant_id son requeridos'
    });
  }

  // Desactivar usuario en lugar de eliminar
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', user_id)
    .eq('tenant_id', tenant_id);

  if (profileError) throw profileError;

  // Desactivar en user_tenant_info
  const { error: tenantInfoError } = await supabase
    .from('user_tenant_info')
    .update({ is_active: false })
    .eq('user_id', user_id)
    .eq('tenant_id', tenant_id);

  if (tenantInfoError) {
    console.warn('Error actualizando user_tenant_info:', tenantInfoError);
  }

  res.status(200).json({
    success: true,
    message: 'Usuario desactivado exitosamente'
  });
}
