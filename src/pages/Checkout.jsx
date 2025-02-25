import config from "../config";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import esLocale from "date-fns/locale/es";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { MdOutlineEventSeat } from "react-icons/md";

function Checkout({ usuario }) {
    const { state } = useLocation();
    const carritoGuardado = JSON.parse(localStorage.getItem("carrito") || "[]");
    const carrito = state?.carrito ?? carritoGuardado;
    const comprador = usuario || { nombre: "", email: "", telefono: "" };
    const evento = carrito.length > 0 ? carrito[0].evento : JSON.parse(localStorage.getItem("evento") || "{}");
    const logoLugar = evento.logoLugar || ""; // ✅ Extrae el logo del lugar
    const fechaFormateada = evento?.fecha 
        ? format(new Date(evento.fecha), "EEEE d 'de' MMMM yyyy", { locale: esLocale }) 
        : "";
    const lugar = evento?.lugar || "Lugar no disponible";
    const direccion = evento?.direccion || "Dirección no disponible";
    const navigate = useNavigate();
    
    const [formularios, setFormularios] = useState(
        carrito.flatMap(item => 
            Array(item.cantidad).fill().map(() => ({
                nombre: "",
                email: "",
                telefono: "",
                documento: "",
                tipoEntrada: item.nombre,
                idPrecio: item.idPrecio,
                monto: item.monto,
                sector: item.sector || "",
                fila: "",
                asiento: ""
            }))
        )
    );
    const [ticketUsuario, setTicketUsuario] = useState(null);
    const [filasPorSector, setFilasPorSector] = useState({});
    const [modalOpen, setModalOpen] = useState(null);
    const [asientos, setAsientos] = useState([]);
    const [sectores, setSectores] = useState([]);
    const [mapaImagen, setMapaImagen] = useState(null);
    const [asientosDelSector, setAsientosDelSector] = useState([]);
    const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);


    
    useEffect(() => {
        carrito.forEach(item => {
            if (item.sector) {
                obtenerFilasPorSector(evento.id, item.sector);
            }
        }); 
    }, [carrito, evento.id]);
    
    const obtenerFilasPorSector = async (eventoId, sectorId) => {
        if (!sectorId) return;
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/eventos/${eventoId}/sectores`);
            if (!response.ok) throw new Error(`Error ${response.status}: No se encontró el sector`);
            const sectores = await response.json();

            // 🔥 Buscar el sector específico por su ID
            const sectorEncontrado = sectores.find(s => s._id === sectorId);
            
            if (sectorEncontrado) {
                const filasDisponibles = sectorEncontrado.filas.filter(fila => fila.disponible); // 🔥 Filtramos solo filas disponibles

                console.log(`📌 Filas disponibles para sector ${sectorId}:`, filasDisponibles);

                setFilasPorSector(prev => ({
                    ...prev,
                    [sectorId]: filasDisponibles || [] // 🔥 Guardamos solo las filas habilitadas
                }));
            } else {
                console.warn(`⚠️ No se encontró el sector con ID ${sectorId}`);
            }
        } catch (error) {
            console.error(`❌ Error al obtener filas del sector ${sectorId}:`, error);
        }
    };

    useEffect(() => {
    console.log("📌 Estado actualizado de asientos:", asientos);
}, [asientos]);



    useEffect(() => {
        const obtenerSectores = async () => {
            try {
                const response = await fetch(`${config.BACKEND_URL}/api/eventos/${evento.id}/sectores`);
                if (!response.ok) throw new Error("Error obteniendo sectores");
                const data = await response.json();
                
                console.log("📌 Sectores obtenidos:", data); // 🔥 Verifica que llega data
                
                setSectores(data); // ✅ Guardamos los sectores en el estado
            } catch (error) {
                console.error("❌ Error obteniendo sectores:", error);
            }
        };

        if (evento.id) obtenerSectores();
    }, [evento.id]);


    useEffect(() => {
        const obtenerMapaLugar = async () => {
        try {
        const eventoId = JSON.parse(localStorage.getItem("evento"))?.id;

        if (!eventoId) {
            console.error("❌ No hay ID de evento en el storage");
            return;
        }

        // 🔍 1️⃣ Buscar el evento en la base de datos
        const responseEvento = await fetch(`${config.BACKEND_URL}/api/eventos/${eventoId}`);
        if (!responseEvento.ok) throw new Error("Error obteniendo el evento");
        const eventoData = await responseEvento.json();
        const lugarId = eventoData.lugar;

        if (!lugarId) {
            console.error("❌ El evento no tiene un lugar asignado.");
            return;
        }

        // 🔍 2️⃣ Buscar el lugar en la base de datos para obtener la imagen del mapa
        const responseLugar = await fetch(`${config.BACKEND_URL}/api/lugares/${lugarId}`);
        if (!responseLugar.ok) throw new Error("Error obteniendo el lugar");
        const lugarData = await responseLugar.json();

        if (!lugarData.mapaImagen) {
            console.warn("⚠️ El lugar no tiene una imagen de mapa.");
            return;
        }

        // ✅ Guardamos la URL de la imagen
        setMapaImagen(`${config.BACKEND_URL}/img/lugares/${lugarData.mapaImagen}`);
        
        } catch (error) {
        console.error("❌ Error obteniendo el mapa del lugar:", error);
        }
    };

    obtenerMapaLugar();
    }, []);

    useEffect(() => {
        if (modalOpen !== null && sectores.length > 0) {
            const sectorId = formularios[modalOpen]?.sector;
            if (sectorId) {
                const nuevosAsientos = obtenerAsientosDelSector(sectorId);
                setAsientos(nuevosAsientos);
                console.log("📌 Asientos cargados al abrir el modal:", nuevosAsientos);
            }
        }
    }, [modalOpen, sectores]); // ✅ Se ejecuta cuando `modalOpen` o `sectores` cambia.




    const handleFilaChange = (index, e) => {
        const { value } = e.target;
        setFormularios(prev => prev.map((form, i) =>
            i === index ? { ...form, fila: value, asiento: "" } : form
        ));
    };
    
    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        setFormularios(prev => prev.map((form, i) => 
            i === index ? { ...form, [name]: value } : form
        ));
    };

    const handleEsParaMi = (index) => {
        setFormularios(prev => prev.map((form, i) => 
            i === index 
                ? { ...form, nombre: comprador.nombre, email: comprador.email, telefono: comprador.telefono }
                : (i === ticketUsuario ? { ...form, nombre: "", email: "", telefono: "" } : form)
        ));
        setTicketUsuario(index);
    };


    const obtenerAsientosDelSector = (sectorId) => {
        if (!sectores || sectores.length === 0) {
            console.warn("⚠️ Sectores aún no están cargados");
            return [];
        }

        const sectorEncontrado = sectores.find(s => s._id === sectorId);

        if (!sectorEncontrado) {
            console.warn(`⚠️ No se encontró el sector con ID: ${sectorId}`);
            return [];
        }

        const asientosTotales = sectorEncontrado.filas.flatMap(fila =>
            fila.asientos.map(asiento => ({
                ...asiento,
                seleccionado: false // 🔥 Agregamos la propiedad desde el principio
            }))
        );

        console.log(`📌 Asientos obtenidos para el sector ${sectorId}:`, asientosTotales);

        return asientosTotales; 
    };


    const handleClickEnMapa = (asiento) => {
    if (!asiento || asiento.ocupado) return; // 🔴 Bloqueamos los ocupados

    console.log("🪑 Asiento seleccionado correctamente:", asiento);

    // 🔥 Buscar la fila a la que pertenece el asiento
    const filaEncontrada = sectores
        .flatMap(sector => sector.filas) // 🔥 Tomamos todas las filas de todos los sectores
        .find(fila => fila.asientos.some(a => a._id === asiento._id)); // 🔥 Buscamos la fila del asiento

    if (!filaEncontrada) {
        console.warn("⚠️ No se encontró la fila del asiento seleccionado.");
        return;
    }

    console.log("📌 Fila encontrada:", filaEncontrada.nombreFila);

    // 🔥 Actualizamos el estado de TODOS los asientos para reflejar la selección
    setAsientos(prevAsientos =>
        prevAsientos.map(a => ({
            ...a,
            seleccionado: a._id === asiento._id, // ✅ Solo este asiento se marca como seleccionado
        }))
    );

    setAsientoSeleccionado(asiento); // ✅ Guardamos el asiento seleccionado

    // 🔥 Actualizamos el formulario correspondiente con el asiento y su fila
    setFormularios(prev =>
        prev.map((form, i) =>
            i === modalOpen
                ? { ...form, fila: filaEncontrada.nombreFila, asiento: asiento.nombreAsiento }
                : form
        )
    );

    // 🔥 FORZAMOS UN RE-RENDER en React
    setAsientos(prevAsientos => [...prevAsientos]); // 💥 Esto obliga a React a redibujar
};


const handleConfirmarAsiento = () => {
    if (!asientoSeleccionado) {
        Swal.fire("Error", "Selecciona un asiento antes de confirmar", "error");
        return;
    }

    console.log("✅ Asiento confirmado:", asientoSeleccionado);

    // 🔥 Cerramos el modal
    setModalOpen(null);
};






    const confirmarCompra = async () => {
        // Verificar si algún asiento seleccionado ya está ocupado o se eligió más de una vez en el mismo checkout
        const asientosSeleccionados = new Set();
        const asientosDuplicados = formularios.some(ticket => {
            const key = `${ticket.sector}-${ticket.fila}-${ticket.asiento}`;
            if (asientosSeleccionados.has(key)) return true;
            asientosSeleccionados.add(key);
            return false;
        });

        if (asientosDuplicados) {
            Swal.fire({ title: "Error", text: "No puedes seleccionar el mismo asiento para más de un ticket.", icon: "error" });
            return;
        }

        const orden = {
            comprador: {
                nombre: comprador.nombre,
                email: comprador.email,
                telefono: comprador.telefono,
            },
            evento: {
                id: evento.id || evento._id,
                nombre: evento.nombre,
                fecha: evento.fecha,
                hora: evento.hora,
                lugar: evento.lugar,
                direccion: evento.direccion
            },
            tickets: formularios.map(ticket => ({
                nombre: ticket.nombre,
                email: ticket.email,
                telefono: ticket.telefono,
                documento: ticket.documento,
                tipoEntrada: ticket.tipoEntrada,
                idPrecio: ticket.idPrecio,
                monto: ticket.monto,
                idVerificador: Math.random().toString(36).substr(2, 9),
                sector: ticket.sector,
                fila: ticket.fila,
                asiento: ticket.asiento
            })),
            total: carrito.reduce((acc, item) => acc + item.subtotal, 0),
            metodoPago: "Tarjeta",
        };

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                Swal.fire({ title: "Error", text: "Usuario no autenticado", icon: "error" });
                return;
            }
            
            const response = await fetch(`${config.BACKEND_URL}/api/ordenes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify(orden),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.removeItem("carrito");
                await Swal.fire({
                    title: "Éxito",
                    text: "Compra realizada",
                    icon: "success",
                    confirmButtonText: "Aceptar"
                });
                navigate("/");
            } else {
                Swal.fire({ title: "Error", text: data.message || "Hubo un error", icon: "error" });
            }
        } catch (error) {
            console.error("Error en la compra:", error);
            Swal.fire({ title: "Error", text: "No se pudo procesar la compra", icon: "error" });
        }
    };


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

                                {/* 🔥 Solo mostramos el select de Fila si hay un sector asignado */}
                                {form.sector && (
                                <div className="entradasForm__item--campo">
                                    <label htmlFor="fila">Fila</label>
                                    <select
                                        name="fila"
                                        value={form.fila || ""}
                                        onChange={(e) => handleFilaChange(index, e)}
                                        // required
                                    >
                                        <option value="">Selecciona una fila</option>
                                        {filasPorSector[form.sector]
                                            ?.filter(fila => fila.disponible) // 🔥 Solo filas disponibles
                                            .map((fila) => (
                                                <option key={fila._id} value={fila.nombreFila}>
                                                    {fila.nombreFila}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                )}

                                {form.fila && (
                                        <div className="entradasForm__item--campo">
                                            <label htmlFor="asiento">Asiento</label>
                                            <select
                                                name="asiento"
                                                value={form.asiento || ""}
                                                onChange={(e) => handleInputChange(index, e)}
                                                // required
                                            >
                                                <option value="">Selecciona un asiento</option>
                                                {filasPorSector[form.sector]
                                                    ?.find(f => f.nombreFila === form.fila)?.asientos
                                                    .filter(asiento => asiento.disponible && !asiento.ocupado) // 🔥 Solo asientos libres
                                                    .map(asiento => (
                                                        <option key={asiento._id} value={asiento.nombreAsiento}>
                                                            {asiento.nombreAsiento}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}


                                {form.sector && (
                                    <>
                                        <button type="button" onClick={() => setModalOpen(index)} className="elegir-asientos">
                                            <i><MdOutlineEventSeat/></i>
                                            <span>Elegir Asientos</span>
                                        </button>

                                        {/* 🔥 Mostrar selección solo si hay asiento elegido */}
                                        {form.asiento && (
                                            <small>
                                                Fila: {form.fila}, Asiento: {form.asiento}
                                            </small>
                                        )}
                                    </>
                                )}


                                {modalOpen !== null && mapaImagen && (
                                        
                                        <div className="modal-mapa">
                                        <div className="modal-mapa__content">
                                                <div className="modal-mapa__content--header">
                                                    <h3>Selecciona un asiento en el mapa</h3>                                   
                                                    <button className="cerrar-modal" onClick={() => setModalOpen(null)}>X</button>
                                                </div>

                                                <div className="modal-mapa__content--mapa">
                                                <svg viewBox="0 0 675 675" width="100%" height="100%">
                                                    {/* 🔥 Imagen de fondo */}
                                                    <image x="0" y="0" width="100%" height="100%" href={mapaImagen} />

                                                    {/* 🔥 Dibujar los asientos como DIVS en foreignObject */}
                                                    {/* 🔥 Dibujar los asientos como DIVS en foreignObject */}
{asientos.length > 0 ? (
    asientos
        .filter(asiento => asiento.disponible) // 🔥 Solo mostramos los disponibles
        .map((asiento, index) => (
            <foreignObject
                key={index}
                x={asiento.coordenadas?.x || 0}
                y={asiento.coordenadas?.y || 0}
                width="25"
                height="25"
                style={{
                    cursor: asiento.ocupado ? "not-allowed" : "pointer"
                }}
                onClick={() => !asiento.ocupado && handleClickEnMapa(asiento)} // 🔥 Evita selección de ocupados
            >
                <div
                    className="asiento-box"
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "5px",
                        backgroundColor: asiento.seleccionado
                            ? "yellow"  // si está seleccionado
                            : asiento.ocupado
                            ? "#9f0d3e"   // si está ocupado
                            : "#e8e7f1", // si está disponible
                        opacity: asiento.seleccionado
                            ? "1"  // si está seleccionado
                            : asiento.ocupado
                            ? ".5"   // si está ocupado
                            : "1", // si está disponible
                        border: "1px solid #2c2948",
                        color: "#2c2948",
                        fontSize: "10px",
                        fontFamily: "Arial, sans-serif"
                    }}
                >
                    {asiento.nombreAsiento}
                </div>
            </foreignObject>
        ))
) : (
    <p>No hay asientos disponibles</p>
)}

                                                </svg>

                                            </div>
                                            
                                            <button
                                                type="button"
                                                className="confirmar-asiento"
                                                onClick={handleConfirmarAsiento}
                                            >
                                                Confirmar Selección
                                            </button>






                                            </div>
                                        </div>
                                        )}

                                
                                    {modalOpen !== null && !mapaImagen && (
                                        <div className="modal-mapa">
                                            <div className="modal-mapa-content">
                                            <h3>No hay mapa disponible para este evento</h3>
                                            <button className="cerrar-modal" onClick={() => setModalOpen(null)}>Cerrar</button>
                                            </div>
                                        </div>
                                    )}

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
