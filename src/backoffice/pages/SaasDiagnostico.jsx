import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Typography, 
  Alert, 
  Tabs, 
  message, 
  Descriptions, 
  Divider, 
  List, 
  Drawer, 
  InputNumber,
  DatePicker,
  TimePicker,
  Switch,
  Upload,
  Image,
  Progress,
  Steps,
  Result,
  Tooltip,
  Badge,
  Statistic,
  Avatar
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  BankOutlined,
  CalendarOutlined,
  UserOutlined,
  ShoppingOutlined,
  SettingOutlined,
  FileTextOutlined,
  PictureOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  TrophyOutlined,
  StarOutlined,
  ReloadOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import './SaasDiagnostico.css';
import {
  RecintoForm,
  SalaForm,
  EventoForm,
  FuncionForm,
  PlantillaPrecioForm,
  MapaForm,
  ZonaForm,
  ProductoForm,
  PlantillaProductoForm
} from './SaasDiagnosticoModales';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Step } = Steps;

const SaasDiagnostico = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [progress, setProgress] = useState(0);
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [showResults, setShowResults] = useState(false);
  
  // Estados para cada elemento del sistema
  const [recintos, setRecintos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [plantillasPrecios, setPlantillasPrecios] = useState([]);
  const [mapas, setMapas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [plantillasProductos, setPlantillasProductos] = useState([]);
  
  // Estados para diagnóstico de errores
  const [databaseErrors, setDatabaseErrors] = useState([]);
  const [isScanningErrors, setIsScanningErrors] = useState(false);
  const [errorScanResults, setErrorScanResults] = useState({});
  
  // Estados para modales
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  
  // Formularios
  const [recintoForm] = Form.useForm();
  const [salaForm] = Form.useForm();
  const [eventoForm] = Form.useForm();
  const [funcionForm] = Form.useForm();
  const [plantillaPrecioForm] = Form.useForm();
  const [mapaForm] = Form.useForm();
  const [zonaForm] = Form.useForm();
  const [productoForm] = Form.useForm();
  const [plantillaProductoForm] = Form.useForm();

  // Pasos del diagnóstico
  const steps = [
    {
      title: 'Seleccionar Tenant',
      description: 'Elegir empresa para diagnosticar',
      icon: <BankOutlined />
    },
    {
      title: 'Diagnóstico de Errores',
      description: 'Detectar y corregir problemas de BD',
      icon: <ExclamationCircleOutlined />
    },
    {
      title: 'Crear Recinto',
      description: 'Configurar lugar del evento',
      icon: <EnvironmentOutlined />
    },
    {
      title: 'Crear Salas',
      description: 'Configurar espacios del recinto',
      icon: <TeamOutlined />
    },
    {
      title: 'Crear Evento',
      description: 'Configurar evento principal',
      icon: <CalendarOutlined />
    },
    {
      title: 'Crear Funciones',
      description: 'Configurar fechas y horarios',
      icon: <ClockCircleOutlined />
    },
    {
      title: 'Crear Plantilla de Precios',
      description: 'Configurar estructura de precios',
      icon: <DollarOutlined />
    },
    {
      title: 'Crear Mapa',
      description: 'Configurar disposición de asientos',
      icon: <PictureOutlined />
    },
    {
      title: 'Crear Zonas',
      description: 'Configurar áreas del mapa',
      icon: <StarOutlined />
    },
    {
      title: 'Crear Productos',
      description: 'Configurar productos adicionales',
      icon: <ShoppingOutlined />
    },
    {
      title: 'Crear Plantilla de Productos',
      description: 'Configurar plantillas de productos',
      icon: <FileTextOutlined />
    },
    {
      title: 'Verificar Sistema',
      description: 'Comprobar funcionamiento',
      icon: <CheckCircleOutlined />
    }
  ];

  // Cargar tenant actual
  useEffect(() => {
    loadCurrentTenant();
  }, []);

  const loadCurrentTenant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.tenant_id) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single();
          
          setCurrentTenant(tenant);
        }
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
    }
  };

  // Función para escanear errores de base de datos
  const scanDatabaseErrors = async () => {
    setIsScanningErrors(true);
    const errors = [];
    
    try {
      // Verificar integridad referencial
      const integrityErrors = await checkReferentialIntegrity();
      errors.push(...integrityErrors);
      
      // Verificar datos corruptos
      const corruptionErrors = await checkDataCorruption();
      errors.push(...corruptionErrors);
      
      // Verificar inconsistencias de RLS
      const rlsErrors = await checkRLSInconsistencies();
      errors.push(...rlsErrors);
      
      // Verificar problemas de permisos
      const permissionErrors = await checkPermissionIssues();
      errors.push(...permissionErrors);
      
      setDatabaseErrors(errors);
      setErrorScanResults({
        totalErrors: errors.length,
        criticalErrors: errors.filter(e => e.severity === 'critical').length,
        warningErrors: errors.filter(e => e.severity === 'warning').length,
        infoErrors: errors.filter(e => e.severity === 'info').length
      });
      
      message.success(`Escaneo completado. Se encontraron ${errors.length} problemas.`);
      
    } catch (error) {
      console.error('Error durante el escaneo:', error);
      message.error('Error durante el escaneo de la base de datos');
    } finally {
      setIsScanningErrors(false);
    }
  };

  // Verificar integridad referencial
  const checkReferentialIntegrity = async () => {
    const errors = [];
    
    try {
      // Verificar funciones sin eventos
      const { data: orphanFunctions } = await supabase
        .from('funciones')
        .select('id, nombre, evento_id')
        .is('evento_id', null);
      
      if (orphanFunctions && orphanFunctions.length > 0) {
        errors.push({
          id: 'orphan_functions',
          type: 'referential_integrity',
          severity: 'critical',
          title: 'Funciones sin Evento',
          description: `${orphanFunctions.length} funciones no tienen evento asociado`,
          affectedRecords: orphanFunctions,
          table: 'funciones',
          fixAction: 'delete_orphan_functions'
        });
      }
      
      // Verificar salas sin recinto
      const { data: orphanSalas } = await supabase
        .from('salas')
        .select('id, nombre, recinto_id')
        .is('recinto_id', null);
      
      if (orphanSalas && orphanSalas.length > 0) {
        errors.push({
          id: 'orphan_salas',
          type: 'referential_integrity',
          severity: 'critical',
          title: 'Salas sin Recinto',
          description: `${orphanSalas.length} salas no tienen recinto asociado`,
          affectedRecords: orphanSalas,
          table: 'salas',
          fixAction: 'delete_orphan_salas'
        });
      }
      
      // Verificar mapas sin sala
      const { data: orphanMapas } = await supabase
        .from('mapas')
        .select('id, nombre, sala_id')
        .is('sala_id', null);
      
      if (orphanMapas && orphanMapas.length > 0) {
        errors.push({
          id: 'orphan_mapas',
          type: 'referential_integrity',
          severity: 'critical',
          title: 'Mapas sin Sala',
          description: `${orphanMapas.length} mapas no tienen sala asociada`,
          affectedRecords: orphanMapas,
          table: 'mapas',
          fixAction: 'delete_orphan_mapas'
        });
      }
      
    } catch (error) {
      console.error('Error verificando integridad referencial:', error);
    }
    
    return errors;
  };

  // Verificar corrupción de datos
  const checkDataCorruption = async () => {
    const errors = [];
    
    try {
      // Verificar registros con datos nulos críticos
      const { data: nullRecintos } = await supabase
        .from('recintos')
        .select('id, nombre, direccion')
        .or('nombre.is.null,direccion.is.null');
      
      if (nullRecintos && nullRecintos.length > 0) {
        errors.push({
          id: 'null_recintos',
          type: 'data_corruption',
          severity: 'warning',
          title: 'Recintos con Datos Nulos',
          description: `${nullRecintos.length} recintos tienen campos obligatorios nulos`,
          affectedRecords: nullRecintos,
          table: 'recintos',
          fixAction: 'fix_null_recintos'
        });
      }
      
      // Verificar eventos sin fecha
      const { data: nullEventos } = await supabase
        .from('eventos')
        .select('id, nombre, fecha_inicio')
        .is('fecha_inicio', null);
      
      if (nullEventos && nullEventos.length > 0) {
        errors.push({
          id: 'null_eventos',
          type: 'data_corruption',
          severity: 'warning',
          title: 'Eventos sin Fecha',
          description: `${nullEventos.length} eventos no tienen fecha de inicio`,
          affectedRecords: nullEventos,
          table: 'eventos',
          fixAction: 'fix_null_eventos'
        });
      }
      
    } catch (error) {
      console.error('Error verificando corrupción de datos:', error);
    }
    
    return errors;
  };

  // Verificar inconsistencias de RLS
  const checkRLSInconsistencies = async () => {
    const errors = [];
    
    try {
      // Verificar si las políticas RLS están habilitadas
      const { data: rlsStatus } = await supabase
        .rpc('check_rls_status');
      
      if (rlsStatus && !rlsStatus.enabled) {
        errors.push({
          id: 'rls_disabled',
          type: 'rls_inconsistency',
          severity: 'critical',
          title: 'RLS Deshabilitado',
          description: 'Row Level Security no está habilitado en algunas tablas',
          affectedRecords: [],
          table: 'system',
          fixAction: 'enable_rls'
        });
      }
      
    } catch (error) {
      // Si la función RPC no existe, asumir que hay problemas de RLS
      errors.push({
        id: 'rls_function_missing',
        type: 'rls_inconsistency',
        severity: 'info',
        title: 'Función RLS no Disponible',
        description: 'No se puede verificar el estado de RLS automáticamente',
        affectedRecords: [],
        table: 'system',
        fixAction: 'manual_rls_check'
      });
    }
    
    return errors;
  };

  // Verificar problemas de permisos
  const checkPermissionIssues = async () => {
    const errors = [];
    
    try {
      // Verificar si el usuario actual puede acceder a las tablas principales
      const { data: recintosAccess, error: recintosError } = await supabase
        .from('recintos')
        .select('count')
        .limit(1);
      
      if (recintosError && recintosError.code === '42501') {
        errors.push({
          id: 'recintos_permission',
          type: 'permission_issue',
          severity: 'critical',
          title: 'Sin Permisos en Recintos',
          description: 'No tienes permisos para acceder a la tabla recintos',
          affectedRecords: [],
          table: 'recintos',
          fixAction: 'fix_permissions'
        });
      }
      
    } catch (error) {
      console.error('Error verificando permisos:', error);
    }
    
    return errors;
  };

  // Función para aplicar correcciones automáticas
  const applyAutomaticFix = async (error) => {
    try {
      switch (error.fixAction) {
        case 'delete_orphan_functions':
          const { error: deleteError } = await supabase
            .from('funciones')
            .delete()
            .is('evento_id', null);
          
          if (deleteError) throw deleteError;
          message.success('Funciones huérfanas eliminadas correctamente');
          break;
          
        case 'delete_orphan_salas':
          const { error: deleteSalasError } = await supabase
            .from('salas')
            .delete()
            .is('recinto_id', null);
          
          if (deleteSalasError) throw deleteSalasError;
          message.success('Salas huérfanas eliminadas correctamente');
          break;
          
        case 'delete_orphan_mapas':
          const { error: deleteMapasError } = await supabase
            .from('mapas')
            .delete()
            .is('sala_id', null);
          
          if (deleteMapasError) throw deleteMapasError;
          message.success('Mapas huérfanos eliminados correctamente');
          break;
          
        default:
          message.info('Esta corrección debe aplicarse manualmente');
          return;
      }
      
      // Re-escanear después de la corrección
      await scanDatabaseErrors();
      
    } catch (error) {
      console.error('Error aplicando corrección automática:', error);
      message.error('Error al aplicar la corrección automática');
    }
  };

  // Función para eliminar registro específico
  const deleteRecord = async (error, recordId) => {
    try {
      const { error: deleteError } = await supabase
        .from(error.table)
        .delete()
        .eq('id', recordId);
      
      if (deleteError) throw deleteError;
      
      message.success('Registro eliminado correctamente');
      
      // Re-escanear después de la eliminación
      await scanDatabaseErrors();
      
    } catch (error) {
      console.error('Error eliminando registro:', error);
      message.error('Error al eliminar el registro');
    }
  };

  // Funciones de eliminación para cada tipo de elemento
  const handleDeleteRecinto = async (id) => {
    try {
      const { error } = await supabase
        .from('recintos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setRecintos(recintos.filter(r => r.id !== id));
      message.success('Recinto eliminado correctamente');
      
    } catch (error) {
      console.error('Error eliminando recinto:', error);
      message.error('Error al eliminar el recinto');
    }
  };

  const handleDeleteSala = async (id) => {
    try {
      const { error } = await supabase
        .from('salas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSalas(salas.filter(s => s.id !== id));
      message.success('Sala eliminada correctamente');
      
    } catch (error) {
      console.error('Error eliminando sala:', error);
      message.error('Error al eliminar la sala');
    }
  };

  const handleDeleteEvento = async (id) => {
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEventos(eventos.filter(e => e.id !== id));
      message.success('Evento eliminado correctamente');
      
    } catch (error) {
      console.error('Error eliminando evento:', error);
      message.error('Error al eliminar el evento');
    }
  };

  const handleDeleteFuncion = async (id) => {
    try {
      const { error } = await supabase
        .from('funciones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setFunciones(funciones.filter(f => f.id !== id));
      message.success('Función eliminada correctamente');
      
    } catch (error) {
      console.error('Error eliminando función:', error);
      message.error('Error al eliminar la función');
    }
  };

  const handleDeletePlantillaPrecio = async (id) => {
    try {
      const { error } = await supabase
        .from('plantillas_precios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPlantillasPrecios(plantillasPrecios.filter(p => p.id !== id));
      message.success('Plantilla de precio eliminada correctamente');
      
    } catch (error) {
      console.error('Error eliminando plantilla de precio:', error);
      message.error('Error al eliminar la plantilla de precio');
    }
  };

  const handleDeleteMapa = async (id) => {
    try {
      const { error } = await supabase
        .from('mapas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMapas(mapas.filter(m => m.id !== id));
      message.success('Mapa eliminado correctamente');
      
    } catch (error) {
      console.error('Error eliminando mapa:', error);
      message.error('Error al eliminar el mapa');
    }
  };

  const handleDeleteZona = async (id) => {
    try {
      const { error } = await supabase
        .from('zonas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setZonas(zonas.filter(z => z.id !== id));
      message.success('Zona eliminada correctamente');
      
    } catch (error) {
      console.error('Error eliminando zona:', error);
      message.error('Error al eliminar la zona');
    }
  };

  const handleDeletePlantillaProducto = async (id) => {
    try {
      const { error } = await supabase
        .from('plantillas_productos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPlantillasProductos(plantillasProductos.filter(p => p.id !== id));
      message.success('Plantilla de producto eliminada correctamente');
      
    } catch (error) {
      console.error('Error eliminando plantilla de producto:', error);
      message.error('Error al eliminar la plantilla de producto');
    }
  };

  const handleDeleteProducto = async (id) => {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProductos(productos.filter(p => p.id !== id));
      message.success('Producto eliminado correctamente');
      
    } catch (error) {
      console.error('Error eliminando producto:', error);
      message.error('Error al eliminar el producto');
    }
  };

  // Función para renderizar el contenido del modal
  const renderModalContent = () => {
    switch (modalType) {
      case 'recinto':
        return <RecintoForm form={recintoForm} onFinish={handleSaveRecinto} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'sala':
        return <SalaForm form={salaForm} onFinish={handleSaveSala} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'evento':
        return <EventoForm form={eventoForm} onFinish={handleSaveEvento} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'funcion':
        return <FuncionForm form={funcionForm} onFinish={handleSaveFuncion} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'plantilla_precio':
        return <PlantillaPrecioForm form={plantillaPrecioForm} onFinish={handleSavePlantillaPrecio} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'mapa':
        return <MapaForm form={mapaForm} onFinish={handleSaveMapa} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'zona':
        return <ZonaForm form={zonaForm} onFinish={handleSaveZona} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'producto':
        return <ProductoForm form={productoForm} onFinish={handleSaveProducto} editingItem={editingItem} currentTenant={currentTenant} />;
      case 'plantilla_producto':
        return <PlantillaProductoForm form={plantillaProductoForm} onFinish={handleSavePlantillaProducto} editingItem={editingItem} currentTenant={currentTenant} />;
      default:
        return <div>Formulario no encontrado</div>;
    }
  };

  // Funciones de guardado para cada tipo de elemento
  const handleSaveRecinto = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('recintos')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setRecintos(recintos.map(r => r.id === editingItem.id ? { ...r, ...values } : r));
        message.success('Recinto actualizado correctamente');
      } else {
        const { data, error } = await supabase
          .from('recintos')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setRecintos([...recintos, data[0]]);
        message.success('Recinto creado correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando recinto:', error);
      message.error('Error al guardar el recinto');
    }
  };

  const handleSaveSala = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('salas')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setSalas(salas.map(s => s.id === editingItem.id ? { ...s, ...values } : s));
        message.success('Sala actualizada correctamente');
      } else {
        const { data, error } = await supabase
          .from('salas')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setSalas([...salas, data[0]]);
        message.success('Sala creada correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando sala:', error);
      message.error('Error al guardar la sala');
    }
  };

  const handleSaveEvento = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('eventos')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setEventos(eventos.map(e => e.id === editingItem.id ? { ...e, ...values } : e));
        message.success('Evento actualizado correctamente');
      } else {
        const { data, error } = await supabase
          .from('eventos')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setEventos([...eventos, data[0]]);
        message.success('Evento creado correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando evento:', error);
      message.error('Error al guardar el evento');
    }
  };

  const handleSaveFuncion = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('funciones')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setFunciones(funciones.map(f => f.id === editingItem.id ? { ...f, ...values } : f));
        message.success('Función actualizada correctamente');
      } else {
        const { data, error } = await supabase
          .from('funciones')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setFunciones([...funciones, data[0]]);
        message.success('Función creada correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando función:', error);
      message.error('Error al guardar la función');
    }
  };

  const handleSavePlantillaPrecio = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('plantillas_precios')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setPlantillasPrecios(plantillasPrecios.map(p => p.id === editingItem.id ? { ...p, ...values } : p));
        message.success('Plantilla de precio actualizada correctamente');
      } else {
        const { data, error } = await supabase
          .from('plantillas_precios')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setPlantillasPrecios([...plantillasPrecios, data[0]]);
        message.success('Plantilla de precio creada correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando plantilla de precio:', error);
      message.error('Error al guardar la plantilla de precio');
    }
  };

  const handleSaveMapa = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('mapas')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setMapas(mapas.map(m => m.id === editingItem.id ? { ...m, ...values } : m));
        message.success('Mapa actualizado correctamente');
      } else {
        const { data, error } = await supabase
          .from('mapas')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setMapas([...mapas, data[0]]);
        message.success('Mapa creado correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando mapa:', error);
      message.error('Error al guardar el mapa');
    }
  };

  const handleSaveZona = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('zonas')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setZonas(zonas.map(z => z.id === editingItem.id ? { ...z, ...values } : z));
        message.success('Zona actualizada correctamente');
      } else {
        const { data, error } = await supabase
          .from('zonas')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setZonas([...zonas, data[0]]);
        message.success('Zona creada correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando zona:', error);
      message.error('Error al guardar la zona');
    }
  };

  const handleSaveProducto = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('productos')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setProductos(productos.map(p => p.id === editingItem.id ? { ...p, ...values } : p));
        message.success('Producto actualizado correctamente');
      } else {
        const { data, error } = await supabase
          .from('productos')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setProductos([...productos, data[0]]);
        message.success('Producto creado correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando producto:', error);
      message.error('Error al guardar el producto');
    }
  };

  const handleSavePlantillaProducto = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('plantillas_productos')
          .update(values)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        setPlantillasProductos(plantillasProductos.map(p => p.id === editingItem.id ? { ...p, ...values } : p));
        message.success('Plantilla de producto actualizada correctamente');
      } else {
        const { data, error } = await supabase
          .from('plantillas_productos')
          .insert([{ ...values, tenant_id: currentTenant.id }])
          .select();
        
        if (error) throw error;
        
        setPlantillasProductos([...plantillasProductos, data[0]]);
        message.success('Plantilla de producto creada correctamente');
      }
      
      closeModal();
      
    } catch (error) {
      console.error('Error guardando plantilla de producto:', error);
      message.error('Error al guardar la plantilla de producto');
    }
  };

  // Función para abrir detalles del error
  const openErrorDetails = (error) => {
    Modal.info({
      title: `Detalles del Error: ${error.title}`,
      width: 800,
      content: (
        <div>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Tipo de Error">{error.type}</Descriptions.Item>
            <Descriptions.Item label="Severidad">
              <Tag color={
                error.severity === 'critical' ? 'red' :
                error.severity === 'warning' ? 'orange' : 'blue'
              }>
                {error.severity === 'critical' ? 'Crítico' :
                 error.severity === 'warning' ? 'Advertencia' : 'Info'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Descripción">{error.description}</Descriptions.Item>
            <Descriptions.Item label="Tabla Afectada">{error.table}</Descriptions.Item>
            <Descriptions.Item label="Acción de Corrección">
              {error.fixAction ? error.fixAction : 'Manual'}
            </Descriptions.Item>
          </Descriptions>
          
          {error.affectedRecords && error.affectedRecords.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Title level={5}>Registros Afectados</Title>
              <List
                size="small"
                dataSource={error.affectedRecords}
                renderItem={(record) => (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        size="small"
                        danger
                        onClick={() => {
                          Modal.confirm({
                            title: 'Confirmar Eliminación',
                            content: `¿Estás seguro de que quieres eliminar este registro?`,
                            onOk: () => deleteRecord(error, record.id)
                          });
                        }}
                      >
                        Eliminar
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={`ID: ${record.id}`}
                      description={
                        <div>
                          {record.nombre && <div>Nombre: {record.nombre}</div>}
                          {record.evento_id && <div>Evento ID: {record.evento_id}</div>}
                          {record.recinto_id && <div>Recinto ID: {record.recinto_id}</div>}
                          {record.sala_id && <div>Sala ID: {record.sala_id}</div>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            {error.fixAction && error.fixAction !== 'manual_rls_check' && (
              <Button
                type="primary"
                onClick={() => {
                  Modal.confirm({
                    title: 'Confirmar Corrección',
                    content: `¿Estás seguro de que quieres aplicar la corrección automática?`,
                    onOk: () => applyAutomaticFix(error)
                  });
                }}
              >
                Aplicar Corrección Automática
              </Button>
            )}
          </div>
        </div>
      )
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 1) / steps.length) * 100);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress((currentStep / steps.length) * 100);
    }
  };

  const handleStepClick = (step) => {
    setCurrentStep(step);
    setProgress((step / steps.length) * 100);
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setModalVisible(true);
    
    // Resetear formulario correspondiente
    switch (type) {
      case 'recinto':
        recintoForm.resetFields();
        if (item) recintoForm.setFieldsValue(item);
        break;
      case 'sala':
        salaForm.resetFields();
        if (item) salaForm.setFieldsValue(item);
        break;
      case 'evento':
        eventoForm.resetFields();
        if (item) eventoForm.setFieldsValue(item);
        break;
      case 'funcion':
        funcionForm.resetFields();
        if (item) funcionForm.setFieldsValue(item);
        break;
      case 'plantillaPrecio':
        plantillaPrecioForm.resetFields();
        if (item) plantillaPrecioForm.setFieldsValue(item);
        break;
      case 'mapa':
        mapaForm.resetFields();
        if (item) mapaForm.setFieldsValue(item);
        break;
      case 'zona':
        zonaForm.resetFields();
        if (item) zonaForm.setFieldsValue(item);
        break;
      case 'producto':
        productoForm.resetFields();
        if (item) productoForm.setFieldsValue(item);
        break;
      case 'plantillaProducto':
        plantillaProductoForm.resetFields();
        if (item) plantillaProductoForm.setFieldsValue(item);
        break;
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setModalType('');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <TenantSelectionStep />;
      case 1:
        return <DatabaseErrorsStep />;
      case 2:
        return <RecintoStep />;
      case 3:
        return <SalasStep />;
      case 4:
        return <EventoStep />;
      case 5:
        return <FuncionesStep />;
      case 6:
        return <PlantillaPreciosStep />;
      case 7:
        return <MapaStep />;
      case 8:
        return <ZonasStep />;
      case 9:
        return <ProductosStep />;
      case 10:
        return <PlantillasProductosStep />;
      case 11:
        return <VerificacionStep />;
      default:
        return <div>Paso no encontrado</div>;
    }
  };

  const TenantSelectionStep = () => (
    <Card title="Selección de Tenant" className="diagnostic-step">
      <Alert
        message="Información del Tenant"
        description="Selecciona la empresa para la cual realizarás el diagnóstico completo del sistema."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      {currentTenant ? (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Empresa">{currentTenant.company_name}</Descriptions.Item>
          <Descriptions.Item label="Subdominio">{currentTenant.subdomain}.ticketera.com</Descriptions.Item>
          <Descriptions.Item label="Email">{currentTenant.contact_email}</Descriptions.Item>
          <Descriptions.Item label="Plan">{currentTenant.plan_type}</Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={currentTenant.status === 'active' ? 'green' : 'red'}>
              {currentTenant.status === 'active' ? 'Activo' : 'Inactivo'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Fecha de Creación">
            {new Date(currentTenant.created_at).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert
          message="No se encontró tenant"
          description="No se pudo cargar la información del tenant actual. Verifica tu sesión."
          type="warning"
          showIcon
        />
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button 
          type="primary" 
          size="large" 
          onClick={handleNext}
          disabled={!currentTenant}
        >
          Continuar al Siguiente Paso
        </Button>
      </div>
    </Card>
  );

  const DatabaseErrorsStep = () => (
    <Card title="Diagnóstico de Errores de Base de Datos" className="diagnostic-step database-errors-step">
      <Alert
        message="Detección de Problemas"
        description="Este paso escanea la base de datos para detectar errores de integridad, datos corruptos, problemas de permisos y inconsistencias. Puedes corregir automáticamente algunos problemas o eliminarlos manualmente."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={scanDatabaseErrors}
            loading={isScanningErrors}
            block
            size="large"
            className="scan-button"
          >
            {isScanningErrors ? 'Escaneando...' : 'Escanear Base de Datos'}
          </Button>
        </Col>
      </Row>

      {/* Resumen de errores encontrados */}
      {Object.keys(errorScanResults).length > 0 && (
        <Card size="small" style={{ marginBottom: '24px' }} className="error-summary">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic 
                title="Total de Errores" 
                value={errorScanResults.totalErrors} 
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: errorScanResults.totalErrors > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Críticos" 
                value={errorScanResults.criticalErrors} 
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Advertencias" 
                value={errorScanResults.warningErrors} 
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Informativos" 
                value={errorScanResults.infoErrors} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Lista de errores encontrados */}
      {databaseErrors.length > 0 && (
        <Card title="Errores Detectados" size="small" className="error-list">
          <List
            dataSource={databaseErrors}
            renderItem={(error) => (
              <List.Item
                actions={[
                  <Button
                    key="fix"
                    type="primary"
                    size="small"
                    onClick={() => applyAutomaticFix(error)}
                    disabled={!error.fixAction || error.fixAction === 'manual_rls_check'}
                  >
                    Corregir
                  </Button>,
                  <Button
                    key="view"
                    size="small"
                    onClick={() => openErrorDetails(error)}
                  >
                    Ver Detalles
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge
                      count={
                        <ExclamationCircleOutlined 
                          style={{ 
                            color: '#fff',
                            fontSize: '12px'
                          }} 
                        />
                      }
                      style={{ 
                        backgroundColor: error.severity === 'critical' ? '#cf1322' : 
                                       error.severity === 'warning' ? '#faad14' : '#1890ff'
                      }}
                    >
                      <Avatar 
                        icon={
                          error.type === 'referential_integrity' ? <DatabaseOutlined /> :
                          error.type === 'data_corruption' ? <ExclamationCircleOutlined /> :
                          error.type === 'rls_inconsistency' ? <SettingOutlined /> :
                          <InfoCircleOutlined />
                        }
                        style={{ 
                          backgroundColor: error.severity === 'critical' ? '#ff4d4f' : 
                                         error.severity === 'warning' ? '#faad14' : '#1890ff'
                        }}
                      />
                    </Badge>
                  }
                  title={
                    <Space>
                      {error.title}
                      <Tag color={
                        error.severity === 'critical' ? 'red' :
                        error.severity === 'warning' ? 'orange' : 'blue'
                      }>
                        {error.severity === 'critical' ? 'Crítico' :
                         error.severity === 'warning' ? 'Advertencia' : 'Info'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>{error.description}</div>
                      {error.affectedRecords && error.affectedRecords.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary">
                            Registros afectados: {error.affectedRecords.length}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Mensaje cuando no hay errores */}
      {databaseErrors.length === 0 && !isScanningErrors && Object.keys(errorScanResults).length > 0 && (
        <div className="success-state">
          <Result
            status="success"
            title="¡Excelente! No se encontraron errores"
            subTitle="Tu base de datos está funcionando correctamente"
            extra={
              <Button type="primary" onClick={handleNext}>
                Continuar al Siguiente Paso
              </Button>
            }
          />
        </div>
      )}

      {/* Botón para continuar si hay errores */}
      {databaseErrors.length > 0 && (
        <div style={{ marginTop: '24px', textAlign: 'center' }} className="warning-state">
          <Alert
            message="Errores Encontrados"
            description="Se encontraron problemas en la base de datos. Puedes corregirlos automáticamente o continuar al siguiente paso para crearlos desde cero."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Button 
            type="primary" 
            size="large" 
            onClick={handleNext}
          >
            Continuar al Siguiente Paso
          </Button>
        </div>
      )}
    </Card>
  );

  const RecintoStep = () => (
    <Card title="Creación de Recinto" className="diagnostic-step">
      <Alert
        message="Recinto del Evento"
        description="Crea el recinto donde se realizará el evento. Define la ubicación, capacidad y características principales."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('recinto')}
            block
          >
            Crear Nuevo Recinto
          </Button>
        </Col>
      </Row>
      
      {recintos.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Recintos Creados</Title>
          <List
            dataSource={recintos}
            renderItem={(recinto) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('recinto', recinto)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('recinto', recinto)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteRecinto(recinto.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={recinto.nombre}
                  description={`${recinto.direccion} - Capacidad: ${recinto.capacidad} personas`}
                />
                <Tag color="green">Creado</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={recintos.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const SalasStep = () => (
    <Card title="Creación de Salas" className="diagnostic-step">
      <Alert
        message="Salas del Recinto"
        description="Crea las salas dentro del recinto seleccionado. Define la capacidad y características de cada espacio."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('sala')}
            block
          >
            Crear Nueva Sala
          </Button>
        </Col>
      </Row>
      
      {salas.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Salas Creadas</Title>
          <List
            dataSource={salas}
            renderItem={(sala) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('sala', sala)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('sala', sala)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteSala(sala.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={sala.nombre}
                  description={`Recinto: ${sala.recinto_id} - Capacidad: ${sala.capacidad} personas`}
                />
                <Tag color="green">Creada</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={salas.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const EventoStep = () => (
    <Card title="Creación de Evento" className="diagnostic-step">
      <Alert
        message="Evento Principal"
        description="Crea el evento principal que se realizará en el recinto. Define el nombre, descripción y características básicas."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('evento')}
            block
          >
            Crear Nuevo Evento
          </Button>
        </Col>
      </Row>
      
      {eventos.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Eventos Creados</Title>
          <List
            dataSource={eventos}
            renderItem={(evento) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('evento', evento)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('evento', evento)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteEvento(evento.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={evento.nombre}
                  description={`${evento.descripcion} - Estado: ${evento.estado}`}
                />
                <Tag color="green">Creado</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={eventos.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const FuncionesStep = () => (
    <Card title="Creación de Funciones" className="diagnostic-step">
      <Alert
        message="Funciones del Evento"
        description="Crea las funciones específicas del evento con fechas, horarios y salas asignadas."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('funcion')}
            block
          >
            Crear Nueva Función
          </Button>
        </Col>
      </Row>
      
      {funciones.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Funciones Creadas</Title>
          <List
            dataSource={funciones}
            renderItem={(funcion) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('funcion', funcion)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('funcion', funcion)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteFuncion(funcion.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={funcion.nombre}
                  description={`Evento: ${funcion.evento_id} - Fecha: ${funcion.fecha_celebracion} - Hora: ${funcion.hora_inicio}`}
                />
                <Tag color="green">Creada</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={funciones.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const PlantillaPreciosStep = () => (
    <Card title="Creación de Plantilla de Precios" className="diagnostic-step">
      <Alert
        message="Plantilla de Precios"
        description="Crea la estructura de precios para las entradas del evento. Define categorías y precios por zona."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('plantillaPrecio')}
            block
          >
            Crear Nueva Plantilla de Precios
          </Button>
        </Col>
      </Row>
      
      {plantillasPrecios.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Plantillas de Precios Creadas</Title>
          <List
            dataSource={plantillasPrecios}
            renderItem={(plantilla) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('plantillaPrecio', plantilla)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('plantillaPrecio', plantilla)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeletePlantillaPrecio(plantilla.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={plantilla.nombre}
                  description={`Evento: ${plantilla.evento_id} - Tipo: ${plantilla.tipo}`}
                />
                <Tag color="green">Creada</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={plantillasPrecios.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const MapaStep = () => (
    <Card title="Creación de Mapa" className="diagnostic-step">
      <Alert
        message="Mapa de Asientos"
        description="Crea el mapa de disposición de asientos para la sala seleccionada. Define filas, columnas y tipos de asientos."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('mapa')}
            block
          >
            Crear Nuevo Mapa
          </Button>
        </Col>
      </Row>
      
      {mapas.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Mapas Creados</Title>
          <List
            dataSource={mapas}
            renderItem={(mapa) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('mapa', mapa)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('mapa', mapa)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteMapa(mapa.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={mapa.nombre}
                  description={`Sala: ${mapa.sala_id} - Filas: ${mapa.filas} - Columnas: ${mapa.columnas}`}
                />
                <Tag color="green">Creado</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={mapas.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const ZonasStep = () => (
    <Card title="Creación de Zonas" className="diagnostic-step">
      <Alert
        message="Zonas del Mapa"
        description="Crea las zonas dentro del mapa para organizar los asientos por categorías y precios."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('zona')}
            block
          >
            Crear Nueva Zona
          </Button>
        </Col>
      </Row>
      
      {zonas.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Zonas Creadas</Title>
          <List
            dataSource={zonas}
            renderItem={(zona) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('zona', zona)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('zona', zona)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteZona(zona.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={zona.nombre}
                  description={`Mapa: ${zona.mapa_id} - Color: ${zona.color} - Precio: $${zona.precio}`}
                />
                <Tag color="green">Creada</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={zonas.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const ProductosStep = () => (
    <Card title="Creación de Productos" className="diagnostic-step">
      <Alert
        message="Productos Adicionales"
        description="Crea productos adicionales que se pueden vender junto con las entradas del evento."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('producto')}
            block
          >
            Crear Nuevo Producto
          </Button>
        </Col>
      </Row>
      
      {productos.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Productos Creados</Title>
          <List
            dataSource={productos}
            renderItem={(producto) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('producto', producto)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('producto', producto)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteProducto(producto.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={producto.nombre}
                  description={`${producto.descripcion} - Precio: $${producto.precio} - Stock: ${producto.stock}`}
                />
                <Tag color="green">Creado</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={productos.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const PlantillasProductosStep = () => (
    <Card title="Creación de Plantillas de Productos" className="diagnostic-step">
      <Alert
        message="Plantillas de Productos"
        description="Crea plantillas para agrupar productos relacionados y facilitar su venta."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal('plantillaProducto')}
            block
          >
            Crear Nueva Plantilla de Productos
          </Button>
        </Col>
      </Row>
      
      {plantillasProductos.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Plantillas de Productos Creadas</Title>
          <List
            dataSource={plantillasProductos}
            renderItem={(plantilla) => (
              <List.Item
                actions={[
                  <Button size="small" icon={<EyeOutlined />} onClick={() => openModal('plantillaProducto', plantilla)}>
                    Ver
                  </Button>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openModal('plantillaProducto', plantilla)}>
                    Editar
                  </Button>,
                  <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeletePlantillaProducto(plantilla.id)}>
                    Eliminar
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={plantilla.nombre}
                  description={`${plantilla.descripcion} - Evento: ${plantilla.evento_id}`}
                />
                <Tag color="green">Creada</Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={plantillasProductos.length === 0}
          >
            Continuar
          </Button>
        </Space>
      </div>
    </Card>
  );

  const VerificacionStep = () => (
    <Card title="Verificación del Sistema" className="diagnostic-step">
      <Alert
        message="Verificación Final"
        description="Verifica que todos los elementos del sistema estén funcionando correctamente antes de finalizar."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={runSystemVerification}
            block
            size="large"
          >
            Ejecutar Verificación del Sistema
          </Button>
        </Col>
      </Row>
      
      {Object.keys(diagnosticResults).length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Resultados de la Verificación</Title>
          <List
            dataSource={Object.entries(diagnosticResults)}
            renderItem={([key, result]) => (
              <List.Item>
                <List.Item.Meta
                  title={result.title}
                  description={result.description}
                />
                <Tag color={result.status === 'success' ? 'green' : result.status === 'warning' ? 'orange' : 'red'}>
                  {result.status === 'success' ? 'Exitoso' : result.status === 'warning' ? 'Advertencia' : 'Error'}
                </Tag>
              </List.Item>
            )}
          />
        </div>
      )}
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space>
          <Button onClick={handlePrev}>
            Anterior
          </Button>
          <Button 
            type="primary" 
            onClick={() => setShowResults(true)}
            disabled={Object.keys(diagnosticResults).length === 0}
          >
            Ver Resultados Completos
          </Button>
        </Space>
      </div>
    </Card>
  );

  const runSystemVerification = async () => {
    setLoading(true);
    const results = {};
    
    try {
      // Verificar recintos
      if (recintos.length > 0) {
        results.recintos = { status: 'success', title: 'Recintos', description: `${recintos.length} recintos creados correctamente` };
      } else {
        results.recintos = { status: 'error', title: 'Recintos', description: 'No se han creado recintos' };
      }
      
      // Verificar salas
      if (salas.length > 0) {
        results.salas = { status: 'success', title: 'Salas', description: `${salas.length} salas creadas correctamente` };
      } else {
        results.salas = { status: 'error', title: 'Salas', description: 'No se han creado salas' };
      }
      
      // Verificar eventos
      if (eventos.length > 0) {
        results.eventos = { status: 'success', title: 'Eventos', description: `${eventos.length} eventos creados correctamente` };
      } else {
        results.eventos = { status: 'error', title: 'Eventos', description: 'No se han creado eventos' };
      }
      
      // Verificar funciones
      if (funciones.length > 0) {
        results.funciones = { status: 'success', title: 'Funciones', description: `${funciones.length} funciones creadas correctamente` };
      } else {
        results.funciones = { status: 'error', title: 'Funciones', description: 'No se han creado funciones' };
      }
      
      // Verificar plantillas de precios
      if (plantillasPrecios.length > 0) {
        results.plantillasPrecios = { status: 'success', title: 'Plantillas de Precios', description: `${plantillasPrecios.length} plantillas creadas correctamente` };
      } else {
        results.plantillasPrecios = { status: 'error', title: 'Plantillas de Precios', description: 'No se han creado plantillas de precios' };
      }
      
      // Verificar mapas
      if (mapas.length > 0) {
        results.mapas = { status: 'success', title: 'Mapas', description: `${mapas.length} mapas creados correctamente` };
      } else {
        results.mapas = { status: 'error', title: 'Mapas', description: 'No se han creado mapas' };
      }
      
      // Verificar zonas
      if (zonas.length > 0) {
        results.zonas = { status: 'success', title: 'Zonas', description: `${zonas.length} zonas creadas correctamente` };
      } else {
        results.zonas = { status: 'error', title: 'Zonas', description: 'No se han creado zonas' };
      }
      
      // Verificar productos
      if (productos.length > 0) {
        results.productos = { status: 'success', title: 'Productos', description: `${productos.length} productos creados correctamente` };
      } else {
        results.productos = { status: 'warning', title: 'Productos', description: 'No se han creado productos (opcional)' };
      }
      
      // Verificar plantillas de productos
      if (plantillasProductos.length > 0) {
        results.plantillasProductos = { status: 'success', title: 'Plantillas de Productos', description: `${plantillasProductos.length} plantillas creadas correctamente` };
      } else {
        results.plantillasProductos = { status: 'warning', title: 'Plantillas de Productos', description: 'No se han creado plantillas de productos (opcional)' };
      }
      
      setDiagnosticResults(results);
      message.success('Verificación del sistema completada');
      
    } catch (error) {
      console.error('Error en verificación:', error);
      message.error('Error durante la verificación del sistema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DatabaseOutlined style={{ marginRight: '8px' }} />
        Diagnóstico Completo del Sistema SaaS
      </Title>
      
      <Paragraph>
        Esta herramienta te permite crear y configurar todos los elementos necesarios para un sistema de ticketera completo,
        desde recintos hasta mapas de asientos, paso a paso.
      </Paragraph>
      
      {/* Barra de progreso */}
      <Card style={{ marginBottom: '24px' }} className="progress-container">
        <Progress 
          percent={progress} 
          status="active" 
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <Text type="secondary">
            Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}
          </Text>
        </div>
      </Card>
      
      {/* Pasos */}
      <Card style={{ marginBottom: '24px' }} className="steps-container">
        <Steps 
          current={currentStep} 
          onChange={handleStepClick}
          responsive={true}
        >
          {steps.map((step, index) => (
            <Step 
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>
      </Card>
      
      {/* Contenido del paso actual */}
      {renderStepContent()}
      
      {/* Modal para crear/editar elementos */}
      <Modal
        title={`${editingItem ? 'Editar' : 'Crear'} ${modalType}`}
        visible={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        {renderModalContent()}
      </Modal>
      
      {/* Modal de resultados */}
      <Modal
        title="Resultados del Diagnóstico Completo"
        visible={showResults}
        onCancel={() => setShowResults(false)}
        footer={[
          <Button key="close" onClick={() => setShowResults(false)}>
            Cerrar
          </Button>,
          <Button key="export" type="primary" icon={<SaveOutlined />}>
            Exportar Reporte
          </Button>
        ]}
        width={1000}
      >
        <Result
          status="success"
          title="Diagnóstico Completado Exitosamente"
          subTitle="El sistema ha sido configurado correctamente con todos los elementos necesarios"
          extra={[
            <Button type="primary" key="dashboard">
              Ir al Dashboard
            </Button>,
            <Button key="settings">
              Configuración Avanzada
            </Button>
          ]}
        >
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>Resumen de Elementos Creados</Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="Recintos" value={recintos.length} prefix={<EnvironmentOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="Salas" value={salas.length} prefix={<TeamOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="Eventos" value={eventos.length} prefix={<CalendarOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="Funciones" value={funciones.length} prefix={<ClockCircleOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="Mapas" value={mapas.length} prefix={<PictureOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="Zonas" value={zonas.length} prefix={<StarOutlined />} />
                </Card>
              </Col>
            </Row>
          </div>
        </Result>
      </Modal>
    </div>
  );
};

export default SaasDiagnostico;
