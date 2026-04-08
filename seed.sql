-- ============================================================
--  SEED: Pyrux Flows — datos reales
--  Ejecutar después de schema.sql
--  Idempotente: usa ON CONFLICT DO NOTHING en todos los INSERT
-- ============================================================


-- ------------------------------------------------------------
-- 1. SERVICES (tarifario de Pyrux)
-- ------------------------------------------------------------

INSERT INTO services (id, name, description, base_price, currency, unit, category, active)
VALUES
  (
    'a0000001-0000-0000-0000-000000000001',
    'Growth',
    'Sitio web profesional sin CMS. Entrega en 2 semanas. Soporte 48hs.',
    210.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'a0000001-0000-0000-0000-000000000002',
    'Pro',
    'Sitio web con CMS. Hasta 2hs/mes de soporte. Entrega en 3-4 semanas.',
    350.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'a0000001-0000-0000-0000-000000000003',
    'Business',
    'Sitio web con CMS avanzado, soporte prioritario 24hs y mejoras continuas. Entrega en 4+ semanas.',
    560.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'a0000001-0000-0000-0000-000000000004',
    'E-Commerce Básico',
    'Tienda online con CMS. Entrega en 4 semanas. Soporte 48hs.',
    560.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'a0000001-0000-0000-0000-000000000005',
    'E-Commerce Pro',
    'Plataforma e-commerce avanzada con CMS. Entrega en 6-8 semanas. Soporte 24hs.',
    1400.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'a0000001-0000-0000-0000-000000000006',
    'Personalizado',
    'Sistemas a medida, IA, plataformas. Precio y entrega a definir según requerimientos.',
    NULL, 'USD', 'proyecto', 'web', true
  )
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- 2. CLIENTS
-- ------------------------------------------------------------

INSERT INTO clients (id, name, email, phone, sector, started_at, notes)
VALUES
  -- Cliente interno: proyectos propios de la agencia
  (
    'b0000002-0000-0000-0000-000000000001',
    'Pyrux',
    NULL, NULL, NULL,
    '2026-01-01',
    'Cliente interno — proyectos propios de la agencia.'
  ),
  -- Primer cliente real
  (
    'b0000002-0000-0000-0000-000000000002',
    'MedMind',
    'guille.bassi@hotmail.com',
    '+54 9 341 353-6452',
    'medico',
    '2026-03-05',
    'Primer cliente Pyrux. Contacto: Guillermina Bassi. Sin contrato firmado — formalizar urgente.'
  )
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- 3. PROJECTS
-- ------------------------------------------------------------

INSERT INTO projects (
  id, client_id, service_id,
  name, status, start_date, price, currency, notes,
  maintenance_amount, maintenance_currency, maintenance_since
)
VALUES
  -- Proyecto interno: sitio web de Pyrux
  (
    'c0000003-0000-0000-0000-000000000001',
    'b0000002-0000-0000-0000-000000000001', -- Pyrux
    NULL,
    'Portfolio Pyrux',
    'mantenimiento',
    '2026-01-01',
    NULL, 'USD',
    'Web institucional de la agencia. En producción en pyrux.com.ar.',
    NULL, 'USD', NULL
  ),
  -- Proyecto interno: producto SaaS
  (
    'c0000003-0000-0000-0000-000000000002',
    'b0000002-0000-0000-0000-000000000001', -- Pyrux
    NULL,
    'Goal Planner',
    'activo',
    '2026-01-01',
    NULL, 'USD',
    'Producto interno Pyrux. En desarrollo. goalplanner.com.ar',
    NULL, 'USD', NULL
  ),
  -- Proyecto real: MedMind
  (
    'c0000003-0000-0000-0000-000000000003',
    'b0000002-0000-0000-0000-000000000002', -- MedMind
    'a0000001-0000-0000-0000-000000000006', -- Personalizado
    'MedMind',
    'mantenimiento',
    '2026-03-05',
    300.00, 'USD',
    'Primer proyecto Pyrux. Desarrollo personalizado $300 USD. Mantenimiento activo $20 USD/mes.',
    20.00, 'USD', '2026-03-05'
  )
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- 4. PROSPECTS (base Rosario — 30 contactos)
-- ------------------------------------------------------------

