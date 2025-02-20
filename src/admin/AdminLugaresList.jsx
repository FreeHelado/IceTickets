import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config";
import Swal from "sweetalert2";

function AdminLugaresList() {
  const [lugares, setLugares] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLugares = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${config.BACKEND_URL}/api/lugares`, {
          headers: { Authorization: token }
        });


        if (!response.ok) throw new Error("Error obteniendo lugares");
        
        const data = await response.json();
        setLugares(data);
      } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire("Error", "No se pudieron cargar los lugares", "error");
      }
    };

    fetchLugares();
  }, []);

  return (
    <main className="adminPanel">
      <h2>Listado de Lugares</h2>
      <div className="alert">Aquí se presentan los lugares que puedes administrar</div>

      <div className="adminPanel__cont">
        <button onClick={() => navigate("/admin/lugar/nuevo")}>Nuevo Lugar</button>

        <ul>
          {lugares.map((lugar) => (
            <li key={lugar._id}>
              <h3>{lugar.nombre}</h3>
              <p>{lugar.direccion}</p>
              <small>Vendedor: {lugar.vendedor?.nombre || "Sin asignar"}</small>
              <button onClick={() => navigate(`/admin/lugar/editar/${lugar._id}`)}>Editar</button>
              <button onClick={() => eliminarLugar(lugar._id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default AdminLugaresList;
