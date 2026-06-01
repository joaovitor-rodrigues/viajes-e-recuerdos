-- ============================================================
-- Viajes e Recuerdos — Seed Data (5 example pins)
-- ============================================================

INSERT INTO pins (latitude, longitude, city, state, country, title, description, pin_date, color, icon)
VALUES
  (
    48.85341000, 2.34880000,
    'Paris', NULL, 'France',
    'Première fois à Paris',
    'Uma tarde gelada no Museu d''Orsay e depois macarons na Rue de Rivoli.',
    '2023-02-14',
    '#C9485B', '🗼'
  ),
  (
    -22.90278000, -43.17222000,
    'Rio de Janeiro', 'RJ', 'Brazil',
    'Réveillon em Copacabana',
    'Dois milhões de pessoas, fogos sobre o mar e muita felicidade.',
    '2024-01-01',
    '#4ECDC4', '🎆'
  ),
  (
    35.68950000, 139.69171000,
    'Tokyo', NULL, 'Japan',
    'Sakura no Ueno',
    'Hanami sob as cerejeiras em flor — chá matcha e taiyaki na mão.',
    '2023-04-02',
    '#FFB347', '🌸'
  ),
  (
    41.38879000, 2.15899000,
    'Barcelona', 'Catalonia', 'Spain',
    'Sagrada Família ao pôr do sol',
    'A luz dourada atravessando os vitrais coloridos é algo impossível de descrever.',
    '2022-09-21',
    '#A78BFA', '⛪'
  ),
  (
    -13.16317000, -72.54509000,
    'Machu Picchu', 'Cusco', 'Peru',
    'Acima das nuvens',
    'Acordar às 4h para ver o sol nascer sobre as ruínas incas. Vale cada passo.',
    '2023-07-15',
    '#34D399', '🏔️'
  );
