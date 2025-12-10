// src/utils/antd-imports.js
// Importaciones específicas para reducir bundle

// Componentes más comunes
export { default as Button } from 'antd/es/button';
export { default as Card } from 'antd/es/card';
export { default as Table } from 'antd/es/table';
export { default as Form } from 'antd/es/form';
export { default as Input } from 'antd/es/input';
export { default as Select } from 'antd/es/select';
export { default as Modal } from 'antd/es/modal';
export { default as Layout } from 'antd/es/layout';
export { default as Menu } from 'antd/es/menu';
export { default as Typography } from 'antd/es/typography';
export { default as Space } from 'antd/es/space';
export { default as Row } from 'antd/es/row';
export { default as Col } from 'antd/es/col';

// Hooks y utilidades
export { default as ConfigProvider } from 'antd/es/config-provider';
export { default as theme } from 'antd/es/theme';

// Icons - usar react-icons en lugar de @ant-design/icons cuando sea posible
export { default as AntdIcon } from '@ant-design/icons';

// Estilos CSS (en lugar de LESS)
import 'antd/es/button/style/css';
import 'antd/es/card/style/css';
import 'antd/es/table/style/css';
import 'antd/es/form/style/css';
import 'antd/es/input/style/css';
import 'antd/es/select/style/css';
import 'antd/es/modal/style/css';
import 'antd/es/layout/style/css';
import 'antd/es/menu/style/css';
import 'antd/es/typography/style/css';
import 'antd/es/space/style/css';
import 'antd/es/row/style/css';
import 'antd/es/col/style/css';
