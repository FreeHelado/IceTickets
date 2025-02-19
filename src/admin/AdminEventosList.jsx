import config from "../config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaRegCalendarPlus, FaRegCalendarCheck, FaIceCream, FaRegEye, FaRegPenToSquare, FaRegTrashCan, FaChartLine } from "react-icons/fa6";
import Swal from "sweetalert2";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es"; // Para formato en español

function AdminEventosList() {
  const [eventos, setEventos] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId"); // 🔥 Obtenemos el ID del usuario autenticado
  const isAdmin = localStorage.getItem("isAdmin") === "true"; // Convertir a booleano

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = () => {
    fetch(`${config.BACKEND_URL}/api/eventos`)
      .then((response) => response.json())
      .then((data) => {
        const eventosFiltrados = isAdmin 
          ? data 
          : data.filter(evento => 
              evento.vendedor === userId || evento.sociosProductores.includes(userId)
            );
        setEventos(eventosFiltrados);
      })
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
      const response = await fetch(`${config.BACKEND_URL}/api/eventos/${id}`, {
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
    <main className="adminPanel">
      <h2>Listado de Eventos</h2>
      <div className="alert">
        Aquí se presentan todos los eventos de los cuales formas parte como vendedor y administrador
      </div>

      <nav>
        <ul>
          <li><Link to="/admin/categorias">Administrar Categorías</Link></li>
          
        </ul>
      </nav>

      <div className="adminPanel__cont">

        <div className="adminPanel__cont--zonaListardo">
         {eventos.length > 0 ? (
            eventos.map((evento) => (
              <div key={evento._id} className="adminPanel__cont--zonaListardo--card">
                
                <img src={`${config.BACKEND_URL}/img/eventos/${evento.imagen}`} alt={`Imagen de ${evento.nombre}`} />
                
                <div className="adminPanel__cont--zonaListardo--card--data">
                  <div className="adminPanel__cont--zonaListardo--card--data--titulo">
                    <h4>{evento.nombre}</h4>
                    <span> {evento.fecha ? format(parseISO(evento.fecha), "dd 'de' MMMM yyyy", { locale: esLocale }) : "Fecha no disponible"} - {evento.hora}</span>
                  </div>

                  <div className="adminPanel__cont--zonaListardo--card--data--tools">
                    
                    <Link to={`/evento/${evento._id}`} target="_blank" rel="noopener noreferrer">
                      <i><FaRegEye /></i>
                      <span>Ir al Evento</span>
                    </Link>
                    <Link to={`/admin/evento/editar/${evento._id}`}>
                      <i><FaRegPenToSquare /></i>
                      <span>Editar Evento</span>
                    </Link>
                    <Link to={`/admin/evento/ordenes/${evento._id}`}>
                      <i><FaChartLine /></i>
                      <span>Ventas</span>
                    </Link>

                    <div onClick={() => handleDelete(evento._id)} className="borrarEvento">
                        <i><FaRegTrashCan /></i>
                        <span>Eliminar</span>
                    </div>
               
                  </div>
                </div>
              </div>
                
            ))
          ) : (
            <div>
              Cargando eventos...
            </div>
          )}
          
        </div>

        <div className="adminPanel__cont--zona3">
            <nav>
              <button onClick={() => navigate("/crearevento")}>
                <i><FaRegCalendarPlus /></i>
                <span>Nuevo Evento</span>
              </button>

              <button onClick={() => navigate("/eventosadmin")}>
                <i><FaRegCalendarCheck /></i>
                <span>Mis Eventos</span>
              </button>
              
              <button onClick={() => navigate("/")}>
                <i><FaIceCream /></i>
                <span>Inicio</span>
              </button>
            </nav>

        </div>
      </div>

    </main>
  );
}

export default AdminEventosList;
