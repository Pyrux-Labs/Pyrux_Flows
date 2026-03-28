-- ============================================================
-- Pyrux OS — Seed data
-- Source: Flujo de clientes(1).xlsx (sheets: CRM, Proyectos,
--         Finanzas, Prospectos Rosario, Config, Tarifario)
-- Generated: 2026-03-28
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- ============================================================


-- ─── SETTINGS ────────────────────────────────────────────────
-- Override the schema.sql default (1200) with the real rate from Config sheet

INSERT INTO settings (key, value, updated_at)
VALUES ('usd_ars_rate', '1425', now())
ON CONFLICT (key) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();


-- ─── PROSPECTS ───────────────────────────────────────────────
-- MedMind is a closed (won) prospect; explicit UUID so projects can ref it.
-- 30 Rosario prospects from "📋 Prospectos Rosario" sheet:
--   "Sin contactar" → nuevo | "Pendiente" → contactado (15 each)

INSERT INTO prospects (
  id, name, business, sector, email, phone,
  source, status, notes, assigned_to, last_contact
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Guillermina Bassi',
  'MedMind',
  'medico',
  'guille.bassi@hotmail.com',
  '54 9 341 353-6452',
  'word_of_mouth',
  'cerrado',
  'Primer cliente Pyrux. Sin contrato formal — formalizar urgente. Débito automático MP $20/mes.',
  'gino',
  '2026-03-05'
);

