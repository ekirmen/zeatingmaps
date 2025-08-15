import React from 'react';

const ContextMenu = ({
  showContextMenu,
  contextMenuPosition,
  contextMenuTarget,
  onSelect,
  onDelete,
  onDuplicate,
  onEdit
}) => {
  if (!showContextMenu) return null;

  const handleAction = (action) => {
    switch (action) {
      case 'select':
        onSelect && onSelect(contextMenuTarget);
        break;
      case 'edit':
        onEdit && onEdit(contextMenuTarget);
        break;
      case 'duplicate':
        onDuplicate && onDuplicate(contextMenuTarget);
        break;
      case 'delete':
        onDelete && onDelete(contextMenuTarget);
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className="context-menu"
      style={{
        position: 'absolute',
        left: contextMenuPosition.x,
        top: contextMenuPosition.y,
        zIndex: 1000
      }}
    >
      <div 
        className="context-menu-item"
        onClick={() => handleAction('select')}
      >
        👆 Seleccionar
      </div>
      
      <div 
        className="context-menu-item"
        onClick={() => handleAction('edit')}
      >
        ✏️ Editar
      </div>
      
      <div 
        className="context-menu-item"
        onClick={() => handleAction('duplicate')}
      >
        📋 Duplicar
      </div>
      
      <div 
        className="context-menu-item danger"
        onClick={() => handleAction('delete')}
      >
        🗑️ Eliminar
      </div>
    </div>
  );
};

export default ContextMenu;
