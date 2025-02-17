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
// 🔑 Registro de Usuario con Código de Verificación
===================================== */
router.post("/register", async (req, res) => {
  try {
    const { email, password, nombre, telefono } = req.body;

    // Verificar si el usuario ya existe
    const userExistente = await User.findOne({ email });
    if (userExistente) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Hashear la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🔥 Generar código de 6 dígitos
    const codigoVerificacion = crypto.randomInt(100000, 999999).toString();

    // 🔥 Establecer expiración en 5 minutos
    const expiracionCodigo = new Date();
    expiracionCodigo.setMinutes(expiracionCodigo.getMinutes() + 5);

    // Crear usuario con estado "pendiente de verificación"
    const newUser = new User({
      email,
      password: hashedPassword,
      nombre,
      telefono,
      isAdmin: false, 
      verificado: false,
      codigoVerificacion,
      expiracionCodigo
    });

    await newUser.save();
    res.status(201).json({ message: "Usuario registrado. Verifica tu correo.", email });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
// 🔎 Ruta para Verificar Código
===================================== */
router.post("/verify", async (req, res) => {
  try {
    const { email, codigo } = req.body;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    // Verificar si ya está confirmado
    if (user.verificado) {
      return res.status(400).json({ message: "El usuario ya está verificado." });
    }

    // Verificar si el código es correcto y está dentro del tiempo límite
    if (user.codigoVerificacion !== codigo) {
      return res.status(400).json({ message: "Código incorrecto." });
    }

    const ahora = new Date();
    if (ahora > user.expiracionCodigo) {
      return res.status(400).json({ message: "El código ha expirado." });
    }

    // Si todo está bien, marcamos al usuario como verificado
    user.verificado = true;
    user.codigoVerificacion = null; // Limpiamos el código
    user.expiracionCodigo = null;
    await user.save();

    res.json({ message: "Usuario verificado correctamente. Ahora puedes iniciar sesión." });

  } catch (error) {
    console.error("Error en verificación:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
// 📩 Reenvio de Codigo de verificación
===================================== */
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    // Si ya está verificado, no debería necesitar otro código
    if (user.verificado) {
      return res.status(400).json({ message: "Este usuario ya está verificado." });
    }

    // 🔥 Generar nuevo código de 6 dígitos
    const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 🔥 Nueva expiración en 5 minutos
    const nuevaExpiracion = new Date();
    nuevaExpiracion.setMinutes(nuevaExpiracion.getMinutes() + 5);

    // Actualizar el usuario en la base de datos
    user.codigoVerificacion = nuevoCodigo;
    user.expiracionCodigo = nuevaExpiracion;
    await user.save();


    res.json({ message: "Se ha enviado un nuevo código de verificación." });

  } catch (error) {
    console.error("Error en reenvío de código:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
// 🔐 Login de usuario
===================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    // Comparar la contraseña ingresada con la hasheada en MongoDB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    // 🔥 Generar un token JWT incluyendo isAdmin y verificado
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin, verificado: user.verificado }, 
      "secreto_super_seguro",
      { expiresIn: "1h" }
    );

    // 🔥 Enviar isAdmin y verificado en la respuesta
    res.json({ token, isAdmin: user.isAdmin, verificado: user.verificado, userId: user._id });


  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
// 🔍 Obtener datos del usuario logueado
===================================== */
router.get("/perfil", verificarToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.user.userId).select("-password");

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


export default router;
