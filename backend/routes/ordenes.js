import express from "express";
import verificarToken from "../middleware/auth.js"; // Protege la ruta
import Orden from "../models/Orden.js"; // Importamos el modelo de la orden
import Evento from "../models/Evento.js"; // ? Importamos el modelo del evento

const router = express.Router();

/* =====================================
// 🛒 Guardar Orden en MongoDB
===================================== */
router.post("/", verificarToken, async (req, res) => {
    try {
        const { comprador, evento, tickets, total, metodoPago } = req.body;

        // 🔹 Verificar si el evento tiene un ID válido
        if (!evento.id || !evento.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID del evento inválido" });
        }

        // Buscar el evento en la base de datos
        const eventoDB = await Evento.findById(evento.id);
        if (!eventoDB) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }

        // 🔥 Validar y descontar stock
       
        tickets.forEach(ticket => {
            const precio = eventoDB.precios.id(ticket.idPrecio); // Busca el precio por ID

            if (!precio) {
                throw new Error(`No se encontró el precio con ID: ${ticket.idPrecio}`);
            }

            if (precio.disponibles < 1) {
                throw new Error(`Stock agotado para ${ticket.tipoEntrada}`);
            }

            precio.disponibles -= 1; // 🚀 Descontamos 1 del stock
        });

        // 🔥 Sumar la cantidad de entradas vendidas al evento
        const cantidadVendida = tickets.length; // 📌 Cantidad de tickets en la orden
        eventoDB.stock.vendidas += cantidadVendida; // ✅ Sumamos al campo vendidas

        // ✅ Guardamos los cambios en la base de datos
        await eventoDB.save();

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

        console.log(`✅ Orden guardada. Se sumaron ${cantidadVendida} tickets al evento.`);
        res.status(201).json({ message: "Orden guardada exitosamente", orden: nuevaOrden });

    } catch (error) {
        console.error("❌ Error al guardar la orden:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

/* =====================================
// 📦 Obtener Órdenes de un Evento
===================================== */
router.get("/evento/:idEvento", verificarToken, async (req, res) => {
    try {
        const { idEvento } = req.params;

        // Validar que el ID del evento sea válido
        if (!idEvento.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID del evento inválido" });
        }

        // 🔥 Buscar el evento
        const evento = await Evento.findById(idEvento);
        if (!evento) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }

        // 🔒 Verificar permisos (admin, vendedor o socio productor)
        const userId = req.user.userId;
        const isAdmin = req.user.isAdmin;
        const esVendedor = evento.vendedor.toString() === userId;
        const esSocio = evento.sociosProductores.some(socio => socio.toString() === userId);

        if (!isAdmin && !esVendedor && !esSocio) {
            return res.status(403).json({ message: "No tienes permisos para ver estas órdenes" });
        }

        // 🔍 Buscar órdenes del evento
        const ordenes = await Orden.find({ "evento.id": idEvento });

        // 🔹 Contar tickets por tipo
        const ticketsPorTipo = {};
        ordenes.forEach(orden => {
            orden.tickets.forEach(ticket => {
                if (!ticketsPorTipo[ticket.tipoEntrada]) {
                    ticketsPorTipo[ticket.tipoEntrada] = 0;
                }
                ticketsPorTipo[ticket.tipoEntrada] += 1;
            });
        });

        // 🔥 Respuesta con info clave para gráficos y análisis
        res.json({
            evento: {
                id: evento._id,
                nombre: evento.nombre,
                fecha: evento.fecha,
                stock: evento.stock, // Incluye aforo y vendidas
                precios: evento.precios // Para ver precios y stock por tipo de entrada
            },
            totalOrdenes: ordenes.length,
            totalTicketsVendidos: ordenes.reduce((sum, orden) => sum + orden.tickets.length, 0),
            ticketsPorTipo,
            ordenes // Lista completa de órdenes
        });

    } catch (error) {
        console.error("❌ Error al obtener las órdenes:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});




export default router;
