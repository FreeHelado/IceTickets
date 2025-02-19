import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot } from "lexical";


const editorConfig = {
  theme: {},
  onError(error) {
    console.error("? Error en Lexical:", error);
  }
};

const EditorDescripcion = ({ value, onChange }) => {
    console.log("Valor inicial:", value); // ?? VERIFICAR QUÉ RECIBE
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor" />}
        />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
                const content = $getRoot().getTextContent();
                console.log("Nuevo contenido:", content); // ?? VERIFICAR QUE ACTUALIZA
              onChange(content);
            });
          }}
        />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
};

export default EditorDescripcion;
