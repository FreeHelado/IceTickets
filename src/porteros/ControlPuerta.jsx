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
      setEvento(JSON.parse(eventoGuardado)); // 🔥 Guardar el evento en el estado
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

  try {
    const response = await fetch(`${config.BACKEND_URL}/api/tickets/validar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idVerificador: codigoTicket }),
    });

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("El servidor no devolvió JSON. Verifica la API.");
    }

    const data = await response.json();

    console.log("📌 Respuesta del backend:", data); // 🔍 Depuración

    if (!response.ok) {
      throw new Error(data.message || "Error en la validación");
    }

    setTicketData(data);
  } catch (err) {
    console.error("❌ Error en la validación:", err);
    setError(err.message);
  }
};


  const validarAcceso = async () => {
    if (!ticketData || !evento) return;

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/tickets/marcar-usado/${ticketData.ticket.idVerificador}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numeroEvento: evento.numeroEvento, clave: evento.clave }),
        }
      );

      const data = await response.json();

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
