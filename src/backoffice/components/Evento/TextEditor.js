import React, { useState } from 'react';
import { Editor, EditorState, convertToRaw, ContentState } from 'draft-js';
import { stateFromHTML } from 'draft-js-import-html'; // Para convertir HTML a Draft.js
import { stateToHTML } from 'draft-js-export-html'; // Para convertir Draft.js a HTML

const TextEditor = ({ editorState, setEditorState }) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  // Convertir HTML a Draft.js
  const handleHtmlToDraft = (html) => {
    const contentState = stateFromHTML(html);
    const newEditorState = EditorState.createWithContent(contentState);
    setEditorState(newEditorState);
  };

  // Manejar cambio en el área de texto HTML
  const handleHtmlChange = (e) => {
    setHtmlContent(e.target.value);
    handleHtmlToDraft(e.target.value);
  };

  // Alternar entre modo HTML y editor
  const toggleHtmlMode = () => {
    if (!isHtmlMode) {
      const currentContent = editorState.getCurrentContent();
      const currentHtml = stateToHTML(currentContent);
      setHtmlContent(currentHtml); // Generar HTML del estado actual
    }
    setIsHtmlMode(!isHtmlMode);
  };

  return (
    <div className="text-editor-container">
      <button onClick={toggleHtmlMode} className="toggle-html-button">
        {isHtmlMode ? 'Volver al Editor' : 'Insertar HTML'}
      </button>

      {isHtmlMode ? (
        <textarea
          className="html-input"
          value={htmlContent}
          onChange={handleHtmlChange}
          placeholder="Escribe o pega tu HTML aquí..."
          rows={10}
        />
      ) : (
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          placeholder="Escribe aquí tu contenido..."
        />
      )}

      {/* Vista previa del HTML */}
      <div className="html-preview">
        <h4>Vista previa:</h4>
        <div
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};

export default TextEditor;
