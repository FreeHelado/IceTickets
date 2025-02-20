import config from "../config";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaRegCalendarPlus, FaRegCalendarCheck, FaIceCream, FaRegEye, FaRegPenToSquare, } from "react-icons/fa6";
import { MdOutlinePlace } from "react-icons/md";
import { LuMapPinPlus } from "react-icons/lu";


function AdminTools({ token }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`${config.BACKEND_URL}/api/auth/perfil`, {
        headers: { Authorization: token }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.nombre || data.email) {
            setUsuario(data);
          }
        })
        .catch((error) => console.error("Error obteniendo perfil:", error));
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setToken(null);
    navigate("/login");
  };


  return (
    <nav>
        <button onClick={() => navigate("/crearevento")}>
            <i><FaRegCalendarPlus /></i>
            <span>Nuevo Evento</span>
        </button>

        <button onClick={() => navigate("/eventosadmin")}>
            <i><FaRegCalendarCheck /></i>
            <span>Mis Eventos</span>
          </button>
          
        <button onClick={() => navigate("/admin/mis-lugares")}>
            <i><MdOutlinePlace /></i>
            <span>Mis Lugares</span>
        </button>
        
        <button onClick={() => navigate("/admin/mis-lugares/crearlugar")}>
            <i><LuMapPinPlus /></i>
            <span>Crear Lugar</span>
        </button>
        
        
        <button onClick={() => navigate("/")}>
            <i><FaIceCream /></i>
            <span>Ir a la Web</span>
        </button>
    </nav>
  );
}

export default AdminTools;