INSERT INTO prospects (name, sector, source, status, notes) VALUES
  -- ── estudio contable (5) ──────────────────────────────────
  ('Estudio Priotti',             'contabilidad', 'otro',      'nuevo',      'Web: estudiopriotti.com — sitio anticuado sin SSL. Servicio: Rediseño web + SSL. Fuente: búsqueda Google.'),
  ('Estudio Herusa',              'contabilidad', 'otro',      'nuevo',      'Web: estudiocontableherusa.com.ar — sin blog ni portal de clientes, diseño viejo. Servicio: Rediseño + portal clientes. Fuente: búsqueda Google.'),
  ('Guastella & Asoc.',          'contabilidad', 'otro',      'nuevo',      'Web: estudiocontablegya.com.ar — 30+ años, sitio brochure sin actualizaciones. Servicio: Rediseño web. Fuente: búsqueda Google.'),
  ('Frasesores',                  'contabilidad', 'otro',      'nuevo',      'Web: frasesores.com.ar — sistema de compra genérico, nada profesional. Servicio: Rediseño completo. Fuente: búsqueda Google.'),
  ('Contador independiente CPCE II', 'contabilidad', 'otro',  'nuevo',      'Sin web. Miles de contadores matriculados sin presencia online. Servicio: Landing page profesional. Fuente: CPCE Cámara II.'),
  -- ── estudio jurídico (6) ─────────────────────────────────
  ('Chiana & Cigno Estudio Jurídico', 'legal',   'otro',      'nuevo',      'Sin web. Solo en directorio. Firma joven, diferenciación posible. Servicio: Sitio institucional. Fuente: Legal.com.ar.'),
  ('Moreira & Asociados',         'legal',        'otro',      'nuevo',      'Sin web. Sedes en Rosario, San Lorenzo y Casilda. Servicio: Sitio multi-sede. Dir: Jujuy 1778 of.2. Fuente: Legal.com.ar.'),
  ('Blando Figueroa y Asociados', 'legal',        'otro',      'nuevo',      'Sin web. Solo directorio. Fuerte en penal, sin identidad digital. Servicio: Sitio institucional. Fuente: Legal.com.ar.'),
  ('Copes & Asociados',           'legal',        'otro',      'nuevo',      'Sin web. Equipo de profesionales, cero presencia web propia. Servicio: Sitio institucional. Fuente: Legal.com.ar.'),
  ('V&C Estudio Jurídico',        'legal',        'otro',      'nuevo',      'Sin web. Tres sedes (Rosario + Arteaga). Oportunidad CMS multi-sede. Servicio: Sitio + CMS. Fuente: Legal.com.ar.'),
  ('Robiolo & Asociados',         'legal',        'otro',      'nuevo',      'Sin web. Enfocados en empresas, ticket alto potencial. Servicio: Sitio institucional premium. Fuente: Legal.com.ar.'),
  -- ── estética (4 sin contactar) ──────────────────────────
  ('Centro de Estética Oroño',    'estetica',     'instagram', 'nuevo',      '16K seguidores IG (@esteticaorono). Alta demanda, sin web. Bv. Oroño, Rosario. Servicio: Landing + sistema de turnos.'),
  ('Mudra Rosario',               'estetica',     'instagram', 'nuevo',      'Solo Instagram (@mudrarosario). Formato spa = ticket alto. Servicio: Web + reservas online.'),
  ('Kymè Studio',                 'estetica',     'otro',      'nuevo',      '5★ Fresha, buenas reseñas. Sin web propia. Mariano Moreno 1739. Servicio: Landing + turnos. Fuente: Fresha.'),
  ('Tania — El Amor Por Tu Piel', 'estetica',     'otro',      'nuevo',      'Buenas reseñas en Fresha. Sin activo digital propio. Bv. Rondeau 1837. Servicio: Landing + reservas. Fuente: Fresha.'),
  -- ── contactados / pendiente respuesta (15) ───────────────
  ('Estetica Médica Brarda',      'estetica',     'otro',      'contactado', 'Web: esteticamedicabrarda.com — desactualizada, sin SSL. Procedimientos médicos. Servicio: Rediseño + SSL + credenciales. Fuente: Google.'),
  ('@blush.rosario',              'otro',         'instagram', 'contactado', '46K seguidores IG. Venta solo por DM. Servicio: E-commerce / tienda online. IG: @blush.rosario.'),
  ('GC Representaciones',         'otro',         'instagram', 'contactado', '37K seguidores. Venta por redes. Servicio: Plataforma e-commerce. IG: @gc.representaciones.'),
  ('Serendipia Rosario',          'otro',         'instagram', 'contactado', 'Activa en IG, emprendimiento listo para escalar. Servicio: Tienda online. IG: @serendipia.rosario.'),
  ('Ferretarías / mueblerías barrio', 'otro',     'otro',      'contactado', 'Sin link a sitio en directorio. Universo amplio. Servicio: Landing + catálogo. Fuente: Directorio local.'),
  ('Excalibur (Holiday Inn)',      'gastronomia',  'otro',      'contactado', '4.7★ TripAdvisor. Buen alcance digital, margen de crecimiento. Dorrego 450, Centro. IG: @excaliburgourmet. Servicio: Gestión RRSS + contenido.'),
  ('Chinchibira',                 'gastronomia',  'otro',      'contactado', 'Bar #1 TripAdvisor Rosario 2025. 4.6★, 950 opiniones. Sin web. Santiago 101, Pichincha. IG: @chinchibirabar. Servicio: Web + RRSS + WhatsApp marketing.'),
  ('Chicharra Asador',            'gastronomia',  'otro',      'contactado', '538 opiniones 4.4★. Sin web. Pueyrredón 1, Centro. IG: @chicharra_rosario. Servicio: Landing + reservas online.'),
  ('Los Jardines (Bar & Grill)',   'gastronomia',  'otro',      'contactado', '770 opiniones 4.1★. Web: losjardinesenrosario.com. RRSS activo. España y El Río, Costanera. Servicio: Mejora web + CMS.'),
  ('Vision Hair Studio',          'otro',         'otro',      'contactado', '1.528 reseñas 5.0★ Fresha. Fuerte boca a boca. Dorrego 90 PB, Centro. IG: @vision.hs_. Servicio: Landing + reservas + RRSS.'),
  ('Essenza Barbería',            'otro',         'otro',      'contactado', '5.0★ Fresha 2026. Sin web. Av. Provincias Unidas 815. IG: @essenzabarberia. Servicio: Landing + sistema de turnos.'),
  ('Be and Feel',                 'estetica',     'instagram', 'contactado', '13K seguidores IG activo (@beandfeelrosario). Sin web. Entre Ríos 176, Centro. Servicio: Web + reservas + RRSS.'),
  ('CM Dental Rosario',           'dental',       'otro',      'contactado', 'Web: cmdentalrosario.com.ar — clínica moderna. Puede mejorar con SEO. Paraguay 1227 PB. IG: @cmdentalrosario. Servicio: Mejora web + SEO + CMS.'),
  ('O2 Gimnasio',                 'fitness',      'otro',      'contactado', 'Web: o2gimnasio.com.ar — presente en búsquedas locales. Av. Pellegrini 614. IG: @o2gimnasio. Servicio: Mejora web + RRSS.'),
  ('Z Market (Ropa urbana)',       'otro',         'instagram', 'contactado', 'Solo FB/IG activo, sin tienda online. Av. Santa Fe 2684. IG: @zmarketrosario. Servicio: E-commerce / tienda online.');


