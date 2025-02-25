import express from "express";
import Evento from "../models/Evento.js";
import User from "../models/User.js";
import Lugar from "../models/Lugar.js";
import verificarToken from "../middleware/auth.js";
import mongoose from "mongoose";
import { format } from "date-fns";

const router = express.Router();

/* =====================================
🔍 Obtener todos los eventos (sin autenticación)
===================================== */
router.get("/", async (req, res) => {
  try {
    const eventos = await Evento.find();

    eventos.forEach(evento => {
      evento.actualizarEstado();
      evento.save();
    });

    res.json(eventos);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
});



/* =====================================
🔍 Obtener un evento por ID (sin autenticación)
===================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validar que el ID sea de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }

    // ✅ Buscar el evento con los datos necesarios
    const evento = await Evento.findById(id).select(
      "nombre fecha hora descripcion stock estado imagen precios categoria lugar vendedor sociosProductores publico tags infoAdicional seleccionAsientos sectores controlPuerta"
    );

    if (!evento) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    // 🔍 Buscar emails de sociosProductores
    const sociosInfo = await User.find(
      { _id: { $in: evento.sociosProductores || [] } },
      "email _id"
    );

    // 🔥 Actualizamos el estado automáticamente
    evento.actualizarEstado();
    await evento.save();

    // Convertimos los sociosProductores en { _id, email }
    const sociosProductores = sociosInfo.map(user => ({
      _id: user._id,
      email: user.email
    }));

    // ✅ Convertimos el evento en un objeto para modificarlo
    const eventoObj = evento.toObject();

    // 🔥 COMPATIBILIDAD CON EVENTOS VIEJOS 🔥
    eventoObj.sectores.forEach(sector => {
        sector.filas.forEach(fila => {
            fila.asientos.forEach(asiento => {
                if (asiento.reservado === undefined) asiento.reservado = false;
                if (!asiento.usuarioReserva) asiento.usuarioReserva = null;
                if (!asiento.expiracionReserva) asiento.expiracionReserva = null;
            });
        });
    });

    // ✅ Devolvemos el evento corregido con los socios actualizados
    res.json({
      ...eventoObj, // 🔥 Ahora sí, usamos el evento corregido
      sectores: eventoObj.sectores || [], // 🔥 Siempre trae los sectores
      sociosProductores // ✅ Ahora tiene los emails
    });

  } catch (error) {
    console.error("❌ Error al obtener el evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



/* ====================================
✨ Crear un evento (protegido con autenticación)
===================================== */
router.post("/", verificarToken, async (req, res) => {
  try {
    const {
      nombre,
      fecha,
      hora,
      descripcion,
      stock,
      estado,
      imagen,
      precios,
      categoria,
      lugar,
      sociosProductoresEmails,
      publico,
      tags,
      infoAdicional,
      seleccionAsientos,
      sectores = [],
      controlPuerta
    } = req.body;


    // ✅ Convertir fecha a Date antes de guardarla
    const fechaConvertida = new Date(fecha);

    // 💰 Convertir `monto` a número antes de guardarlo
    const preciosProcesados = precios.map(precio => ({
      nombre: precio.nombre,
      monto: Number(precio.monto),
      disponibles: Number(precio.disponibles),
      sector: precio.sector ? new mongoose.Types.ObjectId(precio.sector) : null // 🔥 Guardamos el ObjectId del sector
    }));

    // 🔥 Calculamos `aforo` sumando todas las entradas disponibles
    const aforoCalculado = preciosProcesados.reduce((total, precio) => total + precio.disponibles, 0);

    // ✅ Asignar automáticamente el usuario autenticado como vendedor
    const vendedor = req.user.userId;

    let sectoresEvento = sectores; // Usamos los sectores si ya se enviaron
    // 🔥 Si NO hay sectores enviados, intentamos obtenerlos del lugar
    if (sectores.length === 0 && lugar) {
        const lugarDB = await Lugar.findById(lugar).select("sectores");
        if (lugarDB && lugarDB.sectores.length > 0) {
            sectoresEvento = lugarDB.sectores; // Asignamos los sectores del lugar
        }
    }

    // 🔍 Buscar IDs de sociosProductores a partir de emails
    let sociosProductores = [];
    if (sociosProductoresEmails && sociosProductoresEmails.length > 0) {
        const usuariosEncontrados = await User.find({ email: { $in: sociosProductoresEmails } }, "_id");
        sociosProductores = usuariosEncontrados.map(user => user._id);
    }

    const nuevoEvento = new Evento({
      nombre,
      fecha: fechaConvertida, // ✅ Guardamos el Date correctamente
      hora,
      descripcion,
      stock: { 
        aforo: aforoCalculado,  
        vendidas: Number(stock.vendidas) || 0 
      },
      estado,
      imagen,
      precios: preciosProcesados, // $ Guardamos precios convertidos
      categoria,
      lugar,
      vendedor,
      sociosProductores,
      publico,
      tags,
      infoAdicional,
      seleccionAsientos: seleccionAsientos || false,
      sectores: sectoresEvento,
      controlPuerta 
    });

    await nuevoEvento.save();
    res.status(201).json({ message: "Evento creado exitosamente", evento: nuevoEvento });
  } catch (error) {
    console.error("❌ Error al crear evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
// ✨ Actualizar un evento (requiere autenticación)
===================================== */
router.put("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sectores, controlPuerta, ...updateData } = req.body;

    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }

    const evento = await Evento.findById(id);
    if (!evento) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    // ✅ Validar que `controlPuerta` tenga `numeroEvento` y `clave`
    if (controlPuerta && (!controlPuerta.numeroEvento || !controlPuerta.clave)) {
      return res.status(400).json({ message: "Faltan datos de controlPuerta (numeroEvento y clave)" });
    }

    // Si hay sectores en la actualización, respetamos su estado actual
    if (sectores && sectores.length > 0) {
      sectores.forEach(nuevoSector => {
        const sectorExistente = evento.sectores.id(nuevoSector._id);
        if (sectorExistente) {
          nuevoSector.disponible = sectorExistente.disponible; // 🔥 Mantener estado disponible
          nuevoSector.filas.forEach(nuevaFila => {
            const filaExistente = sectorExistente.filas.id(nuevaFila._id);
            if (filaExistente) {
              nuevaFila.disponible = filaExistente.disponible; // 🔥 Mantener estado disponible
              nuevaFila.asientos.forEach(nuevoAsiento => {
                const asientoExistente = filaExistente.asientos.id(nuevoAsiento._id);
                if (asientoExistente) {
                  nuevoAsiento.disponible = asientoExistente.disponible; // 🔥 Mantener estado disponible
                }
              });
            }
          });
        }
      });
    }

    // 🔥 Preparamos la actualización, agregando `controlPuerta` solo si se envía
    const updateFields = { ...updateData, sectores };
    if (controlPuerta) {
      updateFields.controlPuerta = controlPuerta;
    }

    // ✅ Actualizamos el evento con los nuevos datos
    const eventoActualizado = await Evento.findByIdAndUpdate(id, updateFields, { new: true });


    res.json({ message: "Evento actualizado correctamente", evento: eventoActualizado });

  } catch (error) {
    console.error("❌ Error al actualizar el evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



/* =====================================
// 🗑 Eliminar un evento por ID (requiere autenticaciÃ³n)
===================================== */
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const eventoEliminado = await Evento.findByIdAndDelete(id);

    if (!eventoEliminado) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    res.json({ message: "Evento eliminado correctamente" });
  } catch (error) {
    console.error("â Error al eliminar evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



/* =====================================
// RESERVA DE ASIENTO
===================================== */
router.post("/:id/reservar-asiento", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { sectorId, fila, asiento, usuarioId } = req.body;

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        const sector = evento.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        const filaEncontrada = sector.filas.find(f => f.nombreFila === fila);
        if (!filaEncontrada) return res.status(404).json({ message: "Fila no encontrada" });

        const asientoEncontrado = filaEncontrada.asientos.find(a => a.nombreAsiento === asiento);
        if (!asientoEncontrado) return res.status(404).json({ message: "Asiento no encontrado" });

        if (asientoEncontrado.ocupado) return res.status(400).json({ message: "Asiento ya vendido" });

        // 🔥 COMPATIBILIDAD CON EVENTOS EXISTENTES 🔥
        if (asientoEncontrado.reservado === undefined) asientoEncontrado.reservado = false;
        if (!asientoEncontrado.usuarioReserva) asientoEncontrado.usuarioReserva = null;
        if (!asientoEncontrado.expiracionReserva) asientoEncontrado.expiracionReserva = null;

        // Si ya está reservado por otro usuario, bloqueamos
        if (asientoEncontrado.reservado && asientoEncontrado.usuarioReserva.toString() !== usuarioId) {
            return res.status(400).json({ message: "Asiento ya reservado por otro usuario" });
        }

        // 🔥 Reservar asiento por 10 minutos
        asientoEncontrado.reservado = true;
        asientoEncontrado.usuarioReserva = usuarioId;
        asientoEncontrado.expiracionReserva = new Date(Date.now() + 10 * 60 * 1000);

        await evento.save();

        res.json({ message: "Asiento reservado con éxito", asiento: asientoEncontrado });
    } catch (error) {
        console.error("Error reservando asiento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});





export default router;
