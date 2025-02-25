import express from "express";
import verificarToken from "../middleware/auth.js";
import Orden from "../models/Orden.js"; 
import Evento from "../models/Evento.js"; 
import Lugar from "../models/Lugar.js"; 
const router = express.Router();


/* =====================================
// 🛒 Guardar Orden en MongoDB
===================================== */
router.post("/", verificarToken, async (req, res) => {
    try {
        const { comprador, evento, tickets, total, metodoPago } = req.body;

        if (!evento.id || !evento.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID del evento inválido" });
        }

        const eventoDB = await Evento.findById(evento.id);
        if (!eventoDB) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }

        // 🔥 Validamos stock y restamos disponibilidad
        tickets.forEach(ticket => {
            const precio = eventoDB.precios.id(ticket.idPrecio);
            if (!precio) {
                throw new Error(`No se encontró el precio con ID: ${ticket.idPrecio}`);
            }
            if (precio.disponibles < 1) {
                throw new Error(`Stock agotado para ${ticket.tipoEntrada}`);
            }
            precio.disponibles -= 1;
        });

        eventoDB.stock.vendidas += tickets.length;
        await eventoDB.save();

        // 🔥 Marcar asientos como ocupados si hay selección de asientos
        for (const ticket of tickets) {
            if (ticket.sector && ticket.fila && ticket.asiento) {
                const sector = eventoDB.sectores.id(ticket.sector);
                if (sector) {
                    const fila = sector.filas.find(f => f.nombreFila === ticket.fila);
                    if (fila) {
                        const asiento = fila.asientos.find(a => a.nombreAsiento === ticket.asiento);
                        if (asiento) {
                            asiento.ocupado = true;
                        }
                    }
                }
            }
        }

        await eventoDB.save();

        // 🔥 Agregar `usado: false` en cada ticket
        const ticketsProcesados = tickets.map(ticket => ({
            ...ticket,
            usado: false, // ✅ Todos los tickets empiezan sin usar
        }));

        const nuevaOrden = new Orden({
            comprador,
            evento,
            tickets: ticketsProcesados,
            total,
            metodoPago,
            estado: "pendiente",
            fechaCompra: new Date(),
        });

        await nuevaOrden.save();

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
                imagen: evento.imagen,
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


/* =====================================
// 📦 Obtener TICKETS de un Usuario (con info del lugar)
===================================== */
router.get("/mis-tickets", verificarToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // 🔍 Buscar órdenes del usuario con eventos y lugares asociados
        const ordenes = await Orden.find({ "comprador.email": userEmail })
            .populate({
                path: "evento.id",
                model: "Evento",
                populate: { path: "lugar", model: "Lugar" }
            });

        if (!ordenes.length) return res.json([]);

        // 🔥 Transformamos los datos para enviar una respuesta limpia
        const misTickets = ordenes.flatMap(orden =>
            orden.tickets.map(ticket => ({
                ...ticket._doc, // 🔥 Extraer datos del ticket
                evento: {
                    id: orden.evento.id._id, // ✅ Ahora incluimos el ID del evento
                    nombre: orden.evento.id.nombre,
                    fecha: orden.evento.id.fecha,
                    hora: orden.evento.id.hora,
                    lugar: orden.evento.id.lugar?.nombre || "Lugar no disponible",
                    direccion: orden.evento.id.lugar?.direccion || "Dirección no disponible",
                    localidad: orden.evento.id.lugar?.localidad || "Localidad no disponible",
                    imagen: orden.evento.id.imagen,
                    logo: orden.evento.id.lugar?.logo,
                }
            }))
        );

        res.json(misTickets);
    } catch (error) {
        console.error("❌ Error al obtener tickets del usuario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});




export default router;
