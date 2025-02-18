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
  publico: { type: Boolean, default: false } 

}, { toJSON: { virtuals: true } }); 

eventoSchema.virtual("precioMenor").get(function () {
  return this.precios.length > 0 ? Math.min(...this.precios.map(p => p.monto)) : 0;
});


eventoSchema.virtual("aforo").get(function () {
  return this.precios.reduce((total, precio) => total + precio.disponibles, 0);
});

const Evento = mongoose.model("Evento", eventoSchema);
export default Evento;
