import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import verificarToken from "./middleware/auth.js";
import "./cronJobs.js";
import eventosRoutes from "./routes/eventos.js";
import authRoutes from "./routes/auth.js"; 
import ordenesRoutes from "./routes/ordenes.js";
import categoriasRoutes from "./routes/categorias.js";
import lugaresRoutes from "./routes/lugares.js";
import eventosSectoresRoutes from "./routes/eventosSectores.js";
import usuariosRoutes from "./routes/usuarios.js";  // 👈 Asegurate que el nombre es correcto
import porteroRoutes from "./routes/porteros.js";
import ticketsRoutes from "./routes/tickets.js";


import Evento from "./models/Evento.js";
import Categoria from "./models/Categoria.js";
import Lugar from "./models/Lugar.js";
import Vendedor from "./models/Vendedor.js";
import dotenv from "dotenv";



/* =====================================
CONFIG
===================================== */
dotenv.config();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

if (!MONGO_URI) {
  console.error("❌ ERROR: No se encontró la variable MONGO_URI en .env");
  process.exit(1);
}

const app = express();

/* =====================================
RUTAS
===================================== */
app.use(cors());
app.use(express.json());
app.use("/api/eventos", eventosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ordenes", ordenesRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/lugares", lugaresRoutes);
app.use("/api/eventos", eventosSectoresRoutes); // 🔥 Se mantiene dentro de /api/eventos
app.use("/api/usuarios", usuariosRoutes);  // 👈 Ahora sí, el backend va a reconocer /api/usuarios
app.use("/api/portero", porteroRoutes);
app.use("/api/tickets", ticketsRoutes);


/* =====================================
 CONECTAR A MONGODB ATLAS
===================================== */
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("🚀 Conectado a MongoDB Atlas"))
.catch(err => console.error("❌ Error de conexión con MongoDB:", err));

  /* =====================================
 CONECTAR A MONGODB LOCAL
===================================== */
// mongoose.set("strictQuery", false); // Desactivar restricciones en consultas
// mongoose.connect(MONGO_URI)
//    .then(() => console.log(`🔥Conectado a MongoDB: ${MONGO_URI}`))
//   .catch(err => console.error("❌ Error de conexiÃ³n con MongoDB:", err));


/* =====================================
// Configuración de almacenamiento de imagenes
===================================== */
//  Asegurar que `public/img/eventos/` existe antes de guardar imágenes
const uploadPath = path.join(process.cwd(), "public/img/eventos");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/eventos"); // Ruta donde se guardaran las imÃÂ¡genes
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}${ext}`; // Genera un nombre ÃÂºnico
    cb(null, fileName);
  }
});

const upload = multer({ storage });

/* =====================================
// 🔥📷 Nueva ruta para subir imagenes a Eventos
===================================== */
app.post("/api/eventos/upload", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ninguna imagen" });
  }
  res.json({ fileName: req.file.filename });
});

/* =====================================
// 🔥📷 Nueva ruta para subir imagenes a Lugares
===================================== */
app.post("/api/lugares/upload", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ninguna imagen" });
  }
  res.json({ fileName: req.file.filename });
});

//  Servir archivos estáticos desde `public/img/eventos/`
app.use("/img/eventos", express.static("public/img/eventos"));
app.use("/img/lugares", express.static("public/img/lugares"));






/* =====================================
Iniciar el servidor en el puerto 5000
===================================== */
app.listen(PORT, () => console.log(`✨ Servidor corriendo en ${BACKEND_URL || `http://localhost:${PORT}`}`));

