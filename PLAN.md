## Ideas pendientes

### Módulo de Clientes (prospectos cerrados/ganados)

Cuando un prospecto pasa a estado "cerrado" (ganado), pasa a ser cliente y aparece en una sección propia.

**Contexto:**

- "Cerrado" = ganado, hay un proyecto en curso
- Los proyectos ya tienen `prospect_id` (FK opcional a prospectos) y `client_name` (texto libre)
- Hoy no hay relación formal entre un cliente y sus proyectos/pagos en la DB

**Decisión arquitectónica a resolver antes de implementar:**
Hay dos caminos y tienen trade-offs distintos:

- **Opción A — Vista filtrada (sin cambios en DB):** "Clientes" es simplemente una vista de prospectos con `status = cerrado`. Rápido de implementar, cero riesgo de romper datos. Limitación: los proyectos siguen usando `client_name` como texto, sin FK real al cliente.
- **Opción B — Tabla `clients` separada (cambio de DB):** Al cerrar un prospecto se crea un registro en `clients` con FK. Los proyectos pasan a tener `client_id` en vez de `client_name`. Más trabajo, pero habilita reportes por cliente (qué proyectos tiene, cuánto paga, historial).

**Recomendación:** Opción B cuando hagan el reset de DB desde cero (que ya está planeado). Implementar Opción A antes como solución rápida.

**Comportamiento esperado:**

- Prospecto en estado "cerrado" desaparece de la lista de prospectos
- Aparece en la nueva sección "Clientes" con nombre, empresa, email, teléfono
- Se ven los proyectos asociados (usando `prospect_id` existente)
- El módulo de Clientes queda en el sidebar

**Estado:** listo para implementar mañana con Opción A primero

---

### UX — Click en fila para abrir el sheet

Hoy solo el ícono del lápiz abre el sheet. Click en cualquier celda de la fila debería abrirlo.

- **Estado:** listo para implementar, aplica a prospectos, proyectos, gastos, finanzas y tarifas

### UX — Cambio de estado rápido sin abrir el sheet

Click en el badge de estado de un prospecto o proyecto lo cambia directo con un dropdown, sin abrir el sheet completo.

- **Estado:** listo para implementar

### UX — Cmd+N para crear nuevo

Desde cualquier módulo, `Cmd+N` abre el sheet de creación. Complementa el `Cmd+K` ya existente.

- **Estado:** listo para implementar, reutiliza el mismo patrón del hook `useCommandPalette`

### UX — Toast con "deshacer" al eliminar

Al eliminar un item, en vez de solo confirmar, mostrar un toast de Sonner (ya instalado) con botón "Deshacer" activo durante 5 segundos antes de que el borrado se ejecute definitivamente.

- **Estado:** listo para implementar, requiere cambiar el flujo de delete para que sea diferido

### Badge de alertas en el sidebar (opcional)

Un numerito en el ítem "Finanzas" del sidebar mostrando cuántos cobros están pendientes (factura enviada, sin cobrar). Visible desde cualquier pantalla sin entrar al dashboard.

- **Estado:** opcional, implementar si el widget del dashboard no alcanza en el día a día

### Componentes shadcn faltantes

Instalar cuando se necesiten, no antes:

- **`Tooltip`** — para mostrar texto completo (email, teléfono, notas largas) al hacer hover en tablas
- **`Popover`** — necesario para el cambio de estado rápido sin abrir sheet
- **`Scroll Area`** — para sheets con mucho contenido en pantallas chicas

### Calendario compartido con notificaciones por email

Calendario interno para Juanma y Gino con eventos, reuniones y deadlines. Envía mail cuando hay un evento próximo.

- **Estado:** idea confirmada, construcción pesada pero tienen código reutilizable de otra app
- **Acción previa:** traer el código existente y evaluar qué hay que adaptar
- **Stack posible:** shadcn `Calendar` + tabla `events` en Supabase + Resend o Nodemailer para los mails + pg_cron para disparar notificaciones
- **Nota:** ya tienen pg_cron activo por los gastos recurrentes, el mismo mecanismo sirve para disparar recordatorios

### Tipo de cambio automático

Reemplazar el campo manual de USD/ARS en Configuración por una API pública (ej. dólar blue/oficial).

- **Estado:** listo para implementar cuando quieran
- **Opciones de API:** dolarapi.com (Argentina, gratuita, sin key), bluelytics.com.ar
- **Approach:** cron job en Supabase o fetch server-side en cada carga del dashboard

### Reset de base de datos + schema limpio desde cero

Los datos actuales son de prueba y hay columnas/migraciones acumuladas.

- **Estado:** hacer cuando estén listos para usar la app en producción real
- **Plan:** reescribir `schema.sql` con todo integrado (sin migraciones separadas), correr en Supabase fresh, cargar datos reales
- **Nota:** los archivos de migración (`migrations/`) se pueden borrar una vez que el schema final esté consolidado en `schema.sql`
- **Motivación principal:** hoy `client_name` en proyectos es texto libre — si se escribe distinto en cada lugar pierde consistencia. El reset es el momento para introducir una tabla `clients` con FK en proyectos, ingresos y gastos, de modo que el nombre viva en un solo lugar y no se repita ni pueda divergir

### Integración con Mercado Pago (cuenta empresarial)

Sincronizar automáticamente movimientos de MP (cobros y pagos) con gastos e ingresos de la app.

- **Estado:** listo para planear — ya usan MP como cuenta empresarial
- **Approach:** webhooks de MP para recibir eventos en tiempo real (pagos recibidos, pagos realizados)
- **API MP:** requiere credenciales de la cuenta (Access Token) + endpoint público para recibir webhooks (disponible en producción con Vercel)
- **Lo que resolvería:**
  - Ingresos de clientes (ej. MedMind) se registran solos cuando MP acredita el cobro
  - Gastos pagados con MP se importan automáticamente
  - No hay que cargar nada a mano

### Gestión de cobros recurrentes a clientes (ej. MedMind)

Clientes que pagan un precio fijo mensual en ARS vía Mercado Pago.

- **Estado:** listo para planear junto con la integración de MP
- **Contexto:** cobran en pesos, el precio puede cambiar, necesitan poder actualizarlo
- **Approach:** crear una sección de "Suscripciones activas" vinculada a proyectos — precio actual, cliente, día de cobro. Cuando MP notifica el pago, se registra el ingreso automáticamente con el monto real cobrado
