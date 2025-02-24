import config from "../config";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaIceCream, FaTicketSimple, FaFire, FaUser, FaPowerOff } from "react-icons/fa6";



function HeaderAdmin({ token }) {

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

  useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 1); // Si baja m�s de 50px, cambia el estado
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);



  return (
    <header className={isScrolled ? "scrollAdmin" : ""}>
      <div className="header__logo">
        <Link to={`/admin`}>
          <i><FaIceCream /></i>
                  <h1>IceTicket</h1>
        </Link>
        {token && usuario && (<small>Hola {usuario.nombre || usuario.email}</small> )}
      </div>
    

      <div className="header__tools">

        <Link to={token ? "/admin" : "/login"}>
          <i><FaIceCream /></i>
          <span>{token ? "Mi cuenta" : "Ingresar"}</span>
        </Link>

        
        {token && (
        <Link to="/mis-tickets">
            <i><FaTicketSimple /></i>
            <span>Mis Tickets</span>
          </Link>
        )}

        {token && (
          <Link to="/admin">
          <i><FaFire /></i>
            <span>Panel de Vendedor</span>
          </Link>
        )}

        {token && (
          <Link to="/login" onClick={handleLogout}>
            <FaPowerOff />
            <span>Cerrar Sesión</span>
          </Link>
        )}

      </div>
    </header>
  );
}

export default HeaderAdmin;
