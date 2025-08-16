import React from 'react';
import { Menu, Button, Space, Divider } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  CompressOutlined,
  DragOutlined,
  SelectOutlined,
  PlusOutlined,
  MinusOutlined
} from '@ant-design/icons';

const ContextMenu = ({
  visible,
  position,
  onClose,
  onAction,
  selectedElements = [],
  canPan = true,
  canZoom = true,
  canEdit = true
}) => {
  if (!visible) return null;

  const handleAction = (action) => {
    if (onAction) {
      onAction(action);
    }
    onClose();
  };

  const menuItems = [
    // ===== ACCIONES DE NAVEGACIÓN =====
    {
      key: 'navigation',
      type: 'group',
      label: 'Navegación',
      children: [
        {
          key: 'pan',
          icon: <DragOutlined />,
          label: 'Modo Pan',
          disabled: !canPan
        },
        {
          key: 'select',
          icon: <SelectOutlined />,
          label: 'Modo Selección',
          disabled: !canPan
        },
        {
          key: 'zoom-in',
          icon: <ZoomInOutlined />,
          label: 'Zoom In',
          disabled: !canZoom
        },
        {
          key: 'zoom-out',
          icon: <ZoomOutOutlined />,
          label: 'Zoom Out',
          disabled: !canZoom
        },
        {
          key: 'reset-zoom',
          icon: <CompressOutlined />,
          label: 'Reset Zoom',
          disabled: !canZoom
        },
        {
          key: 'fit-screen',
          icon: <FullscreenOutlined />,
          label: 'Ajustar a Pantalla',
          disabled: !canZoom
        }
      ]
    }
  ];

  // ===== ACCIONES DE ELEMENTOS (solo si hay elementos seleccionados) =====
  if (selectedElements.length > 0) {
    menuItems.push({
      key: 'elements',
      type: 'group',
      label: 'Elementos Seleccionados',
      children: [
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Editar Propiedades',
          disabled: !canEdit
        },
        {
          key: 'duplicate',
          icon: <CopyOutlined />,
          label: 'Duplicar',
          disabled: !canEdit
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Eliminar',
          disabled: !canEdit
        }
      ]
    });
  }

  // ===== ACCIONES DE CREACIÓN =====
  menuItems.push({
    key: 'creation',
    type: 'group',
    label: 'Crear Elementos',
    children: [
      {
        key: 'add-mesa',
        icon: <PlusOutlined />,
        label: 'Agregar Mesa'
      },
      {
        key: 'add-sillas',
        icon: <PlusOutlined />,
        label: 'Agregar Sillas'
      },
      {
        key: 'add-texto',
        icon: <EditOutlined />,
        label: 'Agregar Texto'
      },
      {
        key: 'add-area',
        icon: <PlusOutlined />,
        label: 'Agregar Área'
      }
    ]
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        minWidth: '200px'
      }}
    >
      <Menu
        mode="vertical"
        items={menuItems}
        onClick={({ key }) => handleAction(key)}
        style={{
          border: 'none',
          boxShadow: 'none'
        }}
      />
      
      {/* ===== BOTÓN DE CERRAR ===== */}
      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Button 
          size="small" 
          onClick={onClose}
          type="text"
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default ContextMenu;
