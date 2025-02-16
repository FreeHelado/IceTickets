import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: { type: String, required: true },
  nombre: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  verificado: { type: Boolean, default: false }, // ?? Nuevo campo: usuario verificado o no
  codigoVerificacion: { type: String, default: null }, // Código de 6 dígitos
  expiracionCodigo: { type: Date, default: null } // Expiración en 5 minutos
});

export default mongoose.model("User", UserSchema);
