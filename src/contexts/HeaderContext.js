const HeaderContext = () => {
  const { configureHeader } = useHeader();



  useEffect(() => {
    // Configurar el header cuando se monta el componente
    configureHeader({
      title: 'Mi Página',
      subtitle: 'Subtítulo de la página',
      backButton: true,
      backUrl: '/dashboard',
      actions: [
        {
          label: 'Guardar',
          onClick: () => console.log('Guardar'),
          className: 'btn-primary'
        },
        {
          label: 'Cancelar',
          onClick: () => console.log('Cancelar'),
          className: 'btn-secondary'
        }
      ]
    });


    return () => {
      configureHeader({
        title: '',
        subtitle: '',
        backButton: false,
        actions: []
      });
    };
  }, [configureHeader]);

  return (
    <div>
      {/* Contenido de la página */}
    </div>
  );
};

export default HeaderContext;