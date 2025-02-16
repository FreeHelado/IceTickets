import jwt from "jsonwebtoken";

const verificarToken = (req, res, next) => {
  const token = req.header("Authorization"); // Leer el token del header

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado, no hay token" });
  }

  try {
    const verificado = jwt.verify(token, "secreto_super_seguro"); // Verifica el token
    req.user = verificado; // Agrega los datos del usuario al request
    next(); // ContinÃºa con la siguiente funciÃ³n
  } catch (error) {
    res.status(400).json({ message: "Token no vÃ¡lido" });
  }
};

export default verificarToken;
