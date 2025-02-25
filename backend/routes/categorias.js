import express from "express";
import Categoria from "../models/Categoria.js";

const router = express.Router();

/* ==============================
   GET /api/categorias
   Obtener todas las categorías
================================= */
router.get("/", async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json(categorias);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   GET /api/categorias/:id 
   Obtener una categoría por ID
===================================== */
router.get("/:id", async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json(categoria);
  } catch (error) {
    console.error("❌ Error al obtener la categoría:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   POST /api/categorias
   Crear una nueva categoría
===================================== */
router.post("/", async (req, res) => {
  const { nombre, icono } = req.body;

  if (!nombre || !icono) {
    return res.status(400).json({ error: "Nombre e ícono son obligatorios" });
  }

  try {
    const nuevaCategoria = new Categoria({ nombre, icono });
    await nuevaCategoria.save();
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error("❌ Error al crear categoría:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   PUT /api/categorias/:id
   Actualizar una categoría
===================================== */
router.put("/:id", async (req, res) => {
  const { nombre, icono } = req.body;

  try {
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nombre, icono },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    res.json(categoria);
  } catch (error) {
    console.error("❌ Error al actualizar categoría:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/* =====================================
   DELETE /api/categorias/:id
   Eliminar una categoría
===================================== */
router.delete("/:id", async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndDelete(req.params.id);

    if (!categoria) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    res.json({ message: "Categoría eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar categoría:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
