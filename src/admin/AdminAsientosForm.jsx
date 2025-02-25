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
        Swal.fire({
            title: "¿Eliminar esta fila?",
            text: "Esta acción eliminará la fila y sus asientos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
            const updatedSectores = [...sectores];
            updatedSectores[sectorIndex].filas.splice(filaIndex, 1);
            setSectores(updatedSectores);
            
            Swal.fire("Eliminado", "La fila ha sido eliminada con éxito.", "success");
            }
        });
    };


    const handleRemoveSector = (sectorIndex) => {
        Swal.fire({
            title: "⚠️ ¿Estás seguro de eliminar este sector?",
            html: `<span style="font-size:15px;">Todos los datos de este sector, incluyendo filas y asientos, se perderán.</span><br/><br/>Para confirmar escribe: <strong> aplicar-cambio-destructivo</strong>`,
            input: "text",
            inputPlaceholder: "escribe aquí:",
            showCancelButton: true,
            confirmButtonText: "⚠ Eliminar Sector",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => {
            if (value !== "aplicar-cambio-destructivo") {
                return "Debes escribir exactamente 'Aplicar cambio destructivo'";
            }
            }
        }).then((result) => {
            if (result.isConfirmed) {
            const updatedSectores = [...sectores];
            updatedSectores.splice(sectorIndex, 1);
            setSectores(updatedSectores);
            
            Swal.fire("Eliminado", "El sector ha sido eliminado con éxito.", "success");
            }
        });
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
              <h3>Sector: {sector.nombreSector}</h3>
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
                    {sector.filas.map((fila, filaIndex) => (
                        <div key={filaIndex} className="filas__item">
                            <h4>Filas: {fila.nombreFila}</h4>  
                            <div className="campoForm">
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
                                    
                                <button onClick={() => handleRemoveFila(sectorIndex, filaIndex)} className="borrarFila">
                                    <span>X</span>
                                </button>

                            </div>
                        

                            <div className="asientos__cont">
                                <h6>Asientos de la Fila: {fila.nombreFila}</h6>

                                <div className="asientos">
                                {fila.asientos.map((asiento, asientoIndex) => (
                                    <div
                                        key={asientoIndex}
                                        className={`asientos__item ${asiento.ocupado ? "ocupado" : "libre"}`}
                                    >
                                        <span>{asiento.nombreAsiento}</span>

                                        {asientoIndex === fila.asientos.length - 1 && !asiento.ocupado && (
                                            <button onClick={() => handleRemoveAsiento(sectorIndex, filaIndex)}>x</button>
                                        )}
                                    </div>
                                ))}
                                </div>

                                <div className="asientos-tools">
                                    <span>Agregar asientos: </span>
                                    <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 1)}>+ 1</button>
                                    <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 10)}>+ 10</button>
                                    <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 50)}>+ 50</button>
                                    <button onClick={() => handleRemoveAllAsientos(sectorIndex, filaIndex)} className="eliminar">Borrar todos los asientos</button>
                                </div>
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
            <button onClick={() => handleRemoveSector(sectorIndex)} className="borrarSector">Borrar Sector</button>

          </div>
      ))}
          <button onClick={handleAddSector} className="agregarSector">
              <i><FaPlus /></i>
              <span> Agregar Sector</span>
          </button>
      <button onClick={handleSave} className="enviarCambios">Guardar Cambios</button>
    </main>
  );
}

export default AdminAsientosForm;