-- ─── PROJECTS ────────────────────────────────────────────────
-- MedMind project UUID matches the prospect FK above.

INSERT INTO projects (
  id, name, client_name, prospect_id,
  status, start_date, budget, paid, notes, assigned_to
) VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'MedMind',
    'MedMind',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'completado',
    '2026-03-05',     -- fecha inicio mantenimiento (fecha exacta dev a completar)
    300,
    true,
    'Primer proyecto Pyrux. App web personalizada. En producción: medmind.com.ar. Mantenimiento activo $20/mes. Sin contrato formal — formalizar urgente.',
    'ambos'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Portfolio Pyrux',
    'Pyrux (interno)',
    NULL,
    'completado',
    NULL,
    NULL,
    false,
    'Web institucional propia. En producción: pyrux.com.ar. Goal Planner y MedMind como proyectos showcase.',
    'ambos'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Goal Planner',
    'Pyrux (interno)',
    NULL,
    'activo',
    NULL,
    NULL,
    false,
    'Producto interno Pyrux. goalplanner.com.ar. En desarrollo. Limpiar estructura de carpetas pendiente.',
    'ambos'
  );


-- ─── INCOME ──────────────────────────────────────────────────
-- Two records:
--   1. One-time development payment for MedMind (year 2025, exact date unknown → 2025-12-01)
--   2. First maintenance payment March 2026

INSERT INTO income (
  project_id, description, amount, currency,
  date, category, invoice_sent, paid
) VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Desarrollo MedMind — pago único (app web personalizada)',
    300,
    'USD',
    '2025-12-01',   -- año 2025 confirmado; día exacto a completar
    'proyecto',
    false,
    true
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Mantenimiento MedMind — marzo 2026',
    20,
    'USD',
    '2026-03-05',
    'mantenimiento',
    false,
    true
  );


-- ─── EXPENSES ────────────────────────────────────────────────
-- Recurring tools (March 2026) + three annual domain renewals (ARS)

INSERT INTO expenses (
  description, amount, currency,
  date, category, recurrent, notes
) VALUES
  (
    'Google Workspace (2 usuarios)',
    9.80,
    'USD',
    '2026-03-01',
    'herramientas',
    true,
    '$4.90 × 2 usuarios. Facturación mensual.'
  ),
  (
    'Claude Code',
    20.00,
    'USD',
    '2026-03-01',
    'herramientas',
    true,
    'Una cuenta compartida Gino + Juan. Facturación mensual.'
  ),
  (
    'Dominio goalplanner.com.ar',
    8500,
    'ARS',
    '2026-02-12',   -- último pago anual; próximo vencimiento 2027-02-12
    'hosting',
    false,
    'Renovación anual. Próximo vencimiento: 2027-02-12.'
  ),
  (
    'Dominio pyrux.com.ar',
    8500,
    'ARS',
    '2026-02-25',   -- próximo vencimiento 2027-02-25
    'hosting',
    false,
    'Renovación anual. Próximo vencimiento: 2027-02-25.'
  ),
  (
    'Dominio medmind.com.ar',
    8500,
    'ARS',
    '2026-03-03',   -- próximo vencimiento 2027-03-03
    'hosting',
    false,
    'Renovación anual. Próximo vencimiento: 2027-03-03.'
  );


