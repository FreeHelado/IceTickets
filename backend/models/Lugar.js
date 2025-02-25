import mongoose from "mongoose";

// 💺 Estructura de Asientos (Modificada con coordenadas)
const asientoSchema = new mongoose.Schema({
  nombreAsiento: { type: String, required: true },
  ocupado: { type: Boolean, default: false },
  coordenadas: {
    x: { type: Number, default: null },
    y: { type: Number, default: null }
  }
});


// 🚪 Estructura de Filas
const filaSchema = new mongoose.Schema({
  nombreFila: { type: String, required: true }, // Ej: "A", "B", "C"
  asientos: [asientoSchema], // Array de asientos en la fila
});

// 🦖 Estructura de Sectores
const sectorSchema = new mongoose.Schema({
  nombreSector: { type: String, required: true }, // Ej: "VIP", "General", "Platea"
  filas: [filaSchema], // Filas dentro del sector
});

// Modelo de Lugar
const lugarSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  ubicacion: { 
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  contacto: { type: String }, 
  linkWeb: { type: String },
  linkRedSocial: { type: String },
  logo: { type: String },
  mapaImagen: { type: String }, 
  localidad: { type: String },
  sectores: [sectorSchema],
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendedor", required: true },
}, { collection: "lugares" });

const Lugar = mongoose.model("Lugar", lugarSchema);
export default Lugar;
