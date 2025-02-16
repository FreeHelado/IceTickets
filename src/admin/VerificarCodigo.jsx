import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaIceCream } from "react-icons/fa6";
import Swal from "sweetalert2";

function VerificarCodigo() {
    const navigate = useNavigate();
    const email = localStorage.getItem("pendingEmail"); // Tomamos el email guardado tras el registro
    const [codigo, setCodigo] = useState(["", "", "", "", "", ""]); // Array de inputs
    const inputRefs = useRef([]); // Referencias a los inputs
    
    // 🔥 Manejo del input individual
    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Solo números

        const newCodigo = [...codigo];
        newCodigo[index] = value.slice(-1); // Solo un dígito por input
        setCodigo(newCodigo);

        // 🔥 Enfocar el siguiente input si se ingresó un número
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
        inputRefs.current[5].focus(); // Enfocar el último input
        }
    };

    // 🔥 Enviar código al backend
    const handleVerify = async () => {
        const codigoCompleto = codigo.join(""); // Unimos los dígitos
        if (codigoCompleto.length !== 6) {
        Swal.fire({ title: "Error", text: "Debes ingresar los 6 dígitos.", icon: "error" });
        return;
        }

        try {
        const response = await fetch("http://localhost:5000/api/auth/verify", {
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
            </div>
        </div>
    </main>
  );
}

export default VerificarCodigo;
