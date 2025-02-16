import mongoose from "mongoose";

const eventoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fecha: { type: String, required: true },
  hora: { type: String, required: true },
  descripcion: { type: String },
  stock: { 
    aforo: { type: Number }, // lo vamos a usar a modo informativo del lugar. 
    vendidas: { type: Number } // mas adelante lo utilizaremos para sumar la cantidad de entradas vendidas
  },
  estado: {
    type: String,
    enum: ["proximo", "hoy", "cancelado", "finalizado"],
    default: "proximo"
  },
  imagen: { type: String, required: true },
  precios: [
    {
      nombre: { type: String, required: true }, // Tipo de entrada (General, VIP, etc.)
      monto: { 
        type: Number, 
        required: true, 
        min: [1, "El monto debe ser mayor a 0"] // Validación directa en el esquema
      }, 
      disponibles: { type: Number, required: true } // entradas disponibles de un tipo, más adelante este stock bajará con las ventas
    }
  ],

  categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }, 
  lugar: { type: mongoose.Schema.Types.ObjectId, ref: "Lugar" },
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendedor" }
}, { toJSON: { virtuals: true } }); // ?? Permitir que Mongoose agregue virtuals al JSON

// Virtual para obtener el precio más bajo
eventoSchema.virtual("precioMenor").get(function () {
  return this.precios.length > 0 ? Math.min(...this.precios.map(p => p.monto)) : 0;
});

//  Virtual para obtener el aforo
eventoSchema.virtual("aforo").get(function () {
  return this.precios.reduce((total, precio) => total + precio.disponibles, 0);
});

const Evento = mongoose.model("Evento", eventoSchema);
export default Evento;
