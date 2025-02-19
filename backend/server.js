import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import verificarToken from "./middleware/auth.js";
import eventosRoutes from "./routes/eventos.js";
import authRoutes from "./routes/auth.js"; 
import ordenesRoutes from "./routes/ordenes.js";
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
app.use(cors());
app.use(express.json());
app.use("/api/eventos", eventosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ordenes", ordenesRoutes);

/* =====================================
 CONECTAR A MONGODB ATLAS
===================================== */
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("🔥 Conectado a MongoDB Atlas"))
.catch(err => console.error("❌ Error de conexión con MongoDB:", err));

  /* =====================================
 CONECTAR A MONGODB LOCAL
===================================== */
// mongoose.set("strictQuery", false); // Desactivar restricciones en consultas
// mongoose.connect(MONGO_URI)
//    .then(() => console.log(`🔥Conectado a MongoDB: ${MONGO_URI}`))
//   .catch(err => console.error("❌ Error de conexiÃ³n con MongoDB:", err));


/* =====================================
GET /api/eventos // Obtener todos los eventos con sus relaciones
===================================== */
app.get("/api/eventos", async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.json(eventos);
  } catch (error) {
    console.error("❌ Error al obtener eventos:", error);
    res.status(500).json({ message: "Error al obtener eventos", error });
  }
});

/* =====================================
   GET /api/eventos/:id // Obtener un evento por su ID
===================================== */
app.get("/api/eventos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    //  Validar si el ID es un ObjectId vÃ¡lido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de evento invÃ¡lido" });
    }

    // 🔍🔍 Buscar el evento y seleccionar solo los campos necesarios
    const evento = await Evento.findById(id).select("nombre fecha hora descripcion stock estado imagen precios categoria lugar vendedor");

    if (!evento) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    // Ã°ÂÂÂ¥ Adaptamos la estructura segÃÂºn el nuevo esquema
    res.json({
      nombre: evento.nombre,
      fecha: evento.fecha,
      hora: evento.hora,
      descripcion: evento.descripcion,
      stock: {
        aforo: evento.stock?.aforo || null, // `aforo` puede ser null si no estÃ¡ definido
        disponibles: evento.stock?.disponibles || 0, // `disponibles` se calcula en el POST
      },
      estado: evento.estado,
      imagen: evento.imagen,
      precios: evento.precios.map(precio => ({
        nombre: precio.nombre,
        monto: precio.monto,
        disponibles: precio.disponibles, // Stock por tipo de entrada
      })),
      categoria: evento.categoria, 
      lugar: evento.lugar, 
      vendedor: evento.vendedor, 
    });

  } catch (error) {
    console.error("â Error al obtener el evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
GET /api/categorias // Obtener todas las categorÃÂÃÂ­as
===================================== */
app.get("/api/categorias", async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json(categorias);
  } catch (error) {
    console.error("â Error al obtener categorÃ­Â­as:", error);
    res.status(500).json({ message: "Error al obtener categorÃ­Â­as" });
  }
});

/* =====================================
GET /api/categorias/:id // Obtener una categorÃÂÃÂ­a por ID
===================================== */
app.get("/api/categorias/:id", async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: "CategorÃ­Â­a no encontrada" });
    }
    res.json(categoria);
  } catch (error) {
    console.error("â Error al obtener la categorÃÂÃÂ­a:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
GET /api/lugares // Obtener todos los lugares
===================================== */
app.get("/api/lugares", async (req, res) => {
  try {
    const lugares = await Lugar.find();
    res.json(lugares);
  } catch (error) {
    console.error("â Error al obtener lugares:", error);
    res.status(500).json({ message: "Error al obtener lugares" });
  }
});

/* =====================================
GET /api/lugares/:id // Obtener un lugar por su ID
===================================== */
app.get("/api/lugares/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // / Verificar si el ID tiene el formato correcto de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de lugar no vÃ¡lido" });
    }

    const lugar = await Lugar.findById(id);
    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    res.json(lugar);
  } catch (error) {
    console.error("â Error al obtener el lugar:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
PUT /api/eventos/:id  (Actualizar un evento por su ID)
===================================== */
app.put("/api/eventos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const eventoActualizado = await Evento.findByIdAndUpdate(id, req.body, { new: true });

    if (!eventoActualizado) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    res.json(eventoActualizado);
  } catch (error) {
    console.error("â Error al actualizar el evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



/* =====================================
// GET /api/vendedores // Obtener todos los vendedores
===================================== */
app.get("/api/vendedores", async (req, res) => {
  try {
    const vendedores = await Vendedor.find();
    res.json(vendedores);
  } catch (error) {
    console.error("â Error al obtener vendedores:", error);
    res.status(500).json({ message: "Error al obtener vendedores" });
  }
});


/* =====================================
   POST /api/eventos // INGRESA EVENTOS
===================================== */
app.post("/api/eventos", async (req, res) => {
  try {
    const { nombre, fecha, hora, descripcion, aforo, estado, imagen, precios, categoria, lugar, vendedor } = req.body;

    // Ã°ÂÂÂ ValidaciÃÂ³n: `precios` debe ser un array con al menos una entrada
    if (!Array.isArray(precios) || precios.length === 0) {
      return res.status(400).json({ message: "Debe haber al menos un tipo de entrada con precio y stock" });
    }

    for (let precio of precios) {
      if (typeof precio.monto !== "number" || precio.monto <= 0) {
        return res.status(400).json({ message: `El monto de la entrada "${precio.nombre}" debe ser un nÃºmero mayor a 0` });
      }
      if (typeof precio.disponibles !== "number" || precio.disponibles < 0) {
        return res.status(400).json({ message: `Las entradas disponibles para "${precio.nombre}" deben ser 0 o mÃ¡s` });
      }
    }

    //  Aforo es solo informativo, puede ser `null`
    const stock = {
      aforo: aforo || null,
      disponibles: precios.reduce((acc, p) => acc + p.disponibles, 0), // Sumamos todas las entradas disponibles
    };

    const nuevoEvento = new Evento({
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
      vendedor
    });

    await nuevoEvento.save();
    res.status(201).json({ message: "â¨ Evento creado exitosamente", evento: nuevoEvento });
  } catch (error) {
    console.error("â Error al crear evento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
// ConfiguraciÃÂ³n de almacenamiento de imÃÂÃÂ¡genes
===================================== */
// Ã¢ÂÂ¹Ã¢ÂÂ¹ Asegurar que `public/img/eventos/` existe antes de guardar imÃÂÃÂ¡genes
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

// Nueva ruta para subir imÃÂ¡genes
app.post("/api/eventos/upload", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subiÃ³ ninguna imagen" });
  }

  res.json({ fileName: req.file.filename });
});

// Servir archivos estÃÂticos desde `public/img/eventos/`
app.use("/img/eventos", express.static("public/img/eventos"));
app.use("/img/lugares", express.static("public/img/lugares"));


/* =====================================
===================================== */

/* =====================================
Iniciar el servidor en el puerto 5000
===================================== */
app.listen(PORT, () => console.log(`ð Servidor corriendo en ${BACKEND_URL || `http://localhost:${PORT}`}`));

