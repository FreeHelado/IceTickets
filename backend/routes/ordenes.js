import express from "express";
import verificarToken from "../middleware/auth.js"; // Protege la ruta
import Orden from "../models/Orden.js"; // Importamos el modelo de la orden
import Evento from "../models/Evento.js"; // ? Importamos el modelo del evento

const router = express.Router();

/* =====================================
// ? Guardar Orden en MongoDB
===================================== */
router.post("/", verificarToken, async (req, res) => {
    try {
        const { comprador, evento, tickets, total, metodoPago } = req.body;

        // 🔹 Verificar si el evento tiene un ID válido
        console.log("🟢 Recibiendo evento con ID:", evento.id); // <-- 🛠️ Aquí va el console.log

        if (!evento.id || !evento.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID del evento inválido" });
        }

        // Buscar el evento en la base de datos
        const eventoDB = await Evento.findById(evento.id);
        if (!eventoDB) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }

        // Crear la orden
        const nuevaOrden = new Orden({
            comprador,
            evento,
            tickets,
            total,
            metodoPago,
            estado: "pendiente",
            fechaCompra: new Date(),
        });

        // Guardar en la base de datos
        await nuevaOrden.save();

        console.log("✅ Orden guardada correctamente:", nuevaOrden);
        res.status(201).json({ message: "Orden guardada exitosamente", orden: nuevaOrden });

    } catch (error) {
        console.error("❌ Error al guardar la orden:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});



export default router;
