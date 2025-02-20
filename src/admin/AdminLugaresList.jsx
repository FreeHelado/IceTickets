import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config";
import Swal from "sweetalert2";

function AdminLugaresList() {
  const [lugares, setLugares] = useState([]);
  const isAdmin = localStorage.getItem("isAdmin") === "true"; // 🔥 Verificamos si es admin
  const userId = localStorage.getItem("userId"); // 🔥 ID del usuario logueado
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLugares = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/lugares`);
        if (!response.ok) throw new Error("Error obteniendo lugares");

        const data = await response.json();

        // 🔥 Filtramos en el frontend
        const lugaresFiltrados = isAdmin
          ? data // 🔥 Si es admin, ve todos los lugares
          : data.filter(lugar => lugar.vendedor === userId); // 🔥 Si no, solo los suyos

        setLugares(lugaresFiltrados);
      } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire("Error", "No se pudieron cargar los lugares", "error");
      }
    };

    fetchLugares();
  }, []);

  
    const handleDelete = async (id) => {
        const confirmacion = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (confirmacion.isConfirmed) {
            try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}`, {
                method: "DELETE",
                headers: { Authorization: token }
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire("Eliminado", "El lugar ha sido eliminado", "success");
                setLugares((lugares) => lugares.filter((l) => l._id !== id)); // 🔥 Actualizar lista
            } else {
                Swal.fire("Error", data.message || "No se pudo eliminar el lugar", "error");
            }
            } catch (error) {
            console.error("❌ Error eliminando lugar:", error);
            Swal.fire("Error", "Hubo un problema en el servidor", "error");
            }
        }
        };

  return (
    <main className="adminPanel">
      <h2>Listado de Lugares</h2>
      <div className="alert">Aquí se presentan los lugares que puedes administrar</div>

      <div className="adminPanel__cont">
         <button onClick={() => navigate("/admin/mis-lugares/crearlugar/")}>Nuevo Lugar</button>

        <ul>
          {lugares.map((lugar) => (
            <li key={lugar._id}>
              <h3>{lugar.nombre}</h3>
              <p>{lugar.direccion}</p>
              <small>Vendedor: {lugar.vendedor}</small>
              <button onClick={() => navigate(`/admin/mis-lugares/editar/${lugar._id}`)}>✍Editar</button>
              <button onClick={() => handleDelete(lugar._id)}>🗑 Eliminar</button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default AdminLugaresList;
