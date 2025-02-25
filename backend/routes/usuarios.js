import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer"; // 🔥 Para enviar el código por email
import verificarToken from "../middleware/auth.js";
import mongoose from "mongoose";
import crypto from "crypto"; // 🔥 Importamos el módulo crypto


const router = express.Router();


/* =====================================
// 🔍 Obtener email d eusuario por ID
===================================== */
router.get("/:id/email", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("email");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ email: user.email });
  } catch (error) {
    console.error("❌ Error obteniendo email del usuario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



export default router;