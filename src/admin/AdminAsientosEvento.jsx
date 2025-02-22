import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import config from "../config";
import Swal from "sweetalert2";
import { FaPlus } from "react-icons/fa";

function AdminAsientosEvento() {
  const { id } = useParams(); // ID del evento
  const navigate = useNavigate();
  const [sectores, setSectores] = useState([]);

  useEffect(() => {
    const fetchSectores = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/eventos/${id}/sectores`);
        if (!response.ok) throw new Error("Error obteniendo sectores del evento");
        const data = await response.json();
        setSectores(data || []);
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
    const nombreFila = fila.nombreFila || "X";

    const nuevosAsientos = Array.from({ length: cantidad }, (_, i) => ({
      nombreAsiento: `${nombreFila}${fila.asientos.length + i + 1}`,
      ocupado: false,
    }));

    fila.asientos = [...fila.asientos, ...nuevosAsientos];
    setSectores(updatedSectores);
  };

  const handleRemoveAsiento = (sectorIndex, filaIndex) => {
    const updatedSectores = [...sectores];
    const fila = updatedSectores[sectorIndex].filas[filaIndex];

    // Buscar el último asiento que esté libre
    const ultimoLibreIndex = fila.asientos.map(a => a.ocupado).lastIndexOf(false);

    if (ultimoLibreIndex === -1) {
      Swal.fire("Error", "No hay asientos libres para eliminar.", "error");
      return;
    }

    // Eliminar el último asiento libre
    fila.asientos.splice(ultimoLibreIndex, 1);
    setSectores(updatedSectores);
  };

    
    const handleRemoveAllAsientos = (sectorIndex, filaIndex) => {
        const updatedSectores = [...sectores];
        const fila = updatedSectores[sectorIndex].filas[filaIndex];

        // Verificar si hay asientos ocupados
        if (fila.asientos.some(asiento => asiento.ocupado)) {
            Swal.fire("Error", "No puedes eliminar todos los asientos porque hay asientos ocupados.", "error");
            return;
        }

        fila.asientos = [];
        setSectores(updatedSectores);
    };

  const handleRemoveFila = (sectorIndex, filaIndex) => {
    const updatedSectores = [...sectores];
    const fila = updatedSectores[sectorIndex].filas[filaIndex];

    // Verificar si hay asientos ocupados
    if (fila.asientos.some(asiento => asiento.ocupado)) {
      Swal.fire("Error", "No puedes eliminar esta fila porque hay asientos ocupados.", "error");
      return;
    }

    Swal.fire({
      title: "¿Eliminar esta fila?",
      text: "Esto eliminará la fila y sus asientos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        updatedSectores[sectorIndex].filas.splice(filaIndex, 1);
        setSectores(updatedSectores);
        Swal.fire("Eliminado", "La fila ha sido eliminada.", "success");
      }
    });
  };


  const handleRemoveSector = (sectorIndex) => {
    const updatedSectores = [...sectores];
    const sector = updatedSectores[sectorIndex];

    // Verificar si hay asientos ocupados en alguna fila del sector
    const hayAsientosOcupados = sector.filas.some(fila => fila.asientos.some(asiento => asiento.ocupado));

    if (hayAsientosOcupados) {
      Swal.fire("Error", "No puedes eliminar este sector porque hay asientos ocupados.", "error");
      return;
    }

    Swal.fire({
      title: "⚠️ ¿Estás seguro?",
      html: `<span>Se eliminarán todos los datos de este sector.</span><br/><br/>Escribe: <strong>eliminar-sector</strong>`,
      input: "text",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (value !== "eliminar-sector") {
          return "Debes escribir exactamente 'eliminar-sector'";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updatedSectores.splice(sectorIndex, 1);
        setSectores(updatedSectores);
        Swal.fire("Eliminado", "El sector ha sido eliminado.", "success");
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

      const response = await fetch(`${config.BACKEND_URL}/api/eventos/${id}/sectores`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ sectores }),
      });

      const data = await response.json();
      console.log("📌 Respuesta del servidor:", data);

      if (response.ok) {
        Swal.fire("Éxito", "Sectores actualizados", "success");
        navigate("/eventosadmin");
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
      <h2>Editar Sectores y Asientos del Evento</h2>
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
                  <h4>Fila: {fila.nombreFila}</h4>
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
                      {fila.asientos.map((asiento, asientoIndex) => {
                        // Encontrar el último asiento libre en la fila
                        const ultimoLibreIndex = fila.asientos.map(a => a.ocupado).lastIndexOf(false);

                        return (
                          <div key={asientoIndex} className={`asientos__item ${asiento.ocupado ? "ocupado" : "libre"}`}>
                            <span>{asiento.nombreAsiento}</span>
                            {/* Mostrar el botón SOLO en el último asiento libre */}
                            {asientoIndex === ultimoLibreIndex && (
                              <button onClick={() => handleRemoveAsiento(sectorIndex, filaIndex)}>x</button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="asientos-tools">
                      <span>Agregar asientos: </span>
                      <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 1)}>+ 1</button>
                      <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 10)}>+ 10</button>
                              <button onClick={() => handleAddAsiento(sectorIndex, filaIndex, 50)}>+ 50</button>
                              <button onClick={() => handleRemoveAllAsientos(sectorIndex, filaIndex)} className="eliminar">
  Borrar todos los asientos
</button>

                    </div>
                  </div>
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
      <div className="refeAsientos">
        <div className="asientos__item ocupado">
          <small>Ocupado</small>
        </div>
        <div className="asientos__item libre">
          <small>Libre</small>
        </div>
      </div>
    </main>
  );
}

export default AdminAsientosEvento;
