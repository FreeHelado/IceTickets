import { Link } from "react-router-dom";
import { FaIceCream, FaTicketSimple, FaFire, FaUser, FaPowerOff } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

function HeaderAdmin({ token }) {
  return (
    <header>
      <div className="header__logo">
        <Link to={`/admin`}>
          <i><FaIceCream /></i>
                  <h1>IceTicket</h1>
                  <span>Admin</span>
        </Link>
      </div>

     

      <div className="header__tools">
        <Link to={token ? "/admin" : "/login"}>
          <i><FaIceCream /></i>
          <span>{token ? "Mi cuenta" : "Ingresar"}</span>
        </Link>

        
        {token && (
        <a href="" >
          <i><FaTicketSimple /></i>
          <span>Mis Tickets</span>
          </a>
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
