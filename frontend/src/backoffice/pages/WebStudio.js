import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LeftOutlined } from '@ant-design/icons';
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

  const removeWidget = index => {
    setWidgets(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index)
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

  return (
    <div className="flex">
      <aside className="w-64 bg-gray-100 p-4 overflow-y-auto">
        <button
          className="flex items-center gap-2 mb-2 text-gray-700 hover:text-gray-900"
          onClick={() => window.history.back()}
          aria-label="Volver"
        >
          <LeftOutlined />
          <span>Back</span>
        </button>
        <h3 className="font-bold mb-2">Páginas</h3>
        <ul className="mb-4 space-y-1">
          {pagesData.map(p => (
            <li
              key={p.id}
              className="cursor-pointer p-1 hover:bg-gray-200 rounded"
              onClick={() => setSelectedPage(p)}
            >
              {p.name}
            </li>
          ))}
        </ul>

        <details open className="mb-4">
          <summary className="font-semibold">Propiedades</summary>
          <div className="mt-2 text-sm space-y-2">
            <div>
              <label className="block text-gray-600 text-xs">Nombre</label>
              <input className="border w-full p-1" value={selectedPage.name} readOnly />
            </div>
            <div>
              <label className="block text-gray-600 text-xs">URL</label>
              <input className="border w-full p-1" value={selectedPage.url} readOnly />
            </div>
          </div>
        </details>

        <details>
          <summary className="font-semibold">Widgets</summary>
          <div className="mt-2">
            <div
              className="preview-widget mb-2 cursor-pointer"
              onClick={() => addWidget('content', 'Listado de eventos')}
            >
              <div className="layer"></div>
              <div className="preview-over">
                <i className="palco4icon palco4icon-plus-circle-o"></i>
              </div>
              <img
                src="https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/events_list/preview.gif"
                draggable="false"
                alt="Listado de eventos"
              />
            </div>
            <div className="label-type-widget full">
              <label>Listado de eventos</label>
            </div>

            <div
              className="preview-widget mb-2 cursor-pointer"
              onClick={() => addWidget('content', 'Preguntas frecuentes')}
            >
              <div className="layer"></div>
              <div className="preview-over">
                <i className="palco4icon palco4icon-plus-circle-o"></i>
              </div>
              <img
                src="https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/faq/preview.gif"
                draggable="false"
                alt="Preguntas frecuentes"
              />
            </div>
            <div className="label-type-widget full">
              <label>Preguntas frecuentes</label>
            </div>
          </div>
        </details>
        <button
          className="mt-4 w-full bg-blue-600 text-white py-1 rounded"
          onClick={handleSave}
        >
          Guardar
        </button>
        <button
          className="mt-2 w-full bg-gray-300 text-gray-800 py-1 rounded"
          onClick={handleClearCache}
        >
          Limpiar cache
        </button>
      </aside>

      <main className="flex-grow p-4 space-y-4">
        <div className="border p-2">Header</div>
        <div className="border p-2 min-h-[200px]">
          {widgets.content.map((w, idx) => (
            <div
              key={idx}
              className="relative border p-2 mb-2 bg-gray-50"
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
            >
              <button
                className="absolute top-1 right-1 text-red-500"
                onClick={() => removeWidget(idx)}
              >
                x
              </button>
              {w.type}
            </div>
          ))}
        </div>
        <div className="border p-2">Footer</div>

      </main>
    </div>
  );
};

export default WebStudio;
