import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // 🔥 Asegúrate de agregar esto
import config from "../config";


function AdminMapaAsientos() {
  const { id } = useParams(); // ID del lugar
  const [lugar, setLugar] = useState(null);
  const [selectedAsiento, setSelectedAsiento] = useState(null); // 🔥 Asiento seleccionado
  const [rectangles, setRectangles] = useState([]); // 🔥 Lista de rectángulos dibujados

  useEffect(() => {
    const fetchLugar = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}`);
        if (!response.ok) throw new Error("Error obteniendo el lugar");
        const data = await response.json();
        setLugar(data);
      } catch (error) {
        console.error("❌ Error:", error);
      }
    };
    fetchLugar();
  }, [id]);

    const handleMapearAsiento = async (asiento, x, y) => {
  try {
    const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}/sectores/${sectorId}/filas/${filaId}/asientos/${asiento._id}/mapeo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log("🔥 Asiento mapeado correctamente", data);
    } else {
      console.error("❌ Error al mapear:", data);
    }
  } catch (error) {
    console.error("❌ Error en el servidor:", error);
  }
};


  if (!lugar) return <p>Cargando...</p>;

  return (
    <main className="adminPanel">
      <h2>Mapa de Asientos - {lugar.nombre}</h2>
      
      <div className="mapa">
        <svg
          viewBox="0 0 800 800"
          width="100%"
          height="100%"
          onClick={(e) => {
            if (selectedAsiento) {
              const rectX = e.nativeEvent.offsetX;
              const rectY = e.nativeEvent.offsetY;
              setRectangles([...rectangles, { x: rectX, y: rectY, asiento: selectedAsiento }]);
              setSelectedAsiento(null); // 🔥 Desactivar el asiento después de dibujar
            }
          }}
        >
          {/* 🔥 Imagen de fondo del mapa */}
          <image x="0" y="0" width="100%" height="100%" href={`${config.BACKEND_URL}/img/lugares/${lugar.mapaImagen}`} />

          {/* 🔥 Dibujar rectángulos en el mapa */}
          {rectangles.map((rect, index) => (
            <rect
              key={index}
              x={rect.x}
              y={rect.y}
              width="30"
              height="20"
              fill="blue"
              opacity="0.5"
              stroke="black"
            />
          ))}
        </svg>
        <div className="asientosLista">
            <h3>Selecciona un asiento para mapearlo:</h3>
            {lugar.sectores.map((sector) => (
            <div key={sector._id} className="sector">
                <h4>{sector.nombreSector}</h4>
                {sector.filas.map((fila) => (
                <div key={fila._id} className="fila">
                        <h5>Fila {fila.nombreFila}</h5>
                        <div className="asientosFila">

                    {fila.asientos.map((asiento) => (
                    
                        <button
                            key={asiento._id}
                            onClick={() => setSelectedAsiento(asiento.nombreAsiento)}
                            className={`${
                                selectedAsiento === asiento.nombreAsiento ? "selected" : "deselected"
                            }`}
                            >
                            {asiento.nombreAsiento}
                            </button>

                    ))}
                        </div>
                </div>
                ))}
            </div>
            ))}
        </div>
      </div>


    </main>
  );
}

export default AdminMapaAsientos;
