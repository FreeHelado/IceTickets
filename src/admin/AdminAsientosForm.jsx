import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import config from "../config";
import Swal from "sweetalert2";
import { FaPlus } from "react-icons/fa";

function AdminAsientosForm() {
  const { id } = useParams(); // ID del lugar
  const navigate = useNavigate();
  const [sectores, setSectores] = useState([]);

  useEffect(() => {
    const fetchSectores = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}`);
        if (!response.ok) throw new Error("Error obteniendo el lugar");
        const data = await response.json();
        setSectores(data.sectores || []);
      } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire("Error", "No se pudieron cargar los sectores", "error");
      }
    };
    fetchSectores();
  }, [id]);

  const handleAddSector = () => {
    setSectores([...sectores, { nombreSector: "", filas: [] }]);
  };

  const handleAddFila = (sectorIndex) => {
    const updatedSectores = [...sectores];
    updatedSectores[sectorIndex].filas.push({ nombreFila: "", asientos: [] });
    setSectores(updatedSectores);
  };

    const handleAddAsiento = (sectorIndex, filaIndex, cantidad) => {
        const updatedSectores = [...sectores];
        const fila = updatedSectores[sectorIndex].filas[filaIndex];
        const nombreFila = fila.nombreFila || "X"; // Si la fila no tiene nombre, usamos "X"

        const nuevosAsientos = Array.from({ length: cantidad }, (_, i) => ({
            nombreAsiento: `${nombreFila}${fila.asientos.length + i + 1}`, // A1, A2, A3...
            ocupado: false,
        }));

        fila.asientos = [...fila.asientos, ...nuevosAsientos];
        setSectores(updatedSectores);
    };

    const handleRemoveAsiento = (sectorIndex, filaIndex) => {
    const updatedSectores = [...sectores];
    const fila = updatedSectores[sectorIndex].filas[filaIndex];

    if (fila.asientos.length > 0) {
        fila.asientos.pop(); // 🔥 Borra el último asiento
        setSectores(updatedSectores);
    }
    };

    const handleRemoveAllAsientos = (sectorIndex, filaIndex) => {
        const updatedSectores = [...sectores];
        updatedSectores[sectorIndex].filas[filaIndex].asientos = []; // 🔥 Borra todos los asientos
        setSectores(updatedSectores);
    };

    const handleRemoveFila = (sectorIndex, filaIndex) => {
        const updatedSectores = [...sectores];
        updatedSectores[sectorIndex].filas.splice(filaIndex, 1); // 🗑️ Borra la fila en el índice indicado
        setSectores(updatedSectores);
    };


    const handleRemoveSector = (sectorIndex) => {
        const updatedSectores = [...sectores];
        updatedSectores.splice(sectorIndex, 1); // 🗑️ Borra el sector completo
        setSectores(updatedSectores);
     };


  
    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
            Swal.fire("Error", "No tienes permiso para esta acción", "error");
            return;
            }

            // 📦 Mandamos solo los sectores
            const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}/sectores`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token, // ✅ Enviamos el token en el header
            },
            body: JSON.stringify({ sectores }), // ✅ Solo enviamos sectores
            });

            const data = await response.json();
            console.log("📌 Respuesta del servidor:", data);

            if (response.ok) {
            Swal.fire("Éxito", "Sectores actualizados", "success");
            navigate("/admin/mis-lugares");
            } else {
            Swal.fire("Error", data.message || "No se pudo guardar", "error");
            }
        } catch (error) {
            console.error("❌ Error al guardar:", error);
            Swal.fire("Error", "Hubo un problema en el servidor", "error");
        }
    };





  return (
    <main className="adminPanel admin-eventos selecAcientos">
      <h2>Editar Sectores y Asientos:</h2>
      {sectores.map((sector, sectorIndex) => (
          <div key={sectorIndex} className="sector">
              <h3>{sector.nombreSector}</h3>
              <div className="sectorBox">    
                  <div className="campoForm">
                      <label>Nombre del sector</label>
                        <input
                            type="text"
                            value={sector.nombreSector}
                            onChange={(e) => {
                            const updatedSectores = [...sectores];
                            updatedSectores[sectorIndex].nombreSector = e.target.value;
                            setSectores(updatedSectores);
                            }}
                            placeholder="Nombre del sector"
                        />
                  </div>
                  <div className="filas">
                    <h4>Filas</h4>  

                    {sector.filas.map((fila, filaIndex) => (
                        <div key={filaIndex} className="campoForm">
                        <label>Nombre de la fila</label>
                        <input
                            type="text"
                            value={fila.nombreFila}
                            onChange={(e) => {
                            const updatedSectores = [...sectores];
                            updatedSectores[sectorIndex].filas[filaIndex].nombreFila = e.target.value;
                            setSectores(updatedSectores);
                            }}
                            placeholder="Nombre de la fila"
                            />
                            
                         <button onClick={() => handleRemoveFila(sectorIndex, filaIndex)}>
                            ❌ Borrar Fila
                        </button>
   

                        <div className="asientos">
                            <h5>Asientos</h5>

                            {fila.asientos.map((asiento, asientoIndex) => (
                            <div key={asientoIndex} className="asientos__item">
                                <span>{asiento.nombreAsiento}</span>
                                <small>{asiento.ocupado ? "Ocupado" : "Disponible"}</small>
                                {asientoIndex === fila.asientos.length - 1 && (
                                <button onClick={() => handleRemoveAsiento(sectorIndex, filaIndex)}>Borrar Último Asiento</button>
                                )}
                            </div>
                            ))}

                            <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 1)}>Agregar 1 asiento</button>
                            <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 10)}>Agregar 10 asientos</button>
                            <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 50)}>Agregar 50 asientos</button>
                            <button onClick={() => handleRemoveAllAsientos(sectorIndex, filaIndex)}>Borrar todos los asientos</button>
                        </div>

                        <hr/>
                        </div>
                    ))}

                    <button onClick={() => handleAddFila(sectorIndex)}>
                        <i><FaPlus /></i>
                        <span>Agregar Fila</span>
                    </button>
                </div>
 
              </div>
                    <button onClick={() => handleRemoveSector(sectorIndex)}>
  ❌ Borrar Sector
</button>

          </div>
      ))}
      <button onClick={handleAddSector}>Agregar Sector</button>
      <button onClick={handleSave}>Guardar Cambios</button>
    </main>
  );
}

export default AdminAsientosForm;
