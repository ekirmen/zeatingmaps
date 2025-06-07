const Funciones = () => {
    // ... existing code ...
    const handleEliminarFuncion = async (funcionId) => {
        try {
            await axios.delete(`/api/funciones/${funcionId}`);
            message.success("Función eliminada correctamente");
            // Actualizar lista de funciones
        } catch (error) {
            message.error("Error al eliminar la función");
        }
    };

    return (
        <div>
            {/* ... existing content ... */}
            <Button onClick={() => handleModificarFuncion(funcion._id)}>Modificar</Button>
            <Button danger onClick={() => handleEliminarFuncion(funcion._id)}>Eliminar</Button>
        </div>
    );
};