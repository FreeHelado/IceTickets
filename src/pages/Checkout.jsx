import config from "../config";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function Checkout({ usuario }) {
    const { state } = useLocation();
    const carritoGuardado = JSON.parse(localStorage.getItem("carrito") || "[]");

    


    // ✅ Evita la doble declaración, reasignando si state no tiene carrito
    const carrito = state?.carrito ?? carritoGuardado;

    // 🛒 Extraer datos del usuario logueado
    // Aseguramos que el usuario logueado sea el comprador
    const comprador = usuario || { nombre: "", email: "", telefono: "" };

    // 🔥 Extraemos el evento directamente desde el carrito
    const evento = carrito.length > 0 ? carrito[0].evento : JSON.parse(localStorage.getItem("evento") || "{}");

    const logoLugar = evento.logoLugar || ""; // ✅ Extrae el logo del lugar


    // 📅 Formatear fecha
    const fechaFormateada = evento?.fecha 
    ? format(new Date(evento.fecha), "EEEE d 'de' MMMM yyyy", { locale: esLocale }) 
    : "";


    // ✅ Manejo seguro de lugar y dirección
    const lugar = evento?.lugar || "Lugar no disponible";
    const direccion = evento?.direccion || "Dirección no disponible";


    const [formularios, setFormularios] = useState(
        carrito.flatMap(item => 
            Array(item.cantidad).fill().map(() => ({
                nombre: "",
                email: "",
                telefono: "",
                documento: "",
                tipoEntrada: item.nombre,
                idPrecio: item.idPrecio, // ❌ Si no está en el carrito, llega undefined
                monto: item.monto
            }))
        )
    );

    const [ticketUsuario, setTicketUsuario] = useState(null); // Guardará el índice del ticket con los datos del comprador

    //  Manejar cambios en los formularios
    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        setFormularios(prev => prev.map((form, i) => 
            i === index ? { ...form, [name]: value } : form
        ));
    };

    // 🚀 Manejo del checkbox "Es para mí"
    const handleEsParaMi = (index) => {
        setFormularios(prev => prev.map((form, i) => 
            i === index 
                ? { ...form, nombre: comprador.nombre, email: comprador.email, telefono: comprador.telefono }
                : (i === ticketUsuario ? { ...form, nombre: "", email: "", telefono: "" } : form) // Limpia el anterior
        ));
        setTicketUsuario(index);
    };


    /// POST de la compra
    const navigate = useNavigate();

    const confirmarCompra = async () => {
        try {
            const token = localStorage.getItem("token"); // 📌 Obtener token del usuario logueado
            if (!token) {
                Swal.fire({ title: "Error", text: "Usuario no autenticado", icon: "error" });
                return;
            }
            
            const orden = {
                comprador: {
                    nombre: comprador.nombre,
                    email: comprador.email,
                    telefono: comprador.telefono,
                },
                evento: {
                    id: evento.id || evento._id, // 🛠️ Asegurar que haya un ID
                    nombre: evento.nombre,
                    fecha: evento.fecha,
                    hora: evento.hora,
                    lugar: evento.lugar,
                    imagen: evento.imagen,
                    direccion: evento.direccion
                },
                tickets: formularios.map(ticket => ({
                    nombre: ticket.nombre,
                    email: ticket.email,
                    telefono: ticket.telefono,
                    documento: ticket.documento,
                    tipoEntrada: ticket.tipoEntrada,
                    idPrecio: ticket.idPrecio, // 🔥 Ahora enviamos el _id del precio también
                    monto: ticket.monto,
                    idVerificador: Math.random().toString(36).substr(2, 9) // 🔥 Código único
                })),
                total: carrito.reduce((acc, item) => acc + item.subtotal, 0),
                metodoPago: "Tarjeta",
            };


            const response = await fetch(`${config.BACKEND_URL}/api/ordenes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token, // 🔥 Mandar token en el header
                },
                body: JSON.stringify(orden),
            });

            const data = await response.json();

            if (response.ok) {
                // ✅ Borrar carrito del localStorage cuando la compra sea exitosa
                localStorage.removeItem("carrito");
                await Swal.fire({
                    title: "Éxito",
                    text: "Compra realizada",
                    icon: "success",
                    confirmButtonText: "Aceptar"
                });

                navigate("/"); // ✅ Redirige a la home después de aceptar
            } else {
                Swal.fire({ title: "Error", text: data.message || "Hubo un error", icon: "error" });
            }
        } catch (error) {
            console.error("Error en la compra:", error);
            Swal.fire({ title: "Error", text: "No se pudo procesar la compra", icon: "error" });
        }
    };





    useEffect(() => {
        // 🔹 Guardar en localStorage para persistencia
        if (evento) localStorage.setItem("evento", JSON.stringify(evento));
        if (carrito.length > 0) localStorage.setItem("carrito", JSON.stringify(carrito));
    }, [evento, carrito]);

    if (!evento || !evento.nombre) {
        return <h2>No hay evento seleccionado</h2>;
    }


    console.log("Evento en Checkout:", evento);


    return (
        <main className="checkout">
            <h1>Confirmar Compra</h1>
            <div className="checkout__user">
                <h2>Tus datos:</h2>
                <h3>{comprador.nombre}</h3>
                <h4>{comprador.email} / {comprador.telefono}</h4>
                <div className="alert help">
                    Tu compra se enviará con este nombre en la factura. Si tienes más de una entrada deberás completar los datos de cada tickets con el usuario que asistirá al evento cada uno de ellos.
                </div>
            </div>
            
            <div className="checkout__evento">
                
                <figure>
                    <img src={`${config.BACKEND_URL}/img/eventos/${evento.imagen}`} alt={evento.nombre} className="checkout-img" />
                </figure>
                <div className="checkout__evento--data">
                    
                    <div className="checkout__evento--data--evento">
                    <h3>{evento.nombre}</h3>
                    <h4>{fechaFormateada} - {evento.hora}</h4>
                    <h4>{lugar} - {direccion}</h4>
                    {logoLugar && (
                        <img src={`${config.BACKEND_URL}/img/lugares/${logoLugar}`} alt={lugar} className="lugar-logo" />
                    )}
                    </div>

                    <div className="checkout__evento--data--precios">
                        <h3>Tickets:</h3>
                            <ul>
                                {carrito.map((item, index) => (
                                    <li key={index}>{item.cantidad}x {item.nombre} - ${item.subtotal}</li>
                                ))}
                            </ul>
                    </div>

                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); confirmarCompra(); }}>
                
                
                <div className="pasoCheckOut">
                    <div className="pasoCheckOut__tit">
                        <span>1</span>
                        <h2>Datos de los asistentes</h2>
                    </div>
                    <div className="alert">
                        Completá los datos de cada ticket con su correspondiente asistente. Ten en cuenta que en algunos eventos pueden solicitarte información en su entrada.
                    </div>
                    <div className="entradasForm">
                        {formularios.map((form, index) => (
                            <div key={index} className="entradasForm__item">

                                <div className="entradasForm__item--header">
                                    <h4>{form.tipoEntrada}</h4>
                                    <h3>${form.monto}</h3>

                                    <div className="esParaMi">
                                        <input 
                                            type="checkbox" 
                                            id={`esParaMi-${index}`} 
                                            checked={ticketUsuario === index} 
                                            onChange={() => handleEsParaMi(index)} 
                                        />
                                        <label htmlFor={`esParaMi-${index}`}>Es para mí</label>
                                    </div>
                                </div>

                                <div className="entradasForm__item--campo">
                                    <label htmlFor="nombre">Nombre</label>
                                    <input type="text" name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={(e) => handleInputChange(index, e)} required />
                                </div>
                                <div className="entradasForm__item--campo"> 
                                    <label htmlFor="email">Email</label>
                                    <input type="email" name="email" placeholder="Email" value={form.email} onChange={(e) => handleInputChange(index, e)} required />
                                </div>
                                <div className="entradasForm__item--campo"> 
                                    <label htmlFor="telefono">Teléfono:</label>
                                    <input type="tel" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={(e) => handleInputChange(index, e)} required />
                                </div>
                                <div className="entradasForm__item--campo"> 
                                    <label htmlFor="documento">Documento</label>
                                    <input type="text" name="documento" placeholder="Documento de Identidad" value={form.documento} onChange={(e) => handleInputChange(index, e)} required />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pasoCheckOut">
                    <div className="pasoCheckOut__tit">
                        <span>2</span>
                        <h2>Forma de pago</h2>
                    </div>
                    <div className="mediosDePagos">
                    <h4>Selecciona el medio de pago</h4>
                    <div className="grupo-check">
                        <div className="item-check">
                            <input type="radio" name="pago" id="pago01"/>
                            <label htmlFor="pago01">
                                <img src="/img/pagos/tj_Oca.png" alt="" />
                                <span>Tarjeta de Crédito</span>
                            </label>
                        </div>
                        <div className="item-check">
                            <input type="radio" name="pago" id="pago02"/>
                            <label htmlFor="pago02">
                                <img src="/img/pagos/tj_Oca.png" alt="" />
                                <span>Tarjeta de Crédito</span>
                            </label>
                        </div>
                        <div className="item-check">
                            <input type="radio" name="pago" id="pago03"/>
                            <label htmlFor="pago03">
                                <img src="/img/pagos/tj_Oca.png" alt="" />
                                <span>Tarjeta de Crédito</span>
                            </label>
                        </div>
                    </div>
                    </div>
                </div>

                <button type="submit">
                    <span>Confirmar Compra</span>
                    <strong>${carrito.reduce((acc, item) => acc + item.subtotal, 0)}</strong>
                </button>

            </form>
        </main>
    );
}

export default Checkout;
