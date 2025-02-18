import config from "../config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaIceCream } from "react-icons/fa6";
import Swal from "sweetalert2";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const navigate = useNavigate();
    
// 🔥 Redirigir si el usuario ya está logueado
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
        navigate("/", { replace: true }); // Redirige al home si está logueado
        }
    }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("${config.BACKEND_URL}/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nombre, telefono }) // 🔥 No enviamos isAdmin
      });

      const data = await response.json();

        if (response.ok) {
          // 🔥 Guardamos el email en localStorage para la verificación
        localStorage.setItem("pendingEmail", email);
        Swal.fire({
          title: "¡Registro exitoso!",
          text: "Ahora puedes iniciar sesión",
          icon: "success",
          confirmButtonText: "Ir al login"
        }).then(() => {
          navigate("/verificar");
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "No se pudo registrar el usuario",
          icon: "error",
          confirmButtonText: "Intentar de nuevo"
        });
      }
    } catch (error) {
      console.error("Error en registro:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema de conexión con el servidor",
        icon: "error",
        confirmButtonText: "Intentar de nuevo"
      });
    }
  };

  return (
    <main className="registro">
      <div className="registro__header">
          <i><FaIceCream /></i>
          <h1>IceTicket</h1>
      </div>
      <div className="registro__cont">
        <h2>Registro</h2> 
        <form onSubmit={handleSubmit} className="registro__cont--form">
            <div className="registro__cont--form--campo">
                <label htmlFor="nombre">Nombre Completo</label>            
                <input 
                    type="text" 
                    placeholder="Nombre" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    required 
                />
            </div>
            <div className="registro__cont--form--campo">
                <label htmlFor="email">Email</label>
                <input 
                    type="email" 
                    placeholder="Correo" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
            </div>
            <div className="registro__cont--form--campo">
                <label htmlFor="telefono">Teléfono</label>
                <input 
                    type="text" 
                    placeholder="Teléfono" 
                    value={telefono} 
                    onChange={(e) => setTelefono(e.target.value)} 
                    required 
                />
            </div>
            <div className="registro__cont--form--campo">
                <label htmlFor="password">Contraseña</label>
                <input 
                    type={mostrarPassword ? "text" : "password"} 
                    placeholder="Contraseña" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    />
                    <i onClick={() => setMostrarPassword(!mostrarPassword)} style={{ cursor: "pointer" }}>
                    {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                    </i>
            </div>
          <button type="submit">Registrarse</button>
        </form>
      </div>
    </main>
  );
}

export default Register;
