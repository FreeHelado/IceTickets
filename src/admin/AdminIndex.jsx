import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaRegCalendarPlus, FaRegCalendarCheck, FaIceCream, FaRegEye, FaRegPenToSquare } from "react-icons/fa6";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es"; // Para formato en espa�ol

function AdminIndex({ setToken }) {
  const [eventos, setEventos] = useState([]);
  const [usuario, setUsuario] = useState(null); // 🔥 Nuevo estado para guardar el usuario
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId"); // 🔥 Obtenemos el ID del usuario autenticado
  const isAdmin = localStorage.getItem("isAdmin") === "true"; // Convertir a booleano


  useEffect(() => {
    cargarEventos();
    cargarUsuario(); // ✅ Llamamos la función para obtener los datos del usuario
  }, []);

  const cargarEventos = () => {
    fetch("http://localhost:5000/api/eventos")
      .then((response) => response.json())
      .then((data) => {
        const eventosFiltrados = isAdmin 
          ? data 
          : data.filter(evento => 
              evento.vendedor === userId || evento.sociosProductores.includes(userId)
            );
        setEventos(eventosFiltrados);
      })
      .catch((error) => console.error("? Error cargando eventos:", error));
  };

  const cargarUsuario = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/auth/perfil", {
        headers: { Authorization: token }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.nombre || data.email) {
            setUsuario(data); // ✅ Guardamos el usuario en el estado
          }
        })
        .catch((error) => console.error("❌ Error obteniendo perfil:", error));
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  return (
    <div className="adminPanel">

      <div className="adminPanel__cont">
        <div className="adminPanel__cont--zona1">
          <h1>Bienvenido a IceTicket {usuario?.nombre || usuario?.email || "Usuario"} 👋</h1>
          <h2>Desde este panel vas a poder vender tus tickets y administrarlos</h2>
          <span>Ayuda</span>

          {isAdmin && <span>Super Usuario Full Manager</span>}

        </div>

        <div className="adminPanel__cont--zona2">
          <h3>Mis Eventos</h3>
          {eventos.length > 0 ? (
            eventos.map((evento) => (
              <div key={evento._id} className="adminPanel__cont--zona2--card">
                
                <img src={`http://localhost:5000/img/eventos/${evento.imagen}`} alt={`Imagen de ${evento.nombre}`} />
                
                <div className="adminPanel__cont--zona2--card--data">
                  <div className="adminPanel__cont--zona2--card--data--titulo">
                    <h4>{evento.nombre}</h4>
                    <span> {evento.fecha ? format(parseISO(evento.fecha), "dd 'de' MMMM yyyy", { locale: esLocale }) : "Fecha no disponible"} - {evento.hora}</span>
                  </div>

                  <div className="adminPanel__cont--zona2--card--data--tools">
                    <Link to={`/evento/${evento._id}`} target="_blank" rel="noopener noreferrer">
                      <i><FaRegEye /></i>
                    </Link>

                    <Link to={`/admin/evento/editar/${evento._id}`}>
                      <i><FaRegPenToSquare /></i>
                    </Link>
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


    </div>
  );
}

export default AdminIndex;
