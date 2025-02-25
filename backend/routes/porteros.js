import express from "express";
import Evento from "../models/Evento.js";

const router = express.Router();

/* =====================================
Validar acceso al evento (Login del portero)
===================================== */
router.post("/login", async (req, res) => {
  try {
    const { numeroEvento, clave } = req.body;

    // ? Verificamos si existe el evento con esos datos
    const evento = await Evento.findOne({ "controlPuerta.numeroEvento": numeroEvento, "controlPuerta.clave": clave });

    if (!evento) {
      return res.status(401).json({ message: "Número de evento o clave incorrectos" });
    }

    // ? Enviamos solo los datos necesarios del evento
    res.json({
      id: evento._id,
      nombre: evento.nombre,
      fecha: evento.fecha,
      hora: evento.hora,
      lugar: evento.lugar
    });

  } catch (error) {
    console.error("? Error en login del portero:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
