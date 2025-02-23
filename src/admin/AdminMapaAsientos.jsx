import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // 🔥 Asegúrate de agregar esto

import Swal from "sweetalert2";
import AdminTools from "./AdminTools";
import config from "../config";
import { useNavigate } from "react-router-dom"; // 🔥 Importamos navigate



function AdminMapaAsientos() {
  const { id } = useParams(); // ID del lugar
  const [lugar, setLugar] = useState(null);
  const [selectedAsiento, setSelectedAsiento] = useState(null); // 🔥 Asiento seleccionado
  const [rectangles, setRectangles] = useState([]); // 🔥 Lista de rectángulos dibujados
  const [asientoEstados, setAsientoEstados] = useState({}); // 🔥 Estados de botones

  useEffect(() => {
      const fetchLugar = async () => {
        try {
              const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}`);
              if (!response.ok) throw new Error("Error obteniendo el lugar");
              const data = await response.json();
              setLugar(data);

              // 🟡 Extraer coordenadas y definir estados iniciales
              const nuevosEstados = {};
              const nuevosRectangles = [];
              
              data.sectores.forEach(sector => {
                  sector.filas.forEach(fila => {
                      fila.asientos.forEach(asiento => {
                          const tieneCoordenadas = asiento.coordenadas?.x !== null && asiento.coordenadas?.y !== null;

                          nuevosEstados[asiento._id] = tieneCoordenadas ? "mapeado" : "sin-mapear";

                          // ✅ Si el asiento tiene coordenadas, agregarlo al mapa
                          if (tieneCoordenadas) {
                            nuevosRectangles.push({
                                  x: asiento.coordenadas.x,
                                  y: asiento.coordenadas.y,
                                  asiento: asiento.nombreAsiento
                              });
                          }
                        });
                      });
                    });
                    
              setAsientoEstados(nuevosEstados);
              setRectangles(nuevosRectangles); // ✅ 🔥 ACTUALIZAR LOS PATHS EN EL SVG
          } catch (error) {
            console.error("❌ Error:", error);
          }
      };
      fetchLugar();
  }, [id]);

  const handleSeleccionarAsiento = (asiento) => {
      setSelectedAsiento(asiento);

      setAsientoEstados(prev => ({
          ...prev,
          [asiento.id]: "seleccionado" // 🔥 Aplica animación de selección
      }));
  };
  
  const handleMapearAsiento = async (x, y) => {
      if (!selectedAsiento) return;

      try {
        console.log("📌 Antes de eliminar:", rectangles);

          // 🔄 1️⃣ Eliminar el asiento anterior si ya existía en la lista
          setRectangles(prev => {
            const actualizados = prev.filter(rect => rect.asiento !== selectedAsiento.nombre);
            console.log("🗑 Eliminado asiento anterior:", actualizados);
              return actualizados;
          });

          const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}/sectores/${selectedAsiento.sectorId}/filas/${selectedAsiento.filaId}/asientos/${selectedAsiento.id}/mapeo`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ x, y }),
          });
          
          const data = await response.json();
          if (response.ok) {
            console.log("🔥 Asiento mapeado correctamente", data);

            // 🔥 2️⃣ Agregar el nuevo asiento con la nueva posición
            setRectangles(prev => {
                  const nuevoEstado = [...prev, { x, y, asiento: selectedAsiento.nombre }];
                  console.log("🆕 Nuevo estado de rectangles:", nuevoEstado);
                  return nuevoEstado;
              });

              // 🔄 3️⃣ Actualizar el estado de `asientoEstados`
              setAsientoEstados(prev => ({
                  ...prev,
                  [selectedAsiento.id]: "mapeado"
              }));

              // 🔥 4️⃣ Actualizar el estado de `lugar`
              setLugar(prevLugar => ({
                  ...prevLugar,
                  sectores: prevLugar.sectores.map(sector =>
                      sector._id === selectedAsiento.sectorId
                          ? {
                              ...sector,
                              filas: sector.filas.map(fila =>
                                  fila._id === selectedAsiento.filaId
                                      ? {
                                          ...fila,
                                          asientos: fila.asientos.map(asiento =>
                                              asiento._id === selectedAsiento.id
                                                  ? { ...asiento, coordenadas: { x, y } }
                                                  : asiento
                                          )
                                      }
                                      : fila
                              )
                          }
                          : sector
                  )
                }));

              setSelectedAsiento(null);
          } else {
              console.error("❌ Error al mapear:", data);
          }
      } catch (error) {
          console.error("❌ Error en el servidor:", error);
      }
  };
  
  const navigate = useNavigate(); // 🔄 Instancia de navegación
  const handleGuardarMapa = async () => {
    try {
      console.log("📤 Enviando datos:", JSON.stringify(lugar, null, 2)); // 📌 DEBUG

      const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}/mapa`, { 
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lugar),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      Swal.fire({
        title: "✅ OK!",
        text: "Mapa guardado correctamente.",
        icon: "success",
        confirmButtonText: "Genial!"
      }).then(() => {
        navigate("/admin/mis-lugares"); // 🔥 Redirigir al listado de lugares
      });

    } else {
      throw new Error(data.message || "No se pudo guardar");
    }
  } catch (error) {
    console.error("❌ Error al guardar el mapa:", error);
    Swal.fire("💩 A shit!", "Hubo un problema al guardar el mapa.", "error");
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
              const pathX = e.nativeEvent.offsetX;
              const pathY = e.nativeEvent.offsetY;
              const anchoAsiento = 30; // Ajustar según el tamaño real del asiento
              const altoAsiento = 30; 

              // Restamos la mitad para centrarlo
              const ajustedX = pathX - anchoAsiento / 2;
              const ajustedY = pathY - altoAsiento / 2;

              // 🟡 Guardar las coordenadas en el backend
              handleMapearAsiento(ajustedX, ajustedY);
              setSelectedAsiento(null);
            }
          }}
        >


          {/* 🔥 Imagen de fondo del mapa */}
          <image x="0" y="0" width="100%" height="100%" href={`${config.BACKEND_URL}/img/lugares/${lugar.mapaImagen}`} />

          {/* 🔥 Dibujar rectángulos en el mapa */}
          {rectangles.map((rect, index) => (
            <g key={index} transform={`translate(${rect.x}, ${rect.y})`}>
              <path
                d="M20.8,6.7V2.8c0-1.5-1.4-2.8-3-2.8H6.9c-1.7,0-3,1.3-3,2.8v3.9C1.7,7,0,8.9,0,11.2v9.6c0,2.5,2,4.5,4.4,4.5  h15.9c2.4,0,4.4-2,4.4-4.5v-9.6C24.7,8.8,23,7,20.8,6.7z"
                fill="yellow"
                opacity="0.5"
                stroke="black"
                strokeWidth="1"
              />
               {/* 🔤 Nombre del asiento (centrado y pequeño) */}
                <text
                  x="12"  // 🔥 Ajustamos para centrarlo dentro del asiento
                  y="16"  // 🔥 Ajustamos la posición vertical
                  fontSize="10px" // 🔥 Hacemos el texto pequeño
                  fontFamily="Arial, sans-serif"
                  fill="black"
                  textAnchor="middle"
                >
                  {rect.asiento}
                </text>
            </g>
          ))}
        </svg>
        <div className="asientosLista">
          <h3>Selecciona un asiento para mapearlo:</h3>
          <div className="alert">
            Selecciona los asientos en la lista de la derecha, y luego marca en el map su posición aproximada. 
          </div>
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
                          onClick={() => handleSeleccionarAsiento({ 
                              id: asiento._id, 
                              sectorId: sector._id, 
                              filaId: fila._id,
                              nombre: asiento.nombreAsiento
                          })}
                          className={`asiento-btn ${asientoEstados[asiento._id]}`}
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
            <button onClick={handleGuardarMapa} className="guardarMapa">
              Guardar Mapeo
            </button>
      
      <div className="adminPanel__cont--zona3">
          <AdminTools />
        </div>
      
      </div>
      


    </main>
  );
}

export default AdminMapaAsientos;
