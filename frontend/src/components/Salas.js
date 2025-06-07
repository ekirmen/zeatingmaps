const Salas = () => {
    // ... existing code ...
    return (
        <div>
            {salas.map((sala) => (
                <div key={sala._id}>
                    {/* ... existing content ... */}
                    <Button onClick={() => handleModificarSala(sala._id)}>Modificar</Button>
                    <Button danger onClick={() => handleEliminarSala(sala._id)}>Eliminar</Button>
                </div>
            ))}
        </div>
    );
};