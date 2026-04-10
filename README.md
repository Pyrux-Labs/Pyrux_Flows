# Pyrux Flows

Herramienta interna de Pyrux para gestionar clientes, proyectos y finanzas. Reemplaza las hojas de cálculo.

Stack: Next.js · Supabase · Tailwind CSS · shadcn/ui · React Query

---

## Módulos

| Módulo | Descripción |
|---|---|
| **Prospectos** | Pipeline de ventas con kanban y tabla. Al cerrar un prospecto se crea el cliente automáticamente y se migran los contactos. |
| **Clientes** | Clientes activos e históricos con contactos, sector y notas. |
| **Proyectos** | Proyectos por cliente con hitos de pago y contratos de mantenimiento mensual (ARS o USD). |
| **Finanzas** | Movimientos sincronizados desde Mercado Pago (ingresos y egresos en una sola vista). Permite enriquecer manualmente y guardar reglas de auto-asignación. |
| **Dashboard** | Saldo actual MP, resumen del mes (ARS + USD + tipo blue), forecast del mes siguiente, y control de mantenimientos. |

---

## Flujo de datos: Mercado Pago

```
Cuenta MP
    │
    │  cron horario (Vercel Cron) + webhook (cobros)
    ▼
payments/search  ──► créditos e-commerce y QR
bank_report      ──► PAYOUTS (transferencias P2P) + saldo real
settlement_report──► liquidaciones (fire-and-forget)
    │
    │  por cada movimiento nuevo (mp_id único, no duplica)
    ▼
movements (tabla)
    │
    ├─ ¿existe regla en mp_rules para este counterpart_id + type?
    │       │
    │      SÍ ──► asigna project_id + category + is_recurring automáticamente
    │       │
    │      NO ──► queda sin asignar (aparece como "sin clasificar" en Finanzas)
    │
    └─ usuario puede enriquecer manualmente:
           - linkear a un proyecto
           - asignar categoría
           - marcar como recurrente
           - al guardar, se ofrece "recordar esta asignación" → crea regla en mp_rules
```

### Saldo actual

El saldo real se toma del campo `BALANCE_AMOUNT` del `bank_report` de MP y se guarda en `settings.opening_balance_ars` en cada sync. No se calcula — se lee directamente.

El equivalente en USD usa el tipo de cambio blue (venta) de dolarapi.com, cacheado 24h.

### Forecast del mes siguiente

```
ingresos esperados = SUM(maintenance_amount) de projects WHERE status = 'mantenimiento'
egresos esperados  = SUM(amount) de movements WHERE is_recurring = true AND type = 'debit'
neto estimado      = ingresos esperados - egresos esperados
```

### Control de mantenimientos

El dashboard compara lo esperado (suma de `maintenance_amount` por moneda de proyectos en mantenimiento) vs lo recibido (movimientos con `category = 'mantenimiento'` del mes en curso), por moneda.

---

## Schema: tablas principales

| Tabla | Descripción |
|---|---|
| `prospects` | Leads en proceso de venta |
| `clients` | Clientes activos e históricos |
| `contacts` | Contactos de prospects y clientes (email, teléfono, Instagram, etc.) |
| `services` | Catálogo de servicios (precios de referencia) |
| `sectors` | Tabla de referencia de rubros (id text, label text) |
| `projects` | Proyectos y contratos de mantenimiento |
| `project_payments` | Hitos de pago de proyectos (anticipo, entrega, etc.) |
| `movements` | Movimientos de MP sincronizados (créditos y débitos) |
| `mp_rules` | Reglas de auto-asignación por contraparte |
| `settings` | Config general (saldo de apertura, tokens OAuth de MP) |

---

## Variables de entorno

Ver `.env.example` para la lista completa. Las principales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago
MP_ACCESS_TOKEN=          # credencial de producción
MP_CLIENT_ID=             # requerido para OAuth (bank_report, scopes ampliados)
MP_CLIENT_SECRET=         # requerido para OAuth

# App
NEXT_PUBLIC_APP_URL=      # URL pública (redirect OAuth de MP)
CRON_SECRET=              # string aleatorio, mismo valor en Vercel
MP_WEBHOOK_SECRET=        # se obtiene al registrar el webhook en MP
```

`MP_ACCESS_TOKEN`, `MP_CLIENT_ID` y `MP_CLIENT_SECRET` se obtienen desde [developers.mercadopago.com](https://developers.mercadopago.com) → Tu aplicación → Credenciales de producción.

---

## Setup local

```bash
npm install
cp .env.example .env.local
# completar variables en .env.local
npm run dev
```

Correr `schema.sql` → `seed.sql` en el SQL Editor de Supabase antes del primer uso.
