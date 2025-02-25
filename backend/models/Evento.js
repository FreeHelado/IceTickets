import mongoose from "mongoose";

// 💺 Estructura de Asientos (Modificada con coordenadas)
const asientoSchema = new mongoose.Schema({
  nombreAsiento: { type: String, required: true },
  ocupado: { type: Boolean, default: false },
  reservado: { type: Boolean, default: false }, // 🔥 Si el asiento ya existe, se asume `false`
  usuarioReserva: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  expiracionReserva: { type: Date, default: null },
  coordenadas: { x: { type: Number, default: null }, y: { type: Number, default: null } }
});


// 🚪 Estructura de Filas
const filaSchema = new mongoose.Schema({
  nombreFila: { type: String, required: true },
  disponible: { type: Boolean, default: true }, // 🔥 Para ocultarlas en lugar de eliminarlas
  asientos: [asientoSchema],
});

// 🦖 Estructura de Sectores
const sectorSchema = new mongoose.Schema({
  nombreSector: { type: String, required: true },
  disponible: { type: Boolean, default: true }, // 🔥 Para ocultarlos en lugar de eliminarlos
  filas: [filaSchema],
});

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
    enum: ["proximo", "mañana", "hoy", "finalizado", "cancelado", "liquidado"], 
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
      disponibles: { type: Number, required: true },
      sector: { type: mongoose.Schema.Types.ObjectId, ref: "Sector" } // 🔥 Relación con sector
    }
  ],
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }, 
  lugar: { type: mongoose.Schema.Types.ObjectId, ref: "Lugar" }, // 🔥 Aún mantiene referencia a Lugar
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

  // 🔥 Nuevo campo: estructura de sectores, filas y asientos en cada evento
  sectores: [sectorSchema],

  // 🔥 Campo para definir si el evento permite selección de asientos
  seleccionAsientos: { type: Boolean, default: false },
  
  // 🔥 Agregamos la estructura de control para el portero
  controlPuerta: {
    numeroEvento: { type: Number, required: true }, // ❌ Quitamos el default
    clave: { type: String, required: true } // ❌ Quitamos el default
  },


}, { toJSON: { virtuals: true } }); 

// 🔥 Método para actualizar el estado del evento según la fecha
eventoSchema.methods.actualizarEstado = function () {
  const hoy = new Date();
  const fechaEvento = new Date(this.fecha);
  const diferenciaDias = Math.floor((fechaEvento - hoy) / (1000 * 60 * 60 * 24));

  if (this.estado !== "cancelado" && this.estado !== "liquidado") { // 🔥 No tocamos estos estados manuales
    if (diferenciaDias === 1) {
      this.estado = "mañana";
    } else if (fechaEvento.toDateString() === hoy.toDateString()) {
      this.estado = "hoy";
    } else if (fechaEvento < hoy) {
      this.estado = "finalizado";
    } else {
      this.estado = "proximo"; // Si aún falta más de un día, sigue en "próximo"
    }
  }
};

// 🔥 Virtual para obtener el precio más barato
eventoSchema.virtual("precioMenor").get(function () {
  return this.precios.length > 0 ? Math.min(...this.precios.map(p => p.monto)) : 0;
});

// 🔥 Virtual para calcular el aforo total
eventoSchema.virtual("aforo").get(function () {
  return this.precios.reduce((total, precio) => total + precio.disponibles, 0);
});

const Evento = mongoose.model("Evento", eventoSchema);
export default Evento;
