## Ideas pendientes

### Badge de alertas en el sidebar (opcional)

Un numerito en el ítem "Finanzas" del sidebar mostrando cuántos cobros están pendientes (factura enviada, sin cobrar). Visible desde cualquier pantalla sin entrar al dashboard.

- **Estado:** opcional, implementar si el widget del dashboard no alcanza en el día a día

---

### Componentes shadcn faltantes

Instalar cuando se necesiten, no antes:

- **`Tooltip`** — para mostrar texto completo (email, teléfono, notas largas) al hacer hover en tablas
- **`Scroll Area`** — para sheets con mucho contenido en pantallas chicas

---

### Calendario compartido con notificaciones por email

Calendario interno para Juanma y Gino con eventos, reuniones y deadlines. Envía mail cuando hay un evento próximo.

- **Estado:** idea confirmada, construcción pesada pero tienen código reutilizable de otra app
- **Acción previa:** traer el código existente y evaluar qué hay que adaptar
- **Stack posible:** shadcn `Calendar` + tabla `events` en Supabase + Resend o Nodemailer para los mails + pg_cron para disparar notificaciones
- **Nota:** ya tienen pg_cron activo por los gastos recurrentes, el mismo mecanismo sirve para disparar recordatorios

---

### Gastos recurrentes — activar pg_cron

- **Estado:** UI + schema implementados — pendiente activar pg_cron en Supabase (Database → Extensions → pg_cron) y correr el `SELECT cron.schedule(...)` comentado al final del schema.sql

---

### Integración con Mercado Pago

Sincronizar automáticamente movimientos de MP con Ingresos y Gastos de la app.

- **Estado:** bloqueado — necesitan crear una app en developers.mercadopago.com para obtener el Access Token
- **Cuenta:** personal usada como empresa (no cuenta Empresas)
- **Approach decidido:** Vercel Cron Job cada hora que consulta la API de MP y trae movimientos nuevos
  - Créditos (plata que entra) → se crean como Ingresos
  - Débitos (plata que sale) → se crean como Gastos
  - Cada registro importado queda marcado con `source: "mercadopago"`
- **Prerrequisito (manual):**
  1. Ir a developers.mercadopago.com
  2. Crear una app nueva
  3. Copiar el Access Token de producción
  4. Agregarlo como variable de entorno en Vercel (`MP_ACCESS_TOKEN`)

---

### Gestión de cobros recurrentes a clientes

Clientes que pagan un precio fijo mensual vía Mercado Pago.

- **Estado:** pendiente — cada ingreso de mantenimiento se carga a mano hoy
- **Depende de:** integración con Mercado Pago
