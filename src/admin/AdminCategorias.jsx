import { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa"; // Importamos TODOS los iconos
import config from "../config"; // Configuración de backend

const AdminCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("FaQuestionCircle"); // Ícono por defecto

  // Convertimos los nombres de los íconos en una lista
  const iconosDisponibles = Object.keys(FaIcons);

  useEffect(() => {
    fetch(`${config.BACKEND_URL}/api/categorias`)
      .then((response) => response.json())
      .then((data) => setCategorias(data))
      .catch((error) => console.error("❌ Error al obtener categorías:", error));
  }, []);

  const agregarCategoria = async (e) => {
    e.preventDefault();

    if (!nombre || !icono) {
      alert("⚠️ Todos los campos son obligatorios.");
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

      const categoriaCreada = await res.json();
      setCategorias([...categorias, categoriaCreada]); // Actualizar la lista
      setNombre(""); // Limpiar campos
      setIcono("FaQuestionCircle");
    } catch (error) {
      console.error("❌ Error al agregar categoría:", error);
    }
  };

  return (
    <main className="adminPanel">
      <h2>📂 Categorías</h2>

      {/* 🟢 Listado de Categorías */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {categorias.map((categoria) => {
          const Icono = FaIcons[categoria.icono] || FaIcons.FaQuestionCircle;
          return (
            <div key={categoria._id} style={{ textAlign: "center", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
              <Icono size={30} />
              <p>{categoria.nombre}</p>
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
            {iconosDisponibles.map((iconoNombre) => {
              const IconoPreview = FaIcons[iconoNombre]; // Obtenemos el ícono en sí
              return (
                <option key={iconoNombre} value={iconoNombre}>
                  {iconoNombre}
                </option>
              );
            })}
          </select>
        </label>

        
        {/* Previsualización del Icono */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
            {icono && FaIcons[icono] ? (
                (() => {
                const IconoPreview = FaIcons[icono]; // Guardamos el componente en una variable
                return <IconoPreview size={40} />;
                })()
            ) : (
                <FaIcons.FaQuestionCircle size={40} />
            )}
            </div>


        <button type="submit" style={{ padding: "10px", backgroundColor: "#28a745", color: "#fff", borderRadius: "5px", cursor: "pointer" }}>
          Agregar Categoría
        </button>
      </form>
    </main>
  );
};

export default AdminCategorias;