INSERT INTO prospects (name, sector, status, notes)
VALUES
  -- Estudios contables (sin contactar)
  ('Estudio Priotti',        'contabilidad', 'sin_contactar', 'Sitio anticuado, sin SSL. Perfil profesional fuerte. Sugerido: Rediseño web + SSL'),
  ('Estudio Herusa',         'contabilidad', 'sin_contactar', 'Sitio sin blog ni portal de clientes, diseño viejo. Sugerido: Rediseño + portal clientes'),
  ('Guastella & Asoc.',      'contabilidad', 'sin_contactar', '30+ años, sitio brochure sin actualizaciones. Sugerido: Rediseño web'),
  ('Frasesores',             'contabilidad', 'sin_contactar', 'Sitio con sistema de compra genérico, nada profesional. Sugerido: Rediseño completo'),
  ('Contador CPCE II',       'contabilidad', 'sin_contactar', 'Miles de contadores matriculados sin web. Target masivo. Sugerido: Landing page profesional'),

  -- Estudios jurídicos (sin contactar)
  ('Chiana & Cigno',         'legal', 'sin_contactar', 'Solo en directorio. Firma joven, diferenciación posible. Sugerido: Sitio institucional'),
  ('Moreira & Asociados',    'legal', 'sin_contactar', 'Sedes en Rosario, San Lorenzo y Casilda. Sin web propia. Sugerido: Sitio multi-sede'),
  ('Blando Figueroa y Asoc.','legal', 'sin_contactar', 'Solo directorio. Fuerte en penal, sin identidad digital. Sugerido: Sitio institucional'),
  ('Copes & Asociados',      'legal', 'sin_contactar', 'Equipo de profesionales, cero presencia web propia. Sugerido: Sitio institucional'),
  ('V&C Estudio Jurídico',   'legal', 'sin_contactar', 'Tres sedes. Oportunidad de CMS multi-sede. Sugerido: Sitio + CMS multi-sede'),
  ('Robiolo & Asociados',    'legal', 'sin_contactar', 'Enfocados en empresas. Ticket alto potencial. Sugerido: Sitio institucional premium'),

  -- Estética (sin contactar)
  ('Centro de Estética Oroño','estetica', 'sin_contactar', '16K seguidores en IG. Alta demanda probada, sin web. Sugerido: Landing + sistema de turnos'),
  ('Mudra Rosario',           'estetica', 'sin_contactar', 'Solo Instagram. Formato spa = ticket alto. Sugerido: Web + reservas online'),
  ('Kymè Studio',             'estetica', 'sin_contactar', '5★ en Fresha, muy buenas reseñas. Sin web propia. Sugerido: Landing + turnos'),
  ('Tania — El Amor Por Tu Piel','estetica','sin_contactar','Buenas reseñas en Fresha, sin activo digital propio. Sugerido: Landing + reservas'),

  -- Estética (pendiente / contactado)
  ('Estetica Médica Brarda',  'estetica', 'sin_contactar', 'Sitio desactualizado, sin SSL. Procedimientos médicos. Sugerido: Rediseño + SSL + credenciales'),
  ('Be and Feel',             'estetica', 'sin_contactar', '13K seguidores IG activo. Sin web propia. Sugerido: Web + reservas + RRSS'),

  -- Retail / E-commerce (contactado)
  ('Blush Rosario',           'retail', 'sin_contactar', '46K seguidores IG, venta solo por DM. Ideal tienda online. Sugerido: E-commerce'),
  ('GC Representaciones',     'retail', 'sin_contactar', '37K seguidores. Venta por redes, gran oportunidad e-comm. Sugerido: Plataforma e-commerce'),
  ('Serendipia Rosario',      'retail', 'sin_contactar', 'Activa en IG. Emprendimiento listo para escalar. Sugerido: Tienda online'),
  ('Ferreterías / Mueblerías','retail', 'sin_contactar', 'Sin link a sitio en directorio. Universo amplio. Sugerido: Landing + catálogo'),

  -- Gastronomía (contactado)
  ('Excalibur (Holiday Inn)', 'gastronomia', 'sin_contactar', '4.7★ TripAdvisor, buen alcance digital pero puede crecer. Sugerido: Gestión RRSS + contenido'),
  ('Chinchibira',             'gastronomia', 'sin_contactar', 'Bar #1 TripAdvisor Rosario 2025. 4.6★, 950 opiniones. Sugerido: Web + RRSS + WhatsApp marketing'),
  ('Chicharra Asador',        'gastronomia', 'sin_contactar', '538 opiniones 4.4★. Sin web propia. Sugerido: Landing + reservas online'),
  ('Los Jardines',            'gastronomia', 'sin_contactar', '770 opiniones 4.1★. Web existente. Sugerido: Mejora web + CMS'),

  -- Barberías (contactado)
  ('Vision Hair Studio',      'otro', 'sin_contactar', '1.528 reviews 5.0★ en Fresha. Fuerte boca a boca. Sugerido: Landing + reservas + RRSS'),
  ('Essenza Barbería',        'otro', 'sin_contactar', '5.0★ Fresha 2026. Sin web, alta competencia en el rubro. Sugerido: Landing + sistema de turnos'),

  -- Salud / Dental (contactado)
  ('CM Dental Rosario',       'dental', 'sin_contactar', 'Clínica moderna con web. Puede mejorar con SEO y contenido. Sugerido: Mejora web + SEO + CMS'),

  -- Fitness (contactado)
  ('O2 Gimnasio',             'fitness', 'sin_contactar', 'Presente en búsquedas locales. Web funcional. Sugerido: Mejora web + RRSS'),

  -- Moda (contactado)
  ('Z Market',                'moda', 'sin_contactar', 'Solo FB/IG activo. Sin tienda online propia. Sugerido: E-commerce / tienda online')
;
