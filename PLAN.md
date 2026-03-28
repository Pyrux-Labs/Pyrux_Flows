# Pyrux Flows — Plan de mejoras

> Última actualización: 2026-03-28
> Regla de código: funciones, comentarios y variables en inglés. Texto visible al usuario en español.

---

## Fase 1 — Deuda técnica (código) ✅ COMPLETADA
- [x] Centralizar labels en `/lib/constants/labels.ts` e importar en todos los componentes
- [x] Factory functions para optimistic updates en `/lib/mutations.ts`
- [x] Zod validation en todos los `actions.ts` con schemas en `/lib/validations/`

## Fase 2 — UX rápido ✅ COMPLETADA
- [x] Advertencia al cerrar sheet con cambios sin guardar — hook `useUnsavedChanges` + AlertDialog en los 5 sheets
- [x] Dashboard stats → links a vistas de cada módulo (ya estaba implementado con Widget + Link)

## Fase 3 — Paginación ✅ COMPLETADA
- [x] Hook `usePagination` reutilizable (20 items, "cargar más", auto-reset en cambio de datos)
- [x] Aplicado en tabla de prospectos, proyectos, finanzas, gastos y grid de tarifas
- [x] Kanban/pipeline/charts excluidos (no aplica paginación por tipo de vista)

## Fase 4 — Gastos recurrentes ✅ COMPLETADA
- [x] Agregar campo `frequency` al schema: `semanal | mensual | anual`
- [x] Mostrar select de frecuencia en el sheet solo cuando `recurrent = true`
- [x] Supabase pg_cron semanal que genera las entradas faltantes
  - Doble función: genera recurrentes + mantiene el proyecto activo en free tier

## Fase 5 — Búsqueda global ✅ COMPLETADA
- [x] Command palette `Cmd+K` con shadcn `Command`
- [x] Busca en: Prospectos (nombre, empresa) + Proyectos (nombre, cliente)
- [x] Navega al módulo correspondiente al seleccionar un resultado

---

## Decisiones clave
| Tema | Decisión |
|------|----------|
| Clientes | Descartado por ahora |
| Recurrentes trigger | Supabase pg_cron (también evita pausa del free tier) |
| Búsqueda scope | Solo Prospectos + Proyectos |
| Paginación estilo | "Cargar más", 20 items por página |
| Dashboard links | Navegan al módulo sin filtro |
| Labels | `/lib/constants/labels.ts` |
| Zod schemas | Compartidos entre actions y sheets (`/lib/validations/`) |
