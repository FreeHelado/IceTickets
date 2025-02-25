import express from "express";
import mongoose from "mongoose";
import Evento from "../models/Evento.js";
import verificarToken from "../middleware/auth.js";

const router = express.Router();

/* ==============================
   GET /api/eventos/:id/sectores
   Obtener los sectores de un evento
================================= */
router.get("/:id/sectores", async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de evento no válido" });
        }

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        

        res.json(evento.sectores);
    } catch (error) {
        console.error("❌ Error al obtener sectores del evento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});


router.post("/:id/liberar-asiento", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { sectorId, fila, asiento, usuarioId } = req.body;

        console.log("🚀 Recibiendo solicitud de liberación de asiento", { sectorId, fila, asiento, usuarioId });

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        const sector = evento.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        const filaEncontrada = sector.filas.find(f => f.nombreFila === fila);
        if (!filaEncontrada) return res.status(404).json({ message: "Fila no encontrada" });

        const asientoEncontrado = filaEncontrada.asientos.find(a => a.nombreAsiento === asiento);
        if (!asientoEncontrado) return res.status(404).json({ message: "Asiento no encontrado" });

        if (!asientoEncontrado.reservado) {
            return res.status(400).json({ message: "El asiento no estaba reservado" });
        }

        // 🔥 Verificar que el usuario que libera sea el mismo que reservó
        if (asientoEncontrado.usuarioReserva.toString() !== usuarioId) {
            return res.status(400).json({ message: "No puedes liberar un asiento reservado por otro usuario" });
        }

        // 🔥 Liberamos el asiento
        asientoEncontrado.reservado = false;
        asientoEncontrado.usuarioReserva = null;
        asientoEncontrado.expiracionReserva = null;

        await evento.save();

        console.log(`✅ Asiento ${asiento} liberado correctamente.`);
        res.json({ message: "Asiento liberado", asiento: asientoEncontrado });

    } catch (error) {
        console.error("❌ Error al liberar asiento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});


/* ==============================
   PUT /api/eventos/:id/sectores
   Actualizar sectores, filas y asientos de un evento
================================= */
router.put("/:id/sectores", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, isAdmin } = req.user;
        const { sectores } = req.body;

        if (!sectores) {
            return res.status(400).json({ message: "No se enviaron sectores" });
        }

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        // 🔒 Verificar permisos (Admin o creador del evento)
        if (!isAdmin && evento.vendedor.toString() !== userId) {
            return res.status(403).json({ message: "No tienes permiso para modificar los sectores de este evento" });
        }

        // 🔥 Actualizamos solo los sectores
        evento.sectores = sectores;

        await evento.save();
        res.json({ message: "Sectores actualizados con éxito", sectores });
    } catch (error) {
        console.error("❌ Error al actualizar sectores del evento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

/* ==============================
   POST /api/eventos/:id/sectores
   Agregar un nuevo sector a un evento
================================= */
router.post("/:id/sectores", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreSector, filas, asientosPorFila } = req.body;

        if (!nombreSector || !filas || !asientosPorFila) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        // Generar filas con asientos numerados automáticamente
        const nuevasFilas = [];
        for (let i = 0; i < filas; i++) {
            const nombreFila = String.fromCharCode(65 + i); // A, B, C...
            const asientos = Array.from({ length: asientosPorFila }, (_, index) => ({
                nombreAsiento: `${nombreFila}${index + 1}`,
                ocupado: false,
            }));
            nuevasFilas.push({ nombreFila, asientos });
        }

        // Agregar nuevo sector al evento
        evento.sectores.push({ nombreSector, filas: nuevasFilas });
        await evento.save();

        res.status(201).json(evento);
    } catch (error) {
        console.error("❌ Error al agregar sector al evento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

/* ==============================
   DELETE /api/eventos/:id/sectores/:sectorId
   Eliminar un sector de un evento
================================= */
// router.delete("/:id/sectores/:sectorId", verificarToken, async (req, res) => {
//     try {
//         const { id, sectorId } = req.params;

//         const evento = await Evento.findById(id);
//         if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

//         evento.sectores = evento.sectores.filter((s) => s._id.toString() !== sectorId);
//         await evento.save();

//         res.json({ message: "Sector eliminado con éxito" });
//     } catch (error) {
//         console.error("❌ Error al eliminar sector del evento:", error);
//         res.status(500).json({ message: "Error en el servidor" });
//     }
// });

/* ==============================
   POST /api/eventos/:id/sectores/:sectorId/filas
   Agregar una fila a un sector de un evento
================================= */
router.post("/:id/sectores/:sectorId/filas", verificarToken, async (req, res) => {
    try {
        const { id, sectorId } = req.params;
        const { asientos } = req.body;

        if (!asientos) {
            return res.status(400).json({ message: "Debe especificar la cantidad de asientos" });
        }

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        const sector = evento.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        const nombreFila = String.fromCharCode(65 + sector.filas.length);
        const nuevosAsientos = Array.from({ length: asientos }, (_, index) => ({
            nombreAsiento: `${nombreFila}${index + 1}`,
            ocupado: false,
        }));

        sector.filas.push({ nombreFila, asientos: nuevosAsientos });
        await evento.save();

        res.status(201).json(evento);
    } catch (error) {
        console.error("❌ Error al agregar fila al evento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

/* ==============================
   PUT /api/eventos/:id/sectores/:sectorId/filas/:filaId/asientos/:asientoId
   Marcar un asiento como ocupado
================================= */
router.put("/:id/sectores/:sectorId/filas/:filaId/asientos/:asientoId", verificarToken, async (req, res) => {
    try {
        const { id, sectorId, filaId, asientoId } = req.params;
        const { ocupado } = req.body;

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        const sector = evento.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        const fila = sector.filas.id(filaId);
        if (!fila) return res.status(404).json({ message: "Fila no encontrada" });

        const asiento = fila.asientos.id(asientoId);
        if (!asiento) return res.status(404).json({ message: "Asiento no encontrado" });

        asiento.ocupado = ocupado; // 🔥 Aquí se marca el asiento como ocupado
        await evento.save();

        console.log("📌 Asiento actualizado en la BD:", asiento); // ✅ DEBUG

        res.json({ message: "Asiento actualizado", asiento });
    } catch (error) {
        console.error("❌ Error al actualizar asiento en el evento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});



/* ==============================
   GET "/:id/sectores/:sectorId
   Obtiene nombre del sector por ID
================================= */
router.get("/:id/sectores/:sectorId", async (req, res) => {
    try {
        const { id, sectorId } = req.params;

        console.log("📌 Buscando sector en el evento:", { id, sectorId });

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sectorId)) {
            console.error("⚠️ ID de evento o sector no válido");
            return res.status(400).json({ message: "ID de evento o sector no válido" });
        }

        const evento = await Evento.findById(id);
        if (!evento) {
            console.error("❌ Evento no encontrado");
            return res.status(404).json({ message: "Evento no encontrado" });
        }

        // 🔍 Buscar el sector correctamente dentro del array de sectores
        const sector = evento.sectores.find(s => s._id.toString() === sectorId);
        
        console.log("📌 Sector encontrado:", sector);

        if (!sector) {
            console.error("❌ Sector no encontrado en este evento");
            return res.status(404).json({ message: "Sector no encontrado en este evento" });
        }

        res.json({ nombre: sector.nombreSector });

    } catch (error) {
        console.error("❌ Error al obtener nombre del sector:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});


/* ==============================
   PUT /:id/sectores/:sectorId/deshabilitar
  PARA DESHABBILITAR
================================= */
router.put("/:id/sectores/:sectorId/toggle-disponible", verificarToken, async (req, res) => {
    try {
        const { id, sectorId } = req.params;

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        const sector = evento.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        sector.disponible = !sector.disponible; // 🔥 Alternar estado
        await evento.save();

        res.json({ message: `Sector ${sector.disponible ? "habilitado" : "deshabilitado"} con éxito`, sector });
    } catch (error) {
        console.error("❌ Error al alternar disponibilidad del sector:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

router.put("/:id/sectores/:sectorId/filas/:filaId/toggle-disponible", verificarToken, async (req, res) => {
    try {
        const { id, sectorId, filaId } = req.params;

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        const sector = evento.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        const fila = sector.filas.id(filaId);
        if (!fila) return res.status(404).json({ message: "Fila no encontrada" });

        fila.disponible = !fila.disponible; // 🔥 Alternar estado
        await evento.save();

        res.json({ message: `Fila ${fila.disponible ? "habilitada" : "deshabilitada"} con éxito`, fila });
    } catch (error) {
        console.error("❌ Error al alternar disponibilidad de la fila:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

router.put("/:id/sectores/:sectorId/filas/:filaId/asientos/:asientoId/toggle-disponible", verificarToken, async (req, res) => {
    try {
        const { id, sectorId, filaId, asientoId } = req.params;

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

        const sector = evento.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        const fila = sector.filas.id(filaId);
        if (!fila) return res.status(404).json({ message: "Fila no encontrada" });

        const asiento = fila.asientos.id(asientoId);
        if (!asiento) return res.status(404).json({ message: "Asiento no encontrado" });

        asiento.disponible = !asiento.disponible; // 🔥 Alternar estado
        await evento.save();

        res.json({ message: `Asiento ${asiento.disponible ? "habilitado" : "deshabilitado"} con éxito`, asiento });
    } catch (error) {
        console.error("❌ Error al alternar disponibilidad del asiento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});




export default router;
