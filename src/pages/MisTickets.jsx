import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaTicketAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

function MisTickets() {
    const [tickets, setTickets] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarTickets = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(`http://localhost:5000/api/ordenes/mis-tickets`, {
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

    if (cargando) return <p>Cargando tickets...</p>;
    if (tickets.length === 0) return <p>No tienes tickets aún.</p>;

    return (
        <div className="misTickets">
            <h2>Mis Tickets</h2>
            <div className="ticketsGrid">
                {tickets.map((ticket, index) => (
                    <div key={index} className="ticketCard">
                        <figure>
                            {ticket.evento.imagen && <img src={`http://localhost:5000/img/eventos/${ticket.evento.imagen}`} alt="Imagen del Evento" />}
                        </figure>
                        <div className="ticketHeader">
                            {ticket.evento.logo && <img src={`http://localhost:5000/img/lugares/${ticket.evento.logo}`} alt="Logo del lugar" />}
                            <h3>{ticket.evento.nombre}</h3>
                            <p>{new Date(ticket.evento.fecha).toLocaleDateString()} - {ticket.evento.hora}</p>
                        </div>
                        <div className="ticketBody">
                            <p><strong>Lugar:</strong> {ticket.evento.lugar}</p>
                            <p><strong>Dirección:</strong> {ticket.evento.direccion}, {ticket.evento.localidad}</p>
                            <p><strong>Tipo de Entrada:</strong> {ticket.tipoEntrada}</p>
                            <p><strong>Precio:</strong> ${ticket.monto}</p>
                        </div>
                        <div className="ticketFooter">
                            <p><strong>ID Verificador:</strong> {ticket.idVerificador}</p>
                            <p><strong>Nombre:</strong> {ticket.nombre}</p>
                            <p><strong>Email:</strong> {ticket.email}</p>
                            <p><strong>Email:</strong> {ticket.telefono}</p>
                            <p><strong>Email:</strong> {ticket.documento}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MisTickets;

