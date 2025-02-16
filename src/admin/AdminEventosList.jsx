import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

function AdminEventosList() {
  const [eventos, setEventos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = () => {
    fetch("http://localhost:5000/api/eventos")
      .then((response) => response.json())
      .then((data) => setEventos(data))
      .catch((error) => console.error("❌ Error cargando eventos:", error));
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Eliminar Evento",
      text: "¿Estás seguro que quieres borrar el evento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      if (response.ok) {
        Swal.fire("Eliminado!", "El evento ha sido eliminado correctamente.", "success");
        cargarEventos(); // ✅ Recarga los eventos después de eliminar
      } else {
        Swal.fire("Error", "No se pudo eliminar el evento.", "error");
      }
    } catch (error) {
      console.error("❌ Error al eliminar evento:", error);
      Swal.fire("Error", "Error en la conexión con el servidor.", "error");
    }
  };

  return (
    <div className="admin-eventos-list">
      <button onClick={() => navigate("/crearevento")}>📅 Crear Evento</button>
      <h2>📋 Listado de Eventos</h2>
      <table>
        <thead>
          <tr>
            <th>Evento</th>
            <th>Nombre</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {eventos.length > 0 ? (
            eventos.map((evento) => (
              <tr key={evento._id}>
                <td>
                  <img 
                    src={`http://localhost:5000/img/eventos/${evento.imagen}`} 
                    alt={`Imagen de ${evento.nombre}`} 
                    style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }}
                  />
                </td>
                <td>{evento.nombre}</td>
                <td>{evento.fecha}</td>
                <td>{evento.hora}</td>
                <td>
                  <Link to={`/evento/${evento._id}`} target="_blank" rel="noopener noreferrer">
  <button style={{ marginRight: "10px", background: "blue", color: "white" }}>
    👁️ Vista previa
  </button>
</Link>

                  <Link to={`/admin/evento/editar/${evento._id}`}>
                    <button style={{ marginRight: "10px" }}>✏️ Editar</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(evento._id)}
                    style={{ background: "red", color: "white" }}
                  >
                    ❌ Borrar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Cargando eventos...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminEventosList;
