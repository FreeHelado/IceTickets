import express from "express";
import Orden from "../models/Orden.js";
import Evento from "../models/Evento.js";


const router = express.Router();

/* =====================================
// 🎟 Validar Ticket y Marcar como Usado
===================================== */
router.post("/validar", async (req, res) => {
    try {
        console.log("📩 Body recibido:", req.body);
        
        const { idVerificador, eventoId } = req.body;

        if (!idVerificador || !eventoId) {
            return res.status(400).json({ message: "⚠️ Se requiere el ID del ticket y el ID del evento." });
        }

        console.log(`🔍 Buscando ticket con ID: ${idVerificador} en el evento: ${eventoId}`);

        // 🔥 Buscar la orden que contenga este ticket Y pertenezca al evento correcto
        const orden = await Orden.findOne({
            "evento.id": eventoId,
            "tickets": { $elemMatch: { idVerificador: idVerificador } }  // 🔥 Ahora buscamos dentro del array correctamente
        });

        if (!orden) {
            console.log("❌ Ticket no encontrado en este evento.");
            return res.status(404).json({ message: "🚫 Ticket no encontrado en este evento." });
        }

        console.log("📌 Orden encontrada:", orden._id);

        // 🔍 Buscar el ticket dentro de la orden
        const ticket = orden.tickets.find(t => t.idVerificador === idVerificador);
        if (!ticket) {
            console.log("❌ Ticket no encontrado dentro de la orden.");
            return res.status(404).json({ message: "🚫 Ticket no encontrado dentro de la orden." });
        }

        console.log("📌 Ticket encontrado:", ticket);

        res.status(200).json({ message: "✅ Ticket válido.", ticket, evento: orden.evento });

    } catch (error) {
        console.error("❌ Error al validar ticket:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});



/* =====================================
// 🎟 Marcar Ticket como Usado
===================================== */
router.put("/marcar-usado/:idVerificador", async (req, res) => {
    try {
        const { idVerificador } = req.params;
        const { eventoId } = req.body;  // 🔥 Solo recibimos el ID del evento

        console.log("📩 Datos recibidos:", { idVerificador, eventoId });

        if (!idVerificador || !eventoId) {
            return res.status(400).json({ message: "⚠️ Se requiere el ID del ticket y el ID del evento." });
        }

        console.log(`🔍 Intentando marcar como usado el ticket: ${idVerificador}`);

        // 🔥 Buscar la orden que contiene el ticket
        const orden = await Orden.findOne({ "tickets.idVerificador": idVerificador });

        if (!orden) {
            console.log("❌ Ticket no encontrado en ninguna orden.");
            return res.status(404).json({ message: "🚫 Ticket no encontrado." });
        }

        const ticket = orden.tickets.find(t => t.idVerificador === idVerificador);
        if (!ticket) {
            console.log("❌ Ticket no encontrado dentro de la orden.");
            return res.status(404).json({ message: "🚫 Ticket no encontrado dentro de la orden." });
        }

        // 🔥 Validamos que el ticket pertenece al evento correcto
        if (orden.evento.id !== eventoId) {
            console.log("❌ El ticket no pertenece a este evento.");
            return res.status(403).json({ message: "🚫 El ticket no pertenece a este evento." });
        }

        if (ticket.usado) {
            return res.status(400).json({ message: "⚠️ Este ticket ya fue usado." });
        }

        // ✅ Marcar el ticket como usado
        ticket.usado = true;
        await orden.save();

        res.status(200).json({ message: "✅ Ticket marcado como usado.", ticket });
    } catch (error) {
        console.error("❌ Error al marcar ticket como usado:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});





/* =====================================
// 🎟 Obtener todos los tickets de un evento
===================================== */
router.get("/tickets-evento/:idEvento", async (req, res) => {
    try {
        const { idEvento } = req.params;

        if (!idEvento.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID del evento inválido" });
        }

        console.log(`🔍 Buscando órdenes del evento con ID: ${idEvento}`);

        // 🔥 Buscar todas las órdenes asociadas a ese evento
        const ordenes = await Orden.find({ "evento.id": idEvento });

        if (!ordenes.length) {
            console.log("❌ No hay órdenes para este evento.");
            return res.status(404).json({ message: "No hay tickets para este evento." });
        }

        console.log("📌 Órdenes encontradas:", ordenes);

        // 🔥 Extraer todos los tickets
        const tickets = ordenes.flatMap(orden => 
            orden.tickets.map(ticket => ({
                ...ticket._doc, // ✅ Extraer datos del ticket
                ordenId: orden._id, // 🔥 Guardamos el ID de la orden
                evento: {
                    id: orden.evento.id || orden.evento, // 🔍 Puede ser un ID o un objeto
                    nombre: orden.evento.nombre || "Evento sin nombre",
                    fecha: orden.evento.fecha || "Fecha no disponible",
                    hora: orden.evento.hora || "Hora no disponible",
                }
            }))
        );

        console.log("📌 Tickets extraídos:", tickets);

        res.json({ tickets });

    } catch (error) {
        console.error("❌ Error al obtener tickets del evento:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

export default router;
