import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import config from "../config";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import AdminTools from "./AdminTools";

function AdminLugarForm() {
    const { id } = useParams();
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
    const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);
    const [cargandoImagen, setCargandoImagen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetch(`${config.BACKEND_URL}/api/lugares/${id}`)
            .then((res) => res.json())
            .then((data) => {
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
                if (data.logo) {
                    setImagenPreview(`${config.BACKEND_URL}/img/lugares/${data.logo}`);
                }
            })
            .catch(() => Swal.fire("Error", "No se pudo cargar el lugar", "error"));
        }
    }, [id]);

    // ✅ Manejo de la imagen seleccionada
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagenSeleccionada(file);

            // 🔥 Vista previa de la imagen
            const reader = new FileReader();
            reader.onload = () => setImagenPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        let imageName = logo;
        let lugarData = {
            nombre,
            direccion,
            localidad,
            ubicacion: { lat: parseFloat(lat), lng: parseFloat(lng) },
            contacto,
            linkWeb,
            linkRedSocial,
            mapaImagen,
            logo: imageName,
        };

        // ✅ Si hay una imagen nueva, subimos todo en FormData
        if (imagenSeleccionada) {
            const formData = new FormData();
            formData.append("imagen", imagenSeleccionada);
            formData.append("nombre", nombre);
            formData.append("direccion", direccion);
            formData.append("localidad", localidad);
            formData.append("lat", lat);
            formData.append("lng", lng);
            formData.append("contacto", contacto);
            formData.append("linkWeb", linkWeb);
            formData.append("linkRedSocial", linkRedSocial);
            formData.append("mapaImagen", mapaImagen);

            try {
                const response = await fetch(`${config.BACKEND_URL}/api/lugares${id ? "/" + id : ""}`, {
                    method: id ? "PUT" : "POST",
                    headers: { Authorization: token }, // ❌ NO usar "Content-Type"
                    body: formData, 
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
        } else {
            // ✅ Si no hay imagen, mandamos JSON normal
            try {
                const response = await fetch(`${config.BACKEND_URL}/api/lugares${id ? "/" + id : ""}`, {
                    method: id ? "PUT" : "POST",
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
        }
    };

    return (
        <main className="admin-eventos adminPanel">
            <h2>{id ? "Editar Lugar" : "Crear Nuevo Lugar"}</h2>
            
            <form className="form" onSubmit={handleSubmit}>
                <div className="campoForm">
                    <label>Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>

                <div className="campoForm">
                    <label>Dirección</label>
                    <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
                </div>

                <div className="campoForm">
                    <label>Localidad</label>
                    <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} required />
                </div>

                <div className="campoForm addImagen">
                    <label>Logo o Imagen del Lugar</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>

                {cargandoImagen && <p>Cargando imagen...</p>}
                {imagenPreview && <img src={imagenPreview} alt="Vista previa" style={{ maxWidth: "200px" }} />}

                <div className="campoForm">
                    <label>Latitud</label>
                    <input type="number" value={lat} onChange={(e) => setLat(e.target.value)} required />
                </div>

                <div className="campoForm">
                    <label>Longitud</label>
                    <input type="number" value={lng} onChange={(e) => setLng(e.target.value)} required />
                </div>

                <div className="campoForm">
                    <label>Contacto</label>
                    <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} />
                </div>

                <div className="campoForm">
                    <label>Link Web</label>
                    <input type="text" value={linkWeb} onChange={(e) => setLinkWeb(e.target.value)} />
                </div>

                <div className="campoForm">
                    <label>Red Social</label>
                    <input type="text" value={linkRedSocial} onChange={(e) => setLinkRedSocial(e.target.value)} />
                </div>

                <div className="campoForm">
                    <label>Mapa Imagen (URL)</label>
                    <input type="text" value={mapaImagen} onChange={(e) => setMapaImagen(e.target.value)} />
                </div>

                <button type="submit" className="enviarEvento">{id ? "Guardar Cambios" : "Crear Lugar"}</button>
            </form>

            <div className="adminPanel__cont--zona3 toolAdminFormularios">
                <AdminTools />
            </div>
        </main>
    );
}

export default AdminLugarForm;
