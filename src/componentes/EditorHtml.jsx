import JoditEditor from "jodit-react";
import { useRef } from "react";

const EditorDescripcion = ({ evento, setEvento }) => {
  const editor = useRef(null);

  const config = {
      readonly: false, // Permite escribir
      theme: "dark", // 🔥 Activa el modo oscuro
    toolbarAdaptive: false, // Mantiene el toolbar visible en todos los tamañoos
    height: 500,
    
    buttons: [
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "ul",
      "ol",
      "|",
      "outdent",
      "indent",
      "|",
      "align",
      "|",
      "font",
      "fontsize",
      "brush",
      "paragraph",
      "|",
      "link",
      "|",
      "undo",
      "redo",
      "|",
      "hr",
      "eraser",
      "copyformat",
      "source",
    ],
  };

  return (
    <div className="campoForm">
      <label htmlFor="descripcion">Descripción del Evento</label>
      <JoditEditor
        ref={editor}
        value={evento.descripcion}
        config={config}
        onChange={(content) => setEvento({ ...evento, descripcion: content })}
      />
    </div>
  );
};

export default EditorDescripcion;
