module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Metodo no permitido" });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: "Falta configurar RESEND_API_KEY" });
  }

  const fields = parseBody(req.body);
  const nombre = clean(fields.nombre) || "No indicado";
  const telefono = clean(fields.telefono) || "No indicado";
  const empresa = clean(fields.empresa) || "No indicada";
  const servicio = clean(fields.servicio) || "Consulta general";
  const mensaje = clean(fields.mensaje) || "No indicado";

  const text = [
    "Nueva solicitud desde la web de Transporte Tavolaro",
    "",
    `Nombre: ${nombre}`,
    `Telefono: ${telefono}`,
    `Empresa o comercio: ${empresa}`,
    `Tipo de servicio: ${servicio}`,
    "",
    "Mensaje:",
    mensaje
  ].join("\n");

  const html = `
    <h2>Nueva solicitud desde Transporte Tavolaro</h2>
    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
      <tr><td><strong>Nombre</strong></td><td>${escapeHtml(nombre)}</td></tr>
      <tr><td><strong>Telefono</strong></td><td>${escapeHtml(telefono)}</td></tr>
      <tr><td><strong>Empresa o comercio</strong></td><td>${escapeHtml(empresa)}</td></tr>
      <tr><td><strong>Tipo de servicio</strong></td><td>${escapeHtml(servicio)}</td></tr>
      <tr><td><strong>Mensaje</strong></td><td>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</td></tr>
    </table>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Transporte Tavolaro <contacto@transportetavolaro.com>",
      to: ["contacto@transportetavolaro.com"],
      subject: "Nueva solicitud desde Transporte Tavolaro",
      text,
      html,
      reply_to: "contacto@transportetavolaro.com"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return res.status(500).json({ message: "No se pudo enviar el correo", detail: errorText });
  }

  return res.status(200).json({ message: "Solicitud enviada" });
};

function clean(value) {
  return String(value || "").trim().slice(0, 1000);
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;

  return Object.fromEntries(new URLSearchParams(body));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
