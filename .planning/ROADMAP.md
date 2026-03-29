# Roadmap: Pyrux OS — UX Sprint + Módulo Clientes

## Overview

Mejoras de UX transversales (click en fila, atajos de teclado, cambio de estado rápido, undo al eliminar) más el nuevo módulo de Clientes como vista filtrada de prospectos cerrados.

## Phases

- [ ] **Phase 1: UX Interactions** - Click en fila para abrir sheet + Cmd+N para crear nuevo
- [ ] **Phase 2: Quick Status Change** - Cambio de estado rápido via dropdown en badge (prospectos + proyectos)
- [ ] **Phase 3: Undo Delete** - Toast con "deshacer" al eliminar (todos los módulos)
- [ ] **Phase 4: Clients Module** - Módulo Clientes (Opción A — vista filtrada de prospectos cerrados)

## Phase Details

### Phase 1: UX Interactions
**Goal**: Click en cualquier celda de una fila abre el sheet de edición. Cmd+N (o Ctrl+N) desde cualquier módulo abre el sheet de creación.
**Depends on**: Nothing
**Requirements**: UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. Click en cualquier celda de fila en prospectos, proyectos, gastos, finanzas y tarifas abre el sheet de edición
  2. Click en el ícono lápiz sigue funcionando (no regresión)
  3. Cmd+N / Ctrl+N desde cualquier módulo con form de creación abre el sheet vacío
  4. En Dashboard, Cmd+N no hace nada o abre el command palette
**Plans**: TBD

### Phase 2: Quick Status Change
**Goal**: Click en el badge de estado de un prospecto o proyecto abre un dropdown para cambiarlo directamente, sin abrir el sheet completo.
**Depends on**: Phase 1
**Requirements**: UX-03
**Success Criteria** (what must be TRUE):
  1. Click en badge de status en tabla de prospectos abre dropdown con los 5 estados
  2. Click en badge de status en tabla de proyectos abre dropdown con los 4 estados
  3. Click en badge NO propaga al row (no abre el sheet)
  4. Cambio de estado se persiste y refleja inmediatamente (optimistic update)
  5. Si prospecto se cambia a "cerrado", desaparece de la lista de prospectos (una vez que Phase 4 esté implementada)
**Plans**: TBD

### Phase 3: Undo Delete
**Goal**: Al eliminar cualquier item, reemplazar el ConfirmDialog por un toast de Sonner con botón "Deshacer" activo durante 5 segundos antes de ejecutar el borrado definitivo.
**Depends on**: Phase 2
**Requirements**: UX-04
**Success Criteria** (what must be TRUE):
  1. El ConfirmDialog de eliminación es reemplazado por el toast + undo en todos los módulos
  2. El toast muestra un mensaje claro con el nombre del item eliminado
  3. Hacer click en "Deshacer" dentro de 5 segundos cancela el borrado
  4. Pasados 5 segundos sin deshacer, el borrado se ejecuta definitivamente
  5. Si el borrado falla en el servidor, se muestra toast de error
**Plans**: TBD

### Phase 4: Clients Module
**Goal**: Nueva sección "Clientes" en el sidebar que muestra prospectos con status="cerrado". Vista filtrada sin cambios en DB (Opción A).
**Depends on**: Phase 3
**Requirements**: FEAT-01
**Success Criteria** (what must be TRUE):
  1. "Clientes" aparece en el sidebar como ítem de navegación
  2. Prospectos con status="cerrado" aparecen en la lista de Clientes
  3. Prospectos con status="cerrado" NO aparecen en la lista de Prospectos
  4. Click en fila de cliente abre el ProspectSheet reutilizado
  5. La columna "Proyectos" muestra un badge numérico con count de proyectos vinculados via prospect_id
  6. Si desde el sheet se cambia el status a algo distinto de "cerrado", el cliente vuelve a aparecer en Prospectos
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. UX Interactions | 0/TBD | Not started | - |
| 2. Quick Status Change | 0/TBD | Not started | - |
| 3. Undo Delete | 0/TBD | Not started | - |
| 4. Clients Module | 0/TBD | Not started | - |
