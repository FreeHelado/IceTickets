import config from "../config";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaDownload, FaIceCream, FaWhatsapp } from "react-icons/fa6";

function MisTickets() {
    const [tickets, setTickets] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [loadingPDF, setLoadingPDF] = useState({}); // 🔥 Estado para el botón de carga
    const [sectores, setSectores] = useState({});




    useEffect(() => {
        const cargarTickets = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(`${config.BACKEND_URL}/api/ordenes/mis-tickets`, {
                    headers: { Authorization: token }
                });

                if (!response.ok) {
                    throw new Error("No autorizado o error en la carga");
                }

                const data = await response.json();
                setTickets(data);
            } catch (error) {
                console.error("❌ Error al cargar tickets:", error);
                Swal.fire("Error", "No se pudieron cargar los tickets", "error");
            } finally {
                setCargando(false);
            }
        };

        cargarTickets();
    }, []);

    useEffect(() => {
        const obtenerSectores = async () => {
            const nuevosSectores = {}; // Objeto para guardar los sectores obtenidos

            for (const ticket of tickets) {
                if (ticket.sector && !sectores[ticket.sector]) { // Si el sector no está ya en el estado
                    try {
                        const response = await fetch(`${config.BACKEND_URL}/api/eventos/${ticket.evento.id}/sectores/${ticket.sector}`);
                        if (!response.ok) throw new Error("No se pudo obtener el sector");

                        const data = await response.json();
                        nuevosSectores[ticket.sector] = data.nombre;
                    } catch (error) {
                        console.error("❌ Error al obtener sector:", error);
                        nuevosSectores[ticket.sector] = "Sector desconocido";
                    }
                }
            }

            // Actualizar estado solo si hay nuevos sectores
            setSectores(prev => ({ ...prev, ...nuevosSectores }));
        };

        if (tickets.length > 0) obtenerSectores();
        
        console.log("📌 Tickets cargados:", tickets);

    }, [tickets]);

    const convertImageToBase64 = async (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Evitar bloqueos CORS
            img.src = url;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };

            img.onerror = () => {
                console.error("❌ Error cargando imagen:", url);
                reject(null);
            };
        });
    };

    const downloadPDF = async (ticket) => {
        if (!ticket || !ticket._id) {
            console.error("❌ Error: Ticket no definido o sin ID", ticket);
            return;
        }

        setLoadingPDF(prev => ({ ...prev, [ticket._id]: true })); // 🔥 Activar carga en el botón

        const ticketElement = document.getElementById(`ticket-${ticket._id}`);
        if (!ticketElement) {
            console.error(`❌ No se encontró el ticket con ID: ${ticket._id}`);
            setLoadingPDF(prev => ({ ...prev, [ticket._id]: false }));
            return;
        }

        console.log(`📄 Generando PDF para el ticket ID: ${ticket._id}`);

        // 🔹 Convertir imágenes a Base64 antes de capturar el PDF
        const imgElements = ticketElement.querySelectorAll("img");
        for (let img of imgElements) {
            if (img.src.startsWith("http://localhost:5000")) {
                try {
                    img.src = await convertImageToBase64(img.src);
                } catch (error) {
                    console.error("⚠️ No se pudo convertir imagen:", img.src);
                }
            }
        }

        // 🖼️ Capturamos la card con las imágenes en Base64
        const canvas = await html2canvas(ticketElement, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        // 📄 Generamos el PDF con jsPDF
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const imgWidth = 180; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 15, 15, imgWidth, imgHeight);
        pdf.save(`ticket-${ticket._id}.pdf`);

        setLoadingPDF(prev => ({ ...prev, [ticket._id]: false })); // 🔥 Desactivar carga en el botón
    };

    const sendWhatsApp = async (ticket) => {
        if (!ticket || !ticket._id) {
            console.error("❌ Error: Ticket no definido o sin ID", ticket);
            return;
        }

        // URL donde se alojará el PDF (versión básica sin API)
        const pdfUrl = `${config.BACKEND_URL}/tickets/${ticket._id}.pdf`;

        // Mensaje con el enlace
        const message = encodeURIComponent(
            `¡Hola! Aquí tienes tu ticket para ${ticket.evento.nombre} 🎟️. 
            Descárgalo aquí: ${pdfUrl}`
        );

        // Número de WhatsApp (puede ser el que ingresó el usuario en la compra)
        const numeroWhatsApp = ticket.telefono; 

        // Abrir WhatsApp con el mensaje prellenado
        window.open(`https://wa.me/${numeroWhatsApp}?text=${message}`, "_blank");
    };


    if (cargando) return <p>Cargando tickets...</p>;
    if (tickets.length === 0) return <p>No tienes tickets aún.</p>;

    return (
        <main className="misTickets">
            <h2>Mis Tickets</h2>
            <div className="misTickets__cont">
                {tickets.map((ticket, index) => (
                    <div key={index} className="misTickets__cont--item">
                        {/* Contenedor del ticket para capturar en PDF */}
                        <div id={`ticket-${ticket._id}`} className="misTickets__cont--card">
                            <figure>
                                {ticket.evento.imagen && <img src={`${config.BACKEND_URL}/img/eventos/${ticket.evento.imagen}`} alt="Imagen del Evento" />}
                            </figure>

                            <div className="misTickets__cont--card--data">
                                <div className="misTickets__cont--card--data--header">
                                    <div className="QRTicket">
                                        <QRCodeCanvas 
                                            value={ticket.idVerificador}
                                            size={90} 
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                        />
                                    </div>
                                    <div className="misTickets__cont--card--data--header--evento">
                                        <h3>{ticket.evento.nombre}</h3>
                                        <h4>{new Date(ticket.evento.fecha).toLocaleDateString()} - {ticket.evento.hora}</h4>
                                    </div>
                                </div>
                                <div className="misTickets__cont--card--data--body">
                                    <div className="misTickets__cont--card--data--body--precio">
                                        <span>{ticket.tipoEntrada}</span>
                                        <h2> ${ticket.monto}</h2>
                                    </div>
                                    <div className="misTickets__cont--card--data--body--ficha">
                                    {ticket.sector && <span><strong>Sector:</strong> {sectores[ticket.sector] || "Cargando..."}</span>}

                                        {ticket.fila && <span><strong>Fila:</strong> {ticket.fila}</span>}
                                        {ticket.asiento && <span><strong>Asiento:</strong> {ticket.asiento}</span>}
                                    <span><strong>Nombre:</strong> {ticket.nombre}</span>
                                    <span><strong>Email:</strong> {ticket.email}</span>
                                    <span><strong>Teléfono:</strong> {ticket.telefono}</span>
                                    <span><strong>Documento:</strong> {ticket.documento}</span>
                                    </div>
                                </div>
                                <div className="misTickets__cont--card--data--footer">
                                    {ticket.evento.logo && <img src={`${config.BACKEND_URL}/img/lugares/${ticket.evento.logo}`} alt="Logo del lugar" />}
                                    <div className="misTickets__cont--card--data--footer--lugar">
                                        <strong>{ticket.evento.lugar}</strong>
                                        <span>{ticket.evento.direccion}, {ticket.evento.localidad}</span>
                                    </div>
                                </div>
                                <div className="misTickets__cont--card--data--firma">
                                    <i><FaIceCream /></i>
                                    <h1>IceTicket</h1>
                                    <small>{ticket.idVerificador}</small>
                                </div>
                            </div>
                        </div>

                        {/* ✅ Botón con spinner cuando se está generando el PDF */}
                        <button 
                            onClick={() => downloadPDF(ticket)} 
                            disabled={loadingPDF[ticket._id]}
                        >
                            {loadingPDF[ticket._id] ? (
                            <div className="spinner"></div>
                            ) : (
                                <>
                                    <i><FaDownload /></i>
                                    <span>Descargar Ticket</span>
                                </>
                            )}
                        </button>

                       


                        
                        
                    </div>
                ))}
            </div>
        </main>
    );
}

export default MisTickets;
