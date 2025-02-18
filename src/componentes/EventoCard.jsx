import config from "../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as Icons from "react-icons/fa"; // ✅ Importamos TODOS los iconos
import { FaRegCalendar } from "react-icons/fa";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es";

function EventoCard({ _id, nombre, fecha, hora, imagen, stock, precios, categoria, lugar }) {
  const [nombreLugar, setNombreLugar] = useState("Cargando...");
  const [localidadLugar, setLocalidadLugar] = useState("Cargando...");
  const [categoriaData, setCategoriaData] = useState(null); 
  
  // 🗓️ Formatear la fecha
  const fechaFormateada = fecha ? format(parseISO(fecha), "EEEE d MMM yyyy", { locale: esLocale }) : "";

  // 🔥 Verificar si todas las entradas están agotadas
  const todasAgotadas = precios.every(precio => precio.disponibles === 0);

   // 💰 Obtener el precio más bajo
  const precioMenor = precios.length > 0 ? Math.min(...precios.map(p => p.monto)) : 0;

  // 📌 Cargar datos de la categoría
  useEffect(() => {
    if (!categoria) return;

    fetch(`${config.BACKEND_URL}/api/categorias/${categoria}`)
      .then((response) => response.json())
      .then((data) => setCategoriaData(data))
      .catch((error) => console.error("❌ Error cargando categoría:", error));
  }, [categoria]);

  // ✅ Obtener el icono de React Icons dinámicamente
  const IconComponent = categoriaData && Icons[categoriaData.icono] ? Icons[categoriaData.icono] : null;


  // 📍 Cargar datos del lugar (nombre + localidad)
  useEffect(() => {
    if (!lugar) return; // Si no hay lugar, salimos
    fetch(`${config.BACKEND_URL}/api/lugares/${lugar}`)
      .then(response => response.json())
      .then(data => {
        setNombreLugar(data.nombre);
        setLocalidadLugar(data.localidad || "Sin localidad");
      })
      .catch(error => {
        console.error("❌ Error al obtener el lugar:", error);
        setNombreLugar("Lugar desconocido");
        setLocalidadLugar("Localidad desconocida");
      });
  }, [lugar]);

  
  return (
      <div className="eventos__item">
      <Link to={`/evento/${_id}`}>
      <figure>        
        <div className="tagFecha">
          <i><FaRegCalendar /></i>
          <span>{fechaFormateada} - {hora}</span>
        </div>
      <img src={`${config.BACKEND_URL}/img/eventos/${imagen}`} alt={`Imagen de ${nombre}`}/>
          </figure>
      </Link>
      <div className="eventos__item--info">
        {/* 🔥 Mostrar etiqueta de AGOTADO si no hay más entradas */}
        {todasAgotadas && <span className="agotado">AGOTADO</span>}
        <div className="tagCategoria" title={categoriaData?.nombre || "Cargando..."}>
            {categoriaData ? (
            <>
              <i>{IconComponent && <IconComponent />}</i>
              <span>{categoriaData.nombre}</span>
              </>
            ) : (
              "Cargando categoría..."
            )}
        </div>
        <h2>{nombre}</h2>
        <h4>{nombreLugar}, {localidadLugar}</h4>
          <Link to={`/evento/${_id}`}>
            <button disabled={todasAgotadas} className={todasAgotadas ? "agotadoBtn" : ""}>
              <span>
                {todasAgotadas ? "Entradas agotadas" : "Comprar Entradas"}
              </span>
              {!todasAgotadas && <small>Desde ${precioMenor}</small>}
            </button>
          </Link>

      </div>
    </div>
  );
}

export default EventoCard;
