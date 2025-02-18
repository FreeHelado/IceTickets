import config from "../config";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaIceCream } from "react-icons/fa6";
import Swal from "sweetalert2";

function VerificarCodigo() {
  const navigate = useNavigate();
  const email = localStorage.getItem("pendingEmail");
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [contador, setContador] = useState(0); // 🔥 Contador de reenvío
  const inputRefs = useRef([]);

  // 🔥 Manejamos el input individual
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCodigo = [...codigo];
    newCodigo[index] = value.slice(-1);
    setCodigo(newCodigo);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // 🔥 Manejo de pegado de código completo
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedCode = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedCode)) {
      setCodigo(pastedCode.split(""));
      inputRefs.current[5].focus();
    }
  };

  // 🔥 Enviar código al backend
  const handleVerify = async () => {
    const codigoCompleto = codigo.join("");
    if (codigoCompleto.length !== 6) {
      Swal.fire({ title: "Error", text: "Debes ingresar los 6 dígitos.", icon: "error" });
      return;
    }

    try {
      const response = await fetch("${config.BACKEND_URL}/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo: codigoCompleto })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          title: "¡Verificación Exitosa!",
          text: "Ahora puedes iniciar sesión.",
          icon: "success",
          confirmButtonText: "Ir al Login"
        }).then(() => {
          localStorage.removeItem("pendingEmail");
          navigate("/login");
        });
      } else {
        Swal.fire({ title: "Error", text: data.message, icon: "error" });
      }
    } catch (error) {
      console.error("Error en verificación:", error);
      Swal.fire({ title: "Error", text: "Hubo un problema en la verificación.", icon: "error" });
    }
  };

  // 🔥 Solicitar un nuevo código y activar contador
  const handleResendCode = async () => {
    if (contador > 0) return; // Evita reenviar mientras el contador sigue activo

    try {
      const response = await fetch("${config.BACKEND_URL}/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({ title: "Código reenviado", text: data.message, icon: "success" });
        setContador(30); // 🔥 Iniciar cuenta regresiva de 30s
      } else {
        Swal.fire({ title: "Error", text: data.message, icon: "error" });
      }
    } catch (error) {
      console.error("Error al reenviar código:", error);
      Swal.fire({ title: "Error", text: "Hubo un problema al reenviar el código.", icon: "error" });
    }
  };

  // 🔥 Contador de reenvío automático cada segundo
  useEffect(() => {
    if (contador > 0) {
      const timer = setTimeout(() => setContador(contador - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [contador]);

  return (
    <main className="login">
        <div className="login__cont">
            <div className="login__cont--header">
                <i><FaIceCream /></i>
                <h1>IceTicket</h1>
            </div>
            <h2>Verificar Cuenta</h2>
              <span>Introduce el código enviado a tu correo.</span>
              <div className="login__cont--form">
                <div className="codigo__cont">
                    {codigo.map((num, index) => (
                        <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={num}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onPaste={handlePaste}
                        ref={(el) => (inputRefs.current[index] = el)}
                        className="codigo__input"
                        />
                    ))}
                </div>
                  <button onClick={handleVerify}>Verificar</button>
                  <div className="reenviar-codigo">    
                    <span>¿El código no te llegó o expiró?{" "}</span>
                    <button 
                        onClick={handleResendCode} 
                        disabled={contador > 0} 
                    >
                        {contador > 0 ? `Espera ${contador}s...` : "Reenviar Código"}
                    </button>
                  </div>
            </div>
        </div>
    </main>
  );
}

export default VerificarCodigo;
