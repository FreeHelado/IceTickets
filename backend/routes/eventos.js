import express from "express";
import Evento from "../models/Evento.js";
import verificarToken from "../middleware/auth.js"; // Importamos la autenticaciï¿½n
import mongoose from "mongoose";
const router = express.Router();
import { format } from "date-fns"; // Aseguramos que format esté disponible

/* =====================================
🔍 Obtener todos los eventos (sin autenticación)
===================================== */
router.get("/", async (req, res) => {
  try {
    const eventos = await Evento.find();
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

    //  Validamos si el ID es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de evento invÃ¡lido" });
    }

    const evento = await Evento.findById(id).select("nombre fecha hora descripcion stock estado imagen precios categoria lugar vendedor");


    if (!evento) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    //  Adaptamos la estructura incluyendo el _id
    res.json({
      _id: evento._id, // Asegura que el _id se enví­e en la respuesta
      nombre: evento.nombre,
      fecha: evento.fecha,
      hora: evento.hora,
      descripcion: evento.descripcion,
      stock: {
        aforo: evento.stock?.aforo || null,
        disponibles: evento.stock?.disponibles || 0,
      },
      estado: evento.estado,
      imagen: evento.imagen,
      precios: evento.precios.map(precio => ({
        nombre: precio.nombre,
        monto: precio.monto,
        disponibles: precio.disponibles,
      })),
      categoria: evento.categoria,
      lugar: evento.lugar,
      vendedor: evento.vendedor,
    });

  } catch (error) {
    console.error("X Error al obtener el evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
✨ Crear un evento (protegido con autenticación)
===================================== */
router.post("/", verificarToken, async (req, res) => {
  try {
    const { nombre, fecha, hora, descripcion, stock, estado, imagen, precios, categoria, lugar } = req.body;


    // ✅ Asegurar que `fecha` se convierte a "YYYY-MM-DD"
    const fechaConvertida = fecha ? format(new Date(fecha), "yyyy-MM-dd") : null;
    if (!fechaConvertida) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    // 💰 Convertir `monto` a número antes de guardarlo
    const preciosProcesados = precios.map(precio => ({
      nombre: precio.nombre,
      monto: Number(precio.monto), // Covertir Convertimos `monto` a número
      disponibles: Number(precio.disponibles) 
    }));

    // 🔥 Calculamos `aforo` sumando todas las entradas disponibles
    const aforoCalculado = preciosProcesados.reduce((total, precio) => total + precio.disponibles, 0);

    // ✅ Asignar automáticamente el usuario autenticado como vendedor
    const vendedor = req.user.userId;

    const nuevoEvento = new Evento({
      nombre,
      fecha,
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
      vendedor
    });

    await nuevoEvento.save();
    res.status(201).json({ message: "Evento creado exitosamente", evento: nuevoEvento });
  } catch (error) {
    console.error("â Error al crear evento:", error);
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


export default router;
