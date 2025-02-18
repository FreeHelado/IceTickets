import { useState, useEffect } from "react";
import EventoCard from "./EventoCard";

function Eventos() {
  const [eventos, setEventos] = useState([]); // Estado para guardar los eventos

  useEffect(() => {
    fetch("http://localhost:5000/api/eventos")
  .then((response) => response.json())
  .then((data) => {
    console.log("🚀 Eventos recibidos:", data); // Verifica qué llega desde la API
    setEventos(data);
  })
  .catch((error) => console.error("❌ Error cargando eventos:", error));

  }, []);

  return (
    <>
    <div className="eventosHeader">    
      <h2>Eventos</h2>
    </div>
    <div className="eventos">
      {eventos.length > 0 ? (
        eventos
          .filter(evento => evento.publico) // 🔥 Filtrar solo eventos públicos
          .map((evento) => <EventoCard key={evento._id} {...evento} />)
      ) : (
        <p>Cargando eventos...</p>
      )}
    </div>
    </>
  );
}

export default Eventos;
