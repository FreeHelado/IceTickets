import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: { type: String, required: true },
  nombre: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  verificado: { type: Boolean, default: false },
  codigoVerificacion: { type: String, default: null },
  expiracionCodigo: { type: Date, default: null }
});

export default mongoose.model("User", UserSchema);