-- ─── SERVICES ────────────────────────────────────────────────
-- From "📦 Tarifario" sheet — development plans + maintenance plans.
-- Prices are lista (sin descuento de lanzamiento).

INSERT INTO services (
  name, description, price, currency, unit, category, active
) VALUES
  -- ── Planes web estándar ───────────────────────────────────
  (
    'Growth',
    'Sitio web estándar sin CMS. Entrega ~2 semanas. Soporte 48hs. Backup mensual.',
    300, 'USD', 'proyecto', 'web', true
  ),
  (
    'Pro',
    'Sitio web con CMS. Entrega 3-4 semanas. Soporte 48hs. Reporte analíticas mensual. Hasta 2hs soporte/mes.',
    500, 'USD', 'proyecto', 'web', true
  ),
  (
    'Business',
    'Sitio web premium con CMS. Entrega 4+ semanas. Soporte 24hs. Actualizaciones continuas. Hasta 4hs soporte/mes. Precio desde $800.',
    800, 'USD', 'proyecto', 'web', true
  ),
  -- ── Planes e-commerce ────────────────────────────────────
  (
    'E-Commerce Básico',
    'Tienda online básica con CMS. Entrega ~4 semanas. Soporte 48hs.',
    800, 'USD', 'proyecto', 'web', true
  ),
  (
    'E-Commerce Pro',
    'Tienda online avanzada con CMS. Entrega 6-8 semanas. Soporte 24hs.',
    2000, 'USD', 'proyecto', 'web', true
  ),
  (
    'E-Commerce Enterprise',
    'Tienda online enterprise con CMS. Precio, entrega y SLA a convenir.',
    NULL, 'USD', 'proyecto', 'web', true
  ),
  -- ── Personalizado ────────────────────────────────────────
  (
    'Personalizado',
    'Sistemas a medida, integraciones IA, plataformas web complejas. Precio y plazos a definir.',
    NULL, 'USD', 'proyecto', 'automatizacion', true
  ),
  -- ── Planes de mantenimiento ───────────────────────────────
  (
    'Mantenimiento Growth',
    'Hosting + SSL + monitoreo 24/7 + backup mensual + cambios menores de texto/imagen. Soporte canal directo 48hs.',
    40, 'USD', 'mes', 'mantenimiento', true
  ),
  (
    'Mantenimiento Pro',
    'Todo Growth + backup semanal + reporte analíticas mensual + hasta 2hs soporte 48hs/mes.',
    50, 'USD', 'mes', 'mantenimiento', true
  ),
  (
    'Mantenimiento Business',
    'Todo Pro + backup semanal con retención extendida + actualizaciones y mejoras continuas + hasta 4hs soporte 24hs/mes.',
    70, 'USD', 'mes', 'mantenimiento', true
  ),
  (
    'Mantenimiento E-Commerce Básico',
    'Mantenimiento para tienda online básica. Hosting + SSL + monitoreo. Soporte 48hs.',
    50, 'USD', 'mes', 'mantenimiento', true
  ),
  (
    'Mantenimiento E-Commerce Pro',
    'Mantenimiento para tienda online Pro. Soporte 24hs dedicado.',
    200, 'USD', 'mes', 'mantenimiento', true
  );
