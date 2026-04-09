-- ============================================================
--  SEED v4: Pyrux Flows — datos reales al 2026-04-09
--  Ejecutar después de schema.sql
--  Sin IDs hardcodeados — Postgres los genera automáticamente.
--  Las referencias cruzadas usan subqueries por nombre.
-- ============================================================


-- ------------------------------------------------------------
-- 1. SECTORS
-- (id es text/clave natural, no uuid — se mantiene igual)
-- ------------------------------------------------------------

INSERT INTO sectors (id, label) VALUES
  ('contabilidad', 'Contabilidad'),
  ('construccion', 'Construcción'),
  ('consultoria',  'Consultoría'),
  ('dental',       'Dental'),
  ('educacion',    'Educación'),
  ('estetica',     'Estética'),
  ('fitness',      'Fitness'),
  ('gastronomia',  'Gastronomía'),
  ('inmobiliaria', 'Inmobiliaria'),
  ('legal',        'Legal'),
  ('logistica',    'Logística'),
  ('medico',       'Médico'),
  ('moda',         'Moda'),
  ('ong',          'ONG'),
  ('retail',       'Retail'),
  ('ropa_bebe',    'Ropa bebé'),
  ('tecnologia',   'Tecnología'),
  ('turismo',      'Turismo'),
  ('otro',         'Otro');


-- ------------------------------------------------------------
-- 2. SERVICES (tarifario de Pyrux)
-- ------------------------------------------------------------

INSERT INTO services (name, description, base_price, currency, unit, category, active)
VALUES
  (
    'Growth',
    'Sitio web profesional sin CMS. Entrega en 2 semanas. Soporte 48hs.',
    210.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'Pro',
    'Sitio web con CMS. Hasta 2hs/mes de soporte. Entrega en 3-4 semanas.',
    350.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'Business',
    'Sitio web con CMS avanzado, soporte prioritario 24hs y mejoras continuas. Entrega en 4+ semanas.',
    560.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'E-Commerce Básico',
    'Tienda online con CMS. Entrega en 4 semanas. Soporte 48hs.',
    560.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'E-Commerce Pro',
    'Plataforma e-commerce avanzada con CMS. Entrega en 6-8 semanas. Soporte 24hs.',
    1400.00, 'USD', 'proyecto', 'web', true
  ),
  (
    'Personalizado',
    'Sistemas a medida, IA, plataformas. Precio y entrega a definir según requerimientos.',
    NULL, 'USD', 'proyecto', 'web', true
  );


-- ------------------------------------------------------------
-- 3. CLIENTS
-- ------------------------------------------------------------

INSERT INTO clients (prospect_id, name, phone, sector, started_at, notes)
VALUES
  (
    NULL,
    'Pyrux',
    '+54 9 3416 94-1225',
    'otro',
    '2026-01-01',
    'Cliente interno — proyectos propios de la agencia.'
  ),
  (
    NULL,
    'MedMind',
    '+54 9 341 353-6452',
    'otro',
    '2026-03-01',
    'Empresa de traducción especializada en medicina y educación, entre español e inglés. Nombre del contacto: Guillermina Bassi.'
  );


-- ------------------------------------------------------------
-- 4. CONTACTS (de clientes)
-- ------------------------------------------------------------

INSERT INTO contacts (client_id, type, value) VALUES
  ((SELECT id FROM clients WHERE name = 'Pyrux'),   'email', 'pyrux@pyrux.com.ar'),
  ((SELECT id FROM clients WHERE name = 'MedMind'), 'email', 'info@medmindls.com');


-- ------------------------------------------------------------
-- 5. PROJECTS
-- ------------------------------------------------------------

