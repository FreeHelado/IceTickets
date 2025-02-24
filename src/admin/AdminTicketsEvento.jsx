import config from "../config";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";
import AdminTools from "./AdminTools";

function AdminTicketsEvento() {
    const { idEvento } = useParams();
    const [tickets, setTickets] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState(""); // 🔍 Estado del buscador
    const [filtro, setFiltro] = useState("todos"); // ✅ Estado para toggle

    useEffect(() => {
        const cargarTickets = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(`${config.BACKEND_URL}/api/ordenes/evento/${idEvento}`, {
                    headers: { Authorization: token }
                });

                if (!response.ok) {
                    throw new Error("No autorizado o error en la carga");
                }

                const data = await response.json();

                // 📌 Extraer todos los tickets de todas las órdenes en un solo array
                const todosLosTickets = data.ordenes.flatMap(orden => orden.tickets.map(ticket => ({
                    ...ticket,
                    comprador: orden.comprador.nombre, // Guardamos el comprador para referencia
                    metodoPago: orden.metodoPago,
                    fechaCompra: orden.fechaCompra
                })));

                setTickets(todosLosTickets);
            } catch (error) {
                console.error("❌ Error al cargar tickets:", error);
                Swal.fire("Error", "No se pudieron cargar los tickets", "error");
            } finally {
                setCargando(false);
            }
        };

        cargarTickets();
    }, [idEvento]);

    
     // 🔍 Filtrar tickets según búsqueda y estado de usados/no usados
    const ticketsFiltrados = tickets.filter(ticket =>
        (ticket.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        ticket.documento?.toLowerCase().includes(busqueda.toLowerCase()) ||
        ticket.email.toLowerCase().includes(busqueda.toLowerCase())) &&
        (filtro === "todos" || (filtro === "usados" && ticket.usado) || (filtro === "no-usados" && !ticket.usado))
    );

    if (cargando) return <p>Cargando tickets...</p>;
    if (tickets.length === 0) return <p>No hay tickets registrados aún.</p>;

    return (
        <main className="adminPanel">
            <h2>Tickets para el Evento</h2>

            <div className="buscadorAdmin">
                {/* 🔍 Buscador */}
                <input
                    type="text"
                    placeholder="Buscar por nombre, documento, email o teléfono"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="buscador-input"
                />
            </div>

             {/* 🎟 Filtros de tickets */}
                <div className="filtrosTickets">
                    <button 
                        onClick={() => setFiltro("todos")} 
                        className={filtro === "todos" ? "activo" : ""}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => setFiltro("usados")} 
                        className={filtro === "usados" ? "activo" : ""}
                    >
                        Usados
                    </button>
                    <button 
                        onClick={() => setFiltro("no-usados")} 
                        className={filtro === "no-usados" ? "activo" : ""}
                    >
                        No Usados
                    </button>
                </div>

            <div className="ticketsEventos">
                {ticketsFiltrados.length === 0 ? (
                    <p>No se encontraron resultados</p>
                ) : (
                    ticketsFiltrados.map((ticket, index) => (
                        <div className="ticketsEventos__item" key={index}>
                            <div className="ticketsEventos__item--qr">
                                <QRCodeCanvas 
                                    value={ticket.idVerificador}
                                    size={150} 
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                                <small>{ticket.idVerificador}</small>
                            </div>
                            <div className="ticketsEventos__item--info">
                                <span>{ticket.nombre}</span>
                                <span>{ticket.email}</span>
                                <span>{ticket.telefono}</span>
                                <span>{ticket.documento}</span>
                                <span>{new Date(ticket.fechaCompra).toLocaleDateString()}</span> 
                            </div>
                            <div className="ticketsEventos__item--detalle"> 
                                <span>Fila {ticket.fila}/Asiento {ticket.asiento}</span>
                                <span>{ticket.tipoEntrada}</span>
                                <strong>${ticket.monto}</strong>
                            </div>

                            <div className={`tagUsado ${ticket.usado ? "usado" : ""}`}>
                                {ticket.usado ? "Ticket Usado" : "NO fue usado"}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="adminPanel__cont--zona3">
                <AdminTools />
            </div>
        </main>
    );
}

export default AdminTicketsEvento;
