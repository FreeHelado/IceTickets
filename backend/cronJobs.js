import cron from "node-cron";
import Evento from "./models/Evento.js";

/* ===========================
  🔄 TAREA 1: ACTUALIZAR ESTADOS DE EVENTOS
  📅 Se ejecuta TODOS LOS DÍAS a las 00:00
=========================== */
// Cron job: Ejecuta la actualización todos los días a las 00:00
cron.schedule("0 0 * * *", async () => {
  

  try {
    const eventos = await Evento.find({ estado: { $ne: "cancelado" } });
    const hoy = new Date();

    for (const evento of eventos) {
      const fechaEvento = new Date(evento.fecha);
      const diferenciaDias = Math.floor((fechaEvento - hoy) / (1000 * 60 * 60 * 24));

      let nuevoEstado = "proximo";

      if (diferenciaDias === 1) {
        nuevoEstado = "mañana";
      } else if (fechaEvento.toDateString() === hoy.toDateString()) {
        nuevoEstado = "hoy";
      } else if (fechaEvento < hoy) {
        nuevoEstado = "finalizado";
      }

      if (evento.estado !== nuevoEstado) {
        evento.estado = nuevoEstado;
        await evento.save();
        
      }
    }

   
  } catch (error) {
    console.error("❌ Error al actualizar estados de eventos:", error);
  }
});

/* ===========================
  🔄 TAREA 2: LIBERAR ASIENTOS RESERVADOS
  ⏳ Se ejecuta CADA 60 SEGUNDOS
=========================== */
cron.schedule("*/1 * * * *", async () => { // 🔥 Ejecuta cada minuto
    // console.log("🔄 Revisando asientos reservados vencidos...");

    try {
        const eventos = await Evento.find();

        for (const evento of eventos) {
            let cambios = false;

            evento.sectores.forEach(sector => {
                sector.filas.forEach(fila => {
                    fila.asientos.forEach(asiento => {
                        // console.log(`🔍 Asiento: ${asiento.nombreAsiento}, Reservado: ${asiento.reservado}, Expira: ${asiento.expiracionReserva}`);

                        if (asiento.reservado && asiento.expiracionReserva) {
                            const tiempoExpiracion = new Date(asiento.expiracionReserva);
                            const ahora = new Date();

                            // console.log(`⏳ Comparando ${tiempoExpiracion} con ${ahora}`);

                            if (tiempoExpiracion < ahora) {
                                // console.log(`🛑 Liberando asiento ${asiento.nombreAsiento} en evento ${evento.nombre}`);
                                asiento.reservado = false;
                                asiento.usuarioReserva = null;
                                asiento.expiracionReserva = null;
                                cambios = true;
                            }
                        }
                    });
                });
            });

            if (cambios) {
                await evento.save();
                // //console.log(`✅ Asientos liberados en evento: ${evento.nombre}`);
            }
        }
    } catch (error) {
        console.error("❌ Error en la tarea automática de liberar asientos:", error);
    }
});
