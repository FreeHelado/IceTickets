import { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa"; // Importamos TODOS los iconos
import config from "../config"; // Configuración de backend
import Swal from "sweetalert2"; // Importamos SweetAlert2

const AdminCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("FaQuestionCircle"); // Ícono por defecto

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/categorias`);
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error("❌ Error al obtener categorías:", error);
    }
  };

  const agregarCategoria = async (e) => {
    e.preventDefault();

    if (!nombre || !icono) {
      Swal.fire("⚠️ Oops!", "Todos los campos son obligatorios.", "warning");
      return;
    }

    const nuevaCategoria = { nombre, icono };

    try {
      const res = await fetch(`${config.BACKEND_URL}/api/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaCategoria),
      });

      if (!res.ok) throw new Error("Error al agregar categoría");

      await fetchCategorias(); // Recargar la lista después de agregar
      setNombre(""); // Limpiar campos
      setIcono("FaQuestionCircle");

      Swal.fire("✅ Éxito!", "Categoría agregada correctamente.", "success");
    } catch (error) {
      console.error("❌ Error al agregar categoría:", error);
      Swal.fire("❌ Error!", "No se pudo agregar la categoría.", "error");
    }
  };

  const eliminarCategoria = async (id) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${config.BACKEND_URL}/api/categorias/${id}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error("Error al eliminar categoría");

          await fetchCategorias(); // Actualizar lista después de borrar

          Swal.fire("✅ Eliminado!", "La categoría ha sido eliminada.", "success");
        } catch (error) {
          console.error("❌ Error al eliminar categoría:", error);
          Swal.fire("❌ Error!", "No se pudo eliminar la categoría.", "error");
        }
      }
    });
  };

  return (
    <main className="adminPanel">

      <div className="adminCategorias">
        <h2>Categorías</h2>

        
        <div className="adminCategorias__grid">
          {categorias.map((categoria) => {
            const Icono = FaIcons[categoria.icono] || FaIcons.FaQuestionCircle;
            return (
              <div key={categoria._id} className="adminCategorias__item">
                <Icono size={30} />
                <span>{categoria.nombre}</span>
                
                <button
                  onClick={() => eliminarCategoria(categoria._id)}>
                  ✖
                </button>
              </div>
            );
          })}
        </div>

       
        <form onSubmit={agregarCategoria}>
          <div className="camposCategorias">
            <div className="campoForm">
              <label>Nombre de la categoría:</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required/>
            </div>

              <div className="campoForm">  
              <label>Icono:</label>
                <select value={icono} onChange={(e) => setIcono(e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "5px" }}>
                  {Object.keys(FaIcons).map((iconoNombre) => (
                    <option key={iconoNombre} value={iconoNombre}>
                      {iconoNombre}
                    </option>
                  ))}
                </select>
              
            </div>
            <div className="alert">
              <span>Podés buscar el indicado aquí:</span>
              <a href="https://react-icons.github.io/react-icons/icons/fa/" target="_blank">Font Awesome 5</a>
            </div>
            <button type="submit">Agregar Categoría</button>
          </div>


          {/* Previsualización del Icono */}
          <div className="prevIcon">
            <span>Previa del ícono:</span>
            {icono && FaIcons[icono] ? (
              (() => {
                const IconoPreview = FaIcons[icono];
                return <IconoPreview size={100} />;
              })()
            ) : (
              <FaIcons.FaQuestionCircle size={100} />
            )}
          </div>

          
        </form>
      </div>
    </main>
  );
};

export default AdminCategorias;
