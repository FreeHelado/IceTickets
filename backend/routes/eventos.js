import express from "express";
import Evento from "../models/Evento.js";
import User from "../models/User.js";
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

    // Validar que el ID sea de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }

    // Buscar el evento sin populate
    const evento = await Evento.findById(id).select("nombre fecha hora descripcion stock estado imagen precios categoria lugar vendedor sociosProductores");

    if (!evento) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    console.log("Evento encontrado:", evento);

    // Buscar los emails de los sociosProductores manualmente
    const sociosInfo = await User.find({ _id: { $in: evento.sociosProductores || [] } }, "email _id");

    // Convertimos los sociosProductores en { _id, email }
    const sociosProductores = sociosInfo.map(user => ({
      _id: user._id,
      email: user.email
    }));

    res.json({
      ...evento.toObject(),
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
    const { nombre, fecha, hora, descripcion, stock, estado, imagen, precios, categoria, lugar, sociosProductoresEmails, publico } = req.body;


    // ✅ Convertir fecha a Date antes de guardarla
    const fechaConvertida = new Date(fecha);

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
      publico
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
    const { nombre, fecha, hora, descripcion, stock, estado, imagen, precios, categoria, lugar, sociosProductoresEmails, publico } = req.body;
    const userId = req.user.userId; // 🔥 Usuario autenticado
    const isAdmin = req.user.isAdmin; // 🔥 Si es admin

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de evento inválido" });
    }

    // 🔍 Buscar el evento antes de actualizar
    const eventoExistente = await Evento.findById(id);
    if (!eventoExistente) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    // 🔒 Verificar permisos: Solo el admin, el vendedor o un socio asignado pueden editar
    const esVendedor = eventoExistente.vendedor.toString() === userId;
    const esSocio = eventoExistente.sociosProductores.some(socio => socio.toString() === userId);

    if (!isAdmin && !esVendedor && !esSocio) {
      return res.status(403).json({ message: "No tienes permisos para editar este evento" });
    }

    // 🔍 Buscar IDs de sociosProductores a partir de los emails
    let sociosProductores = [];
    if (sociosProductoresEmails && sociosProductoresEmails.length > 0) {
      const usuariosEncontrados = await User.find({ email: { $in: sociosProductoresEmails } }, "_id");
      sociosProductores = usuariosEncontrados.map(user => user._id);
    }

    // 📌 Construir objeto con datos actualizados
    const updateData = {
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
      sociosProductores,
    };

    // ✅ Agregar `publico` solo si está definido en la petición
    if (publico !== undefined) {
      updateData.publico = publico;
    }

    // 📌 Actualizar el evento con los nuevos datos
    const eventoActualizado = await Evento.findByIdAndUpdate(id, updateData, { new: true });

    if (!eventoActualizado) {
      return res.status(404).json({ message: "Evento no encontrado tras la actualización" });
    }

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


export default router;
