import React from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Switch, Button, Row, Col, message } from 'antd';
import { supabase } from '../../supabaseClient';

const { Option } = Select;
const { TextArea } = Input;

// Formulario para Recinto
export const RecintoForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre del Recinto"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Teatro Municipal" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="capacidad"
          label="Capacidad Total"
          rules={[{ required: true, message: 'Capacidad requerida' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="1000" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="direccion"
          label="Dirección"
          rules={[{ required: true, message: 'Dirección requerida' }]}
        >
          <Input placeholder="Dirección completa del recinto" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="ciudad"
          label="Ciudad"
          rules={[{ required: true, message: 'Ciudad requerida' }]}
        >
          <Input placeholder="Ciudad" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="pais"
          label="País"
          rules={[{ required: true, message: 'País requerido' }]}
        >
          <Input placeholder="País" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="telefono"
          label="Teléfono"
        >
          <Input placeholder="+1 234 567 8900" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="email"
          label="Email de Contacto"
          rules={[{ type: 'email', message: 'Email válido requerido' }]}
        >
          <Input placeholder="contacto@recinto.com" />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Recinto' : 'Crear Recinto'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Sala
export const SalaForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Sala"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Sala Principal" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="capacidad"
          label="Capacidad"
          rules={[{ required: true, message: 'Capacidad requerida' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="500" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Sala"
          rules={[{ required: true, message: 'Tipo requerido' }]}
        >
          <Select placeholder="Seleccionar tipo">
            <Option value="teatro">Teatro</Option>
            <Option value="auditorio">Auditorio</Option>
            <Option value="sala_conferencias">Sala de Conferencias</Option>
            <Option value="estadio">Estadio</Option>
            <Option value="otro">Otro</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          rules={[{ required: true, message: 'Estado requerido' }]}
        >
          <Select placeholder="Seleccionar estado">
            <Option value="activa">Activa</Option>
            <Option value="mantenimiento">En Mantenimiento</Option>
            <Option value="inactiva">Inactiva</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item
      name="descripcion"
      label="Descripción"
    >
      <TextArea rows={3} placeholder="Descripción de la sala" />
    </Form.Item>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Sala' : 'Crear Sala'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Evento
export const EventoForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre del Evento"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Concierto de Rock" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="categoria"
          label="Categoría"
          rules={[{ required: true, message: 'Categoría requerida' }]}
        >
          <Select placeholder="Seleccionar categoría">
            <Option value="musica">Música</Option>
            <Option value="teatro">Teatro</Option>
            <Option value="deportes">Deportes</Option>
            <Option value="conferencia">Conferencia</Option>
            <Option value="otro">Otro</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="fecha_inicio"
          label="Fecha de Inicio"
          rules={[{ required: true, message: 'Fecha requerida' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="fecha_fin"
          label="Fecha de Fin"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          rules={[{ required: true, message: 'Estado requerido' }]}
        >
          <Select placeholder="Seleccionar estado">
            <Option value="borrador">Borrador</Option>
            <Option value="activo">Activo</Option>
            <Option value="pausado">Pausado</Option>
            <Option value="finalizado">Finalizado</Option>
            <Option value="cancelado">Cancelado</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo_entrada"
          label="Tipo de Entrada"
          rules={[{ required: true, message: 'Tipo requerido' }]}
        >
          <Select placeholder="Seleccionar tipo">
            <Option value="gratuita">Gratuita</Option>
            <Option value="pago">Pago</Option>
            <Option value="mixta">Mixta</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item
      name="descripcion"
      label="Descripción"
    >
      <TextArea rows={3} placeholder="Descripción del evento" />
    </Form.Item>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Evento' : 'Crear Evento'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Función
export const FuncionForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Función"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Función Principal" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="fecha_celebracion"
          label="Fecha de Celebración"
          rules={[{ required: true, message: 'Fecha requerida' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="hora_inicio"
          label="Hora de Inicio"
          rules={[{ required: true, message: 'Hora requerida' }]}
        >
          <Input type="time" style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="hora_fin"
          label="Hora de Fin"
        >
          <Input type="time" style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          rules={[{ required: true, message: 'Estado requerido' }]}
        >
          <Select placeholder="Seleccionar estado">
            <Option value="programada">Programada</Option>
            <Option value="en_venta">En Venta</Option>
            <Option value="agotada">Agotada</Option>
            <Option value="finalizada">Finalizada</Option>
            <Option value="cancelada">Cancelada</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="capacidad_disponible"
          label="Capacidad Disponible"
          rules={[{ required: true, message: 'Capacidad requerida' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="500" />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Función' : 'Crear Función'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Plantilla de Precio
export const PlantillaPrecioForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Plantilla"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Plantilla Estándar" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Plantilla"
          rules={[{ required: true, message: 'Tipo requerido' }]}
        >
          <Select placeholder="Seleccionar tipo">
            <Option value="general">General</Option>
            <Option value="vip">VIP</Option>
            <Option value="descuento">Con Descuento</Option>
            <Option value="premium">Premium</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="precio_base"
          label="Precio Base"
          rules={[{ required: true, message: 'Precio requerido' }]}
        >
          <InputNumber 
            min={0} 
            step={0.01} 
            style={{ width: '100%' }} 
            placeholder="25.00" 
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="moneda"
          label="Moneda"
          rules={[{ required: true, message: 'Moneda requerida' }]}
        >
          <Select placeholder="Seleccionar moneda">
            <Option value="USD">USD</Option>
            <Option value="EUR">EUR</Option>
            <Option value="MXN">MXN</Option>
            <Option value="COP">COP</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item
      name="descripcion"
      label="Descripción"
    >
      <TextArea rows={3} placeholder="Descripción de la plantilla de precios" />
    </Form.Item>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Plantilla' : 'Crear Plantilla'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Mapa
export const MapaForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre del Mapa"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Mapa Principal" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Mapa"
          rules={[{ required: true, message: 'Tipo requerido' }]}
        >
          <Select placeholder="Seleccionar tipo">
            <Option value="asientos">Asientos</Option>
            <Option value="mesas">Mesas</Option>
            <Option value="mixto">Mixto</Option>
            <Option value="general">General</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="filas"
          label="Número de Filas"
          rules={[{ required: true, message: 'Número de filas requerido' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="20" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="columnas"
          label="Número de Columnas"
          rules={[{ required: true, message: 'Número de columnas requerido' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="25" />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item
      name="configuracion"
      label="Configuración JSON"
    >
      <TextArea rows={4} placeholder='{"filas": 20, "columnas": 25, "asientos": []}' />
    </Form.Item>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Mapa' : 'Crear Mapa'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Zona
export const ZonaForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Zona"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Zona VIP" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="color"
          label="Color de la Zona"
          rules={[{ required: true, message: 'Color requerido' }]}
        >
          <Select placeholder="Seleccionar color">
            <Option value="#ff0000">Rojo</Option>
            <Option value="#00ff00">Verde</Option>
            <Option value="#0000ff">Azul</Option>
            <Option value="#ffff00">Amarillo</Option>
            <Option value="#ff00ff">Magenta</Option>
            <Option value="#00ffff">Cian</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="capacidad"
          label="Capacidad de la Zona"
          rules={[{ required: true, message: 'Capacidad requerida' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="100" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Zona"
          rules={[{ required: true, message: 'Tipo requerido' }]}
        >
          <Select placeholder="Seleccionar tipo">
            <Option value="vip">VIP</Option>
            <Option value="general">General</Option>
            <Option value="premium">Premium</Option>
            <Option value="economica">Económica</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item
      name="descripcion"
      label="Descripción"
    >
      <TextArea rows={3} placeholder="Descripción de la zona" />
    </Form.Item>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Zona' : 'Crear Zona'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Producto
export const ProductoForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre del Producto"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Camiseta del Evento" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="categoria"
          label="Categoría"
          rules={[{ required: true, message: 'Categoría requerida' }]}
        >
          <Select placeholder="Seleccionar categoría">
            <Option value="ropa">Ropa</Option>
            <Option value="accesorios">Accesorios</Option>
            <Option value="alimentos">Alimentos</Option>
            <Option value="bebidas">Bebidas</Option>
            <Option value="souvenirs">Souvenirs</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="precio"
          label="Precio"
          rules={[{ required: true, message: 'Precio requerido' }]}
        >
          <InputNumber 
            min={0} 
            step={0.01} 
            style={{ width: '100%' }} 
            placeholder="15.00" 
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="stock"
          label="Stock Disponible"
          rules={[{ required: true, message: 'Stock requerido' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="100" />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item
      name="descripcion"
      label="Descripción"
    >
      <TextArea rows={3} placeholder="Descripción del producto" />
    </Form.Item>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Producto' : 'Crear Producto'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Plantilla de Producto
export const PlantillaProductoForm = ({ form, onFinish, editingItem, currentTenant }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Plantilla"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Plantilla de Productos Estándar" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Plantilla"
          rules={[{ required: true, message: 'Tipo requerido' }]}
        >
          <Select placeholder="Seleccionar tipo">
            <Option value="general">General</Option>
            <Option value="vip">VIP</Option>
            <Option value="personalizada">Personalizada</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="activa"
          label="Plantilla Activa"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="max_productos"
          label="Máximo de Productos"
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="10" />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item
      name="descripcion"
      label="Descripción"
    >
      <TextArea rows={3} placeholder="Descripción de la plantilla de productos" />
    </Form.Item>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Plantilla' : 'Crear Plantilla'}
      </Button>
    </Form.Item>
  </Form>
);
