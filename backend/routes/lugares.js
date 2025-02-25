import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import Lugar from "../models/Lugar.js";
import User from "../models/User.js"; // 🔥 Asegurate de importar el modelo de usuario
import verificarToken from "../middleware/auth.js";
const router = express.Router();

/* =====================================
📷 Configuración de almacenamiento de imágenes
===================================== */
const uploadPath = path.join(process.cwd(), "public/img/lugares");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/lugares");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

/* ==============================
   GET /api/lugares
   Obtener todos los lugares (público, sin token)
================================= */
router.get("/", async (req, res) => {
  try {
    const lugares = await Lugar.find();
    res.json(lugares);
  } catch (error) {
    console.error("❌ Error al obtener lugares:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   GET /api/lugares/:id 
   Obtener un lugar por su ID (público, sin token)
===================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de lugar no válido" });
    }

    const lugar = await Lugar.findById(id);
    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    res.json(lugar);
  } catch (error) {
    console.error("❌ Error al obtener el lugar:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   PUT /:id/mapa 
   Guardar Mapeo
===================================== */
router.put("/:id/mapa", async (req, res) => {
    try {
        const { id } = req.params;
        const { sectores } = req.body; // Asegurate que estás enviando `sectores` en el frontend

        console.log(`🗺️ Guardando mapa en Lugar ${id}`);

        const lugar = await Lugar.findById(id);
        if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

        // Actualizar solo las coordenadas de los asientos
        lugar.sectores.forEach((sector) => {
            const sectorData = sectores.find(s => s._id === sector._id.toString());
            if (sectorData) {
                sector.filas.forEach((fila) => {
                    const filaData = sectorData.filas.find(f => f._id === fila._id.toString());
                    if (filaData) {
                        fila.asientos.forEach((asiento) => {
                            const asientoData = filaData.asientos.find(a => a._id === asiento._id.toString());
                            if (asientoData && asientoData.coordenadas) {
                                asiento.coordenadas = asientoData.coordenadas;
                            }
                        });
                    }
                });
            }
        });

        await lugar.save();

        res.json({ message: "Mapa guardado con éxito", lugar });
    } catch (error) {
        console.error("❌ Error al guardar el mapa:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

/* =====================================
   PUT /:id/mapa 
   Actualizar Mapa
===================================== */
router.put("/:id/sectores/:sectorId/filas/:filaId/asientos/:asientoId/mapeo", async (req, res) => {
    try {
        const { id, sectorId, filaId, asientoId } = req.params;
        const { x, y } = req.body;

        // Buscar el lugar
        const lugar = await Lugar.findById(id);
        if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

        // Buscar el sector
        const sector = lugar.sectores.id(sectorId);
        if (!sector) return res.status(404).json({ message: "Sector no encontrado" });

        // Buscar la fila
        const fila = sector.filas.id(filaId);
        if (!fila) return res.status(404).json({ message: "Fila no encontrada" });

        // Buscar el asiento
        const asiento = fila.asientos.id(asientoId);
        if (!asiento) return res.status(404).json({ message: "Asiento no encontrado" });

        // Actualizar coordenadas
        asiento.coordenadas = { x, y };
        await lugar.save();

        res.json({ message: "Asiento mapeado con éxito", asiento });
    } catch (error) {
        console.error("❌ Error al actualizar asiento:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});


/* ==============================
   POST /api/lugares
   Crear un nuevo lugar (requiere token)
================================= */
router.post("/", verificarToken, upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, direccion, localidad, contacto, linkWeb, linkRedSocial, mapaImagen } = req.body;
    const { userId } = req.user;
    const ubicacion = { lat: parseFloat(req.body.lat), lng: parseFloat(req.body.lng) };
    const logo = req.file ? req.file.filename : "";

    if (!nombre || !direccion || !localidad || !ubicacion.lat || !ubicacion.lng) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben estar completos." });
    }

    const nuevoLugar = new Lugar({
      nombre,
      direccion,
      localidad,
      ubicacion,
      vendedor: new mongoose.Types.ObjectId(userId),
      contacto,
      linkWeb,
      linkRedSocial,
      logo, 
      mapaImagen,
      sectores: [],
    });

    await nuevoLugar.save();
    res.status(201).json({ message: "Lugar creado con éxito", lugar: nuevoLugar });
  } catch (error) {
    console.error("❌ Error al crear lugar:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* ==============================
   PUT /api/lugares
   Editar un lugar (requiere token)
================================= */
router.put("/:id", verificarToken, upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.user;
    const { nombre, direccion, localidad, contacto, linkWeb, linkRedSocial, mapaImagen } = req.body;

    // 🔍 Buscar el lugar
    const lugar = await Lugar.findById(id);
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

    // 🔒 Verificar permisos
    if (!isAdmin && lugar.vendedor.toString() !== userId) {
      return res.status(403).json({ message: "No tienes permiso para editar este lugar" });
    }

    // ✅ ACTUALIZAR SOLO LOS DATOS BÁSICOS (NADA DE SECTORES POR AHORA)
    if (nombre) lugar.nombre = nombre;
    if (direccion) lugar.direccion = direccion;
    if (localidad) lugar.localidad = localidad;
    if (contacto) lugar.contacto = contacto;
    if (linkWeb) lugar.linkWeb = linkWeb;
    if (linkRedSocial) lugar.linkRedSocial = linkRedSocial;
    if (mapaImagen) lugar.mapaImagen = mapaImagen;

    // ✅ SI SE SUBIÓ UNA NUEVA IMAGEN, ACTUALIZAMOS
    if (req.file) {
      lugar.logo = req.file.filename;
    }

    await lugar.save();
    res.json({ message: "Lugar actualizado con éxito", lugar });
  } catch (error) {
    console.error("❌ Error al actualizar lugar:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



/* ==============================
   DEL /api/lugares
   bORRAR un lugar (requiere token)
================================= */
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de lugar no válido" });
    }

    const lugar = await Lugar.findById(id);
    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    // 🔥 Verificar permisos
    if (!isAdmin && lugar.vendedor.toString() !== userId) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este lugar" });
    }

    await Lugar.findByIdAndDelete(id);

    res.json({ message: "Lugar eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar lugar:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
   PUT /api/lugares/:id/sectores
   Actualizar SOLO sectores, filas y asientos
===================================== */
router.put("/:id/sectores", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.user;
    const { sectores } = req.body;

    if (!sectores) {
      return res.status(400).json({ message: "No se enviaron sectores" });
    }

    // 🔍 Buscar el lugar
    const lugar = await Lugar.findById(id);
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

    // 🔒 Verificar permisos (Solo el admin o el dueño del lugar pueden editar)
    if (!isAdmin && lugar.vendedor.toString() !== userId) {
      return res.status(403).json({ message: "No tienes permiso para modificar los sectores" });
    }

    // 🔥 Actualizamos solo los sectores
    lugar.sectores = sectores;

    console.log("📝 Guardando nuevos sectores:", JSON.stringify(sectores, null, 2));

    await lugar.save();
    res.json({ message: "Sectores actualizados con éxito", sectores });
  } catch (error) {
    console.error("❌ Error al actualizar sectores:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
   POST /:id/sectores
  Agregar un sector a un lugar
======================================== */
router.post("/:id/sectores", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreSector, filas, asientosPorFila } = req.body;

    if (!nombreSector || !filas || !asientosPorFila) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const lugar = await Lugar.findById(id);
    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    // Generar filas con asientos numerados automáticamente
    const nuevasFilas = [];
    for (let i = 0; i < filas; i++) {
      const nombreFila = String.fromCharCode(65 + i); // A, B, C...
      const asientos = Array.from({ length: asientosPorFila }, (_, index) => ({
        nombreAsiento: `${nombreFila}${index + 1}`,
        ocupado: false,
      }));
      nuevasFilas.push({ nombreFila, asientos });
    }

    // Agregar nuevo sector al lugar
    lugar.sectores.push({ nombreSector, filas: nuevasFilas });
    await lugar.save();

    res.status(201).json(lugar);
  } catch (error) {
    console.error("❌ Error al agregar sector:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   POST /:id/sectores:sectorId/filas
  Agregar una fila a un sector existente
======================================== */
router.post("/:id/sectores/:sectorId/filas", async (req, res) => {
  try {
    const { id, sectorId } = req.params;
    const { asientos } = req.body;

    if (!asientos) {
      return res.status(400).json({ message: "Debe especificar la cantidad de asientos" });
    }

    const lugar = await Lugar.findById(id);
    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    const sector = lugar.sectores.id(sectorId);
    if (!sector) {
      return res.status(404).json({ message: "Sector no encontrado" });
    }

    const nombreFila = String.fromCharCode(65 + sector.filas.length); // Letra siguiente (A, B, C...)
    const nuevosAsientos = Array.from({ length: asientos }, (_, index) => ({
      nombreAsiento: `${nombreFila}${index + 1}`,
      ocupado: false,
    }));

    sector.filas.push({ nombreFila, asientos: nuevosAsientos });
    await lugar.save();

    res.status(201).json(lugar);
  } catch (error) {
    console.error("❌ Error al agregar fila:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


/* =====================================
   POST /:id/sectores:sectorId/
  Eliminar un Sector
======================================== */
router.delete("/:id/sectores/:sectorId", async (req, res) => {
  try {
    const { id, sectorId } = req.params;

    const lugar = await Lugar.findById(id);
    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    lugar.sectores = lugar.sectores.filter((s) => s._id.toString() !== sectorId);
    await lugar.save();

    res.json({ message: "Sector eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar sector:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   PUT /:id/sectores/:sectorId/filas/:filaId/asientos/:asientoId"
    Marcar Asiento como ocupado
======================================== */
router.put("/:id/sectores/:sectorId/filas/:filaId/asientos/:asientoId", async (req, res) => {
  try {
    const { id, sectorId, filaId, asientoId } = req.params;
    const { ocupado } = req.body;

    const lugar = await Lugar.findById(id);
    if (!lugar) {
      return res.status(404).json({ message: "Lugar no encontrado" });
    }

    const sector = lugar.sectores.id(sectorId);
    if (!sector) {
      return res.status(404).json({ message: "Sector no encontrado" });
    }

    const fila = sector.filas.id(filaId);
    if (!fila) {
      return res.status(404).json({ message: "Fila no encontrada" });
    }

    const asiento = fila.asientos.id(asientoId);
    if (!asiento) {
      return res.status(404).json({ message: "Asiento no encontrado" });
    }

    asiento.ocupado = ocupado;
    await lugar.save();

    res.json({ message: "Asiento actualizado", asiento });
  } catch (error) {
    console.error("❌ Error al actualizar asiento:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* ==============================
   GET /api/lugares/sector/:id
   Obtener un sector específico dentro de un lugar
================================= */
router.get("/sector/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Buscar un lugar que contenga el sector con ese ID
    const lugar = await Lugar.findOne({ "sectores._id": id }, { "sectores.$": 1 });

    if (!lugar || !lugar.sectores.length) {
      return res.status(404).json({ message: "Sector no encontrado en ningún lugar" });
    }

    // ✅ Devolver solo el sector encontrado
    res.json(lugar.sectores[0]);
  } catch (error) {
    console.error("❌ Error al obtener sector:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



export default router;
