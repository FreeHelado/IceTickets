import config from "../config";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import LugarCard from "../componentes/LugarCard";
import CompraEntradas from "../componentes/CompraEntradas"; // Importa el nuevo componente

import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es";

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
              <h3>{fechaFormateadaDetalle} - {evento.hora}</h3>
            </div>
          </figure>
          <h1>{evento.nombre}</h1>
          
          {/* ✅ Mostrar nombre e ícono de la categoría */}
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
            <h3>Información acicional del Evento:</h3>
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
            <div className="evento__cont--info--ficha--infoadicional">
              <h3>Más información</h3>
              {evento.infoAdicional &&
                Object.entries(evento.infoAdicional)
                  .filter(([_, value]) => value) // Solo muestra los campos con datos
                  .map(([key, value]) => (
                    <div key={key} className="evento__cont--info--ficha--infoadicional--item">
                      <h3>{key.replace(/([A-Z])/g, " $1")}</h3> {/* Formatea camelCase */}
                      <p>{value}</p>
                    </div>
                ))}
            </div>
          </section>
          
          
          {/* ✅ Renderizar LugarCard con los datos del lugar */}
          
          {lugar && <LugarCard lugar={lugar} />}

        </div>
         
          {/* 📌 Sección lateral para compra de entradas o mensaje de agotado */}
        <div className="evento__cont--lateral">
          {todasAgotadas ? (
            <div className="agotado-box">
              <h3>Entradas agotadas</h3>
              <p>Lo sentimos, todas las entradas han sido vendidas.</p>
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
