import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { GoDash, GoPlus } from "react-icons/go";
import { FaTicketSimple, FaRegTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdOutlineShoppingBag } from "react-icons/md";

function CompraEntradas({ precios, aforo, evento }) {
    
    const navigate = useNavigate();
    
    const [carrito, setCarrito] = useState(() => {
        const carritoGuardado = localStorage.getItem("carrito");
        return carritoGuardado ? JSON.parse(carritoGuardado) : [];
    });

    const [cantidades, setCantidades] = useState(() => {
    const cantidadesGuardadas = JSON.parse(localStorage.getItem("cantidades")) || {};
    return precios.reduce((acc, precio) => ({
        ...acc,
        [precio.nombre]: cantidadesGuardadas[precio.nombre] || 0, // Si hay datos en storage, los usa
        }), {});
    });

    // 🟢 🔥 Agregamos la referencia del modal
    const modalRef = useRef(null);
    useEffect(() => {
    if (modalRef.current) {
        gsap.set(modalRef.current, { bottom: "-100%", opacity: 0, visibility: "hidden" });
    }
    }, []);

    const cerrarCarrito = () => {
        if (!modalRef.current) return; // ⚠️ Evita errores si modalRef es null

        gsap.to(modalRef.current, {
            bottom: "-100%", // 🔽 Baja el modal fuera de la pantalla
            opacity: 0,
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
                modalRef.current.style.visibility = "hidden"; // Ocultamos el modal después de la animación
            },
        });
    };

    const mostrarCarrito = () => {
    if (!modalRef.current) return; // ⚠️ Evita errores si modalRef es null

    modalRef.current.style.visibility = "visible"; // Asegura que sea visible antes de animar

        gsap.fromTo(
            modalRef.current,
            {
                scale: 0.3, // 🌀 Empieza muy pequeño
                bottom: "-100%", // 📍 Inicia desde abajo
                opacity: 0,
                transformOrigin: "bottom left", // 📌 Aparece desde la esquina inferior izquierda
            },
            {
                scale: 1, // 🔥 Crece hasta su tamaño normal
                bottom: "15px", // 📌 Se posiciona en su sitio
                opacity: 1,
                duration: 0.8,
                ease: "elastic.out(1, 0.6)", // 🏀 Rebote suave
            }
        );
    };



    useEffect(() => {
        localStorage.setItem("cantidades", JSON.stringify(cantidades));
    }, [cantidades]);


    // 🔢 Sumar el total de entradas seleccionadas en el botón
    const totalBoton = precios.reduce((acc, precio) => acc + cantidades[precio.nombre] * precio.monto, 0);

    // 🔢 Sumar el total de entradas seleccionadas
    const totalEntradas = Object.values(cantidades).reduce((acc, val) => acc + val, 0);

    // 🔔 Detectar si alguna entrada llegó al límite y lanzar alerta
    useEffect(() => {
        precios.forEach((precio) => {
        if (cantidades[precio.nombre] >= precio.disponibles && precio.disponibles > 0) {
            Swal.fire({
            title: "Stock agotado",
            text: `No hay más entradas disponibles para "${precio.nombre}".`,
            icon: "warning",
            confirmButtonText: "Entendido",
            });
        }
        });
    }, [cantidades, precios]); // 🛑 Se ejecuta cada vez que `cantidades` cambia

    // 🛒 Guardar en localStorage cuando cambia el carrito
    useEffect(() => {
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }, [carrito]);

    const aumentarCantidad = (nombre, disponibles) => {
        setCantidades((prev) => {
        const nuevaCantidad = prev[nombre] + 1;

        // 🚫 Evita que el usuario agregue más de lo permitido
        if (nuevaCantidad > disponibles) return prev;

        return {
            ...prev,
            [nombre]: nuevaCantidad,
        };
        });
    };

    // 🔽 Disminuir cantidad (mínimo 0)
    const disminuirCantidad = (nombre) => {
        setCantidades((prev) => ({
        ...prev,
        [nombre]: Math.max(prev[nombre] - 1, 0),
        }));
    };

    const vaciarCarrito = () => {
        setCarrito([]); // 🛒 Limpia el estado del carrito
        localStorage.removeItem("carrito"); // 🗑️ Borra el carrito del localStorage
    };

    // 🛒 Agregar entradas al carrito
    const agregarAlCarrito = () => {

        if (!evento._id) {  
            console.error("⚠️ Error: El evento no tiene un ID válido", evento);
            return;
        }

        const nuevasEntradas = precios
            .filter(precio => cantidades[precio.nombre] > 0)
            .map(precio => ({
                idPrecio: precio._id, // 🔥 Agregamos el ID del precio
                nombre: precio.nombre,
                cantidad: cantidades[precio.nombre],
                monto: precio.monto,
                subtotal: cantidades[precio.nombre] * precio.monto,
                evento: { 
                    id: evento._id || "",  // 
                    nombre: evento.nombre || "Evento sin nombre",
                    imagen: evento.imagen || "",
                    fecha: evento.fecha || "",
                    hora: evento.hora || "",
                    lugar: evento.lugar.nombre || "Lugar no disponible",
                    direccion: evento.lugar.direccion || "Dirección no disponible"
                }
            }));

        if (nuevasEntradas.length === 0) {
            Swal.fire({
                title: "No hay entradas seleccionadas",
                text: "Selecciona al menos una entrada antes de comprar.",
                icon: "warning",
                confirmButtonText: "Entendido",
            });
            return;
        }

        setCarrito(nuevasEntradas);
        // 🔥 Guardamos el evento correctamente en localStorage
        localStorage.setItem("evento", JSON.stringify({
            id: evento._id,  // ✅ Guarda el ID correctamente
            nombre: evento.nombre,
            imagen: evento.imagen,
            fecha: evento.fecha,
            hora: evento.hora,
            lugar: evento.lugar?.nombre,
            direccion: evento.lugar?.direccion,
            logoLugar: evento.lugar?.logo || "" // ✅ Guarda el logo del lugar
        }));
        
        localStorage.setItem("carrito", JSON.stringify(nuevasEntradas));
        // 🎯 Ejecutar la animación después de actualizar el carrito
    mostrarCarrito();
    };
    JSON.parse(localStorage.getItem("carrito"))


    // 🛒🎫 Calcular total en el carrito
    const totalEntradasCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0);

    // 🛒 Calcular total en el carrito
    const totalCarrito = carrito.reduce((acc, item) => acc + item.subtotal, 0);

    // ✅ Redirigir a Checkout con el evento y el carrito
    const irAConfirmacion = () => {
        const token = localStorage.getItem("token"); // 🔍 Verifica si el usuario está logueado

        if (!evento) {
            Swal.fire({
                title: "Error",
                text: "Hubo un problema al cargar los datos del evento.",
                icon: "error",
                confirmButtonText: "Entendido",
            });
            return;
        }

        if (!token) {
            // 📌 Guarda que el destino real es /checkout
            localStorage.setItem("prevPage", "/checkout"); 
            localStorage.setItem("carrito", JSON.stringify(carrito));
            if (evento && evento.lugar) {
                localStorage.setItem("evento", JSON.stringify(evento));
            }
            
            navigate("/login"); // 🔄 Redirige a login
            return;
        }

        

        // ✅ Si el usuario está logueado, sigue al checkout como antes
        navigate("/checkout", { 
            state: { 
                carrito, 
                evento: { 
                    id: evento.id || evento._id, // 🔥 Asegurar que el ID esté presente
                    nombre: evento.nombre, 
                    imagen: evento.imagen, 
                    fecha: evento.fecha, 
                    hora: evento.hora,
                    lugar: evento.lugar?.nombre || "Lugar no disponible",
                    direccion: evento.lugar?.direccion || "Dirección no disponible"
                } 
            } 
        });

    };


  return (
     <div className="compra">
      <h3>Comprá tus entradas</h3>
      <span>Selecciona el tipo de entrada:</span>

      <div className="precios">
        <div className="botones">
          {precios.map((precio, index) => (
            <div key={index} className="addCarrito">
              <div className="entrada">
                <span>{precio.nombre}</span>
                <div className="precio">${precio.monto}</div>
              </div>
              <div className="cantidades">
                {precio.disponibles === 0 ? (
                    <span className="agotadoTag">Agotadas</span>
                ) : (
                    <>
                    <button onClick={() => disminuirCantidad(precio.nombre)}>
                        <i><GoDash /></i>
                    </button>
                    <input type="number" value={cantidades[precio.nombre]} readOnly />
                    <button
                        onClick={() => aumentarCantidad(precio.nombre, precio.disponibles)}
                        disabled={cantidades[precio.nombre] >= precio.disponibles}
                    >
                        <i><GoPlus /></i>
                    </button>
                    </>
                    )}
                    </div>

                    </div>
                ))}
        </div>
      </div>

          {/* 🔥 Botón con total actualizado */}
            <button className="comprarBtn" onClick={agregarAlCarrito}>
              <span>{carrito.length > 0 ? "Actualizar Carrito" : "Comprar Entradas"}</span>
                <div className="montoTotal">
                    <small>$</small>
                    <strong>{totalBoton}</strong> {/* ✅ Total de lo seleccionado antes de agregar al carrito */}
                </div>
          </button>

        {carrito.length > 0 && (             
            <button className="boton-flotante" onClick={mostrarCarrito}>
                {totalEntradasCarrito > 0 && (
                    <span>{totalEntradasCarrito}</span>
                )} 
                <i><MdOutlineShoppingBag /></i>
            </button>
        )}


        {/* 🛒 Mostrar carrito */}
        {carrito.length > 0 && (
            <div ref={modalRef} className="carrito">
                  <h3>Tickets en tu Carrito</h3>
                  
                  <button className="carrito__cerrar" onClick={cerrarCarrito}>X</button>
                  <div className="carrito__lista">  
                      <ul>
                        {carrito.map((item, index) => (
                            <li key={index}>
                                <div className="cantidadX">
                                    <i><FaTicketSimple /></i>
                                    <small>x{item.cantidad}</small>
                                </div>
                                <span>{item.nombre}</span>
                                <strong>${item.subtotal}</strong>
                            </li>
                        ))}
                          <li className="totalCarrito">
                              <span>Total:</span>
                              <strong>${totalCarrito}</strong>
                          </li>
                      </ul>
                      
                       {carrito.length > 0 && (
                          <div className="vaciarCarrito" onClick={vaciarCarrito}>
                                <i><FaRegTrashCan /></i>
                                <span>Vaciar Carrito</span>
                        </div>
                        )}

                  </div>
                    
                    {carrito.length > 0 && (
                        <button className="finalizarBtn" onClick={irAConfirmacion}>
                            Finalizar Compra
                        </button>
                    )}
                    
            </div>
        )}
    </div>
  );
}

export default CompraEntradas;
