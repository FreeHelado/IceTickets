import config from "../config";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaRegCalendarPlus, FaRegCalendarCheck, FaIceCream, FaRegEye, FaRegPenToSquare, FaRegTrashCan, FaChartLine } from "react-icons/fa6";
import AdminTicketsEvento from "./AdminTicketsEvento";
import Swal from "sweetalert2";

function AdminOrdenesEvento() {
    const { idEvento } = useParams();
    const [evento, setEvento] = useState(null);
    const [ordenes, setOrdenes] = useState([]);
    const [resumen, setResumen] = useState({ ticketsPorTipo: {}, totalRecaudado: 0 });
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarOrdenes = async () => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${config.BACKEND_URL}/api/ordenes/evento/${idEvento}`, {
                headers: { Authorization: token }
            });

            if (!response.ok) {
                throw new Error("No autorizado o error en la carga");
            }

            const data = await response.json();
            setEvento(data.evento);
            setOrdenes(data.ordenes);

             // 📊 Procesamos los datos para obtener el resumen
            const resumenData = data.ordenes.reduce(
            (acc, orden) => {
                orden.tickets.forEach((ticket) => {
                    const { tipoEntrada, monto } = ticket;

                    // 🔥 Contamos cuántos tickets hay por tipo
                    acc.ticketsPorTipo[tipoEntrada] = (acc.ticketsPorTipo[tipoEntrada] || 0) + 1;

                    // 💰 Sumamos el monto total recaudado
                    acc.totalRecaudado += monto;
                });
                return acc;
            },
            { ticketsPorTipo: {}, totalRecaudado: 0 }
            );

            setResumen(resumenData);

        } catch (error) {
            console.error("❌ Error al cargar órdenes:", error);
            Swal.fire("Error", "No se pudieron cargar las órdenes", "error");
        } finally {
            setCargando(false);
        }
    };
    cargarOrdenes();
    }, [idEvento]);

    const porcentajeVendidas = evento?.stock?.aforo > 0 
    ? Math.round((evento.stock.vendidas / evento.stock.aforo) * 100) 
    : 0; 
    
    



    if (cargando) return <p>Cargando órdenes...</p>;
    if (!evento) return <p>Error al cargar evento.</p>;

    return (
        <div className="adminPanel">
            <nav className="ventasNav">
                <Link to={`/evento/${evento._id}`} target="_blank" rel="noopener noreferrer">
                    <i><FaRegEye /></i>
                    <span>Ir al Evento</span>
                </Link>
                <Link to={`/admin/evento/editar/${evento._id}`}>
                    <i><FaRegPenToSquare /></i>
                    <span>Editar Evento</span>
                </Link>
                <Link to={`/admin/`}>
                    <i><FaRegPenToSquare /></i>
                    <span>Volver</span>
                </Link>
            </nav>
            <section className="ventas">

                <div className="ventas__stats">   
                    <h1>{evento.nombre}</h1>
                    
                    <div className="ventas__stats--aforo">
                        
                        <div className="ventas__stats--aforo--vendidas">
                            <div className="progress" style={{ width: `${porcentajeVendidas}%` }} ></div>
                            <span>Entradas vendidas:</span>
                            <strong>{evento.stock.vendidas}/{evento.stock.aforo}</strong>
                        </div>   
                        <div className="alert">
                            El aforo: Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cum tempora vel id officia sit commodi similique pariatur placeat nesciunt nam.
                        </div>
                    </div>

                    <div className="ventas__stats--tickets">
                        <h3>Resumen por Ticket</h3>
                        <ul>
                        {Object.entries(resumen.ticketsPorTipo).map(([tipo, cantidadVendida]) => {
                            // ✅ Buscar en `evento.precios` cuántos tickets había disponibles en total
                            const precioData = evento.precios.find(p => p.nombre === tipo);
                            const cantidadDisponible = precioData ? precioData.disponibles + cantidadVendida : 0;

                            // ✅ Calcular porcentaje de vendidos
                            const porcentaje = cantidadDisponible > 0 ? ((cantidadVendida / cantidadDisponible) * 100).toFixed(2) : 0;

                            return (
                                <li key={tipo}>
                                    <div className="progress">
                                        <div 
                                            className="progressVendidas" 
                                            style={{ height: `${porcentaje}%` }} // 🔥 Ajustamos el ancho según el porcentaje
                                        ></div>
                                    </div>
                                    <strong>{tipo}:</strong> 
                                    <span>{cantidadVendida}/{cantidadDisponible}</span>
                                </li>
                            );
                        })}
                            
                        </ul>
                        
                    </div>                   
                    <p><strong>Total recaudado:</strong> ${resumen.totalRecaudado}</p>
                </div>

                <div className="ventas__lista">
                    {/* 📝 LISTADO DE ÓRDENES */}
                    <h3>Lista de Órdenes</h3>
                    {ordenes.length > 0 ? (
                        <table className="tablaOrdenes">
                        <thead>
                            <tr>
                            <th>Comprador</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Total</th>
                            <th>Cantidad Tickets</th> {/* 🆕 Nueva columna */}
                            <th>Método de Pago</th>
                            <th>Estado</th>
                            <th>Fecha Compra</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenes.map(orden => (
                            <tr key={orden._id}>
                                <td>{orden.comprador.nombre}</td>
                                <td>{orden.comprador.email}</td>
                                <td>{orden.comprador.telefono}</td>
                                <td>${orden.total}</td>
                                <td>x {orden.tickets.length}</td> {/* ✅ Nueva celda: cantidad de tickets comprados */}
                                <td>{orden.metodoPago}</td>
                                <td>{orden.estado}</td>
                                <td>{new Date(orden.fechaCompra).toLocaleDateString()}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    ) : (
                        <p>No hay órdenes registradas aún.</p>
                    )}

                    <Link to={`/admin/evento/${idEvento}/tickets`}>
                        <i><FaRegEye /></i>
                        <span>Ver Tickets</span>
                    </Link>

                </div>


            </section>
        


    </div>
    );
}

export default AdminOrdenesEvento;
