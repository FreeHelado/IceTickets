import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import config from "../config";

function PorteroLogin() {
  const [numeroEvento, setNumeroEvento] = useState("");
  const [clave, setClave] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!numeroEvento || !clave) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, ingresa el número de evento y la clave.",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/portero/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroEvento, clave }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Guardamos el evento en el estado o localStorage
        localStorage.setItem("eventoPortero", JSON.stringify(data));
        navigate("/validar-tickets"); // 🔥 Redirigir a la validación de tickets
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Número de evento o clave incorrectos.",
          showConfirmButton: true,
        });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo conectar con el servidor." });
    }
  };

  return (
    <main className="portero-login">
      <h2>Acceso para Control de Tickets</h2>
      <form onSubmit={handleLogin}>
        <div className="campoForm">
          <label>Número de Evento</label>
          <input
            type="number"
            value={numeroEvento}
            onChange={(e) => setNumeroEvento(e.target.value)}
            required
            placeholder="Ej: 123456"
          />
        </div>

        <div className="campoForm">
          <label>Clave</label>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
            placeholder="Ingresa la clave"
          />
        </div>

        <button type="submit" className="btn-entrada">Ingresar</button>
      </form>
    </main>
  );
}

export default PorteroLogin;
