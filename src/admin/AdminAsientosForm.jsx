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

  const handleAddAsientos = (sectorIndex, filaIndex, cantidad) => {
    const updatedSectores = [...sectores];
    const nombreFila = updatedSectores[sectorIndex].filas[filaIndex].nombreFila || "X";
    updatedSectores[sectorIndex].filas[filaIndex].asientos = Array.from(
      { length: cantidad },
      (_, i) => `${nombreFila}${i + 1}`
    );
    setSectores(updatedSectores);
  };

  const handleSave = async () => {
  try {
    const token = localStorage.getItem("token");

    const payload = { sectores };
    console.log("📦 Datos enviados:", JSON.stringify(payload, null, 2)); // 🔥 Ver qué se está mandando

    const response = await fetch(`${config.BACKEND_URL}/api/lugares/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("📌 Respuesta del servidor:", data); // 🔥 Ver qué responde el backend

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
                        <button onClick={() => handleAddAsientos(sectorIndex, filaIndex, 10)}>
                            Agregar 10 Asientos
                        </button>
                        <p>Asientos: {fila.asientos.join(", ")}</p>
                        <hr/>
                        </div>
                    ))}
                      <button onClick={() => handleAddFila(sectorIndex)}>
                          <i><FaPlus /></i>
                          <span>Agregar Fila</span>
                      </button>
                  </div>  
              </div>
        </div>
      ))}
      <button onClick={handleAddSector}>Agregar Sector</button>
      <button onClick={handleSave}>Guardar Cambios</button>
    </main>
  );
}

export default AdminAsientosForm;
