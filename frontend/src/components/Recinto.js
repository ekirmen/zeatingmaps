const Recinto = () => {
    // ... existing code ...
    const handleActualizar = async (recintoId) => {
        try {
            const response = await axios.put(`/api/recintos/${recintoId}`, datosRecinto);
            message.success("Recinto actualizado correctamente");
        } catch (error) {
            message.error("Error al actualizar el recinto");
        }
    };

    return (
        <div>
            {/* ... existing content ... */}
            <Button onClick={() => handleActualizar(recinto._id)}>Actualizar</Button>
            <Button danger onClick={() => handleEliminar(recinto._id)}>Eliminar</Button>
        </div>
    );
};