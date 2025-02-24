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
    const eventoGuardado = localStorage.getItem("evento");

    if (eventoGuardado) {
      try {
        const eventoData = JSON.parse(eventoGuardado);
        console.log("📌 Datos del evento cargados desde localStorage:", eventoData);
        
        // ✅ Guardamos los datos del evento en el estado
        setEvento({
          id: eventoData.id,
          nombre: eventoData.nombre,
          imagen: eventoData.imagen,  // 📷 Imagen del evento
          fecha: eventoData.fecha,
          hora: eventoData.hora,
          lugar: eventoData.lugar,
          direccion: eventoData.direccion,
          logoLugar: eventoData.logoLugar, // 🏟 Logo del lugar
        });
        
      } catch (error) {
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

    const data = await response.json();
    console.log("📌 Respuesta JSON del ticket:", data);

    if (!response.ok) {
      throw new Error(data.message || "Error en la validación");
    }

    // ✅ 🔥 DEPURAMOS EL SECTOR
    console.log("📌 Ticket recibido, sector:", data.ticket.sector);

    // 🔥 Si el ticket tiene un sector válido, buscamos su nombre en la API
    if (data.ticket.sector && data.ticket.sector !== "undefined" && data.ticket.sector.trim() !== "") {
      try {
        console.log("📡 Buscando nombre del sector con ID:", data.ticket.sector);
        const sectorResponse = await fetch(`${config.BACKEND_URL}/api/lugares/sector/${data.ticket.sector}`);
        if (!sectorResponse.ok) throw new Error("No se pudo obtener el sector");

        const sectorData = await sectorResponse.json();
        data.ticket.sectorNombre = sectorData.nombre || "Sector sin nombre"; // ✅ Guardamos el nombre
        console.log("✅ Nombre del sector encontrado:", data.ticket.sectorNombre);
      } catch (error) {
        console.error("❌ Error al obtener sector:", error);
        data.ticket.sectorNombre = "Sector desconocido"; // 🚨 Fallback
      }
    } else {
      data.ticket.sectorNombre = "Sin sector"; // 🚨 Si el sector es vacío, no hacemos la petición
      console.log("⚠️ No hay sector en este ticket.");
    }

    setTicketData(data);

    // ✅ 🔥 Mostrar los datos del ticket en un SweetAlert
    Swal.fire({
      title: data.ticket.usado ? "🎟 Ticket Usado" : "Bienvenido",
      html: `
        <p><strong>Nombre:</strong> ${data.ticket.nombre || "No disponible"}</p>
        <p><strong>Email:</strong> ${data.ticket.email || "No disponible"}</p>
        <p><strong>Documento:</strong> ${data.ticket.documento || "No disponible"}</p>
        <p><strong>Tipo de Entrada:</strong> ${data.ticket.tipoEntrada || "No disponible"}</p>
        ${data.ticket.sector ? `<p><strong>Sector:</strong> ${data.ticket.sectorNombre}</p>` : ""}
        ${data.ticket.fila ? `<p><strong>Fila:</strong> ${data.ticket.fila}</p>` : ""}
        ${data.ticket.asiento ? `<p><strong>Asiento:</strong> ${data.ticket.asiento}</p>` : ""}
        ${data.ticket.usado ? `<p class="usado">⚠️ Este ticket ya fue usado</p>` : ""}
      `,
      icon: data.ticket.usado ? "warning" : "success",
      showCancelButton: !data.ticket.usado,
      confirmButtonText: data.ticket.usado ? "Cerrar" : "✅ Validar Acceso",
    }).then((result) => {
      if (result.isConfirmed) {
        validarAcceso();
      }
    });

  } catch (err) {
    console.error("❌ Error en la validación:", err.message);

    // ✅ Mostrar el error bien formateado en SweetAlert
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
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
    <main className="porteros">


      {/* 🔥 Mostrar información del evento */}
      {evento && (
        <div className="porteros__cont">
          <figure className="porteros__cont--bg">
            <img src={`${config.BACKEND_URL}/img/eventos/${evento.imagen}`} alt={evento.nombre} className="evento-img" />

           
            
            <div className="porteros__cont--bg--data">
              {evento.logoLugar && <img src={`${config.BACKEND_URL}/img/lugares/${evento.logoLugar}`} alt="Logo del Lugar" className="logo-lugar" />}
              <div className="porteros__cont--bg--data--info">
                <h3>{evento.nombre}</h3>
                <span>{new Date(evento.fecha).toLocaleDateString()} - {evento.hora}</span>
                <span> {evento.lugar}</span>
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
