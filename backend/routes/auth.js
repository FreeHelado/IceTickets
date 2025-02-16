import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import verificarToken from "../middleware/auth.js";


const router = express.Router();

/* =====================================
ð Registro de Usuario
===================================== */
router.post("/register", async (req, res) => {
  try {
    const { email, password,nombre, telefono } = req.body;

    // Verificar si el usuario ya existe
    const userExistente = await User.findOne({ email });
    if (userExistente) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Hashear la contraseÃ±aa antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Usuario registrado con Ã©xito" });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
// â Login de usuario
===================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    // Comparar la contraseÃ±a ingresada con la hasheada en MongoDB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "ContraseÃ±a incorrecta" });
    }

    // Generar un token JWT
    const token = jwt.sign({ userId: user._id }, "secreto_super_seguro", { expiresIn: "1h" });

    res.json({ token });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
// â Obtener datos del usuario logueado
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
