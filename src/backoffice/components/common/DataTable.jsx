import React from 'react';
import { Table, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import dompurify from 'dompurify';

/**
 * DataTable Component
 * A wrapper around Ant Design Table enforced for Dashboard usage.
 * Includes standardized pagination, sanitization (if needed), and clean styling.
 * 
 * @param {Object} props
 * @param {Array} props.columns - AntD columns definition
 * @param {Array} props.dataSource - Data to display
 * @param {Boolean} props.loading - Loading state
 * @param {Function} props.onChange - Handler for table changes (pagination, filters, sorter)
 * @param {Object} props.pagination - Pagination config object
 * @param {String} props.rowKey - Unique key for rows (default: 'id')
 */
const DataTable = ({
    columns,
    dataSource,
    loading,
    onChange,
    pagination = { pageSize: 10 },
    rowKey = 'id',
    searchable = false,
    onSearch = () => { }
}) => {
    // Configuración de paginación segura
    const paginationConfig = {
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
        pageSizeOptions: ['10', '20', '50', '100'],
        ...pagination
    };

    // Sanitización básica de celdas si se requiere (ejemplo)
    // Nota: AntD escapa por defecto, pero si usáramos dangerouslySetInnerHTML, usaríamos dompurify.
    // Aquí usamos dompurify solo si alguien pasa HTML explícito, pero por ahora confiamos en render.

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 w-full h-full flex flex-col">
            {searchable && (
                <div className="mb-4 flex justify-end">
                    <Input
                        placeholder="Buscar..."
                        prefix={<SearchOutlined />}
                        onChange={(e) => onSearch(dompurify.sanitize(e.target.value))}
                        style={{ width: 250 }}
                    />
                </div>
            )}
            <Table
                columns={columns}
                dataSource={dataSource}
                loading={loading}
                onChange={onChange}
                pagination={paginationConfig}
                rowKey={rowKey}
                scroll={{ x: 'max-content' }} // Responsive horizontal
                size="middle"
                className="w-full"
            />
        </div>
    );
};

DataTable.propTypes = {
    columns: PropTypes.array.isRequired,
    dataSource: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    onChange: PropTypes.func,
    pagination: PropTypes.object,
    rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    searchable: PropTypes.bool,
    onSearch: PropTypes.func
};

export default DataTable;
