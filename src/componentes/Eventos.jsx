import config from "../config";
import { useState, useEffect } from "react";
import EventoCard from "./EventoCard";

function Eventos() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    fetch(`${config.BACKEND_URL}/api/eventos`)
    .then((response) => response.json())
    .then((data) => {
      setEventos(data);
    })
    .catch((error) => console.error("❌ Error cargando eventos:", error));

  }, []);

  return (
    <main>
      <div className="eventosHeader">    
        <h2>Lo que se viene</h2>
      </div>
      <div className="eventos">
        {eventos.length > 0 ? (
          eventos
           .filter(evento => evento.publico && evento.estado !== "finalizado") // 🔥 Filtramos eventos públicos y no finalizados
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)) // 🔥 Ordenamos por fecha ascendente (más próximos primero)
          .map((evento) => <EventoCard key={evento._id} {...evento} />)
        ) : (
          <p>Cargando eventos...</p>
        )}
      </div>
     
      <div className="eventosHeader">    
        <h2>Finalizados</h2>
      </div>
      <div className="eventos">
        {eventos.length > 0 ? (
          eventos
           .filter(evento => evento.publico && evento.estado == "finalizado")
            .map((evento) => <EventoCard key={evento._id} {...evento} />)
        ) : (
          <p>Cargando eventos...</p>
        )}
      </div>
    </main>
  );
}

export default Eventos;
