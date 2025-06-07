const PlantillaPrecio = () => {
    // ... existing code ...
    return (
        <div>
            {plantillas.map((plantilla) => (
                <div key={plantilla._id}>
                    {/* ... existing content ... */}
                    <Button onClick={() => handleModificar(plantilla._id)}>Modificar</Button>
                    <Button danger onClick={() => handleEliminar(plantilla._id)}>Eliminar</Button>
                </div>
            ))}
        </div>
    );
};