INSERT INTO projects (
  client_id, service_id,
  name, status, start_date, price, currency, notes,
  maintenance_amount, maintenance_currency, maintenance_since
)
VALUES
  (
    (SELECT id FROM clients WHERE name = 'Pyrux'),
    NULL,
    'Portfolio Pyrux',
    'desarrollo',
    '2026-01-01',
    NULL, 'USD',
    'Web institucional de la agencia. En producción en pyrux.com.ar.',
    NULL, 'USD', NULL
  ),
  (
    (SELECT id FROM clients WHERE name = 'Pyrux'),
    NULL,
    'Goal Planner',
    'desarrollo',
    '2026-01-01',
    NULL, 'USD',
    'Producto interno Pyrux. En desarrollo. goalplanner.com.ar',
    NULL, 'USD', NULL
  ),
  (
    (SELECT id FROM clients WHERE name = 'MedMind'),
    (SELECT id FROM services WHERE name = 'Personalizado'),
    'MedMind',
    'mantenimiento',
    '2026-03-05',
    300.00, 'USD',
    'Primer proyecto Pyrux. Desarrollo personalizado $300 USD. Mantenimiento activo $20 USD/mes.',
    20.00, 'USD', '2026-03-05'
  );


-- ------------------------------------------------------------
-- 6. PROSPECTS (31 contactos reales al 2026-04-09)
-- ------------------------------------------------------------

