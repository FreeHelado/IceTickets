import config from "../config";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaRegCalendarPlus, FaRegCalendarCheck, FaIceCream, FaRegEye, FaRegPenToSquare, FaRegTrashCan, FaChartLine, FaMoneyBill1Wave, FaTicketSimple, FaFire } from "react-icons/fa6";
import AdminTicketsEvento from "./AdminTicketsEvento";
import Swal from "sweetalert2";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es"; // Para formato en español
import AdminTools from "./AdminTools";

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
        <main className="adminPanel">
            <nav className="ventasNav">
                <Link to={`/evento/${idEvento}`} target="_blank" rel="noopener noreferrer">
                    <i><FaRegEye /></i>
                    <span>Ir al Evento</span>
                </Link>
                <Link to={`/admin/evento/editar/${idEvento}`}>
                    <i><FaRegPenToSquare /></i>
                    <span>Editar Evento</span>
                </Link>
                <Link to={`/admin/`}>
                    <i><FaFire /></i>
                    <span>Volver al admin</span>
                </Link>
            </nav>
            <section className="ventas">

                
                <div className="ventas__stats">
                    <div className="ventas__stats--evento">
                        <figure>
                            <img src={`${config.BACKEND_URL}/img/eventos/${evento.imagen}`} alt={`Imagen de ${evento.nombre}`} />
                        </figure>

                        <div className="ventas__stats--evento--data">
                            <h1>{evento.nombre}</h1>
                            <h2> {evento.fecha ? format(parseISO(evento.fecha), "dd 'de' MMMM yyyy", { locale: esLocale }) : "Fecha no disponible"}</h2>
                        </div>
                    </div>
                    
                    <div className="ventas__stats--aforo">
                        
                        <div className="ventas__stats--aforo--vendidas">
                            <div className="progress" style={{ width: `${porcentajeVendidas}%` }} ></div>
                            <div className="progress-text">
                                <span>Entradas vendidas:</span>
                                <strong>{evento.stock.vendidas}/{evento.stock.aforo}</strong>
                            </div>
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
                                            style={{ width: `${porcentaje}%` }} // 🔥 Ajustamos el ancho según el porcentaje
                                        ></div>
                                    </div>
                                    <div className="ticketData">
                                        <strong>{tipo}: ({cantidadVendida}/{cantidadDisponible})</strong> 
                                    </div>
                                </li>
                            );
                        })}
                            
                        </ul>
                        
                    </div>  
                    
                </div>

                <div className="ventas__lista">
                    {/* 📝 LISTADO DE ÓRDENES */}
                    <h3>Lista de Órdenes</h3>
                    {ordenes.length > 0 ? (
                        <ul className="ventas__lista--tabla">
                            <li>
                                <div className="comprador">
                                    <strong>Comprador</strong>
                                </div>
                                
                                <strong>Pago</strong>
                                <strong>Estado</strong>
                                <strong>Fecha Compra</strong>
                                <div className="total">
                                    <strong>Total</strong>
                                </div>
                            </li>
                       
                        
                            {ordenes.map(orden => (
                            <li key={orden._id}>
                                <div className="comprador">
                                    <span>{orden.comprador.nombre}</span>
                                    <span>{orden.comprador.email}</span>
                                    <span>{orden.comprador.telefono}</span>
                                </div>    
                                <span>{orden.metodoPago}</span>
                                <span>{orden.estado}</span>
                                    <span>{new Date(orden.fechaCompra).toLocaleDateString()}</span>
                                    <div className="total">
                                        <div className="xTicket">
                                            <i><FaTicketSimple /></i>
                                            <span>x{orden.tickets.length}</span>
                                        </div>
                                        <span>${orden.total}</span>
                                    </div>
                            </li>
                            ))}
                            <li className="recaudado">
                                <i><FaMoneyBill1Wave /></i>
                                <span>Recaudado</span>
                                <strong>${resumen.totalRecaudado}</strong> 
                                
                            </li>
                        </ul>
                        
                    ) : (
                        <p>No hay órdenes registradas aún.</p>
                    )}

                    <div className="ventas__lista--tools">
                    <Link to={`/admin/evento/${idEvento}/tickets`}>
                        <i><FaRegEye /></i>
                        <span>Ver Tickets</span>
                    </Link>
                    </div>

                </div>


            </section>
        
<div className="adminPanel__cont--zona3">
          <AdminTools />
        </div>

        </main>
    );
}

export default AdminOrdenesEvento;
