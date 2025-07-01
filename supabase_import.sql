-- DATI ESSENZIALI TOURISTIQ PER SUPABASE
-- Crediti Admin (Pacchetto RobS)
INSERT INTO admin_credits (admin_code, credits_remaining, credits_used, last_generated_at) 
VALUES ('TIQ-IT-ADMIN', 996, 4, '2025-06-29 08:56:16.628');

-- Codici IQ principali
INSERT INTO iq_codes (code, role, is_active, status, assigned_to, location, code_type, approved_at, approved_by, internal_note) VALUES
('TIQ-IT-ADMIN', 'admin', true, 'approved', 'Sistema Admin', 'IT', 'professional', NOW(), 'system', 'Admin principale sistema'),
('TIQ-VV-STT-2567', 'structure', true, 'approved', 'Hotel Calabria Mare', 'VV', 'professional', NOW(), 'TIQ-IT-ADMIN', 'Struttura test principale'),
('TIQ-RC-STT-4334', 'structure', true, 'approved', 'Grand Hotel Reggio', 'RC', 'professional', NOW(), 'TIQ-IT-ADMIN', 'Struttura test secondaria'),
('TIQ-VV-PRT-2250', 'partner', true, 'approved', 'Ristorante Le Rose', 'VV', 'professional', NOW(), 'TIQ-IT-ADMIN', 'Partner test Briatico'),
('TIQ-VV-PRT-3847', 'partner', true, 'approved', 'Trattoria A Caseja', 'VV', 'professional', NOW(), 'TIQ-IT-ADMIN', 'Partner test Briatico'),
('TIQ-VV-PRT-5629', 'partner', true, 'approved', 'Da Pasquale', 'VV', 'professional', NOW(), 'TIQ-IT-ADMIN', 'Partner test Briatico'),
('TIQ-VV-PRT-7418', 'partner', true, 'approved', 'La Torretta', 'VV', 'professional', NOW(), 'TIQ-IT-ADMIN', 'Partner test Briatico'),
('TIQ-VV-PRT-9253', 'partner', true, 'approved', 'Hotel Ristorante Solari', 'VV', 'professional', NOW(), 'TIQ-IT-ADMIN', 'Partner test Briatico'),
('TIQ-IT-7394-VESUVIO', 'tourist', true, 'approved', NULL, 'IT', 'emotional', NOW(), 'TIQ-IT-ADMIN', 'Codice turista test');

-- Pacchetti assegnati alle strutture
INSERT INTO assigned_packages (recipient_iq_code, package_size, status, assigned_by, credits_remaining, credits_used) VALUES
('TIQ-VV-STT-2567', 25, 'active', 'TIQ-IT-ADMIN', 20, 5),
('TIQ-RC-STT-4334', 50, 'active', 'TIQ-IT-ADMIN', 45, 5);

-- Partner Details per TIQai (5 ristoranti reali di Briatico)
INSERT INTO partner_details (partner_code, business_name, business_type, description, address, city, province, phone, email, opening_hours, wheelchair_accessible, gluten_free, vegetarian_options, child_friendly, wifi_available, credit_cards_accepted) VALUES
('TIQ-VV-PRT-2250', 'Ristorante Le Rose', 'ristorante', 'Cucina tradizionale calabrese con splendida vista mare', 'Via Marina 15', 'Briatico', 'VV', '+39 0963 391234', 'info@lerose.it', '{"mar-dom": "12:00-15:00,19:00-23:00", "lun": "chiuso"}', true, true, true, true, true, true),
('TIQ-VV-PRT-3847', 'Trattoria A Caseja', 'ristorante', 'Atmosfera tipica calabrese con piatti della tradizione', 'Via Principale 42', 'Briatico', 'VV', '+39 0963 391567', 'info@acaseja.it', '{"tutti": "12:00-15:00,19:30-23:30"}', false, false, true, true, true, true),
('TIQ-VV-PRT-5629', 'Da Pasquale', 'ristorante', 'Ristorante tra i top 10 su TripAdvisor, specializzato in piatti di pesce', 'Lungomare Cristoforo Colombo 8', 'Briatico', 'VV', '+39 0963 391890', 'info@dapasquale.it', '{"tutti": "12:30-15:30,19:00-23:00"}', true, true, true, true, true, true),
('TIQ-VV-PRT-7418', 'La Torretta', 'ristorante', 'Ristorante con terrazza panoramica e esperienza culinaria unica', 'Via Torretta 3', 'Briatico', 'VV', '+39 0963 392123', 'info@latorretta.it', '{"mar-dom": "12:00-15:00,19:00-23:00", "lun": "chiuso"}', true, false, true, true, true, true),
('TIQ-VV-PRT-9253', 'Hotel Ristorante Solari', 'ristorante', 'Situato vicino alla spiaggia, offre piatti deliziosi in ambiente rilassante', 'Via Solari 20', 'Briatico', 'VV', '+39 0963 392456', 'info@solari.it', '{"tutti": "12:00-15:00,19:30-23:00"}', true, true, true, true, true, true);

-- Onboarding partner completato
INSERT INTO partner_onboarding (partner_code, is_completed, completed_at, business_info_completed, accessibility_info_completed, allergy_info_completed, family_info_completed, specialty_info_completed, services_info_completed) VALUES
('TIQ-VV-PRT-2250', true, NOW(), true, true, true, true, true, true),
('TIQ-VV-PRT-3847', true, NOW(), true, true, true, true, true, true),
('TIQ-VV-PRT-5629', true, NOW(), true, true, true, true, true, true),
('TIQ-VV-PRT-7418', true, NOW(), true, true, true, true, true, true),
('TIQ-VV-PRT-9253', true, NOW(), true, true, true, true, true, true);

-- Ospiti per test
INSERT INTO guests (structure_code, first_name, last_name, email, phone, room_number, checkin_date, checkout_date, notes, assigned_codes, is_active) VALUES
('TIQ-VV-STT-2567', 'Mario', 'Rossi', 'mario.rossi@email.com', '+39 333 1234567', '101', '2025-01-15', '2025-01-20', 'Ospite VIP', 1, true),
('TIQ-VV-STT-2567', 'Anna', 'Bianchi', 'anna.bianchi@email.com', '+39 333 7654321', '102', '2025-01-18', '2025-01-22', 'Famiglia con bambini', 0, true);

-- Movimenti contabili test
INSERT INTO accounting_movements (structure_code, type, category, description, amount, movement_date, payment_method, clients_served, iqcodes_used, notes) VALUES
('TIQ-VV-STT-2567', 'income', 'pernottamento', 'Camera doppia 3 notti', '450.00', '2025-01-15', 'carta_credito', 2, 2, 'Pagamento anticipato'),
('TIQ-VV-STT-2567', 'expense', 'fornitori', 'Rifornimento colazione', '120.50', '2025-01-16', 'bonifico', 0, 0, 'Fornitore locale'),
('TIQ-RC-STT-4334', 'income', 'servizi', 'Servizio navetta aeroporto', '35.00', '2025-01-20', 'contanti', 1, 1, 'Servizio extra');