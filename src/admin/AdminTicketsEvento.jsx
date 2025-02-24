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
    const [busqueda, setBusqueda] = useState(""); // 🔍 Buscador
    const [filtro, setFiltro] = useState("todos"); // ✅ Estado de filtro: "todos", "usados", "no-usados"
    const [paginaActual, setPaginaActual] = useState(1);
    const ticketsPorPagina = 100; // 📌 Cantidad de tickets por página
    const [evento, setEvento] = useState(null); // ✅ Agregar esta línea antes de usar setEvento


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

                // 📌 Guardamos la info del evento en el estado
                setEvento({
                    nombre: data.evento.nombre,
                    fecha: data.evento.fecha,
                    lugar: data.evento.lugar,
                    imagen: data.evento.imagen, // 📷 Imagen del evento
                });


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

    // 📌 Contadores de tickets según estado
    const totalTickets = tickets.length;
    const totalUsados = tickets.filter(ticket => ticket.usado).length;
    const totalNoUsados = tickets.filter(ticket => !ticket.usado).length;

    // 🔍 Filtrar tickets según búsqueda y estado de usados/no usados
    const ticketsFiltrados = tickets.filter(ticket =>
        (ticket.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        ticket.documento?.toLowerCase().includes(busqueda.toLowerCase()) ||
        ticket.email.toLowerCase().includes(busqueda.toLowerCase())) &&
        (filtro === "todos" || (filtro === "usados" && ticket.usado) || (filtro === "no-usados" && !ticket.usado))
    );

    // 📌 Calcular los tickets a mostrar en la página actual
    const indiceInicio = (paginaActual - 1) * ticketsPorPagina;
    const indiceFin = indiceInicio + ticketsPorPagina;
    const ticketsPaginados = ticketsFiltrados.slice(indiceInicio, indiceFin);

    // 📌 Calcular el total de páginas
    const totalPaginas = Math.ceil(ticketsFiltrados.length / ticketsPorPagina);

    // 📌 Funciones para cambiar de página
    const paginaAnterior = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

    const paginaSiguiente = () => {
        if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
    };

    if (cargando) return <p>Cargando tickets...</p>;
    if (tickets.length === 0) return <p>No hay tickets registrados aún.</p>;

    return (
        <main className="adminPanel">
            <h2>Tickets para {evento.nombre}</h2>
            <h3>{new Date(evento.fecha).toLocaleDateString()} - {evento.lugar}</h3>
   
            <div className="buscadorAdmin">

            <input
                type="text"
                placeholder="Buscar por nombre, documento o email"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="buscador-input"
            />
            </div>

            
            <div className="filtrosTickets">
                <button 
                    onClick={() => setFiltro("todos")} 
                    className={filtro === "todos" ? "activo" : ""}
                >
                    Todos ({totalTickets})
                </button>
                <button 
                    onClick={() => setFiltro("usados")} 
                    className={filtro === "usados" ? "activo" : ""}
                >
                    Usados ({totalUsados})
                </button>
                <button 
                    onClick={() => setFiltro("no-usados")} 
                    className={filtro === "no-usados" ? "activo" : ""}
                >
                    No Usados ({totalNoUsados})
                </button>
            </div>
            
            <div className="ticketsEventos">
                {ticketsPaginados.length === 0 ? (
                    <p>No se encontraron resultados</p>
                ) : (
                    ticketsPaginados.map((ticket, index) => (
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

            {/* 🔹 Paginación */}
            <div className="paginacion">
                <button onClick={paginaAnterior} disabled={paginaActual === 1}>
                    ⬅ Anterior
                </button>
                <span>Página {paginaActual} de {totalPaginas}</span>
                <button onClick={paginaSiguiente} disabled={paginaActual === totalPaginas}>
                    Siguiente ➡
                </button>
            </div>

            <div className="adminPanel__cont--zona3">
                <AdminTools />
            </div>
        </main>
    );
}

export default AdminTicketsEvento;
