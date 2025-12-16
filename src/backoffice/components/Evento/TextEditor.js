import React, { useState, useEffect } from 'react';
import { Editor, EditorState, convertToRaw, ContentState } from 'draft-js';
import { stateFromHTML } from 'draft-js-import-html'; // Para convertir HTML a Draft.js
import { stateToHTML } from 'draft-js-export-html'; // Para convertir Draft.js a HTML
import 'draft-js/dist/Draft.css'; // Importar estilos de Draft.js
import './TextEditor.css'; // Tus estilos personalizados

const TextEditor = ({
  editorState,
  setEditorState,
  initialValue = '',
  onChange,
  placeholder = "Escribe aquí tu contenido..."
}) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  // Inicializar con contenido si se proporciona
  useEffect(() => {
    if (initialValue) {
      try {
        // Verificar si es HTML
        if (initialValue.includes('<') && initialValue.includes('>')) {
          const contentState = stateFromHTML(initialValue);
          const newEditorState = EditorState.createWithContent(contentState);
          setEditorState(newEditorState);

          // También establecer el HTML
          setHtmlContent(initialValue);
        } else {
          // Es texto plano
          const contentState = ContentState.createFromText(initialValue);
          const newEditorState = EditorState.createWithContent(contentState);
          setEditorState(newEditorState);
        }
      } catch (error) {
        console.error('Error initializing editor:', error);
        // Crear editor vacío como fallback
        setEditorState(EditorState.createEmpty());
      }
    }
  }, [initialValue, setEditorState]);

  // Notificar cambios al componente padre
  useEffect(() => {
    if (onChange) {
      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      onChange(rawContent);
    }
  }, [editorState, onChange]);

  // Convertir HTML a Draft.js
  const handleHtmlToDraft = (html) => {
    try {
      const contentState = stateFromHTML(html);
      const newEditorState = EditorState.createWithContent(contentState);
      setEditorState(newEditorState);
    } catch (error) {
      console.error('Error converting HTML to Draft.js:', error);
      // Si falla, crear editor vacío
      setEditorState(EditorState.createEmpty());
    }
  };

  // Manejar cambio en el área de texto HTML
  const handleHtmlChange = (e) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    handleHtmlToDraft(newHtml);
  };

  // Alternar entre modo HTML y editor
  const toggleHtmlMode = () => {
    if (!isHtmlMode) {
      // Entrando en modo HTML: convertir el contenido actual a HTML
      try {
        const currentContent = editorState.getCurrentContent();
        const currentHtml = stateToHTML(currentContent);
        setHtmlContent(currentHtml);
      } catch (error) {
        console.error('Error converting to HTML:', error);
        setHtmlContent('');
      }
    }
    setIsHtmlMode(!isHtmlMode);
  };

  // Obtener texto plano del editor

  const getPlainText = () => {
    return editorState.getCurrentContent().getPlainText();
  };

  // Obtener HTML del editor
  const getHtml = () => {
    const contentState = editorState.getCurrentContent();
    return stateToHTML(contentState);
  };

  // Limpiar el editor
  const clearEditor = () => {
    setEditorState(EditorState.createEmpty());
    setHtmlContent('');
  };

  return (
    <div className="text-editor-container">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={toggleHtmlMode}
          className={`toggle-html-button ${isHtmlMode ? 'active' : ''}`}
        >
          {isHtmlMode ? '↩️ Volver al Editor' : '🔧 Modo HTML'}
        </button>

        <div className="editor-info">
          <span className="char-count">
            Caracteres: {getPlainText().length}
          </span>
          <button
            type="button"
            onClick={clearEditor}
            className="clear-button"
          >
            Limpiar
          </button>
        </div>
      </div>

      {isHtmlMode ? (
        <div className="html-mode-container">
          <div className="html-editor-section">
            <label className="section-label">Editor HTML</label>
            <textarea
              className="html-input"
              value={htmlContent}
              onChange={handleHtmlChange}
              placeholder="Escribe o pega tu HTML aquí..."
              rows={10}
            />
            <div className="html-tips">
              <small>Tip: Puedes usar etiquetas HTML como &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, etc.</small>
            </div>
          </div>

          <div className="html-preview-section">
            <label className="section-label">Vista Previa</label>
            <div className="preview-content">
              {htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              ) : (
                <div className="empty-preview">
                  <p>No hay contenido para mostrar</p>
                  <small>Escribe HTML en el editor para ver la vista previa</small>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="draft-editor-container">
          <div className="editor-wrapper">
            <Editor
              editorState={editorState}
              onChange={setEditorState}
              placeholder={placeholder}
            />
          </div>

          <div className="draft-preview">
            <label className="section-label">Texto Plano</label>
            <div className="plain-text-preview">
              {getPlainText() || 'No hay texto...'}
            </div>
          </div>
        </div>
      )}

      <div className="editor-export">
        <div className="export-options">
          <button
            type="button"
            className="export-button"
            onClick={() => {
              const html = getHtml();
              navigator.clipboard.writeText(html);
              alert('HTML copiado al portapapeles');
            }}
          >
            Copiar HTML
          </button>

          <button
            type="button"
            className="export-button"
            onClick={() => {
              const text = getPlainText();
              navigator.clipboard.writeText(text);
              alert('Texto copiado al portapapeles');
            }}
          >
            Copiar Texto
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;