import mongoose from "mongoose";

const OrdenSchema = new mongoose.Schema({
    comprador: {
        nombre: String,
        email: String,
        telefono: String
    },
    evento: {
        id: String,
        nombre: String,
        fecha: String,
        hora: String,
        lugar: String,
        direccion: String
    },
    tickets: [
        {
            nombre: String,
            email: String,
            telefono: String,
            documento: String,
            tipoEntrada: String,
            monto: Number,
            idVerificador: String // Para validar en puerta
        }
    ],
    total: Number,
    metodoPago: String,
    estado: { type: String, default: "pendiente" },
    fechaCompra: { type: Date, default: Date.now }
});

export default mongoose.model("Orden", OrdenSchema, "ordenes");
