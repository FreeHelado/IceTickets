import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";

function AdminTicketsEvento() {
    const { idEvento } = useParams();
    const [tickets, setTickets] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarTickets = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(`http://localhost:5000/api/ordenes/evento/${idEvento}`, {
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

    if (cargando) return <p>Cargando tickets...</p>;
    if (tickets.length === 0) return <p>No hay tickets registrados aún.</p>;

    return (
        <div className="adminPanel">
            <h2>Tickets para el Evento</h2>

            <table className="tablaTickets">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Tipo Entrada</th>
                        <th>Monto</th>
                        <th>ID Verificador</th>
                        <th>Comprador</th>
                        <th>Método de Pago</th>
                        <th>Fecha de Compra</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map((ticket, index) => (
                        <tr key={index}>
                            <td>{ticket.nombre}</td>
                            <td>{ticket.email}</td>
                            <td>{ticket.telefono}</td>
                            <td>{ticket.tipoEntrada}</td>
                            <td>${ticket.monto}</td>
                            <td>{ticket.idVerificador}</td>
                            <QRCodeCanvas 
                                value={ticket.idVerificador}
                                size={150} 
                                bgColor="#ffffff"
                                fgColor="#000000"
                                />
                            <td>{ticket.comprador}</td>
                            <td>{ticket.metodoPago}</td>
                            <td>{new Date(ticket.fechaCompra).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminTicketsEvento;
