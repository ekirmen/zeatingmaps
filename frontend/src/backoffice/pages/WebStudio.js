import React, { useState, useEffect } from 'react';

const pagesData = [
  { id: 'home', name: 'Home', url: '/store' },
  { id: 'events', name: 'Eventos', url: '/store/event' }
];

const defaultWidgets = { header: [], content: [], footer: [] };

const WebStudio = ({ setSidebarCollapsed }) => {
  const [selectedPage, setSelectedPage] = useState(pagesData[0]);
  const [widgets, setWidgets] = useState(defaultWidgets);

  useEffect(() => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    return () => setSidebarCollapsed && setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const saved = localStorage.getItem(`cms-page-${selectedPage.id}`);
    if (saved) {
      setWidgets(JSON.parse(saved));
    } else {
      setWidgets(defaultWidgets);
    }
  }, [selectedPage]);

  useEffect(() => {
    localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
  }, [widgets, selectedPage]);

  const addWidget = (area, type) => {
    setWidgets(prev => ({
      ...prev,
      [area]: [...prev[area], { type }]
    }));
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 p-4 overflow-y-auto">
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
          </div>
        </details>
      </aside>

      <main className="flex-grow p-4 space-y-4">
        <div className="border p-2">Header</div>
        <div className="border p-2 min-h-[200px]">
          {widgets.content.map((w, idx) => (
            <div key={idx} className="border p-2 mb-2 bg-gray-50">
              {w.type}
            </div>
          ))}
        </div>
        <div className="border p-2">Footer</div>

        <div className="container-pages-viewer mt-6">
          <iframe
            id="pageViewerIframe"
            className="page-viewer-iframe"
            title="viewer"
            width="100%"
            height="600px"
            src="cmsWindowDevice?skin=0_default&timestamp=1749765383042&cmsZoomPercentage="
            allowFullScreen
          />
          <iframe
            id="pageViewerIframeEmail"
            style={{ display: 'none' }}
            title="email viewer"
            className="page-viewer-iframe"
            width="100%"
            height="600px"
            src="cmsWindowDeviceEmail?skin=0_default&timestamp=1749765383042&idEmpresa=50&cmsZoomPercentage="
            allowFullScreen
          />
        </div>
      </main>
    </div>
  );
};

export default WebStudio;
