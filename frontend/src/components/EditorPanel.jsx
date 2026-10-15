import React, {useEffect, useRef} from "react";
import * as monaco from "monaco-editor";

export default function EditorPanel(){
  const ref = useRef(null);
  useEffect(()=>{
    const editor = monaco.editor.create(ref.current, {
      value: "# Open a tool to edit\n",
      language: "python",
      theme: "vs-dark",
      minimap: { enabled: false }
    });
    return ()=>editor.dispose();
  }, []);
  return <div className="editor-panel" ref={ref} style={{height:"60vh"}} />;
}
