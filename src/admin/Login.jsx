import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaIceCream } from "react-icons/fa6";

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const prevPage = localStorage.getItem("prevPage") || "/";
      localStorage.removeItem("prevPage");
      navigate(prevPage, { replace: true });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        console.log("🔥 Respuesta del backend:", data);
        if (!data.verificado) { // 🔥 Verificamos si el usuario está verificado
          Swal.fire({
            title: "Cuenta no verificada",
            text: "Debes verificar tu cuenta antes de iniciar sesión.",
            icon: "warning",
            confirmButtonText: "Verificar ahora"
          }).then(() => {
            localStorage.setItem("pendingEmail", email);
            navigate("/verificar"); // Redirigir a la verificación
          });
          return; // 🔥 Detenemos el proceso de login aquí
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", data.isAdmin); // 🔥 Guardamos isAdmin
        localStorage.setItem("userId", data.userId); // 🔥 Guardamos el userId aquí
        setToken(data.token);

        const prevPage = localStorage.getItem("prevPage") || "/";
        localStorage.removeItem("prevPage");
        navigate(prevPage, { replace: true });

        // Mostrar un Toast de éxito
        Swal.fire({
          title: "¡Bienvenido!",
          text: "Has iniciado sesión con éxito",
          icon: "success",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });

      } else {
        
        Swal.fire({
          title: "Error",
          text: data.message || "Usuario no encontrado o contraseña incorrecta",
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error en login:", error);

      //Mostrar un Toast si hay un error de conexión
      Swal.fire({
        title: "Error",
        text: "Hubo un problema de conexión con el servidor",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  return (
    <main className="login">
      <div className="login__cont">
      <div className="login__cont--header">
          <i><FaIceCream /></i>
          <h1>IceTicket</h1>
      </div>
        <h2>Iniciar Sesión</h2> 
        <form onSubmit={handleSubmit} className="login__cont--form">
          <div className="login__cont--form--campo">
            <input 
              type="email" 
              placeholder="Correo" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="login__cont--form--campo">
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

          <button type="submit">Ingresar</button>
        </form>
      </div>
      <div className="login__crear">
         <span>
          Si aún no tienes cuenta, <strong onClick={() => navigate("/register")}>puedes crearla aquí</strong>
        </span>
      </div>
    </main>
  );
}

export default Login;
