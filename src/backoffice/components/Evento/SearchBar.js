import React from 'react';

const SearchBar = ({ searchTerm, handleSearch, searchResults, handleEdit }) => {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Buscar evento por nombre"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(evento => (
            <div
              key={evento.id}
              className="search-result-item"
              onClick={() => handleEdit(evento.id)}
            >
              <strong>{evento.nombre}</strong>
              <span style={{ color: '#666', marginLeft: '8px' }}>
                {evento.sector}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;