INSERT INTO prospects (name, phone, sector, status, notes) VALUES

  -- Contabilidad
  ('Estudio Priotti',        NULL,                  'contabilidad', 'sin_contactar', 'Sitio anticuado, sin SSL. Perfil profesional fuerte. Sugerido: Rediseño web + SSL'),
  ('Estudio Herusa',         NULL,                  'contabilidad', 'sin_contactar', 'Sitio sin blog ni portal de clientes, diseño viejo. Sugerido: Rediseño + portal clientes'),
  ('Frasesores',             NULL,                  'contabilidad', 'sin_contactar', 'Sitio con sistema de compra genérico, nada profesional. Sugerido: Rediseño completo'),
  ('Contador CPCE II',       NULL,                  'contabilidad', 'sin_contactar', 'Miles de contadores matriculados sin web. Target masivo. Sugerido: Landing page profesional'),

  -- Legal
  ('Chiana & Cigno',         NULL,                  'legal',        'sin_contactar', 'Solo en directorio. Firma joven, diferenciación posible. Sugerido: Sitio institucional'),
  ('Moreira & Asociados',    NULL,                  'legal',        'sin_contactar', 'Sedes en Rosario, San Lorenzo y Casilda. Sin web propia. Sugerido: Sitio multi-sede'),
  ('Blando Figueroa y Asoc.',NULL,                  'legal',        'sin_contactar', 'Solo directorio. Fuerte en penal, sin identidad digital. Sugerido: Sitio institucional'),
  ('Copes & Asociados',      NULL,                  'legal',        'sin_contactar', 'Equipo de profesionales, cero presencia web propia. Sugerido: Sitio institucional'),
  ('V&C Estudio Jurídico',   '+54 9 3412 98-4441',  'legal',        'sin_contactar', 'Tres sedes. Oportunidad de CMS multi-sede. Sugerido: Sitio + CMS multi-sede'),
  ('Robiolo & Asociados',    NULL,                  'legal',        'sin_contactar', 'Enfocados en empresas. Ticket alto potencial. Sugerido: Sitio institucional premium'),

  -- Estética
  ('Centro de Estética Oroño',NULL,                 'estetica',     'sin_contactar', '16K seguidores en IG. Alta demanda probada, sin web. Sugerido: Landing + sistema de turnos'),
  ('Mudra Rosario',          NULL,                  'estetica',     'sin_contactar', 'Solo Instagram. Formato spa = ticket alto. Sugerido: Web + reservas online'),
  ('Kymè Studio',            NULL,                  'estetica',     'sin_contactar', '5★ en Fresha, muy buenas reseñas. Sin web propia. Sugerido: Landing + turnos'),
  ('Tania — El Amor Por Tu Piel', NULL,             'estetica',     'sin_contactar', 'Buenas reseñas en Fresha, sin activo digital propio. Sugerido: Landing + reservas'),
  ('Estetica Médica Brarda', NULL,                  'estetica',     'sin_contactar', 'Sitio desactualizado, sin SSL. Procedimientos médicos. Sugerido: Rediseño + SSL + credenciales'),
  ('Be and Feel',            '+54 9 3416 94-3777',  'estetica',     'contactado',    '13K seguidores IG activo. Sin web propia. Sugerido: Web + reservas + RRSS'),

  -- Retail / Moda
  ('Blush Rosario',          NULL,                  'retail',       'sin_contactar', '46K seguidores IG, venta solo por DM. Ideal tienda online. Sugerido: E-commerce'),
  ('GC Representaciones',    NULL,                  'retail',       'sin_contactar', '37K seguidores. Venta por redes, gran oportunidad e-comm. Sugerido: Plataforma e-commerce'),
  ('Serendipia Rosario',     NULL,                  'retail',       'sin_contactar', 'Activa en IG. Emprendimiento listo para escalar. Sugerido: Tienda online'),
  ('Ferreterías / Mueblerías',NULL,                 'retail',       'sin_contactar', 'Sin link a sitio en directorio. Universo amplio. Sugerido: Landing + catálogo'),
  ('Z Market',               NULL,                  'moda',         'sin_contactar', 'Solo FB/IG activo. Sin tienda online propia. Sugerido: E-commerce / tienda online'),

  -- Gastronomía
  ('Excalibur (Holiday Inn)', NULL,                 'gastronomia',  'sin_contactar', '4.7★ TripAdvisor, buen alcance digital pero puede crecer. Sugerido: Gestión RRSS + contenido'),
  ('Chinchibira',            NULL,                  'gastronomia',  'sin_contactar', 'Bar #1 TripAdvisor Rosario 2025. 4.6★, 950 opiniones. Sugerido: Web + RRSS + WhatsApp marketing'),
  ('Chicharra Asador',       NULL,                  'gastronomia',  'sin_contactar', '538 opiniones 4.4★. Sin web propia. Sugerido: Landing + reservas online'),
  ('Los Jardines',           NULL,                  'gastronomia',  'sin_contactar', '770 opiniones 4.1★. Web existente. Sugerido: Mejora web + CMS'),
  ('Panchería y Papitería Gourmet', NULL,           'gastronomia',  'contactado',    'Instagram: pancheriaypapiteriagourmet'),

  -- Dental
  ('CM Dental Rosario',      NULL,                  'dental',       'sin_contactar', 'Clínica moderna con web. Puede mejorar con SEO y contenido. Sugerido: Mejora web + SEO + CMS'),

  -- Otro
  ('Vision Hair Studio',     '+54 9 3412 78-1223',  'otro',         'contactado',    '1.528 reviews 5.0★ en Fresha. Fuerte boca a boca. Sugerido: Landing + reservas + RRSS'),
  ('Essenza Barbería',       NULL,                  'otro',         'cerrado',       '5.0★ Fresha 2026. Sin web, alta competencia en el rubro. Sugerido: Landing + sistema de turnos'),
  ('ESSENZA Barberia',       '+54 9 3417 18-9339',  'otro',         'contactado',    NULL),
  ('Cielito Encantando',     '+54 9 3416 16-5692',  'otro',         'contactado',    NULL);


-- ------------------------------------------------------------
-- 7. CONTACTS (de prospects)
-- ------------------------------------------------------------

INSERT INTO contacts (prospect_id, type, value)
SELECT id, 'instagram', 'pancheriaypapiteriagourmet'
FROM prospects
WHERE name = 'Panchería y Papitería Gourmet';


-- ------------------------------------------------------------
-- 8. SETTINGS
-- ------------------------------------------------------------

INSERT INTO settings (key, value) VALUES
  ('opening_balance_ars',  '36409.85'),
  ('opening_balance_date', '2026-04-01');
