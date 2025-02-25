import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Asegurar que tenemos acceso al modelo de usuario

const verificarToken = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado, no hay token" });
  }

  try {
    const verificado = jwt.verify(token, "secreto_super_seguro"); 
    req.user = { userId: verificado.userId, email: verificado.email, isAdmin: verificado.isAdmin }; 


    // 🔍 Buscar el email del usuario en la base de datos solo si no lo tenemos en el token
    if (!req.user.email) {
      const usuarioDB = await User.findById(req.user.userId);
      if (usuarioDB) {
        req.user.email = usuarioDB.email; // ✅ Agregamos el email
      }
    }

    next(); // Continúa con la siguiente función
  } catch (error) {
    res.status(400).json({ message: "Token no válido" });
  }
};

export default verificarToken;




