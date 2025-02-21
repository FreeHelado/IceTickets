import config from "../config";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import LugarCard from "../componentes/LugarCard";
import CompraEntradas from "../componentes/CompraEntradas"; // Importa el nuevo componente
import gsap from "gsap";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

/// iconos ////
import { FaRegTrashCan, FaDog } from "react-icons/fa6";
import { FaHamburger, FaAccessibleIcon, FaSun } from "react-icons/fa";
import { MdFamilyRestroom } from "react-icons/md";
import { TbRating18Plus } from "react-icons/tb";
import { BiSolidDrink } from "react-icons/bi";

function EventoDetalle() {
  const { id } = useParams(); // Captura el ID del evento desde la URL
  const [evento, setEvento] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [lugar, setLugar] = useState(null);
  
  const btnMobileRef = useRef(null);
  const lateralRef = useRef(null);
 
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin); // 🔥 Registrar ambos

  const scrollToLateral = () => {
    if (lateralRef.current) {
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: lateralRef.current.offsetTop, autoKill: false }, // 🔥 Cambié `y: lateralRef.current`
        ease: "power2.inOut",
      });
    }
  };

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/eventos/${id}`);
        const data = await response.json();
        setEvento(data);

        // ✅ Buscar datos de la categoría si no viene completa en el evento
        if (data.categoria && typeof data.categoria === "string") {
          fetch(`${config.BACKEND_URL}/api/categorias/${data.categoria}`)
            .then((res) => res.json())
            .then((catData) => setCategoria(catData))
            .catch((error) => console.error("❌ Error cargando categoría:", error));
        } else {
          setCategoria(data.categoria);
        }

        // ✅ Buscar datos del lugar si no viene completo en el evento
        if (data.lugar && typeof data.lugar === "string") {
          fetch(`${config.BACKEND_URL}/api/lugares/${data.lugar}`)
            .then((res) => res.json())
            .then((lugarData) => setLugar(lugarData))
            .catch((error) => console.error("❌ Error cargando lugar:", error));
        } else {
          setLugar(data.lugar);
        }
      } catch (error) {
        console.error("❌ Error cargando el evento:", error);
      }
    };

    fetchEvento();
  }, [id]);

  useEffect(() => {
    const btnMobile = btnMobileRef.current;
    const lateral = lateralRef.current;

    if (!btnMobile || !lateral) {
      return;
    }

    // 🔥 Usamos `requestAnimationFrame` para asegurarnos de que los elementos están en el DOM
    requestAnimationFrame(() => {
      ScrollTrigger.create({
        trigger: lateral,
        start: "top bottom",
        end: "bottom bottom",
        onEnter: () => {
          gsap.to(btnMobile, { 
            y: 100, 
            opacity: 0, 
            duration: 0.8, // ⏳ Ajustá la duración
            ease: "elastic.in(1, 0.5)" // 🔥 Entrada más elástica
          });
        },
        onLeaveBack: () => {
          gsap.to(btnMobile, { 
            y: 0, 
            opacity: 1, 
            duration: 0.6, // ⏳ Un poco más rápido en la salida
            ease: "elastic.out(1, 0.5)" // 🔥 Rebote más fluido
          });
        },
      });
    });

  }, [evento]); // 🔥 Se ejecuta cuando `evento` cambia


  if (!evento) return <p>Cargando...</p>;

  // 🗓️ Formatear la fecha correctamente
  const fechaFormateadaDetalle = evento.fecha
    ? format(parseISO(evento.fecha), "EEEE d 'de' MMMM yyyy", { locale: esLocale })
    : "";

  // 🔥 Verificar si todas las entradas están agotadas
  const todasAgotadas = evento.precios.every((precio) => precio.disponibles === 0);

  return (
    <main className="evento">
      <section className="evento__cont">
        <div className="evento__cont--info">
          <figure className="evento__cont--info--img">
            <img src={`${config.BACKEND_URL}/img/eventos/${evento.imagen}`} alt={`Imagen de ${evento.nombre}`} />
            <div className="evento__cont--info--img--data">
              {/* ✅ Mostrar estado del evento con estilos dinámicos */}
              {["hoy", "cancelado", "finalizado", "liquidado"].includes(evento.estado) && (
                <div className={`evento-estado evento-estado--${evento.estado.toLowerCase()}`}>
                  {evento.estado.toUpperCase()}
                </div>
              )}
              <h3>{fechaFormateadaDetalle} - {evento.hora}</h3>
            </div>
          </figure>
          <h1>{evento.nombre}</h1>
          
          
          <div className="evento__cont--info--categoria">
            {categoria ? (
              <>
                <span>{categoria.nombre} </span>
              {FaIcons[categoria.icono] && <i>{FaIcons[categoria.icono]()}</i>}
            </>
            ) : (
              "Cargando..."
            )}
          </div>
         
          

          <div dangerouslySetInnerHTML={{ __html: evento.descripcion }} />


          
          <section className="evento__cont--info--ficha">
            {evento.tags && Object.values(evento.tags).some(valor => valor) && (
            <>
            <h3>Información adicional</h3>
            <div className="evento__cont--info--ficha--tags">
              <ul>
                {evento.tags?.todoPublico && (
                  <li>
                    <i><MdFamilyRestroom /></i>
                    <span>PARA TODO PÚBLICO</span>
                  </li>
                )}
                {evento.tags?.noMenores && (
                  <li>
                    <i><TbRating18Plus /></i>
                    <span>PARA MAYORES DE 18</span>
                  </li>
                )}
                {evento.tags?.ventaComida && (
                  <li>
                    <i><FaHamburger /></i>
                    <span>VENTA DE COMIDA</span>
                  </li>
                )}
                {evento.tags?.ventaBebida && (
                  <li>
                   <i><BiSolidDrink /></i>
                <span>VENTA DE BEBIDA</span>
                  </li>
                )}
                {evento.tags?.petFriendly && (
                  <li>
                     <i><FaDog /></i>
                <span>PET FIENDLY</span>
                  </li>
                )}
                {evento.tags?.accesible && (
                  <li>
                   <i><FaAccessibleIcon /></i>
                <span>ACCESIBLE E INCLUSIVO</span>
                  </li>
                )}
                {evento.tags?.aireLibre && (
                  <li>
                    <i><FaSun /></i>
              <span>AIRE LIBRE</span>
                  </li>
                )}
              </ul>
                </div>
              </>
            )}

            {evento.infoAdicional &&
              Object.values(evento.infoAdicional).some(value => value) && (
                <div className="evento__cont--info--ficha--infoadicional">
                  <h3>Más información</h3>

                  {evento.infoAdicional.edadMinima && (
                    <div className="evento__cont--info--ficha--infoadicional--item">
                      <h3>Edad mínima para ingresar al evento:</h3>
                      <p>{evento.infoAdicional.edadMinima}</p>
                    </div>
                  )}

                  {evento.infoAdicional.menoresGratis && (
                    <div className="evento__cont--info--ficha--infoadicional--item">
                      <h3>Menores de hasta {evento.infoAdicional.menoresGratis} gratis</h3>
                    </div>
                  )}

                  {evento.infoAdicional.elementosProhibidos && (
                    <div className="evento__cont--info--ficha--infoadicional--item">
                      <h3>Elementos prohibidos:</h3>
                      <p>{evento.infoAdicional.elementosProhibidos}</p>
                    </div>
                  )}

                  {evento.infoAdicional.terminosCondiciones && (
                    <div className="evento__cont--info--ficha--infoadicional--item">
                      <h3>Términos y condiciones:</h3>
                      <p>{evento.infoAdicional.terminosCondiciones}</p>
                    </div>
                  )}

                  {evento.infoAdicional.horaApertura && (
                    <div className="evento__cont--info--ficha--infoadicional--item">
                      <h3>Horario de apertura:</h3>
                      <p>{evento.infoAdicional.horaApertura}</p>
                    </div>
                  )}

                  {evento.infoAdicional.estacionamiento && (
                    <div className="evento__cont--info--ficha--infoadicional--item">
                      <h3>Estacionamiento:</h3>
                      <p>{evento.infoAdicional.estacionamiento}</p>
                    </div>
                  )}

                  {evento.infoAdicional.transporte && (
                    <div className="evento__cont--info--ficha--infoadicional--item">
                      <h3>Transporte para llegar al evento:</h3>
                      <p>{evento.infoAdicional.transporte}</p>
                    </div>
                  )}

                </div>
              )}

          </section>
          
          
          {/* ✅ Renderizar LugarCard con los datos del lugar */}
          
          {lugar && <LugarCard lugar={lugar} />}

          <div ref={btnMobileRef} className="btnMobile" onClick={scrollToLateral}>
          <div className="btnMobile__cont">
            <span>COMPRAR TICKETS</span>
          </div>
        </div>
        </div>
         
        
        <div ref={lateralRef} className="evento__cont--lateral">
          {todasAgotadas ? (
            <div className="noDisponible">
              <h3>Entradas agotadas</h3>
              <p>Lo sentimos, todas las entradas han sido vendidas.</p>
            </div>
          ) : /* 🔥 Si el evento está cancelado, finalizado o liquidado */
          ["cancelado", "finalizado", "liquidado"].includes(evento.estado) ? (
            <div className="noDisponible">
                  
              <h3>Este evento ya no está disponible</h3>
              <div className="alert alert-warning">
                {evento.estado === "cancelado" && "Este evento ha sido cancelado."}
                {evento.estado === "finalizado" && "Este evento ya ha finalizado."}
                {evento.estado === "liquidado" && "Este evento ha sido liquidado."}
              </div>
            </div>
          ) : (
            <CompraEntradas precios={evento.precios} aforo={evento.stock?.aforo} evento={{ _id: evento._id, ...evento, lugar }} />
          )}
      </div>


        
 
      </section>
      
      
      
      
    </main>
  );
}

export default EventoDetalle;
