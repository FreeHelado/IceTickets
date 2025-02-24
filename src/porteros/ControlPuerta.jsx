import { useState, useEffect } from "react";
import config from "../config";
import Swal from "sweetalert2";


function ValidacionPortero() {
  const [codigoTicket, setCodigoTicket] = useState("");
  const [numeroEvento, setNumeroEvento] = useState("");
  const [clave, setClave] = useState("");
  const [ticketData, setTicketData] = useState(null);
    const [error, setError] = useState(null);
    const [evento, setEvento] = useState(null); // 🔥 Definir el estado de evento

  // ✅ Cargar el evento desde localStorage al iniciar
  useEffect(() => {
    const eventoGuardado = localStorage.getItem("eventoPortero");
    if (eventoGuardado) {
      try {
        setEvento(JSON.parse(eventoGuardado));
      } catch (error) {
        Swal.fire("Error", "Datos del evento corruptos. Intenta iniciar sesión de nuevo.", "error");
      }
    } else {
      Swal.fire("Error", "No tienes un evento seleccionado", "error");
    }
  }, []);

    
const buscarTicket = async () => {
  setError(null);
  setTicketData(null);

  if (!codigoTicket.trim()) {
    Swal.fire("Error", "Ingrese un código de ticket", "error");
    return;
  }

  if (!evento) {
    Swal.fire("Error", "No tienes un evento seleccionado", "error");
    return;
  }

  console.log("📩 Enviando a backend:", {
    idVerificador: codigoTicket,
    eventoId: evento.id,
  });

  try {
    const response = await fetch(`${config.BACKEND_URL}/api/tickets/validar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idVerificador: codigoTicket,
        eventoId: evento.id,
      }),
    });

    console.log("📌 Respuesta sin procesar:", response);

    // 🔥 Intentamos obtener JSON, si no es JSON manejamos el error
    const textResponse = await response.text();
    console.log("📌 Respuesta en texto:", textResponse);

    if (!response.ok) {
      let errorMessage = "Error desconocido";
      try {
        const errorData = JSON.parse(textResponse);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = textResponse; // Si no es JSON, mostramos el texto crudo
      }
      
      throw new Error(errorMessage);
    }

    const data = JSON.parse(textResponse);
    console.log("📌 Respuesta JSON:", data);

    setTicketData(data);
  } catch (err) {
    console.error("❌ Error en la validación:", err.message);

    // ✅ Mostramos el mensaje de error bien formateado en pantalla
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message, // 🔥 Ahora solo muestra el mensaje sin el JSON
    });

    setError(err.message);
  }
};



const validarAcceso = async () => {
  if (!ticketData || !evento) {
    console.log("❌ ERROR: ticketData o evento están vacíos.");
    return;
  }

  console.log("📩 Enviando validación con:", {
    idVerificador: ticketData.ticket.idVerificador,
    eventoId: evento.id,  // 🔥 Solo enviamos el ID del evento
  });

  try {
    const response = await fetch(
      `${config.BACKEND_URL}/api/tickets/marcar-usado/${ticketData.ticket.idVerificador}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoId: evento.id,  // 🔥 Solo enviamos el ID del evento
        }),
      }
    );

    const data = await response.json();
    console.log("📌 Respuesta del backend:", data);

    if (!response.ok) {
      throw new Error(data.message || "No se pudo marcar como usado");
    }

    Swal.fire("Acceso Validado", "El ticket ha sido marcado como usado", "success");
    setTicketData(null);
    setCodigoTicket("");
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
};








  return (
    <main className="adminPanel validacion-portero">
      <h2>Validación de Ticket</h2>
      <input
        type="text"
        placeholder="Ingresar código de ticket"
        value={codigoTicket}
        onChange={(e) => setCodigoTicket(e.target.value)}
      />
      <button onClick={buscarTicket}>Buscar Ticket</button>

      {error && <p className="error">❌ {error}</p>}

      {ticketData && ticketData.ticket && (
  <div className="ticket-info">
    <h3>Datos del Ticket</h3>
    <p><strong>Nombre:</strong> {ticketData.ticket.nombre || "No disponible"}</p>
    <p><strong>Email:</strong> {ticketData.ticket.email || "No disponible"}</p>
    <p><strong>Documento:</strong> {ticketData.ticket.documento || "No disponible"}</p>
    <p><strong>Tipo de Entrada:</strong> {ticketData.ticket.tipoEntrada || "No disponible"}</p>
    {ticketData.ticket.sector && <p><strong>Sector:</strong> {ticketData.ticket.sector}</p>}
    {ticketData.ticket.fila && <p><strong>Fila:</strong> {ticketData.ticket.fila}</p>}
    {ticketData.ticket.asiento && <p><strong>Asiento:</strong> {ticketData.ticket.asiento}</p>}
    {ticketData.ticket.usado && <p className="usado">⚠️ Este ticket ya fue usado</p>}
    <button onClick={validarAcceso} disabled={ticketData.ticket.usado}>
      {ticketData.ticket.usado ? "Ya Usado" : "Validar Acceso"}
    </button>
  </div>
)}

    </main>
  );
}

export default ValidacionPortero;
