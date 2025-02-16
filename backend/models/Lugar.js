import mongoose from "mongoose";

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
  localidad: { type: String }
}, { collection: "lugares" }); // ?? Forzar nombre de la colección

const Lugar = mongoose.model("Lugar", lugarSchema);
export default Lugar;
