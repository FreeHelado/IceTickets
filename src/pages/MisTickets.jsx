import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaTicketAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

function MisTickets() {
    const [tickets, setTickets] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarMisTickets = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch("http://localhost:5000/api/ordenes/mis-tickets", {
                    headers: { Authorization: token }
                });

                if (!response.ok) {
                    throw new Error("Error en la carga de tickets");
                }

                const data = await response.json();
                setTickets(data);
            } catch (error) {
                console.error("❌ Error al cargar tickets:", error);
                Swal.fire("Error", "No se pudieron cargar tus tickets", "error");
            } finally {
                setCargando(false);
            }
        };

        cargarMisTickets();
    }, []);

    if (cargando) return <p>Cargando tickets...</p>;
    if (tickets.length === 0) return <p>No tienes tickets adquiridos.</p>;

    return (
        <div className="misTickets">
            <h2>Mis Tickets</h2>
            <div className="ticketsContainer">
                {tickets.map((ticket, index) => (
                    <div key={index} className="ticketCard">
                        <h3><FaTicketAlt /> {ticket.evento.nombre}</h3>
                        <p><strong>Fecha:</strong> {new Date(ticket.evento.fecha).toLocaleDateString()}</p>
                        <p><strong>Lugar:</strong> {ticket.evento.lugar}</p>
                        <p><strong>Tipo Entrada:</strong> {ticket.tipoEntrada} /  {ticket.monto}</p>
                        
                        <hr />
                        <p><strong>Nombre:</strong> {ticket.nombre}</p>
                        <p><strong>Teléfono:</strong> {ticket.telefono}</p>
                        <p><strong>Email:</strong> {ticket.email}</p>
                        <p><strong>Documento:</strong> {ticket.documento}</p>
                        <p><strong>ID Verificador:</strong> {ticket.idVerificador}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MisTickets;
