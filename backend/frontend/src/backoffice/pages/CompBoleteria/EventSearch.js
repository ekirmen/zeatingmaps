import React from 'react';
import { Select, Table, Button, Empty } from 'antd';
const { Option } = Select;

const EventSearch = ({ 
  eventos = [], 
  onEventSelect 
}) => {
  return (
    <div className="event-search">
      <div className="search-filters">
        <Select
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Select Event"
          onChange={onEventSelect}
          notFoundContent={<Empty description="No events found" />}
        >
          {eventos.map(evento => (
            <Option key={evento._id} value={evento._id}>
              {evento.nombre}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default EventSearch;