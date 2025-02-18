import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";

function AdminOrdenesEvento() {
  const { idEvento } = useParams();
  const [evento, setEvento] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarOrdenes = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`http://localhost:5000/api/ordenes/evento/${idEvento}`, {
          headers: { Authorization: token }
        });

        if (!response.ok) {
          throw new Error("No autorizado o error en la carga");
        }

        const data = await response.json();
        setEvento(data.evento);
        setOrdenes(data.ordenes);
      } catch (error) {
        console.error("❌ Error al cargar órdenes:", error);
        Swal.fire("Error", "No se pudieron cargar las órdenes", "error");
      } finally {
        setCargando(false);
      }
    };

    cargarOrdenes();
  }, [idEvento]);

  if (cargando) return <p>Cargando órdenes...</p>;
  if (!evento) return <p>Error al cargar evento.</p>;

  return (
    <div className="adminPanel">
      <h2>Órdenes de {evento.nombre}</h2>
      
      <div className="infoEvento">
        <p><strong>Aforo:</strong> {evento.stock.aforo}</p>
        <p><strong>Vendidas:</strong> {evento.stock.vendidas}</p>
      </div>

      <h3>Lista de Órdenes</h3>
      {ordenes.length > 0 ? (
        <table className="tablaOrdenes">
          <thead>
            <tr>
              <th>Comprador</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Total</th>
              <th>Método de Pago</th>
              <th>Estado</th>
              <th>Fecha Compra</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map(orden => (
              <tr key={orden._id}>
                <td>{orden.comprador.nombre}</td>
                <td>{orden.comprador.email}</td>
                <td>{orden.comprador.telefono}</td>
                <td>${orden.total}</td>
                <td>{orden.metodoPago}</td>
                <td>{orden.estado}</td>
                <td>{new Date(orden.fechaCompra).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay órdenes registradas aún.</p>
      )}
    </div>
  );
}

export default AdminOrdenesEvento;
