import mongoose from "mongoose";

const vendedorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }
}, { collection: "vendedores" }); // ?? Forzar nombre de la colecci�n

const Vendedor = mongoose.model("Vendedor", vendedorSchema);
export default Vendedor;

