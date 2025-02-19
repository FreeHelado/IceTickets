import config from "../config";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
import esLocale from "date-fns/locale/es";

/// iconos ////
import { FaRegTrashCan, FaDog } from "react-icons/fa6";
import { FaHamburger, FaAccessibleIcon, FaSun } from "react-icons/fa";
import { MdFamilyRestroom } from "react-icons/md";
import { TbRating18Plus } from "react-icons/tb";
import { BiSolidDrink } from "react-icons/bi";


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
    publico: false, // ✅ Por defecto en false
    tags: {
      todoPublico: false,
      noMenores: false,
      ventaComida: false,
      ventaBebida: false,
      petFriendly: false,
      accesible: false,
      aireLibre: false
    },
    infoAdicional: {
      edadMinima: "",
      menoresGratis: "",
      elementosProhibidos: "",
      terminosCondiciones: "",
      horaApertura: "",
      estacionamiento: "",
      transporte: ""
    }
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
      const response = await fetch(`${config.BACKEND_URL}/api/eventos/${id}`, {
        headers: { Authorization: token },
      });

      if (!response.ok) {
        throw new Error("No autorizado");
      }

      const data = await response.json();
      if (!data) return;

      // 🔐 Verificar permisos
      const puedeEditar =
        isAdmin ||
        userId === data.vendedor ||
        data.sociosProductores?.some((socio) => socio._id === userId);

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
          vendidas: data.stock?.vendidas || 0,
        },
        estado: data.estado || "proximo",
        imagen: data.imagen || "",
        precios: data.precios?.length
          ? data.precios.map((precio) => ({
              nombre: precio.nombre || "",
              monto: precio.monto || "",
              disponibles: precio.disponibles || "",
            }))
          : [{ nombre: "", monto: "", disponibles: "" }],
        categoria: data.categoria || "",
        lugar: data.lugar || "",
        vendedor: data.vendedor || "",
        publico: data.publico ?? false,

        // ✅ Aseguramos que `tags` tenga valores por defecto
        tags: {
          todoPublico: data.tags?.todoPublico ?? false,
          noMenores: data.tags?.noMenores ?? false,
          ventaComida: data.tags?.ventaComida ?? false,
          ventaBebida: data.tags?.ventaBebida ?? false,
          petFriendly: data.tags?.petFriendly ?? false,
          accesible: data.tags?.accesible ?? false,
          aireLibre: data.tags?.aireLibre ?? false,
        },

        // ✅ Aseguramos que `infoAdicional` tenga valores por defecto
        infoAdicional: {
          edadMinima: data.infoAdicional?.edadMinima || "",
          menoresGratis: data.infoAdicional?.menoresGratis || "",
          elementosProhibidos: data.infoAdicional?.elementosProhibidos || "",
          terminosCondiciones: data.infoAdicional?.terminosCondiciones || "",
          horaApertura: data.infoAdicional?.horaApertura || "",
          estacionamiento: data.infoAdicional?.estacionamiento || "",
          transporte: data.infoAdicional?.transporte || "",
        },
      });

      if (data.imagen) {
        setImagenPreview(`${config.BACKEND_URL}/img/eventos/${data.imagen}`);
      }
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
    fetch(`${config.BACKEND_URL}/api/categorias`)
      .then((response) => response.json())
      .then(setCategorias)
      .catch((error) => console.error("❌ Error al obtener categorías:", error));
  }, []);

  // ✅ Cargar lugares
  useEffect(() => {
    fetch(`${config.BACKEND_URL}/api/lugares`)
      .then((response) => response.json())
      .then((data) => {
        setLugares(data);

        if (evento.lugar && data.length > 0) {
          const lugarEncontrado = data.find(l => l._id === evento.lugar);
          if (lugarEncontrado) {
            setBusquedaLugar(lugarEncontrado.nombre); // 
          }
        }
      })
      .catch((error) => console.error("❌ Error al obtener lugares:", error));
  }, [evento.lugar]); 


  // ✅ Cargar sociosProductores al editar un evento
  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/eventos/${id}`);
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
          publico: data.publico || false,
           // ✅ Aseguramos que `tags` tenga todos los valores por defecto
          tags: {
            todoPublico: data.tags?.todoPublico || false,
            noMenores: data.tags?.noMenores || false,
            ventaComida: data.tags?.ventaComida || false,
            ventaBebida: data.tags?.ventaBebida || false,
            petFriendly: data.tags?.petFriendly || false,
            accesible: data.tags?.accesible || false,
            aireLibre: data.tags?.aireLibre || false
          },

          // ✅ Lo mismo para `infoAdicional`
          infoAdicional: {
            edadMinima: data.infoAdicional?.edadMinima || "",
            menoresGratis: data.infoAdicional?.menoresGratis || "",
            elementosProhibidos: data.infoAdicional?.elementosProhibidos || "",
            terminosCondiciones: data.infoAdicional?.terminosCondiciones || "",
            horaApertura: data.infoAdicional?.horaApertura || "",
            estacionamiento: data.infoAdicional?.estacionamiento || "",
            transporte: data.infoAdicional?.transporte || ""
          }
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
  setEvento(prev => ({
    ...prev,
    tags: prev.tags && name in prev.tags ? { ...prev.tags, [name]: checked } : prev.tags,
    infoAdicional: prev.infoAdicional && name in prev.infoAdicional ? { ...prev.infoAdicional, [name]: value } : prev.infoAdicional,
    [name]: type === "checkbox" ? checked :
      name in prev.stock
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
        const response = await fetch(`${config.BACKEND_URL}/api/eventos/upload`, { method: "POST", body: formData });
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
  fecha: evento.fecha.toISOString(),
  hora: evento.hora,
  descripcion: evento.descripcion,
  stock: {
    aforo: evento.stock.aforo,
    vendidas: evento.stock.vendidas || 0,
  },
  estado: evento.estado,
  imagen: imageName,
  precios: evento.precios.map((precio) => ({
    nombre: precio.nombre,
    monto: precio.monto,
    disponibles: precio.disponibles,
  })),
  categoria: evento.categoria,
  lugar: evento.lugar,
  sociosProductoresEmails: sociosEmails,
  publico: evento.publico,

  // ✅ Aseguramos que se envíe al backend correctamente
  tags: evento.tags || {
    todoPublico: false,
    noMenores: false,
    ventaComida: false,
    ventaBebida: false,
    petFriendly: false,
    accesible: false,
    aireLibre: false,
  },

  infoAdicional: evento.infoAdicional || {
    edadMinima: "",
    menoresGratis: "",
    elementosProhibidos: "",
    terminosCondiciones: "",
    horaApertura: "",
    estacionamiento: "",
    transporte: "",
  },
};


    try {
      const response = await fetch(`${config.BACKEND_URL}/api/eventos/${id || ""}`, {
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
          publico: false,
            tags: { 
              todoPublico: false,
              noMenores: false,
              ventaComida: false,
              ventaBebida: false,
              petFriendly: false,
              accesible: false,
              aireLibre: false
            },
            infoAdicional: {
              edadMinima: "",
              menoresGratis: "",
              elementosProhibidos: "",
              terminosCondiciones: "",
              horaApertura: "",
              estacionamiento: "",
              transporte: ""
            }
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
    <main className="admin-eventos adminPanel">
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
          <textarea name="" id="" value={evento.descripcion || ""} 
            onChange={(content) => setEvento({ ...evento, descripcion: content })}></textarea>


     
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
          Medidas recomendadas: La imágen debe ser de 1200px x 628px y pesar menos de 400 kb. Recomendamos que sea en formato jpg, png o webp.
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

        <span>Selecciona las etiquetas quequieres presentar en tu evento</span>
        <div className="grupoTags">
          <div className="grupoTags__tag">
              <input type="checkbox" name="todoPublico" id="todoPublico"
                checked={evento.tags.todoPublico} 
                onChange={handleChange} />
              <label htmlFor="todoPublico">
                <i><MdFamilyRestroom /></i>
                <span>PARA TODO PÚBLICO</span>
              </label>
          </div>
          <div className="grupoTags__tag">
                <input type="checkbox" name="noMenores" id="noMenores" 
                  checked={evento.tags.noMenores} 
                  onChange={handleChange} />
            <label htmlFor="noMenores">
              <i><TbRating18Plus /></i>
              <span>PARA MAYORES DE 18</span>
            </label>
          </div>

          <div className="grupoTags__tag">
              <input type="checkbox" name="ventaComida" id="ventaComida" 
                checked={evento.tags.ventaComida} 
                onChange={handleChange} />
            <label htmlFor="ventaComida">
              <i><FaHamburger /></i>
              <span>VENTA DE COMIDA</span>
            </label>
          </div>
          <div className="grupoTags__tag">
              <input type="checkbox" name="ventaBebida" id="ventaBebida" 
                checked={evento.tags.ventaBebida} 
                onChange={handleChange} />
            <label htmlFor="ventaBebida">
              <i><BiSolidDrink /></i>
                <span>VENTA DE BEBIDA</span>
              </label>
          </div>
          <div className="grupoTags__tag">
              <input type="checkbox" name="petFriendly" id="petFriendly"
                checked={evento.tags.petFriendly} 
                onChange={handleChange} />
              <label htmlFor="petFriendly">
              <i><FaDog /></i>
                <span>PET FIENDLY</span>
              </label>
          </div>

          <div className="grupoTags__tag">
              <input type="checkbox" name="accesible" id="accesible" 
                checked={evento.tags.accesible} 
                onChange={handleChange} />
              <label htmlFor="accesible">
                <i><FaAccessibleIcon /></i>
                <span>ACCESIBLE E INCLUSIVO</span>
              </label>
          </div>

          <div className="grupoTags__tag">
              <input type="checkbox" name="aireLibre" id="aireLibre" 
                checked={evento.tags.aireLibre} 
                onChange={handleChange} />
            <label htmlFor="aireLibre">
              <i><FaSun /></i>
              <span>AIRE LIBRE</span>
             
            </label>

          </div>
            
          </div>

        
        <hr />

        <h3>Información Adicional</h3>
          <div className="campoForm">
            <label>Edad mínima para acceder</label>
            <input 
              type="text" 
              name="edadMinima" 
              value={evento.infoAdicional.edadMinima} 
              onChange={handleChange} 
              placeholder="Ej: 18 años"
            />
          </div>

          <div className="campoForm">
            <label>Menores de (edad) no pagan</label>
            <input 
              type="text" 
              name="menoresGratis" 
              value={evento.infoAdicional.menoresGratis} 
              onChange={handleChange} 
              placeholder="Ej: 10 años"
            />
          </div>

          <div className="campoForm">
            <label>Elementos prohibidos</label>
            <input 
              type="text" 
              name="elementosProhibidos" 
              value={evento.infoAdicional.elementosProhibidos} 
              onChange={handleChange} 
              placeholder="Ej: Botellas de vidrio, armas..."
            />
          </div>

          <div className="campoForm">
            <label>Términos y Condiciones</label>
            <textarea 
              name="terminosCondiciones" 
              value={evento.infoAdicional.terminosCondiciones} 
              onChange={handleChange} 
              placeholder="Ingresa aquí los términos y condiciones del evento"
            ></textarea>
        </div>
        
        <div className="campoForm">
        <label>Horario de Apertura</label>
        <input 
          type="text" 
          name="horaApertura" 
          value={evento.infoAdicional.horaApertura} 
          onChange={handleChange} 
          placeholder="Ej: 19:00 hs"
        />
      </div>

      <div className="campoForm">
        <label>Estacionamiento</label>
        <textarea 
          name="estacionamiento" 
          value={evento.infoAdicional.estacionamiento} 
          onChange={handleChange} 
          placeholder="Ej: Estacionamiento privado a 200m, tarifa $500/hora"
        ></textarea>
      </div>

      <div className="campoForm">
        <label>Transporte recomendado</label>
        <textarea 
          name="transporte" 
          value={evento.infoAdicional.transporte} 
          onChange={handleChange} 
          placeholder="Ej: Líneas de colectivo 152, 59 y 168"
        ></textarea>
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
    </main>
  );
}

export default AdminEventos;
