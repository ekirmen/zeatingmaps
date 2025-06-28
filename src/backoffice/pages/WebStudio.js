import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlineLeft } from 'react-icons/ai';
import { fetchCmsPage, saveCmsPage } from '../services/apibackoffice';

const pagesData = [
  { id: 'home', name: 'Home', url: '/store' },
  { id: 'events', name: 'Eventos', url: '/store/event' }
];

const defaultWidgets = { header: [], content: [], footer: [] };

const WebStudio = ({ setSidebarCollapsed }) => {
  const [selectedPage, setSelectedPage] = useState(pagesData[0]);
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    return () => setSidebarCollapsed && setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const loadPage = async () => {
      setPageLoaded(false);
      try {
        const data = await fetchCmsPage(selectedPage.id);
        setWidgets(data.widgets || defaultWidgets);
      } catch (e) {
        const saved = localStorage.getItem(`cms-page-${selectedPage.id}`);
        if (saved) {
          setWidgets(JSON.parse(saved));
        } else {
          setWidgets(defaultWidgets);
        }
      }
      setPageLoaded(true);
    };
    loadPage();
  }, [selectedPage]);

  useEffect(() => {
    if (!pageLoaded) return;
    const autoSave = async () => {
      try {
        await saveCmsPage(selectedPage.id, widgets);
        localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
      } catch (err) {
        console.error('Auto save failed', err);
      }
    };
    autoSave();
  }, [widgets, selectedPage, pageLoaded]);

  const addWidget = (area, type) => {
    setWidgets(prev => ({
      ...prev,
      [area]: [...prev[area], { type }]
    }));
  };

  const removeWidget = (area, index) => {
    setWidgets(prev => ({
      ...prev,
      [area]: prev[area].filter((_, i) => i !== index)
    }));
  };

  const handleDragStart = idx => setDraggingIdx(idx);
  const handleDragOver = e => e.preventDefault();
  const handleDrop = idx => {
    if (draggingIdx === null || draggingIdx === idx) return;
    setWidgets(prev => {
      const updated = [...prev.content];
      const [moved] = updated.splice(draggingIdx, 1);
      updated.splice(idx, 0, moved);
      return { ...prev, content: updated };
    });
    setDraggingIdx(null);
  };

  const handleSave = async () => {
    try {
      await saveCmsPage(selectedPage.id, widgets);
      localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
      toast.success('Página guardada');
    } catch (error) {
      toast.error('Error al guardar la página');
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem(`cms-page-${selectedPage.id}`);
    toast.success('Cache limpia');
  };

  const renderWidget = (area, widget, idx) => (
    <div
      key={idx}
      className="relative border p-2 mb-2 bg-white rounded shadow-sm"
      draggable={area === 'content'}
      onDragStart={() => area === 'content' && handleDragStart(idx)}
      onDragOver={area === 'content' ? handleDragOver : undefined}
      onDrop={() => area === 'content' && handleDrop(idx)}
    >
      <button
        className="absolute top-1 right-1 text-red-500 font-bold"
        onClick={() => removeWidget(area, idx)}
        title="Eliminar widget"
      >
        ×
      </button>
      <div className="text-sm">{widget.type}</div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 p-4 overflow-y-auto">
        <button
          className="flex items-center gap-2 mb-4 text-gray-700 hover:text-gray-900"
          onClick={() => window.history.back()}
        >
          <AiOutlineLeft />
          <span>Volver</span>
        </button>

        <h3 className="font-bold mb-2">Páginas</h3>
        <ul className="space-y-1 mb-4">
          {pagesData.map(p => (
            <li
              key={p.id}
              onClick={() => setSelectedPage(p)}
              className={`cursor-pointer p-2 rounded ${
                selectedPage.id === p.id ? 'bg-blue-200 font-semibold' : 'hover:bg-gray-200'
              }`}
            >
              {p.name}
            </li>
          ))}
        </ul>

        <div className="mb-4">
          <h4 className="font-semibold mb-1">Widgets disponibles</h4>
          <button
            onClick={() => addWidget('content', 'Listado de eventos')}
            className="text-sm bg-blue-500 text-white w-full py-1 rounded mb-2"
          >
            + Listado de eventos
          </button>
          <button
            onClick={() => addWidget('content', 'Preguntas frecuentes')}
            className="text-sm bg-blue-500 text-white w-full py-1 rounded"
          >
            + Preguntas frecuentes
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <label className="block text-gray-600">Nombre</label>
            <input className="border w-full px-2 py-1 rounded" value={selectedPage.name} readOnly />
          </div>
          <div>
            <label className="block text-gray-600">URL</label>
            <input className="border w-full px-2 py-1 rounded" value={selectedPage.url} readOnly />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded"
          >
            Guardar página
          </button>
          <button
            onClick={handleClearCache}
            className="bg-gray-400 hover:bg-gray-500 text-white w-full py-2 rounded"
          >
            Limpiar cache
          </button>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {['header', 'content', 'footer'].map((area) => (
          <div key={area} className="mb-6">
            <h2 className="font-semibold mb-2 capitalize">{area}</h2>
            <div className="bg-white p-3 border rounded min-h-[80px]">
              {widgets[area]?.length > 0 ? (
                widgets[area].map((w, idx) => renderWidget(area, w, idx))
              ) : (
                <p className="text-sm text-gray-500">Sin widgets</p>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default WebStudio;
