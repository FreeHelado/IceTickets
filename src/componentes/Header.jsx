import { Link } from "react-router-dom";
import { FaIceCream, FaTicketSimple, FaFire, FaUser, FaPowerOff } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";


function Header({ token }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const handleLogout = () => {
      localStorage.removeItem("token");
      setToken(null);
      navigate("/login");
    };
  
    useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 1); // Si baja más de 50px, cambia el estado
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);
  
  return (
    
    <header className={isScrolled ? "scroll" : ""}>
      <div className="header__logo">
        <Link to={`/`}>
          <i><FaIceCream /></i>
          <h1>IceTicket</h1>
        </Link>
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
            <span>Cerrar SesiÃ³n</span>
          </Link>
        )}

      </div>
    </header>
  );
}

export default Header;
