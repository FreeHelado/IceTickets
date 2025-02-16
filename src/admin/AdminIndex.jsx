import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaRegCalendarPlus, FaRegCalendarCheck, FaIceCream, FaRegEye, FaRegPenToSquare  } from "react-icons/fa6";

function AdminIndex({ setToken }) {
  const [eventos, setEventos] = useState([]);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("isAdmin") === "true"; // Convertir a booleano



  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = () => {
    fetch("http://localhost:5000/api/eventos")
      .then((response) => response.json())
      .then((data) => setEventos(data))
      .catch((error) => console.error("❌ Error cargando eventos:", error));
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
          <h1>Bienvenido a IceTicket bro</h1>
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
                    <span>{evento.fecha} - {evento.hora}</span>
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
