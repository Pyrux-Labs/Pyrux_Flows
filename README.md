# Pyrux Flows

Herramienta interna de Pyrux para gestionar clientes, proyectos y finanzas. Reemplaza las hojas de cálculo.

Stack: Next.js · Supabase · Tailwind CSS · shadcn/ui

---

## Módulos

| Módulo | Descripción |
|---|---|
| **Prospects** | Pipeline de ventas. Al cerrar un prospect se crea el cliente automáticamente. |
| **Clientes** | Clientes activos e históricos con su estado y proyectos asociados. |
| **Proyectos** | Proyectos por cliente, hitos de pago, y contratos de mantenimiento mensual. |
| **Finanzas** | Ingresos reales sincronizados desde Mercado Pago. |
| **Gastos** | Egresos reales sincronizados desde Mercado Pago. |
| **Dashboard** | Saldo actual, forecast del mes siguiente, y mantenimientos pendientes de cobro. |

---

## Flujo de datos: Mercado Pago

```
Cuenta MP
    │
    │  cron horario (Vercel Cron)
    ▼
GET /v1/payments/search
    │
    │  por cada movimiento nuevo (mp_id único, no duplica)
    ▼
movements (tabla)
    │
    ├─ ¿existe regla en mp_rules para este counterpart_id?
    │       │
    │      SÍ ──► asigna project_id + category + is_recurring automáticamente
    │       │
    │      NO ──► queda sin asignar (aparece como "sin clasificar" en la UI)
    │
    └─ usuario puede enriquecer manualmente:
           - linkear a un proyecto
           - asignar categoría
           - marcar como recurrente
           - al guardar, se ofrece "recordar esta asignación" → crea regla en mp_rules
```

### Saldo actual

```
saldo actual = opening_balance_ars (settings)
             + SUM(amount) WHERE type = 'credit' AND date >= opening_balance_date
             - SUM(amount) WHERE type = 'debit'  AND date >= opening_balance_date
```

El `opening_balance_ars` se configura una sola vez antes de activar la sincronización.

### Forecast del mes siguiente

```
ingresos esperados = SUM(maintenance_amount) de projects WHERE status = 'mantenimiento'
egresos esperados  = SUM(amount) de movements WHERE is_recurring = true AND type = 'debit'
neto estimado      = ingresos esperados - egresos esperados
```

### Control de mantenimientos

Para saber si un cliente pagó el mantenimiento del mes:

```sql
-- ¿MedMind pagó en abril 2026?
SELECT EXISTS (
  SELECT 1 FROM movements
  WHERE project_id = '<id-proyecto-medmind>'
    AND type = 'credit'
    AND date >= '2026-04-01'
    AND date <  '2026-05-01'
);
```

El dashboard muestra una tabla con todos los proyectos en mantenimiento y su estado de cobro para el mes en curso.

---

## Schema: tablas principales

| Tabla | Descripción |
|---|---|
| `prospects` | Leads en proceso de venta |
| `clients` | Clientes activos e históricos |
| `services` | Catálogo de servicios (precios de referencia) |
| `projects` | Proyectos y contratos de mantenimiento |
| `project_payments` | Hitos de pago de proyectos (anticipo, entrega) |
| `movements` | Movimientos de MP sincronizados (ingresos y egresos) |
| `mp_rules` | Reglas de auto-asignación por contraparte |
| `settings` | Config general (saldo de apertura, etc.) |

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
MP_ACCESS_TOKEN=
```

`MP_ACCESS_TOKEN` se obtiene desde [developers.mercadopago.com](https://developers.mercadopago.com) → Tu aplicación → Credenciales de producción.

---

## Setup local

```bash
npm install
cp .env.example .env.local
# completar variables en .env.local
npm run dev
```

Correr `schema.sql` en el SQL Editor de Supabase antes del primer uso.
