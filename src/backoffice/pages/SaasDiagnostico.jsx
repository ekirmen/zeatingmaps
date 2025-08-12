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
  Avatar,
  Empty,
  Spin,
  Table
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
  const [errorScanResults, setErrorScanResults] = useState(null);
  
  // Estados para boletería
  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSala, setSelectedSala] = useState(null);
  
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
      title: 'Diagnóstico de Errores',
      description: 'Detectar y corregir errores de BD'
    },
    {
      title: 'Recintos y Salas',
      description: 'Configurar espacios de eventos'
    },
    {
      title: 'Eventos y Funciones',
      description: 'Crear eventos y funciones'
    },
    {
      title: 'Mapas y Zonas',
      description: 'Configurar distribución de asientos'
    },
    {
      title: 'Plantillas de Precio',
      description: 'Definir estructuras de precios'
    },
    {
      title: 'Productos y Servicios',
      description: 'Gestionar productos adicionales'
    },
    {
      title: 'Gestión de Asientos',
      description: 'Estado, bloqueo y disponibilidad'
    },
    {
      title: 'Sistema de Reservas',
      description: 'Crear y gestionar reservas'
    },
    {
      title: 'Panel de Pagos',
      description: 'Transacciones y estados'
    },
    {
      title: 'Gestión de Ventas',
      description: 'Historial y reembolsos'
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
      case 'plantillaProducto':
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
        return <DatabaseErrorsStep />;
      case 1:
        return <RecintosSalasStep />;
      case 2:
        return <EventosFuncionesStep />;
      case 3:
        return <MapasZonasStep />;
      case 4:
        return <PlantillasPrecioStep />;
      case 5:
        return <ProductosServiciosStep />;
      case 6:
        return <GestionAsientosStep />;
      case 7:
        return <SistemaReservasStep />;
      case 8:
        return <PanelPagosStep />;
      case 9:
        return <GestionVentasStep />;
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

  const RecintosSalasStep = () => (
    <Card title="Creación de Recinto y Salas" className="diagnostic-step">
      <Alert
        message="Recinto del Evento y Salas"
        description="Crea el recinto donde se realizará el evento y las salas dentro del recinto. Define la ubicación, capacidad y características principales."
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

  const EventosFuncionesStep = () => (
    <Card title="Creación de Eventos y Funciones" className="diagnostic-step">
      <Alert
        message="Evento Principal y Funciones"
        description="Crea el evento principal que se realizará en el recinto y las funciones específicas del evento con fechas, horarios y salas asignadas."
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

  const MapasZonasStep = () => (
    <Card title="Creación de Mapa y Zonas" className="diagnostic-step">
      <Alert
        message="Mapa de Asientos y Zonas del Mapa"
        description="Crea el mapa de disposición de asientos para la sala seleccionada y las zonas dentro del mapa para organizar los asientos por categorías y precios."
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

  const PlantillasPrecioStep = () => (
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

  const ProductosServiciosStep = () => (
    <Card title="Creación de Productos y Servicios" className="diagnostic-step">
      <Alert
        message="Productos Adicionales y Servicios"
        description="Crea productos adicionales que se pueden vender junto con las entradas del evento y servicios adicionales que se ofrecen."
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

  const GestionAsientosStep = () => {
    const [events, setEvents] = useState([]);
    const [salas, setSalas] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedSala, setSelectedSala] = useState(null);

    useEffect(() => {
      loadEventsData();
    }, []);

    const loadEventsData = async () => {
      const eventsData = await loadEvents();
      setEvents(eventsData);
    };

    const handleEventChange = async (eventId) => {
      setSelectedEvent(eventId);
      setSelectedSala(null);
      setSeats([]);
      if (eventId) {
        const salasData = await loadSalas(eventId);
        setSalas(salasData);
      }
    };

    const handleSalaChange = async (salaId) => {
      setSelectedSala(salaId);
      if (salaId) {
        await loadSeats(salaId);
      }
    };

    return (
      <Card title="Gestión de Asientos" className="diagnostic-step">
        <Alert
          message="Estado, Bloqueo y Disponibilidad"
          description="Configura el estado, bloqueo y disponibilidad de los asientos para cada sala."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Select
              placeholder="Seleccionar Evento"
              style={{ width: '100%' }}
              onChange={handleEventChange}
              value={selectedEvent}
            >
              {events.map(event => (
                <Select.Option key={event.id} value={event.id}>
                  {event.nombre} - {new Date(event.fecha_inicio).toLocaleDateString()}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Select
              placeholder="Seleccionar Sala"
              style={{ width: '100%' }}
              onChange={handleSalaChange}
              value={selectedSala}
              disabled={!selectedEvent}
            >
              {salas.map(sala => (
                <Select.Option key={sala.id} value={sala.id}>
                  {sala.nombre} - {sala.capacidad} asientos
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        {selectedSala && (
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>Asientos de la Sala</Title>
            {isLoadingSeats ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Cargando asientos...</div>
              </div>
            ) : seats.length > 0 ? (
              <div className="seats-grid">
                {seats.map(seat => (
                  <div
                    key={seat.id}
                    className={`seat-item ${seat.estado} ${seat.bloqueado ? 'blocked' : ''}`}
                    style={{
                      backgroundColor: seat.zona?.color || '#f0f0f0',
                      border: seat.bloqueado ? '2px solid #ff4d4f' : '1px solid #d9d9d9'
                    }}
                  >
                    <div className="seat-info">
                      <div className="seat-id">{seat.id}</div>
                      <div className="seat-status">
                        <Tag color={seat.estado === 'disponible' ? 'green' : 
                                   seat.estado === 'reservado' ? 'orange' : 
                                   seat.estado === 'vendido' ? 'red' : 'default'}>
                          {seat.estado}
                        </Tag>
                      </div>
                      <div className="seat-actions">
                        <Button
                          size="small"
                          type={seat.bloqueado ? 'primary' : 'default'}
                          onClick={() => toggleSeatLock(seat.id, seat.bloqueado)}
                        >
                          {seat.bloqueado ? 'Desbloquear' : 'Bloquear'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No hay asientos configurados para esta sala" />
            )}
          </div>
        )}

        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!selectedSala || seats.length === 0}
            >
              Continuar
            </Button>
          </Col>
        </Row>
      </Card>
    );
  };

  const SistemaReservasStep = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [reservationModalVisible, setReservationModalVisible] = useState(false);
    const [newReservation, setNewReservation] = useState({});

    useEffect(() => {
      loadEventsData();
    }, []);

    useEffect(() => {
      if (selectedEvent) {
        loadReservations(selectedEvent);
      }
    }, [selectedEvent]);

    const loadEventsData = async () => {
      const eventsData = await loadEvents();
      setEvents(eventsData);
    };

    const handleEventChange = (eventId) => {
      setSelectedEvent(eventId);
    };

    const handleCreateReservation = () => {
      setNewReservation({
        evento_id: selectedEvent,
        sala_id: '',
        asiento_id: '',
        usuario_id: ''
      });
      setReservationModalVisible(true);
    };

    const handleSaveReservation = async () => {
      if (await createReservation(newReservation)) {
        setReservationModalVisible(false);
        setNewReservation({});
      }
    };

    return (
      <Card title="Sistema de Reservas" className="diagnostic-step">
        <Alert
          message="Crear y Gestionar Reservas"
          description="Configura el sistema de reservas para que los usuarios puedan reservar asientos para eventos."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Select
              placeholder="Seleccionar Evento"
              style={{ width: '100%' }}
              onChange={handleEventChange}
              value={selectedEvent}
            >
              {events.map(event => (
                <Select.Option key={event.id} value={event.id}>
                  {event.nombre} - {new Date(event.fecha_inicio).toLocaleDateString()}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateReservation}
              disabled={!selectedEvent}
            >
              Crear Reserva
            </Button>
          </Col>
        </Row>

        {selectedEvent && (
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>Reservas del Evento</Title>
            {isLoadingReservations ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Cargando reservas...</div>
              </div>
            ) : reservations.length > 0 ? (
              <Table
                dataSource={reservations}
                columns={[
                  {
                    title: 'Usuario',
                    dataIndex: 'usuarios',
                    key: 'usuario',
                    render: (usuarios) => usuarios?.email || 'N/A'
                  },
                  {
                    title: 'Asiento',
                    dataIndex: 'asiento_id',
                    key: 'asiento'
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'estado',
                    key: 'estado',
                    render: (estado) => (
                      <Tag color={
                        estado === 'reservado' ? 'green' :
                        estado === 'cancelada' ? 'red' :
                        estado === 'expirada' ? 'orange' : 'default'
                      }>
                        {estado}
                      </Tag>
                    )
                  },
                  {
                    title: 'Fecha Reserva',
                    dataIndex: 'fecha_reserva',
                    key: 'fecha_reserva',
                    render: (fecha) => new Date(fecha).toLocaleString()
                  },
                  {
                    title: 'Expira',
                    dataIndex: 'fecha_expiracion',
                    key: 'fecha_expiracion',
                    render: (fecha) => new Date(fecha).toLocaleString()
                  },
                  {
                    title: 'Acciones',
                    key: 'acciones',
                    render: (_, record) => (
                      <Space>
                        {record.estado === 'reservado' && (
                          <Button
                            size="small"
                            danger
                            onClick={() => cancelReservation(record.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </Space>
                    )
                  }
                ]}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            ) : (
              <Empty description="No hay reservas para este evento" />
            )}
          </div>
        )}

        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!selectedEvent}
            >
              Continuar
            </Button>
          </Col>
        </Row>

        {/* Modal para crear reserva */}
        <Modal
          title="Crear Nueva Reserva"
          open={reservationModalVisible}
          onOk={handleSaveReservation}
          onCancel={() => setReservationModalVisible(false)}
          okText="Crear"
          cancelText="Cancelar"
        >
          <Form layout="vertical">
            <Form.Item label="Sala" required>
              <Select
                placeholder="Seleccionar sala"
                value={newReservation.sala_id}
                onChange={(value) => setNewReservation({...newReservation, sala_id: value})}
              >
                {salas.map(sala => (
                  <Select.Option key={sala.id} value={sala.id}>
                    {sala.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Asiento" required>
              <Input
                placeholder="ID del asiento"
                value={newReservation.asiento_id}
                onChange={(e) => setNewReservation({...newReservation, asiento_id: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Usuario" required>
              <Input
                placeholder="ID del usuario"
                value={newReservation.usuario_id}
                onChange={(e) => setNewReservation({...newReservation, usuario_id: e.target.value})}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  };

  const PanelPagosStep = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [newPayment, setNewPayment] = useState({});

    useEffect(() => {
      loadEventsData();
    }, []);

    useEffect(() => {
      if (selectedEvent) {
        loadPayments(selectedEvent);
      }
    }, [selectedEvent]);

    const loadEventsData = async () => {
      const eventsData = await loadEvents();
      setEvents(eventsData);
    };

    const handleEventChange = (eventId) => {
      setSelectedEvent(eventId);
    };

    const handleCreatePayment = () => {
      setNewPayment({
        evento_id: selectedEvent,
        usuario_id: '',
        monto: '',
        metodo_pago: 'tarjeta'
      });
      setPaymentModalVisible(true);
    };

    const handleSavePayment = async () => {
      if (await processPayment(newPayment)) {
        setPaymentModalVisible(false);
        setNewPayment({});
      }
    };

    return (
      <Card title="Panel de Pagos" className="diagnostic-step">
        <Alert
          message="Transacciones y Estados"
          description="Configura el sistema de pagos para que los usuarios puedan realizar pagos y ver el estado de sus transacciones."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Select
              placeholder="Seleccionar Evento"
              style={{ width: '100%' }}
              onChange={handleEventChange}
              value={selectedEvent}
            >
              {events.map(event => (
                <Select.Option key={event.id} value={event.id}>
                  {event.nombre} - {new Date(event.fecha_inicio).toLocaleDateString()}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreatePayment}
              disabled={!selectedEvent}
            >
              Procesar Pago
            </Button>
          </Col>
        </Row>

        {selectedEvent && (
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>Transacciones del Evento</Title>
            {isLoadingPayments ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Cargando transacciones...</div>
              </div>
            ) : payments.length > 0 ? (
              <Table
                dataSource={payments}
                columns={[
                  {
                    title: 'Usuario',
                    dataIndex: 'usuarios',
                    key: 'usuario',
                    render: (usuarios) => usuarios?.email || 'N/A'
                  },
                  {
                    title: 'Monto',
                    dataIndex: 'monto',
                    key: 'monto',
                    render: (monto) => `$${monto}`
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'estado',
                    key: 'estado',
                    render: (estado) => (
                      <Tag color={
                        estado === 'completado' ? 'green' :
                        estado === 'procesando' ? 'blue' :
                        estado === 'fallido' ? 'red' :
                        estado === 'reembolsado' ? 'orange' : 'default'
                      }>
                        {estado}
                      </Tag>
                    )
                  },
                  {
                    title: 'Método de Pago',
                    dataIndex: 'metodo_pago',
                    key: 'metodo_pago',
                    render: (metodo) => (
                      <Tag color="blue">{metodo}</Tag>
                    )
                  },
                  {
                    title: 'Fecha',
                    dataIndex: 'fecha_pago',
                    key: 'fecha_pago',
                    render: (fecha) => new Date(fecha).toLocaleString()
                  },
                  {
                    title: 'Acciones',
                    key: 'acciones',
                    render: (_, record) => (
                      <Space>
                        {record.estado === 'completado' && (
                          <Button
                            size="small"
                            onClick={() => handleRefundPayment(record.id)}
                          >
                            Reembolsar
                          </Button>
                        )}
                      </Space>
                    )
                  }
                ]}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            ) : (
              <Empty description="No hay transacciones para este evento" />
            )}
          </div>
        )}

        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!selectedEvent}
            >
              Continuar
            </Button>
          </Col>
        </Row>

        {/* Modal para procesar pago */}
        <Modal
          title="Procesar Nuevo Pago"
          open={paymentModalVisible}
          onOk={handleSavePayment}
          onCancel={() => setPaymentModalVisible(false)}
          okText="Procesar"
          cancelText="Cancelar"
        >
          <Form layout="vertical">
            <Form.Item label="Usuario" required>
              <Input
                placeholder="ID del usuario"
                value={newPayment.usuario_id}
                onChange={(e) => setNewPayment({...newPayment, usuario_id: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Monto" required>
              <InputNumber
                placeholder="0.00"
                value={newPayment.monto}
                onChange={(value) => setNewPayment({...newPayment, monto: value})}
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
            <Form.Item label="Método de Pago" required>
              <Select
                placeholder="Seleccionar método"
                value={newPayment.metodo_pago}
                onChange={(value) => setNewPayment({...newPayment, metodo_pago: value})}
              >
                <Select.Option value="tarjeta">Tarjeta de Crédito/Débito</Select.Option>
                <Select.Option value="transferencia">Transferencia Bancaria</Select.Option>
                <Select.Option value="efectivo">Efectivo</Select.Option>
                <Select.Option value="paypal">PayPal</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  };

  const GestionVentasStep = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [saleModalVisible, setSaleModalVisible] = useState(false);
    const [newSale, setNewSale] = useState({});

    useEffect(() => {
      loadEventsData();
    }, []);

    useEffect(() => {
      if (selectedEvent) {
        loadSales(selectedEvent);
      }
    }, [selectedEvent]);

    const loadEventsData = async () => {
      const eventsData = await loadEvents();
      setEvents(eventsData);
    };

    const handleEventChange = (eventId) => {
      setSelectedEvent(eventId);
    };

    const handleCreateSale = () => {
      setNewSale({
        evento_id: selectedEvent,
        funcion_id: '',
        asiento_id: '',
        usuario_id: '',
        precio: ''
      });
      setSaleModalVisible(true);
    };

    const handleSaveSale = async () => {
      if (await registerSale(newSale)) {
        setSaleModalVisible(false);
        setNewSale({});
      }
    };

    const handleRefundSale = async (saleId) => {
      try {
        const { error } = await supabase
          .from('ventas')
          .update({ estado: 'reembolsado' })
          .eq('id', saleId);
        
        if (error) throw error;
        
        message.success('Venta reembolsada correctamente');
        loadSales(selectedEvent);
      } catch (error) {
        console.error('Error reembolsando venta:', error);
        message.error('Error reembolsando venta');
      }
    };

    return (
      <Card title="Gestión de Ventas" className="diagnostic-step">
        <Alert
          message="Historial y Reembolsos"
          description="Configura el sistema de ventas para que los usuarios puedan registrar ventas y gestionar reembolsos."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Select
              placeholder="Seleccionar Evento"
              style={{ width: '100%' }}
              onChange={handleEventChange}
              value={selectedEvent}
            >
              {events.map(event => (
                <Select.Option key={event.id} value={event.id}>
                  {event.nombre} - {new Date(event.fecha_inicio).toLocaleDateString()}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateSale}
              disabled={!selectedEvent}
            >
              Registrar Venta
            </Button>
          </Col>
        </Row>

        {selectedEvent && (
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>Ventas del Evento</Title>
            {isLoadingSales ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Cargando ventas...</div>
              </div>
            ) : sales.length > 0 ? (
              <Table
                dataSource={sales}
                columns={[
                  {
                    title: 'Usuario',
                    dataIndex: 'usuarios',
                    key: 'usuario',
                    render: (usuarios) => usuarios?.email || 'N/A'
                  },
                  {
                    title: 'Asiento',
                    dataIndex: 'asiento_id',
                    key: 'asiento'
                  },
                  {
                    title: 'Precio',
                    dataIndex: 'precio',
                    key: 'precio',
                    render: (precio) => `$${precio}`
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'estado',
                    key: 'estado',
                    render: (estado) => (
                      <Tag color={
                        estado === 'vendido' ? 'green' :
                        estado === 'reembolsado' ? 'orange' :
                        estado === 'cancelado' ? 'red' : 'default'
                      }>
                        {estado}
                      </Tag>
                    )
                  },
                  {
                    title: 'Fecha Venta',
                    dataIndex: 'fecha_venta',
                    key: 'fecha_venta',
                    render: (fecha) => new Date(fecha).toLocaleString()
                  },
                  {
                    title: 'Acciones',
                    key: 'acciones',
                    render: (_, record) => (
                      <Space>
                        {record.estado === 'vendido' && (
                          <Button
                            size="small"
                            danger
                            onClick={() => handleRefundSale(record.id)}
                          >
                            Reembolsar
                          </Button>
                        )}
                      </Space>
                    )
                  }
                ]}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            ) : (
              <Empty description="No hay ventas para este evento" />
            )}
          </div>
        )}

        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!selectedEvent}
            >
              Continuar
            </Button>
          </Col>
        </Row>

        {/* Modal para registrar venta */}
        <Modal
          title="Registrar Nueva Venta"
          open={saleModalVisible}
          onOk={handleSaveSale}
          onCancel={() => setSaleModalVisible(false)}
          okText="Registrar"
          cancelText="Cancelar"
        >
          <Form layout="vertical">
            <Form.Item label="Función" required>
              <Input
                placeholder="ID de la función"
                value={newSale.funcion_id}
                onChange={(e) => setNewSale({...newSale, funcion_id: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Asiento" required>
              <Input
                placeholder="ID del asiento"
                value={newSale.asiento_id}
                onChange={(e) => setNewSale({...newSale, asiento_id: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Usuario" required>
              <Input
                placeholder="ID del usuario"
                value={newSale.usuario_id}
                onChange={(e) => setNewSale({...newSale, usuario_id: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="Precio" required>
              <InputNumber
                placeholder="0.00"
                value={newSale.precio}
                onChange={(value) => setNewSale({...newSale, precio: value})}
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  };

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

  // Función para cargar eventos disponibles
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, nombre, fecha_inicio, fecha_fin')
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error cargando eventos:', error);
      message.error('Error cargando eventos');
      return [];
    }
  };

  // Función para cargar salas de un evento
  const loadSalas = async (eventoId) => {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('id, nombre, capacidad')
        .eq('evento_id', eventoId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error cargando salas:', error);
      message.error('Error cargando salas');
      return [];
    }
  };

  // Función para cargar asientos de una sala
  const loadSeats = async (salaId) => {
    setIsLoadingSeats(true);
    try {
      const { data, error } = await supabase
        .from('mapas')
        .select(`
          id,
          sala_id,
          asientos:asientos_json,
          zonas(id, nombre, color)
        `)
        .eq('sala_id', salaId)
        .single();
      
      if (error) throw error;
      
      if (data?.asientos) {
        const seatsArray = Object.entries(data.asientos).map(([seatId, seatData]) => ({
          id: seatId,
          ...seatData,
          zona: data.zonas?.find(z => z.id === seatData.zona_id)
        }));
        setSeats(seatsArray);
      } else {
        setSeats([]);
      }
    } catch (error) {
      console.error('Error cargando asientos:', error);
      message.error('Error cargando asientos');
      setSeats([]);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  // Función para cargar reservas
  const loadReservations = async (eventoId) => {
    setIsLoadingReservations(true);
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select(`
          id,
          evento_id,
          sala_id,
          asiento_id,
          usuario_id,
          estado,
          fecha_reserva,
          fecha_expiracion,
          usuarios:profiles(email, full_name)
        `)
        .eq('evento_id', eventoId)
        .order('fecha_reserva', { ascending: false });
      
      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error cargando reservas:', error);
      message.error('Error cargando reservas');
      setReservations([]);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  // Función para cargar pagos
  const loadPayments = async (eventoId) => {
    setIsLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          evento_id,
          usuario_id,
          monto,
          estado,
          metodo_pago,
          fecha_pago,
          usuarios:profiles(email, full_name)
        `)
        .eq('evento_id', eventoId)
        .order('fecha_pago', { ascending: false });
      
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error cargando pagos:', error);
      message.error('Error cargando pagos');
      setPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Función para cargar ventas
  const loadSales = async (eventoId) => {
    setIsLoadingSales(true);
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          evento_id,
          funcion_id,
          asiento_id,
          usuario_id,
          precio,
          estado,
          fecha_venta,
          usuarios:profiles(email, full_name)
        `)
        .eq('evento_id', eventoId)
        .order('fecha_venta', { ascending: false });
      
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error cargando ventas:', error);
      message.error('Error cargando ventas');
      setSales([]);
    } finally {
      setIsLoadingSales(false);
    }
  };

  // Función para bloquear/desbloquear asiento
  const toggleSeatLock = async (seatId, isLocked) => {
    try {
      const { error } = await supabase
        .from('asientos_bloqueados')
        .upsert({
          asiento_id: seatId,
          bloqueado: !isLocked,
          fecha_bloqueo: new Date().toISOString()
        });
      
      if (error) throw error;
      
      message.success(`Asiento ${isLocked ? 'desbloqueado' : 'bloqueado'} correctamente`);
      loadSeats(selectedSala);
    } catch (error) {
      console.error('Error cambiando estado de asiento:', error);
      message.error('Error cambiando estado de asiento');
    }
  };

  // Función para crear reserva
  const createReservation = async (reservationData) => {
    try {
      const { error } = await supabase
        .from('reservas')
        .insert({
          evento_id: reservationData.evento_id,
          sala_id: reservationData.sala_id,
          asiento_id: reservationData.asiento_id,
          usuario_id: reservationData.usuario_id,
          estado: 'reservado',
          fecha_reserva: new Date().toISOString(),
          fecha_expiracion: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
        });
      
      if (error) throw error;
      
      message.success('Reserva creada correctamente');
      loadReservations(reservationData.evento_id);
      return true;
    } catch (error) {
      console.error('Error creando reserva:', error);
      message.error('Error creando reserva');
      return false;
    }
  };

  // Función para cancelar reserva
  const cancelReservation = async (reservationId) => {
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ estado: 'cancelada' })
        .eq('id', reservationId);
      
      if (error) throw error;
      
      message.success('Reserva cancelada correctamente');
      loadReservations(selectedEvent);
      return true;
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      message.error('Error cancelando reserva');
      return false;
    }
  };

  // Función para procesar pago
  const processPayment = async (paymentData) => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          evento_id: paymentData.evento_id,
          usuario_id: paymentData.usuario_id,
          monto: paymentData.monto,
          estado: 'procesando',
          metodo_pago: paymentData.metodo_pago,
          fecha_pago: new Date().toISOString()
        });
      
      if (error) throw error;
      
      message.success('Pago procesado correctamente');
      loadPayments(paymentData.evento_id);
      return true;
    } catch (error) {
      console.error('Error procesando pago:', error);
      message.error('Error procesando pago');
      return false;
    }
  };

  // Función para registrar venta
  const registerSale = async (saleData) => {
    try {
      const { error } = await supabase
        .from('ventas')
        .insert({
          evento_id: saleData.evento_id,
          funcion_id: saleData.funcion_id,
          asiento_id: saleData.asiento_id,
          usuario_id: saleData.usuario_id,
          precio: saleData.precio,
          estado: 'vendido',
          fecha_venta: new Date().toISOString()
        });
      
      if (error) throw error;
      
      message.success('Venta registrada correctamente');
      loadSales(saleData.evento_id);
      return true;
    } catch (error) {
      console.error('Error registrando venta:', error);
      message.error('Error registrando venta');
      return false;
    }
  };

  // Función para reembolsar pago
  const handleRefundPayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ estado: 'reembolsado' })
        .eq('id', paymentId);
      
      if (error) throw error;
      
      message.success('Pago reembolsado correctamente');
      if (selectedEvent) {
        loadPayments(selectedEvent);
      }
    } catch (error) {
      console.error('Error reembolsando pago:', error);
      message.error('Error reembolsando pago');
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
