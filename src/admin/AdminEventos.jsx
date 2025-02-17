import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es";
import { Editor } from "@tinymce/tinymce-react";
import { FaRegTrashCan } from "react-icons/fa6";




function AdminEventos({ setToken }) {
  const { id } = useParams(); // ✅ Capturar ID si estamos en edición
  const [evento, setEvento] = useState({
    nombre: "",
    fecha: "",
    hora: "",
    descripcion: "",
    stock: { aforo: "", vendidas: 0 }, // ✅ Nueva estructura con `stock`
    disponibles: "",
    estado: "proximo",
    imagen: "",
     precios: [{ nombre: "", monto: "", disponibles: "" }], // ✅ Cada precio maneja su stock
    categoria: "",
    lugar: "",
  });

  const [lugares, setLugares] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroLugares, setFiltroLugares] = useState([]);
  const [busquedaLugar, setBusquedaLugar] = useState("");
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const navigate = useNavigate();

  // ✅ Si hay un ID, traer datos del evento para editar
  useEffect(() => {
  const fetchEvento = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id}`);
      const data = await response.json();

      if (!data) return;

      // ✅ Cargar evento en el estado
      setEvento({
        nombre: data.nombre || "",
        fecha: data.fecha ? parseISO(data.fecha) : null,
        hora: data.hora || "",
        descripcion: data.descripcion || "",
        stock: { 
          aforo: data.stock?.aforo || "", 
          vendidas: data.stock?.vendidas || 0  // ✅ Nuevo campo `vendidas`
        },
        disponibles: data.stock?.disponibles || "", // ✅ Cargar disponibles
        estado: data.estado || "proximo",
        imagen: data.imagen || "",
        precios: data.precios?.length > 0 
          ? data.precios.map(precio => ({
              nombre: precio.nombre || "",
              monto: precio.monto || "",
              disponibles: precio.disponibles || "" // ✅ Nuevo campo `disponibles` por tipo de entrada
            }))
          : [{ nombre: "", monto: "", disponibles: "" }],
        categoria: data.categoria || "",
        lugar: data.lugar || "",
        vendedor: data.vendedor || "",
      });

      // ✅ Si hay imagen, mostrarla en la preview
      if (data.imagen) {
        setImagenPreview(`http://localhost:5000/img/eventos/${data.imagen}`);
      }

      // ✅ Si el evento tiene un lugar, obtener el nombre
      if (data.lugar) {
        const lugarResponse = await fetch(`http://localhost:5000/api/lugares/${data.lugar}`);
        if (lugarResponse.ok) {
          const lugarData = await lugarResponse.json();
          setBusquedaLugar(lugarData.nombre);
        } else {
          console.error("❌ Error: Lugar no encontrado");
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar el evento:", error);
    }
  };

  if (id) fetchEvento();
}, [id]);


  // ✅ Cargar categorías
  useEffect(() => {
    fetch("http://localhost:5000/api/categorias")
      .then((response) => response.json())
      .then(setCategorias)
      .catch((error) => console.error("❌ Error al obtener categorías:", error));
  }, []);

  // ✅ Cargar lugares
  useEffect(() => {
    fetch("http://localhost:5000/api/lugares")
      .then((response) => response.json())
      .then(setLugares)
      .catch((error) => console.error("❌ Error al obtener lugares:", error));
  }, []);

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  setImagenSeleccionada(file);

  
    
  if (file) {
    setCargandoImagen(true); // ✅ Mostramos el spinner

    const reader = new FileReader();
    reader.onload = () => {
      setImagenPreview(reader.result);
      setCargandoImagen(false); // ✅ Ocultamos el spinner cuando la imagen se lee
    };
    reader.readAsDataURL(file);
  }
};

  // 💰 PRECIOS
  const handlePrecioChange = (index, e) => {
    const { name, value } = e.target;
    const nuevosPrecios = [...evento.precios];
    nuevosPrecios[index][name] = value;
    // 🔥 Recalcular `aforo` sumando todos los `disponibles`
    const nuevoAforo = nuevosPrecios.reduce((total, p) => total + Number(p.disponibles || 0), 0);
    setEvento({ ...evento, precios: nuevosPrecios, stock: { ...evento.stock, aforo: nuevoAforo } });
  };


  const agregarPrecio = () => {
    setEvento({ 
      ...evento, 
      precios: [...evento.precios, { nombre: "", monto: "", disponibles: "" }] // ✅ Agregar `disponibles`
    });
  };

  const eliminarPrecio = (index) => {
    if (index === 0) return;
    setEvento({ 
      ...evento, 
      precios: evento.precios.filter((_, i) => i !== index) 
    });
  };
  // 💰 PRECIOS


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "aforo" || name === "vendidas") {
      setEvento((prev) => ({
        ...prev,
        stock: {
          ...prev.stock,
          [name]: value, // ✅ Asegura que `aforo` y `vendidas` se guarden dentro de `stock`
        },
      }));
    } else {
      setEvento((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const handleFechaChange = (date) => {
    if (!date) return;
    const fechaFormateada = format(date, "yyyy-MM-dd", { locale: esLocale });
    setEvento({ ...evento, fecha: fechaFormateada });
  };

  const handleCategoriaChange = (e) => {
    setEvento({ ...evento, categoria: e.target.value });
  };

  const handleBuscarLugar = (e) => {
    const texto = e.target.value;
    setBusquedaLugar(texto);
    if (texto.trim() === "") {
      setFiltroLugares([]);
      return;
    }
    setFiltroLugares(lugares.filter((lugar) => lugar.nombre.toLowerCase().includes(texto.toLowerCase())));
  };

  const handleSeleccionLugar = (lugar) => {
    setBusquedaLugar(lugar.nombre);
    setEvento({ ...evento, lugar: lugar._id });
    setFiltroLugares([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!imagenSeleccionada && !evento.imagen) {
      Swal.fire({
        icon: "warning",
        title: "Imagen requerida",
        text: "Debes seleccionar una imagen antes de guardar el evento.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    let imageName = evento.imagen;
    if (imagenSeleccionada) {
      const formData = new FormData();
      formData.append("imagen", imagenSeleccionada);
      try {
        const response = await fetch("http://localhost:5000/api/eventos/upload", { method: "POST", body: formData });
        const data = await response.json();
        imageName = data.fileName;
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error al subir la imagen", text: "No se pudo subir la imagen." });
        return;
      }
    }

    // ✅ Construir el objeto `evento` con la nueva estructura
    const eventoData = {
      nombre: evento.nombre,
      fecha: evento.fecha,
      hora: evento.hora,
      descripcion: evento.descripcion,
      stock: { 
        aforo: evento.stock.aforo, 
        vendidas: evento.stock.vendidas || 0 
      },
      estado: evento.estado,
      imagen: imageName,
      precios: evento.precios.map(precio => ({
        nombre: precio.nombre,
        monto: precio.monto,
        disponibles: precio.disponibles
      })),
      categoria: evento.categoria,
      lugar: evento.lugar,
    };

    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id || ""}`, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(eventoData),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: `Evento ${id ? "actualizado" : "agregado"} correctamente`,
          text: "El evento ha sido guardado en la base de datos.",
          showConfirmButton: true,
          confirmButtonText: "Aceptar",
        }).then(() => navigate("/eventosadmin"));

        setEvento({
          nombre: "",
          fecha: "",
          hora: "",
          descripcion: "",
          stock: { aforo: "", vendidas: 0 },
          estado: "proximo",
          imagen: "",
          precios: [{ nombre: "", monto: "", disponibles: "" }],
          categoria: "",
          lugar: "",
          vendedor: "",
        });

        setImagenPreview(null);
        setImagenSeleccionada(null);
      } else {
        Swal.fire({ icon: "error", title: "Error al guardar", text: data.message || "Hubo un problema." });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error en la conexión", text: "No se pudo conectar con el servidor." });
    }
  };




  return (
    <div className="admin-eventos adminPanel">
      <h2>{id ? "Editar Evento" : "Agregar Nuevo Evento"}</h2>
      <form onSubmit={handleSubmit}>

        <h3>Información del Evento</h3>
        <div className="campoForm">
          <label htmlFor="nombre">Nombre del Evento</label>
          <input 
            type="text" 
            name="nombre" 
            value={evento.nombre} 
            onChange={handleChange} 
            required 
            placeholder="Nombre del evento" 
          />
        </div>

        <div className="campoForm">
          <label htmlFor="lugar">Lugar</label>
          <input
            type="text"
            placeholder="Buscar lugar..."
            value={busquedaLugar}
            onChange={handleBuscarLugar}
          />
          {/* ✅ Mostrar lista de lugares filtrados */}
          {filtroLugares.length > 0 && (
            <ul className="autocomplete-list">
              {filtroLugares.map(lugar => (
                <li key={lugar._id} onClick={() => handleSeleccionLugar(lugar)}>
                  {lugar.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="campoForm">
          <label htmlFor="descripcion">Descripción del Evento</label>
          <Editor
              apiKey='1yli8xddk7o5i9q5vhqd84u36v32xfmi359kk8ec29hskklr'
              init={{
              language: "es", // ✅ Establece el idioma en español
              skin: "oxide-dark", // ✅ Activa el skin oscuro de TinyMCE
                content_css: "dark", // ✅ Hace que el contenido dentro del editor sea oscuro también
              width: "100%",
              toolbar: `
                undo redo | formatselect | bold italic underline strikethrough | 
                forecolor backcolor | alignleft aligncenter alignright alignjustify | 
                bullist numlist outdent indent | link image media table | 
                emoticons charmap removeformat`,
              plugins: [
                "advlist autolink lists link image charmap print preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste code help wordcount"
              ], // ✅ Agregamos plugins útiles
              content_style: "body { font-family:Arial,sans-serif; font-size:16px; background-color:#19191b; }", // ✅ Estilos personalizados dentro del editor
                tinycomments_mode: 'embedded',
                tinycomments_author: 'Author name',
                mergetags_list: [
                  { value: 'First.Name', title: 'First Name' },
                  { value: 'Email', title: 'Email' },
                ],
                ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
              }}
            value={evento.descripcion}
            onEditorChange={(content) => setEvento({ ...evento, descripcion: content })}
          />
        </div>
        
        <div className="grupoCampos">
        <div className="campoForm">
          <label htmlFor="fecha">Fecha del Evento</label>
          <ReactDatePicker
            selected={evento.fecha ? new Date(evento.fecha) : null}
            onChange={handleFechaChange}
            dateFormat="EEEE d 'de' MMMM yyyy"
            locale={esLocale}  
            className="custom-datepicker"
          />
        </div>
        
        <div className="campoForm">
          <label htmlFor="hora">Hora</label>
          <input 
            type="time" 
            name="hora" 
            value={evento.hora} 
            onChange={handleChange} 
            required 
          />
        </div>
        </div>

        <hr/>
        
        

        <h3>Imagen de tu Evento</h3>
        <div className="alert">
          Medidas recomendadas: 
        </div>
        <div className="campoForm addImagen">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

          
          {cargandoImagen && (
            <div className="spinner">
              <div className="loader"></div>
            </div>
          )}

          {imagenPreview && <img src={imagenPreview} alt="Vista previa" style={{ maxWidth: "300px" }} className="imgPrev" />}
        
        <hr/>

        <h3>Tickets</h3>
        <div className="alert admin">
          En esta sección agrega las diferentes opciones de tickets que vas a ofrecer.
        </div>
            {evento.precios.map((precio, index) => (
              <div key={index} className="camposTickets">
                <div className="campoForm">
                  <label htmlFor="nombre">Nombre del ticket</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    placeholder="Tipo (VIP, General...)" 
                    value={precio.nombre} 
                    onChange={(e) => handlePrecioChange(index, e)} 
                    required 
                  />
                </div>
                <div className="campoForm">
                  <label htmlFor="monto">Precio</label>
                  <input 
                    type="number" 
                    name="monto" 
                    placeholder="Monto" 
                    value={precio.monto} 
                    onChange={(e) => handlePrecioChange(index, e)} 
                    required 
                  />
                </div>
                <div className="campoForm">
                  <label htmlFor="disponibles">Stock Disponible</label>
                  <input 
                    type="number" 
                    name="disponibles"
                    placeholder="Disponibles" 
                    value={precio.disponibles} 
                    onChange={(e) => handlePrecioChange(index, e)} 
                    required 
                  />
                </div>
                {index > 0 && <button type="button" onClick={() => eliminarPrecio(index)}><i><FaRegTrashCan /></i></button>}
              </div>
            ))}
            <div className="addTicket">
          <button type="button" onClick={agregarPrecio}>
            <strong>+</strong><span>Agregar Ticket</span>
            </button>
            </div>

        <hr />
        
        <h3>Stock</h3>
        <div className="campoForm">  
          <input 
            type="number" 
            name="aforo" 
            value={evento.stock.aforo} 
            disabled // ❌ No editable
            placeholder="Aforo total" 
          />

          <input 
            type="number" 
            name="vendidas" 
            value={evento.stock.vendidas} 
            onChange={handleChange} 
            placeholder="Entradas vendidas (Solo informativo)" 
            disabled 
          />
        </div>

        <hr/>

        <h3>Más Info</h3>
        <div className="campoForm">
          <label htmlFor="categoria">Categoría</label>
          <select name="categoria" value={evento.categoria} onChange={handleCategoriaChange} required>
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
        

        <button type="submit" className="enviarEvento">{id ? "Actualizar Evento" : "Guardar Evento"}</button>
        </form>
    </div>
  );
}

export default AdminEventos;
