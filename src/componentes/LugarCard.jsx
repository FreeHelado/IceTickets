import config from "../config";
import React from "react";

function LugarCard({ lugar }) {
  if (!lugar) return null; // No renderizar si no hay datos

  return (
    <div className="evento__cont--info--lugar">

      <div className="evento__cont--info--lugar--header">
        {lugar.logo && <img src={`${config.BACKEND_URL}/img/lugares/${lugar.logo}`} alt={lugar.nombre} className="lugar-logo" />}
        <div className="evento__cont--info--lugar--header--data">
          <h2>{lugar.nombre}</h2>
          {lugar.direccion &&<span><strong>Dirección:</strong> {lugar.direccion}, {lugar.localidad}</span>}
          {lugar.contacto && <span><strong>Contacto:</strong> {lugar.contacto}</span>}
          {(lugar.linkWeb || lugar.linkRedSocial) && (
            <div className="evento__cont--info--lugar--header--data--rrss">
              {lugar.linkWeb && (
                <a href={lugar.linkWeb} target="_blank" rel="noopener noreferrer">
                  Sitio Web
                </a>
              )}
              {lugar.linkRedSocial && (
                <a href={lugar.linkRedSocial} target="_blank" rel="noopener noreferrer">
                  Redes Sociales
                </a>
              )}
            </div>
          )}
 </div>
        
      </div>


      {/*mapa */}
      {lugar.ubicacion?.lat && lugar.ubicacion?.lng && (
     
        
        <iframe
          src={`https://www.google.com/maps?q=${lugar.ubicacion.lat},${lugar.ubicacion.lng}&hl=en&z=14&output=embed`}
          width="100%"
          height="400"
          style={{ border: 0, marginTop: "10px" }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      )}
    </div>
  );
}

export default LugarCard;
