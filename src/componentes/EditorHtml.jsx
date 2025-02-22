import JoditEditor from "jodit-react";
import { useRef } from "react";

const EditorDescripcion = ({ evento, setEvento }) => {
  const editor = useRef(null);

  const config = {
    readonly: false,
    theme: "dark",
    toolbarAdaptive: false,
    height: 500,
    buttons: [
      "bold", "italic", "underline", "strikethrough",
      "|", "ul", "ol",
      "|", "font", "fontsize", "brush", "paragraph",
      "|", "link",
      "|", "undo", "redo",
      "|", "hr", "eraser", "copyformat", "source"
    ],
  };
  return (
    <div className="campoForm">
      <label htmlFor="descripcion">Descripción del Evento</label>
      <JoditEditor
        ref={editor}
        value={evento.descripcion} // ✅ Ahora el editor inicia con la descripción actual
        config={config}
        onChange={(newContent) => setEvento((prev) => ({ ...prev, descripcion: newContent }))} // ✅ Actualiza en cada cambio
      />
    </div>
  );
};

export default EditorDescripcion;
