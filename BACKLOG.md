## Próximos

### Dashboard — Control de mantenimientos (Fase 2)

Detalle individual por cliente: linkear pagador MP → proyecto via `mp_rules`.
Ver quién pagó / quién no pagó en el mes.

- Depende de tener más clientes con mantenimientos activos para que valga la pena.

### Badge de alertas en el sidebar (opcional)

Un numerito en el ítem "Finanzas" del sidebar mostrando cuántos cobros están sin clasificar.
Visible desde cualquier pantalla sin entrar a Finanzas.

---

## A futuro

### Kanban de tareas internas

Tablero compartido entre Juanma y Gino para gestionar tareas del día a día de la agencia.

- **Columnas sugeridas:** Por hacer / En progreso / Hecho
- **Features mínimos:** crear tarea, asignar a un usuario, mover entre columnas
- **Stack posible:** tabla `tasks` en Supabase + Realtime para sincronización instantánea entre los dos usuarios + drag & drop (dnd-kit)
- **Nota:** Supabase Realtime ya está disponible en el proyecto, no requiere infraestructura extra



### Calendario compartido con notificaciones por email

Calendario interno para Juanma y Gino con eventos, reuniones y deadlines. Envía mail cuando hay un evento próximo.

- **Stack posible:** shadcn `Calendar` + tabla `events` en Supabase + Resend para mails + pg_cron para disparar recordatorios
- **Nota:** ya tienen pg_cron activo, el mismo mecanismo sirve para disparar recordatorios

### Gastos recurrentes — activar pg_cron

UI + schema ya implementados. Falta activar pg_cron en Supabase (Database → Extensions → pg_cron) y ejecutar el `SELECT cron.schedule(...)` comentado al final de `schema.sql`.

### Componentes shadcn por instalar cuando se necesiten

- **`Tooltip`** — para mostrar texto completo al hacer hover en celdas de tablas
- **`Scroll Area`** — para sheets con mucho contenido en pantallas chicas
