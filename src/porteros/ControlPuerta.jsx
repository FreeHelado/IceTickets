import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import config from "../config";
import Swal from "sweetalert2";
import { FaIceCream, FaTicketSimple, FaFire, FaUser, FaPowerOff } from "react-icons/fa6";

import { MdOutlineQrCodeScanner } from "react-icons/md";

function ValidacionPortero() {
  const [codigoTicket, setCodigoTicket] = useState("");
  const [numeroEvento, setNumeroEvento] = useState("");
  const [clave, setClave] = useState("");
  const [ticketData, setTicketData] = useState(null);
    const [error, setError] = useState(null);
  const [evento, setEvento] = useState(null); // 🔥 Definir el estado de evento
  
  const scannerRef = useRef(null);

  // ✅ Cargar el evento desde localStorage al iniciar
  useEffect(() => {
  const eventoGuardado = localStorage.getItem("eventoPortero");

  if (eventoGuardado) {
    try {
      const eventoData = JSON.parse(eventoGuardado);
      console.log("✅ Evento cargado desde localStorage:", eventoData);

      // 🔥 Primero obtenemos los datos del evento desde el backend
      fetch(`${config.BACKEND_URL}/api/eventos/${eventoData.id}`)
        .then((res) => res.json())
        .then((eventoCompleto) => {
          console.log("📌 Evento completo obtenido del backend:", eventoCompleto);

          // ✅ Guardamos el evento con el ID correcto
          setEvento((prevEvento) => ({
            ...prevEvento,
            ...eventoCompleto,
            _id: eventoCompleto._id, // 🔥 Asegurar que el ID está bien guardado
          }));

          // 🔥 Luego obtenemos los datos del lugar
          return fetch(`${config.BACKEND_URL}/api/lugares/${eventoCompleto.lugar}`);
        })
        .then((res) => res.json())
        .then((lugarData) => {
          console.log("📌 Datos del lugar obtenidos:", lugarData);
          setEvento((prevEvento) => ({
            ...prevEvento,
            lugarNombre: lugarData.nombre,
            lugarImagen: lugarData.logo, // 🔥 Esto es la imagen del lugar
            direccion: lugarData.direccion,
          }));
        })
        .catch((err) => {
          console.error("❌ Error al obtener el evento o el lugar:", err);
          Swal.fire("Error", "No se pudo obtener la información del evento o del lugar.", "error");
        });

    } catch (error) {
      console.error("❌ Error al parsear el evento:", error);
      Swal.fire("Error", "Datos del evento corruptos. Intenta iniciar sesión de nuevo.", "error");
    }
  } else {
    Swal.fire("Error", "No tienes un evento seleccionado", "error");
  }
}, []);







  const iniciarEscaneo = () => {
    Swal.fire({
      title: "Escaneando QR...",
      html: '<div id="qr-reader" style="width: 300px;"></div>',
      showConfirmButton: false,
      didOpen: () => {
        const scanner = new Html5QrcodeScanner("qr-reader", {
          fps: 10,
          qrbox: 250,
        });

        scanner.render(
          (decodedText) => {
            setCodigoTicket(decodedText);
            scanner.clear(); // Cierra la cámara después de escanear
            Swal.close();
          },
          (errorMessage) => {
            console.log("Error escaneando:", errorMessage);
          }
        );

        scannerRef.current = scanner;
      },
      willClose: () => {
        if (scannerRef.current) {
          scannerRef.current.clear(); // Asegura que la cámara se cierre al cerrar el modal
        }
      },
    });
  };

    
 const buscarTicket = async () => {
    setError(null);
    setTicketData(null);

    if (!codigoTicket.trim()) {
      Swal.fire("Error", "Ingrese un código de ticket", "error");
      return;
    }

    if (!evento || !evento._id) { // ✅ Asegurarnos de que `evento._id` exista antes de buscar
      console.log("🚨 `evento` aún no está disponible o falta el ID:", evento);
      Swal.fire("Error", "No tienes un evento seleccionado", "error");
      return;
    }

    console.log("📤 Buscando tickets del evento con ID:", evento._id);

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/tickets/tickets-evento/${evento._id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en la validación");
      }

      console.log("📌 Tickets del evento recibidos:", data.tickets);

      const ticketEncontrado = data.tickets.find(ticket => ticket.idVerificador === codigoTicket);

      if (!ticketEncontrado) {
        throw new Error("❌ Este ticket no pertenece a este evento.");
      }

      console.log("✅ Ticket encontrado:", ticketEncontrado);
      setTicketData(ticketEncontrado);

      Swal.fire({
        title: "✅ Ticket válido",
        html: `
          <p><strong>Nombre:</strong> ${ticketEncontrado.nombre || "No disponible"}</p>
          <p><strong>Email:</strong> ${ticketEncontrado.email || "No disponible"}</p>
          <p><strong>Documento:</strong> ${ticketEncontrado.documento || "No disponible"}</p>
          <p><strong>Tipo de Entrada:</strong> ${ticketEncontrado.tipoEntrada || "No disponible"}</p>
          ${ticketEncontrado.sector ? `<p><strong>Sector:</strong> ${ticketEncontrado.sector}</p>` : ""}
          ${ticketEncontrado.fila ? `<p><strong>Fila:</strong> ${ticketEncontrado.fila}</p>` : ""}
          ${ticketEncontrado.asiento ? `<p><strong>Asiento:</strong> ${ticketEncontrado.asiento}</p>` : ""}
          ${ticketEncontrado.usado ? `<p class="usado">⚠️ Este ticket ya fue usado</p>` : ""}
        `,
        icon: ticketEncontrado.usado ? "warning" : "success",
        showCancelButton: !ticketEncontrado.usado,
        confirmButtonText: ticketEncontrado.usado ? "Cerrar" : "✅ Validar Acceso",
      }).then((result) => {
        if (result.isConfirmed) {
          validarAcceso();
        }
      });

    } catch (err) {
      console.error("❌ Error en la validación:", err.message);

      Swal.fire({
        icon: "error",
        title: "Ticket no válido",
        text: err.message,
        showCancelButton: true,
        confirmButtonText: "Intentar de nuevo",
        cancelButtonText: "Cerrar",
      });

      setError(err.message);
    }
};





  const validarAcceso = async () => {
    if (!ticketData || !evento) return;

    console.log("📩 Enviando validación con:", {
      idVerificador: ticketData.idVerificador, // ✅ TicketData ya es el ticket
      eventoId: evento._id,  // ✅ Enviar evento._id en lugar de numeroEvento
    });

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/tickets/marcar-usado/${ticketData.idVerificador}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventoId: evento._id }), // ✅ Mandamos `eventoId`
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
      console.error("❌ Error en la validación:", err.message);
      Swal.fire("Error", err.message, "error");
    }
};




  return (
    <main className="porteros">


      {/* 🔥 Mostrar información del evento */}
      {evento && (
        <div className="porteros__cont">
          <figure className="porteros__cont--bg">
            <img src={`${config.BACKEND_URL}/img/eventos/${evento.imagen}`} alt={evento.nombre} className="evento-img" />

           
            
            <div className="porteros__cont--bg--data">
              {evento.lugarImagen && (
                <img src={`${config.BACKEND_URL}/img/lugares/${evento.lugarImagen}`} alt="Logo del Lugar" className="logo-lugar" />
              )}
              <div className="porteros__cont--bg--data--info">
                <h3>{evento.nombre}</h3>
                <span>{new Date(evento.fecha).toLocaleDateString()} - {evento.hora}</span>
                <span>{evento.lugarNombre || "Lugar desconocido"}</span> {/* 🔥 Nombre del lugar */}
                <span>{evento.direccion || "Dirección no disponible"}</span> {/* 🔥 Dirección */}
              </div>
            </div>

            <div className="porteros__cont--bg--form">
                <div className="porteros__cont--bg--tit--logo">
                  <i><FaIceCream /></i>
                  <h1>IceTicket</h1>
                </div>
                <h2>Validación de Ticket</h2>
              <div className="porteros__cont--bg--form--input">
              
                <input
                  type="text"
                  placeholder="Ingresar código de ticket"
                  value={codigoTicket}
                  onChange={(e) => setCodigoTicket(e.target.value)}
                  />
                <button onClick={iniciarEscaneo}>
                  <i><MdOutlineQrCodeScanner /></i>
                </button>
              </div>
              <button onClick={buscarTicket}>Buscar Ticket</button>
                  {error && <p className="error">{error}</p>}

            </div>

        
          </figure>
        </div>
      )}




    </main>
  );
}

export default ValidacionPortero;
