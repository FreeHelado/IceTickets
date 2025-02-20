import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import config from "../config";
import Swal from "sweetalert2";

function AdminLugarForm() {
    const { id } = useParams(); // 🔥 Capturamos el ID del lugar desde la URL
    const [nombre, setNombre] = useState("");
    const [direccion, setDireccion] = useState("");
    const [localidad, setLocalidad] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [contacto, setContacto] = useState("");
    const [linkWeb, setLinkWeb] = useState("");
    const [linkRedSocial, setLinkRedSocial] = useState("");
    const [mapaImagen, setMapaImagen] = useState("");
    const [logo, setLogo] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetch(`${config.BACKEND_URL}/api/lugares/${id}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("📥 Datos recibidos del backend:", data); // 🔥 Debug

                setNombre(data.nombre);
                setDireccion(data.direccion);
                setLocalidad(data.localidad);
                setLat(data.ubicacion?.lat);
                setLng(data.ubicacion?.lng);
                setContacto(data.contacto || "");
                setLinkWeb(data.linkWeb || "");
                setLinkRedSocial(data.linkRedSocial || "");
                setMapaImagen(data.mapaImagen || "");
                setLogo(data.logo || ""); 
            })
            .catch(() => Swal.fire("Error", "No se pudo cargar el lugar", "error"));
        }
    }, [id]);

    const handleSubmit = async (e) => {
            e.preventDefault();

        if (!nombre || !direccion || !localidad || !lat || !lng) {
            Swal.fire("Error", "Todos los campos obligatorios deben estar completos", "error");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const metodo = id ? "PUT" : "POST";
            const url = `${config.BACKEND_URL}/api/lugares`;

            const lugarData = {
            id,
            nombre,
            direccion,
            localidad,
            ubicacion: { lat: parseFloat(lat), lng: parseFloat(lng) },
            contacto,
            linkWeb,
            linkRedSocial,
            mapaImagen,
            logo,
            };

            console.log("📤 Enviando datos al backend:", lugarData); // 🔥 Debug

            const response = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify(lugarData),
            });

            const data = await response.json();

            if (response.ok) {
            Swal.fire("Éxito", id ? "Lugar actualizado" : "Lugar creado", "success");
            navigate("/admin/mis-lugares");
            } else {
            Swal.fire("Error", data.message || "No se pudo guardar el lugar", "error");
            }
        } catch (error) {
            console.error("❌ Error al guardar lugar:", error);
            Swal.fire("Error", "Hubo un problema en el servidor", "error");
        }
    };



    return (
        <main className="adminPanel">
        <h2>{id ? "Editar Lugar" : "Crear Nuevo Lugar"}</h2>
        <form className="form" onSubmit={handleSubmit}>
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

            <label>Dirección</label>
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} required />

            <label>Localidad</label>
            <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} required />

            <label>Latitud</label>
            <input type="number" value={lat} onChange={(e) => setLat(e.target.value)} required />

            <label>Longitud</label>
            <input type="number" value={lng} onChange={(e) => setLng(e.target.value)} required />

            <label>Contacto</label>
            <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} />

            <label>Link Web</label>
            <input type="text" value={linkWeb} onChange={(e) => setLinkWeb(e.target.value)} />

            <label>Red Social</label>
            <input type="text" value={linkRedSocial} onChange={(e) => setLinkRedSocial(e.target.value)} />

            <label>Mapa Imagen (URL)</label>
                <input type="text" value={mapaImagen} onChange={(e) => setMapaImagen(e.target.value)} />
                
            <label>Logo (URL o Nombre de Archivo)</label>
            <input type="text" value={logo} onChange={(e) => setLogo(e.target.value)} />
    

            <button type="submit">{id ? "Guardar Cambios" : "Crear Lugar"}</button>
        </form>
        </main>
    );
}

export default AdminLugarForm;
