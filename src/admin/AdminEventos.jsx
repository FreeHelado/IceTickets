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
    stock: { aforo: "", vendidas: 0 }, 
    disponibles: "",
    estado: "proximo",
    imagen: "",
    precios: [{ nombre: "", monto: "", disponibles: "" }],
    categoria: "",
    publico: false // ✅ Por defecto en false
  });

  const [lugares, setLugares] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroLugares, setFiltroLugares] = useState([]);
  const [busquedaLugar, setBusquedaLugar] = useState("");
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const [sociosEmails, setSociosEmails] = useState([]);
  const [nuevoEmail, setNuevoEmail] = useState(""); // ✅ Aseguramos que esté definido
  const [vendedorEmail, setVendedorEmail] = useState(""); // ✅ Guardamos el email del vendedor
  const userId = localStorage.getItem("userId"); // 🔥 Obtenemos el ID del usuario autenticado
  const isAdmin = localStorage.getItem("isAdmin") === "true"; // Convertimos el string a booleano


  const navigate = useNavigate();

  // ✅ /// EDICION!!! Si hay un ID, traer datos del evento para editar
  useEffect(() => {
  const fetchEvento = async () => {
    const token = localStorage.getItem("token");
    
    // 🔒 Si no hay token, redirigir al login
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Acceso restringido",
        text: "Debes iniciar sesión para acceder a esta sección",
        confirmButtonText: "Ir al Login",
      }).then(() => navigate("/login"));
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id}`, {
        headers: { Authorization: token }
      });

      if (!response.ok) {
        throw new Error("No autorizado");
      }

      const data = await response.json();
      if (!data) return;

      // 🔐 Verificar si el usuario puede editar
      const puedeEditar =
        isAdmin || 
        userId === data.vendedor || 
        data.sociosProductores.some(socio => socio._id === userId);

      if (!puedeEditar) {
        Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text: "No tienes permisos para editar este evento",
          confirmButtonText: "Volver al panel",
        }).then(() => navigate("/eventosadmin"));
        return;
      }

     

      setEvento({
        nombre: data.nombre || "",
        fecha: data.fecha ? parseISO(data.fecha) : null,
        hora: data.hora || "",
        descripcion: data.descripcion || "",
        stock: { 
          aforo: data.stock?.aforo || "", 
          vendidas: data.stock?.vendidas || 0  
        },
        estado: data.estado || "proximo",
        imagen: data.imagen || "",
        precios: data.precios?.length > 0 
          ? data.precios.map(precio => ({
              nombre: precio.nombre || "",
              monto: precio.monto || "",
              disponibles: precio.disponibles || ""
            }))
          : [{ nombre: "", monto: "", disponibles: "" }],
        categoria: data.categoria || "",
        lugar: data.lugar || "",
        vendedor: data.vendedor || "",
        publico: data.publico ?? false // ✅ Agrega esta línea
      });

    } catch (error) {
      console.error("❌ Error al cargar el evento:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar el evento.",
        confirmButtonText: "Volver",
      }).then(() => navigate("/eventosadmin"));
    }
  };

  if (id) fetchEvento();
  }, [id, isAdmin, userId, navigate]);



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

  // ✅ Cargar sociosProductores al editar un evento
  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/eventos/${id}`);
        const data = await response.json();
        if (!data) return;

        // ✅ Cargar emails de sociosProductores en la lista
        setSociosEmails(data.sociosProductores ? data.sociosProductores.map(sp => sp.email) : []);


        setEvento({
          nombre: data.nombre || "",
          fecha: data.fecha ? parseISO(data.fecha) : null,
          hora: data.hora || "",
          descripcion: data.descripcion || "",
          stock: {
            aforo: data.stock?.aforo || "",
            vendidas: data.stock?.vendidas || 0
          },
          estado: data.estado || "proximo",
          imagen: data.imagen || "",
          precios: data.precios?.length > 0 
            ? data.precios.map(precio => ({
                nombre: precio.nombre || "",
                monto: precio.monto || "",
                disponibles: precio.disponibles || ""
              }))
            : [{ nombre: "", monto: "", disponibles: "" }],
          categoria: data.categoria || "",
          lugar: data.lugar || "",
          vendedor: data.vendedor || "",
          publico: data.publico || false 
        });
      } catch (error) {
        console.error("❌ Error al cargar el evento:", error);
      }
    };

    if (id) fetchEvento();
  }, [id]);

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


  // Socios //
  const agregarEmail = () => {
    if (nuevoEmail && !sociosEmails.includes(nuevoEmail)) {
      setSociosEmails([...sociosEmails, nuevoEmail]);
      setNuevoEmail("");
    }
  };

  const eliminarEmail = (email) => {
    setSociosEmails(sociosEmails.filter(e => e !== email));
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvento((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked :
        (name === "aforo" || name === "vendidas")
        ? { ...prev.stock, [name]: value }
        : value
    }));
  };


  const handleFechaChange = (date) => {
    if (!date) return;
    setEvento({ ...evento, fecha: date }); // ✅ Guardamos la fecha como `Date`
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
      fecha: evento.fecha.toISOString(), // ✅ Convertimos Date a ISO antes de enviar
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
      sociosProductoresEmails: sociosEmails,
      publico: evento.publico // ✅ Se agrega para que se envíe al backend
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
            selected={evento.fecha} // ✅ Ahora es un objeto Date
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
        
        <h3>Stock del Evento</h3>
        <div className="campoForm">  
          <label>Aforo Total</label>
          <input 
            type="number" 
            name="aforo" 
            value={evento.stock.aforo} 
            disabled // ❌ No editable
            placeholder="Aforo total" 
          />
        </div>

        <div className="campoForm"> 
          <label>Vendidas</label>
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

        
        <hr />

        
        <div className="campoCheck">
            <input
              type="checkbox"
              name="publico"
              checked={evento.publico}
              onChange={handleChange}
            />
          <label>Evento público</label>
        </div>
        <div className="alert">
          Marca este check cuando el evento esté llisto para salir al público, mientras no lo esté el evento estará disponible solo con el link d ela vista previa, pero no se listará en la porta ni buscadores
        </div>

        <hr />
        
        <h3>Socios Productores</h3>
        <div className="campoForm">
          <div className="alert">
            Vendedor de este evento: {vendedorEmail}
          </div>
        </div>


        <div className="sociosCont">
          
          {isAdmin || userId === evento.vendedor ? (
            <>
              <div className="alert alert-warning">
                Ingresa aquí los emails de los demás productores, si tienen un usuario en IceTicket, podrán ver y administrar el evento. Ten en cuenta que todos los productores tienen los mismos privilegios en los eventos, podrán eliminarlo y modificar cualquiera de sus datos. Lo único que solo puedes hacer tu, es editar los socios promotores.
               </div>
              
              <div className="campoForm campoSocio">
                <label>Ingresá el Email</label>
                <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} />
                <button type="button" onClick={agregarEmail}>Agregar</button>
              </div>
            </>
          ) : (
            <div className="alert alert-warning">Solo el vendedor {vendedorEmail} puede modificar los socios productores</div>
          )}

            <div className="listadoSocios">
              <h5>Socios:</h5>
              {sociosEmails.map(email => (
                <span key={email}>
                  {email}{" "}
                  {isAdmin || userId === evento.vendedor ? (
                    <button onClick={() => eliminarEmail(email)}>X</button>
                  ) : null}
                </span>
              ))}
            </div>
        </div>

        

        <button type="submit" className="enviarEvento">{id ? "Actualizar Evento" : "Guardar Evento"}</button>
        </form>
    </div>
  );
}

export default AdminEventos;
