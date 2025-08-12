import React from 'react';
import { Form, Input, Select, InputNumber, DatePicker, TimePicker, Switch, Button, Row, Col, message } from 'antd';
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
          <Input placeholder="+1234567890" />
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
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
        >
          <TextArea rows={3} placeholder="Descripción del recinto y sus características" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="active"
        >
          <Select>
            <Option value="active">Activo</Option>
            <Option value="inactive">Inactivo</Option>
            <Option value="maintenance">En Mantenimiento</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Recinto"
          initialValue="theater"
        >
          <Select>
            <Option value="theater">Teatro</Option>
            <Option value="stadium">Estadio</Option>
            <Option value="conference">Centro de Convenciones</Option>
            <Option value="auditorium">Auditorio</Option>
            <Option value="other">Otro</Option>
          </Select>
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
export const SalaForm = ({ form, onFinish, editingItem, recintos }) => (
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
          name="recinto_id"
          label="Recinto"
          rules={[{ required: true, message: 'Recinto requerido' }]}
        >
          <Select placeholder="Seleccionar recinto">
            {recintos.map(recinto => (
              <Option key={recinto.id} value={recinto.id}>
                {recinto.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="capacidad"
          label="Capacidad de la Sala"
          rules={[{ required: true, message: 'Capacidad requerida' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="500" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Sala"
          initialValue="seated"
        >
          <Select>
            <Option value="seated">Con Asientos</Option>
            <Option value="standing">De Pie</Option>
            <Option value="mixed">Mixta</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
        >
          <TextArea rows={3} placeholder="Descripción de la sala y sus características" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="active"
        >
          <Select>
            <Option value="active">Activa</Option>
            <Option value="inactive">Inactiva</Option>
            <Option value="maintenance">En Mantenimiento</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="accesible"
          label="Accesible para Discapacitados"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Col>
    </Row>
    
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
            <Option value="music">Música</Option>
            <Option value="theater">Teatro</Option>
            <Option value="sports">Deportes</Option>
            <Option value="conference">Conferencia</Option>
            <Option value="exhibition">Exposición</Option>
            <Option value="other">Otro</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
          rules={[{ required: true, message: 'Descripción requerida' }]}
        >
          <TextArea rows={3} placeholder="Descripción detallada del evento" />
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
          initialValue="draft"
        >
          <Select>
            <Option value="draft">Borrador</Option>
            <Option value="published">Publicado</Option>
            <Option value="active">Activo</Option>
            <Option value="cancelled">Cancelado</Option>
            <Option value="completed">Completado</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="tipo_entrada"
          label="Tipo de Entrada"
          initialValue="paid"
        >
          <Select>
            <Option value="paid">Pago</Option>
            <Option value="free">Gratis</Option>
            <Option value="donation">Donación</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Evento' : 'Crear Evento'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Función
export const FuncionForm = ({ form, onFinish, editingItem, eventos, salas }) => (
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
          name="evento_id"
          label="Evento"
          rules={[{ required: true, message: 'Evento requerido' }]}
        >
          <Select placeholder="Seleccionar evento">
            {eventos.map(evento => (
              <Option key={evento.id} value={evento.id}>
                {evento.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="fecha_celebracion"
          label="Fecha de Celebración"
          rules={[{ required: true, message: 'Fecha requerida' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="hora_inicio"
          label="Hora de Inicio"
          rules={[{ required: true, message: 'Hora requerida' }]}
        >
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="sala_id"
          label="Sala"
          rules={[{ required: true, message: 'Sala requerida' }]}
        >
          <Select placeholder="Seleccionar sala">
            {salas.map(sala => (
              <Option key={sala.id} value={sala.id}>
                {sala.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="duracion"
          label="Duración (minutos)"
          rules={[{ required: true, message: 'Duración requerida' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="120" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="scheduled"
        >
          <Select>
            <Option value="scheduled">Programada</Option>
            <Option value="active">Activa</Option>
            <Option value="cancelled">Cancelada</Option>
            <Option value="completed">Completada</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="capacidad_disponible"
          label="Capacidad Disponible"
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

// Formulario para Plantilla de Precios
export const PlantillaPrecioForm = ({ form, onFinish, editingItem, eventos }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Plantilla"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Precios Estándar" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="evento_id"
          label="Evento"
          rules={[{ required: true, message: 'Evento requerido' }]}
        >
          <Select placeholder="Seleccionar evento">
            {eventos.map(evento => (
              <Option key={evento.id} value={evento.id}>
                {evento.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Plantilla"
          rules={[{ required: true, message: 'Tipo requerido' }]}
        >
          <Select>
            <Option value="standard">Estándar</Option>
            <Option value="vip">VIP</Option>
            <Option value="student">Estudiante</Option>
            <Option value="senior">Adulto Mayor</Option>
            <Option value="custom">Personalizada</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="moneda"
          label="Moneda"
          initialValue="USD"
        >
          <Select>
            <Option value="USD">USD ($)</Option>
            <Option value="EUR">EUR (€)</Option>
            <Option value="MXN">MXN ($)</Option>
            <Option value="COP">COP ($)</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
        >
          <TextArea rows={3} placeholder="Descripción de la plantilla de precios" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="active"
        >
          <Select>
            <Option value="active">Activa</Option>
            <Option value="inactive">Inactiva</Option>
            <Option value="draft">Borrador</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="aplicar_descuentos"
          label="Aplicar Descuentos"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Plantilla' : 'Crear Plantilla'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Mapa
export const MapaForm = ({ form, onFinish, editingItem, salas }) => (
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
          name="sala_id"
          label="Sala"
          rules={[{ required: true, message: 'Sala requerida' }]}
        >
          <Select placeholder="Seleccionar sala">
            {salas.map(sala => (
              <Option key={sala.id} value={sala.id}>
                {sala.nombre}
              </Option>
            ))}
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
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="tipo_asiento"
          label="Tipo de Asiento"
          initialValue="chair"
        >
          <Select>
            <Option value="chair">Silla</Option>
            <Option value="bench">Banco</Option>
            <Option value="table">Mesa</Option>
            <Option value="standing">De Pie</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="orientacion"
          label="Orientación"
          initialValue="north"
        >
          <Select>
            <Option value="north">Norte (Escenario)</Option>
            <Option value="south">Sur</Option>
            <Option value="east">Este</Option>
            <Option value="west">Oeste</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
        >
          <TextArea rows={3} placeholder="Descripción del mapa y disposición de asientos" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="active"
        >
          <Select>
            <Option value="active">Activo</Option>
            <Option value="inactive">Inactivo</Option>
            <Option value="draft">Borrador</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="mostrar_numeros"
          label="Mostrar Números de Asiento"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Mapa' : 'Crear Mapa'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Zona
export const ZonaForm = ({ form, onFinish, editingItem, mapas }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Zona"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: VIP, General, etc." />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="mapa_id"
          label="Mapa"
          rules={[{ required: true, message: 'Mapa requerido' }]}
        >
          <Select placeholder="Seleccionar mapa">
            {mapas.map(mapa => (
              <Option key={mapa.id} value={mapa.id}>
                {mapa.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="color"
          label="Color de la Zona"
          rules={[{ required: true, message: 'Color requerido' }]}
        >
          <Select placeholder="Seleccionar color">
            <Option value="#ff4d4f">Rojo</Option>
            <Option value="#1890ff">Azul</Option>
            <Option value="#52c41a">Verde</Option>
            <Option value="#faad14">Amarillo</Option>
            <Option value="#722ed1">Púrpura</Option>
            <Option value="#13c2c2">Cian</Option>
            <Option value="#eb2f96">Rosa</Option>
            <Option value="#fa8c16">Naranja</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="precio"
          label="Precio Base"
          rules={[{ required: true, message: 'Precio requerido' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="25.00" />
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
          initialValue="standard"
        >
          <Select>
            <Option value="standard">Estándar</Option>
            <Option value="vip">VIP</Option>
            <Option value="premium">Premium</Option>
            <Option value="economy">Económica</Option>
            <Option value="accessible">Accesible</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
        >
          <TextArea rows={3} placeholder="Descripción de la zona y sus características" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="active"
        >
          <Select>
            <Option value="active">Activa</Option>
            <Option value="inactive">Inactiva</Option>
            <Option value="sold_out">Agotada</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="aplicar_impuestos"
          label="Aplicar Impuestos"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Col>
    </Row>
    
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
            <Option value="clothing">Ropa</Option>
            <Option value="accessories">Accesorios</Option>
            <Option value="food">Comida</Option>
            <Option value="beverages">Bebidas</Option>
            <Option value="merchandise">Merchandising</Option>
            <Option value="other">Otro</Option>
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
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="15.00" />
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
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
          rules={[{ required: true, message: 'Descripción requerida' }]}
        >
          <TextArea rows={3} placeholder="Descripción detallada del producto" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="active"
        >
          <Select>
            <Option value="active">Activo</Option>
            <Option value="inactive">Inactivo</Option>
            <Option value="out_of_stock">Sin Stock</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="aplicar_impuestos"
          label="Aplicar Impuestos"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Producto' : 'Crear Producto'}
      </Button>
    </Form.Item>
  </Form>
);

// Formulario para Plantilla de Productos
export const PlantillaProductoForm = ({ form, onFinish, editingItem, eventos, productos }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="nombre"
          label="Nombre de la Plantilla"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input placeholder="Ej: Paquete Básico" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="evento_id"
          label="Evento"
          rules={[{ required: true, message: 'Evento requerido' }]}
        >
          <Select placeholder="Seleccionar evento">
            {eventos.map(evento => (
              <Option key={evento.id} value={evento.id}>
                {evento.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="descripcion"
          label="Descripción"
          rules={[{ required: true, message: 'Descripción requerida' }]}
        >
          <TextArea rows={3} placeholder="Descripción de la plantilla y productos incluidos" />
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="tipo"
          label="Tipo de Plantilla"
          initialValue="bundle"
        >
          <Select>
            <Option value="bundle">Paquete</Option>
            <Option value="combo">Combo</Option>
            <Option value="collection">Colección</Option>
            <Option value="custom">Personalizada</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="estado"
          label="Estado"
          initialValue="active"
        >
          <Select>
            <Option value="active">Activa</Option>
            <Option value="inactive">Inactiva</Option>
            <Option value="draft">Borrador</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>
    
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="aplicar_descuento"
          label="Aplicar Descuento"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="descuento_porcentaje"
          label="Porcentaje de Descuento"
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="10" />
        </Form.Item>
      </Col>
    </Row>
    
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        {editingItem ? 'Actualizar Plantilla' : 'Crear Plantilla'}
      </Button>
    </Form.Item>
  </Form>
);
