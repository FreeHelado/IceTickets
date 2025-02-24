import config from "./config";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import axios from "axios";

import Header from "./componentes/Header";
import HeaderAdmin from "./admin/HeaderAdmin";
import Eventos from "./componentes/Eventos";
import EventoDetalle from "./pages/EventoDetalle";

import Login from "./admin/Login";
import Register from "./admin/Register";
import VerificarCodigo from "./admin/VerificarCodigo";

import AdminEventos from "./admin/AdminEventos";
import AdminIndex from "./admin/AdminIndex";
import AdminEventosList from "./admin/AdminEventosList";
import AdminOrdenesEvento from "./admin/AdminOrdenesEvento";
import AdminTicketsEvento from "./admin/AdminTicketsEvento";
import AdminCategorias from "./admin/AdminCategorias";
import AdminAsientosForm from "./admin/AdminAsientosForm"; 
import AdminLugaresList from "./admin/AdminLugaresList";
import AdminLugarForm from "./admin/AdminLugarForm";
import AdminMapaAsientos from "./admin/AdminMapaAsientos";
import AdminAsientosEvento from "./admin/AdminAsientosEvento";

import PorteroLogin from "./porteros/PorteroLogin";
import ControlPuerta from "./porteros/ControlPuerta";

import Checkout from "./pages/Checkout"; 
import MisTickets from "./pages/MisTickets"; 

function App() {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const obtenerPerfil = async () => {
      if (token) {
        try {
          const res = await axios.get(`${config.BACKEND_URL}/api/auth/perfil`, {
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
      {location.pathname !== "/login" && location.pathname !== "/register" && location.pathname !== "/verificar"  && location.pathname !== "/validar-tickets" && location.pathname !== "/portero" && (esRutaAdmin ? <HeaderAdmin token={token} /> : <Header token={token} />)}

      <Routes>
        <Route path="/" element={<Eventos />} /> {/* Página principal con los eventos */}
        <Route path="/evento/:id" element={<EventoDetalle />} /> {/* Página del evento seleccionado */}

        {/* ?? Ruta protegida: AdminEventos solo accesible si hay token de Administrador */}
        <Route path="/admin" element={token ? <AdminIndex token={token} setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/crearevento" element={token ? <AdminEventos setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/eventosadmin" element={token ? <AdminEventosList /> : <Navigate to="/login" />} />
        <Route path="/admin/evento/editar/:id" element={token ? <AdminEventos setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/admin/evento/ordenes/:idEvento" element={<AdminOrdenesEvento />} /> 
        <Route path="/admin/evento/:idEvento/tickets" element={<AdminTicketsEvento />} />
        <Route path="/admin/categorias" element={token ? <AdminCategorias isAdmin={true} /> : <Navigate to="/login" />} />
        <Route path="/admin/mis-lugares" element={token ? <AdminLugaresList setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/admin/asientos/editar/:id" element={<AdminAsientosForm />} /> 
        <Route path="/admin/asientos/map/:id" element={<AdminMapaAsientos />} /> 
        <Route path="/admin/mis-lugares/crearlugar" element={token ? <AdminLugarForm setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/admin/mis-lugares/editar/:id" element={token ? <AdminLugarForm setToken={setToken} /> : <Navigate to="/login" />} />
        <Route path="/admin/evento/asientos/:id" element={token ? <AdminAsientosEvento /> : <Navigate to="/login" />} />

        <Route path="/portero" element={<PorteroLogin />} />
        <Route path="/validar-tickets" element={<ControlPuerta />} />


        <Route path="/checkout" element={token ? <Checkout usuario={usuario} /> : <Navigate to="/login" />} />
        <Route path="/mis-tickets" element={<MisTickets />} />
        

        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verificar" element={<VerificarCodigo />} />
      </Routes>
    </>
  );
}

export default App;
