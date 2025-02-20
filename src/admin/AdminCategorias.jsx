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
      <h2>📂 Categorías</h2>

      {/* 🟢 Listado de Categorías */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {categorias.map((categoria) => {
          const Icono = FaIcons[categoria.icono] || FaIcons.FaQuestionCircle;
          return (
            <div key={categoria._id} style={{ textAlign: "center", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", position: "relative" }}>
              <Icono size={30} />
              <p>{categoria.nombre}</p>
              {/* 🗑️ Botón de eliminar */}
              <button
                onClick={() => eliminarCategoria(categoria._id)}
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  width: "25px",
                  height: "25px",
                  fontSize: "14px",
                }}
              >
                ✖
              </button>
            </div>
          );
        })}
      </div>

      {/* 📝 Formulario para Agregar Categoría */}
      <form onSubmit={agregarCategoria} style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
        <label>
          Nombre:
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: "100%", padding: "5px", borderRadius: "5px" }} />
        </label>

        <label>
          Icono:
          <select value={icono} onChange={(e) => setIcono(e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "5px" }}>
            {Object.keys(FaIcons).map((iconoNombre) => (
              <option key={iconoNombre} value={iconoNombre}>
                {iconoNombre}
              </option>
            ))}
          </select>
        </label>

        {/* Previsualización del Icono */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          {icono && FaIcons[icono] ? (
            (() => {
              const IconoPreview = FaIcons[icono];
              return <IconoPreview size={40} />;
            })()
          ) : (
            <FaIcons.FaQuestionCircle size={40} />
          )}
        </div>

        <button type="submit" style={{ padding: "10px", backgroundColor: "#28a745", color: "#fff", borderRadius: "5px", cursor: "pointer" }}>
          ➕ Agregar Categoría
        </button>
      </form>
    </main>
  );
};

export default AdminCategorias;
