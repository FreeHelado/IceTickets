import mongoose from "mongoose";

const eventoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fecha: { type: Date, required: true }, 
  hora: { type: String, required: true },
  descripcion: { type: String },
  stock: { 
    aforo: { type: Number },
    vendidas: { type: Number } 
  },
  estado: {
    type: String,
    enum: ["proximo", "hoy", "cancelado", "finalizado"],
    default: "proximo"
  },
  imagen: { type: String, required: true },
    precios: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      nombre: { type: String, required: true },
      monto: { 
        type: Number, 
        required: true, 
        min: [1, "El monto debe ser mayor a 0"] 
      }, 
      disponibles: { type: Number, required: true } 
    }
  ],
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }, 
  lugar: { type: mongoose.Schema.Types.ObjectId, ref: "Lugar" },
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendedor" },
  sociosProductores: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  publico: { type: Boolean, default: false },
  
  // ✅ 🔥 Aseguramos que `tags` tenga valores por defecto
  tags: {
    todoPublico: { type: Boolean, default: false },
    noMenores: { type: Boolean, default: false },
    ventaComida: { type: Boolean, default: false },
    ventaBebida: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    accesible: { type: Boolean, default: false },
    aireLibre: { type: Boolean, default: false },
  },

  // ✅ 🔥 Aseguramos que `infoAdicional` también tenga valores por defecto
  infoAdicional: {
    edadMinima: { type: String, default: "" },
    menoresGratis: { type: String, default: "" },
    elementosProhibidos: { type: String, default: "" },
    terminosCondiciones: { type: String, default: "" },
    horaApertura: { type: String, default: "" },
    estacionamiento: { type: String, default: "" },
    transporte: { type: String, default: "" },
  },

}, { toJSON: { virtuals: true } }); 

eventoSchema.virtual("precioMenor").get(function () {
  return this.precios.length > 0 ? Math.min(...this.precios.map(p => p.monto)) : 0;
});


eventoSchema.virtual("aforo").get(function () {
  return this.precios.reduce((total, precio) => total + precio.disponibles, 0);
});

const Evento = mongoose.model("Evento", eventoSchema);
export default Evento;
