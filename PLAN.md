# Pyrux Flows — Plan de mejoras

## Fase 1 — Deuda técnica ✅ COMPLETADA
- [x] Centralizar labels en `lib/constants/labels.ts`
- [x] Factory functions para optimistic updates en `lib/mutations.ts`
- [x] Schemas Zod en `lib/validations/` y validación en todos los `actions.ts`

## Fase 2 — Advertencia al cerrar sheet con cambios sin guardar ✅ COMPLETADA
- [x] Hook `useUnsavedChanges` que intercepta `onOpenChange` cuando `isDirty`
- [x] AlertDialog de confirmación en los 5 sheets

## Fase 3 — Paginación "cargar más" en todos los módulos ✅ COMPLETADA
- [x] Hook `usePagination` reutilizable (20 items, auto-reset en cambio de datos)
- [x] Aplicado en prospectos, proyectos, gastos, finanzas y tarifas

## Fase 4 — Gastos recurrentes con frecuencia y pg_cron ✅ COMPLETADA
- [x] Enum `expense_frequency` (semanal/mensual/anual) + columnas `frequency` y `generated_from_id`
- [x] Función PL/pgSQL `generate_recurring_expenses()` + cron job semanal (lunes 06:00 UTC)
- [x] Select de frecuencia en expense-sheet visible solo cuando `recurrent = true`
- [x] Tabla diferencia templates, copias auto-generadas y gastos normales

## Fase 5 — Command palette Cmd+K con búsqueda global ✅ COMPLETADA
- [x] Búsqueda en tiempo real sobre prospectos y proyectos
- [x] Navega al módulo correspondiente al seleccionar un resultado
- [x] Hint visual `⌘K` en el topbar

## Fase 6 — Email y teléfono en tabla de prospectos ✅ COMPLETADA
- [x] Columnas `Email` y `Teléfono` visibles en la tabla

## Fase 7 — Widget "Pendiente de cobro" en el dashboard ✅ COMPLETADA
- [x] Muestra total de ingresos con factura enviada pero sin cobrar (ARS y USD)
- [x] Solo aparece cuando hay monto pendiente, con link directo a Finanzas

## Fase 8 — Gráfico de evolución mensual en el dashboard ✅ COMPLETADA
- [x] Barras de ingresos vs gastos de los últimos 6 meses (convertidos a ARS)
- [x] Tooltip con ganancia/pérdida del mes en verde/rojo

---

## Ideas pendientes

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

### Integración con cuenta bancaria empresarial
Conectar movimientos bancarios directamente a gastos e ingresos.
- **Estado:** bloqueado — no tienen cuenta empresarial todavía
- **Retomar cuando:** abran la cuenta (probablemente Mercado Pago o banco digital)
- **Approach posible:** webhooks de MP o scraping del extracto PDF

### Gestión de cobros recurrentes a clientes (ej. MedMind)
Registrar que a un cliente se le cobra un precio fijo por mes vía Mercado Pago y poder actualizarlo.
- **Estado:** sin definir — necesita más contexto
- **Preguntas a resolver antes de planear:**
  - ¿Quieren que la app avise cuándo cobrar, o solo registrar que se cobró?
  - ¿El precio puede cambiar por cliente o es el mismo para todos?
  - ¿Quieren vincular esto a las tarifas existentes?
