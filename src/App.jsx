import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import axios from "axios";

import Header from "./componentes/Header"; // ✅ Header normal
import HeaderAdmin from "./admin/HeaderAdmin"; // ✅ Header para Admin
import Eventos from "./componentes/Eventos";
import EventoDetalle from "./pages/EventoDetalle";
import Login from "./admin/Login";
import Register from "./admin/Register";
import VerificarCodigo from "./admin/VerificarCodigo";
import AdminEventos from "./admin/AdminEventos";
import AdminIndex from "./admin/AdminIndex";
import AdminEventosList from "./admin/AdminEventosList";
import AdminOrdenesEvento from "./admin/AdminOrdenesEvento";
import Checkout from "./pages/Checkout"; // ✅ Importamos Checkout

function App() {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const obtenerPerfil = async () => {
      if (token) {
        try {
          const res = await axios.get("http://localhost:5000/api/auth/perfil", {
            headers: { Authorization: token },
          });
          setUsuario(res.data); // Guardamos los datos del usuario
        } catch (error) {
          console.error("Error obteniendo perfil:", error);
          setUsuario(null);
        }
      }
    };
    obtenerPerfil();
  }, [token]);

  return (
    <Router>
      <AppContent token={token} setToken={setToken} usuario={usuario} />
    </Router>
  );
}

// ✅ Usamos `useLocation()` dentro de `Router` para determinar qué header mostrar
function AppContent({ token, setToken, usuario }) {
  const location = useLocation(); // 🔥 Obtenemos la ruta actual

  // 🔥 Definimos en qué rutas queremos mostrar el HeaderAdmin
  const rutasAdmin = ["/admin", "/crearevento", "/eventosadmin", "/admin/evento/editar"];
  const esRutaAdmin = rutasAdmin.some(ruta => location.pathname.startsWith(ruta));

  return (
    <>
      {/* 🔥 No mostramos ningún header si estamos en /login */}
      {location.pathname !== "/login" && location.pathname !== "/register" && location.pathname !== "/verificar" && (esRutaAdmin ? <HeaderAdmin token={token} /> : <Header token={token} />)}

      <Routes>
        <Route path="/" element={<Eventos />} /> {/* Página principal con los eventos */}
        <Route path="/evento/:id" element={<EventoDetalle />} /> {/* Página del evento seleccionado */}

        {/* ?? Ruta protegida: AdminEventos solo accesible si hay token de Administrador */}
        <Route path="/admin" element={token ? <AdminIndex token={token} setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/crearevento" element={token ? <AdminEventos setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/eventosadmin" element={token ? <AdminEventosList /> : <Navigate to="/login" />} />
        <Route path="/admin/evento/editar/:id" element={token ? <AdminEventos setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/admin/evento/ordenes/:idEvento" element={<AdminOrdenesEvento />} /> 
        <Route path="/checkout" element={token ? <Checkout usuario={usuario} /> : <Navigate to="/login" />} />

        
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verificar" element={<VerificarCodigo />} />
      </Routes>
    </>
  );
}

export default App;
