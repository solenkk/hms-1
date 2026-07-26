-- Clinical Seed Data for Ethiopian Clinic HMS
-- Seeding common diagnoses and laboratory test templates with parameters

BEGIN;

--------------------------------------------------------------------------------
-- SECTION 1: ICD-10 Diagnoses Common in Ethiopian Clinics
--------------------------------------------------------------------------------

INSERT INTO diagnoses (icd10_code, description_en, description_am, category) VALUES
-- Infectious & Parasitic Diseases
('B54', 'Unspecified malaria', 'ያልተገለጸ ወባ', 'Infectious & parasitic'),
('A01.0', 'Typhoid fever', 'የታይፎይድ ትኩሳት', 'Infectious & parasitic'),
('A15', 'Respiratory tuberculosis, bacteriologically and histologically confirmed', 'የሳምባ ነቀርሳ (ሳንባ ቲቢ)', 'Infectious & parasitic'),
('B20', 'Human immunodeficiency virus [HIV] disease', 'የኤች.አይ.ቪ/ኤድስ በሽታ', 'Infectious & parasitic'),
('B76.9', 'Hookworm disease, unspecified', 'የኮክዎርም ጥገኛ ትል በሽታ', 'Infectious & parasitic'),
('B77.0', 'Ascariasis with intestinal complications', 'የወስፋት ትል በሽታ ከሆድ ውስብስብ ችግር ጋር', 'Infectious & parasitic'),
('B82.0', 'Intestinal helminthiasis, unspecified', 'ያልተገለጸ የሆድ ዕቃ ጥገኛ ትላትል', 'Infectious & parasitic'),
('A06.0', 'Acute amebic dysentery', 'አጣዳፊ የአሜባ ተቅማጥ', 'Infectious & parasitic'),
('A07.1', 'Giardiasis [lambliasis]', 'የጂያርዲያ ተቅማጥ በሽታ', 'Infectious & parasitic'),
('B65.9', 'Schistosomiasis, unspecified (Bilharzia)', 'ቢልሃርዝያ (የውሃ ውስጥ ትል በሽታ)', 'Infectious & parasitic'),
('A00.9', 'Cholera, unspecified', 'አጣዳፊ የተቅማጥ እና ትውከት በሽታ (ኮሌራ)', 'Infectious & parasitic'),
('A30.9', 'Leprosy, unspecified', 'የስጋ ደዌ በሽታ', 'Infectious & parasitic'),

-- Respiratory System
('J06.9', 'Acute upper respiratory infection, unspecified', 'አጣዳፊ የላይኛው የመተንፈሻ አካላት ኢንፌክሽን', 'Respiratory'),
('J18.9', 'Pneumonia, unspecified organism', 'የሳምባ ምች በሽታ', 'Respiratory'),
('J40', 'Bronchitis, not specified as acute or chronic', 'የብሮንካይተስ (የመተንፈሻ ቱቦ) እብጠት', 'Respiratory'),
('J45.9', 'Asthma, unspecified', 'የአስም በሽታ', 'Respiratory'),
('J02.9', 'Acute pharyngitis, unspecified', 'አጣዳፊ የጉሮሮ እብጠት', 'Respiratory'),
('J30.9', 'Allergic rhinitis, unspecified', 'የአፍንጫ አለርጂ', 'Respiratory'),

-- Digestive System
('A09', 'Infectious gastroenteritis and colitis, unspecified', 'ተላላፊ የሆድ እና አንጀት እብጠት', 'Digestive'),
('K27.9', 'Peptic ulcer, site unspecified, unspecified as acute or chronic', 'የጨጓራ ቁስለት በሽታ', 'Digestive'),
('B18.1', 'Chronic viral hepatitis B without delta-agent', 'ሥር የሰደደ የጉበት በሽታ ቢ (ሄፓታይተስ ቢ)', 'Digestive'),
('K29.7', 'Gastritis, unspecified', 'የጨጓራ እብጠት (ጋስትራይተስ)', 'Digestive'),
('K59.0', 'Constipation', 'የሆድ ድርቀት', 'Digestive'),

-- Cardiovascular System
('I10', 'Essential (primary) hypertension', 'የደም ግፊት በሽታ', 'Cardiovascular'),
('I50.9', 'Heart failure, unspecified', 'የልብ ድካም', 'Cardiovascular'),
('I00', 'Rheumatic fever without mention of heart involvement', 'የአጥንትና መገጣጠሚያ የሩማቲዝም ትኩሳት', 'Cardiovascular'),
('I25.1', 'Atherosclerotic heart disease', 'የልብ የደም ቧንቧ መጥበብ በሽታ', 'Cardiovascular'),

-- Endocrine, Nutritional & Metabolic
('E11.9', 'Type 2 diabetes mellitus without complications', 'የስኳር በሽታ ዓይነት 2 (ያለ ውስብስብ ችግር)', 'Endocrine'),
('E46', 'Unspecified protein-energy malnutrition', 'የአልሚ ምግብ እጥረት (የመቀጨጭ በሽታ)', 'Endocrine'),
('D64.9', 'Anemia, unspecified', 'የደም ማነስ በሽታ', 'Endocrine'),
('E03.9', 'Hypothyroidism, unspecified', 'የታይሮይድ እጢ ሆርሞን ማነስ', 'Endocrine'),
('E66.9', 'Obesity, unspecified', 'ከመጠን ያለፈ ውፍረት', 'Endocrine'),

-- Skin and Subcutaneous Tissue
('B35.9', 'Dermatophytosis, unspecified (Tinea/Ringworm)', 'የቆዳ ፈንገስ ኢንፌክሽን (ቺፌ/እከክ)', 'Skin'),
('B86', 'Scabies', 'የእከክ በሽታ (ስካቢስ)', 'Skin'),
('L89.9', 'Decubitus ulcer and pressure area, unspecified', 'የመኝታ ቁስል', 'Skin'),
('L03.9', 'Cellulitis, unspecified', 'የቆዳና የሰውነት ህዋስ ኢንፌክሽን', 'Skin'),
('L23.9', 'Allergic contact dermatitis, unspecified cause', 'የቆዳ አለርጂ', 'Skin'),

-- Genitourinary / Reproductive
('N39.0', 'Urinary tract infection, site not specified', 'የሽንት ቧንቧ ኢንፌክሽን', 'Reproductive'),
('Z34.9', 'Supervision of normal pregnancy, unspecified', 'የተለመደ የእርግዝና ክትትል', 'Reproductive'),
('N76.0', 'Acute vaginitis', 'አጣዳፊ የሴት ብልት እብጠት', 'Reproductive'),
('N40', 'Hyperplasia of prostate (BPH)', 'የፕሮስቴት እጢ ማበጥ', 'Reproductive'),

-- Injuries and Poisoning
('T14.0', 'Superficial injury of unspecified body region (laceration/wound)', 'ቀላል የሰውነት መቆረጥ/ቁስል', 'Injuries'),
('T30.0', 'Burn of unspecified body region, unspecified degree', 'የሰውነት ቃጠሎ', 'Injuries'),
('T14.2', 'Fracture of unspecified body region', 'የአጥንት ስብራት', 'Injuries'),
('S09.9', 'Unspecified injury of head', 'የራስ ቅል መጎዳት', 'Injuries'),

-- Mental and Behavioral Disorders
('F32.9', 'Depressive episode, unspecified', 'የጭንቀትና ድብርት ስሜት', 'Mental health'),
('G40.9', 'Epilepsy, unspecified', 'የሚጥል በሽታ (ኤፒሌፕሲ)', 'Mental health'),
('F41.9', 'Anxiety disorder, unspecified', 'የጭንቀት በሽታ', 'Mental health'),

-- General Symptoms / Others
('R50.9', 'Fever, unspecified', 'ትኩሳት', 'General'),
('R51', 'Headache', 'ራስ ምታት', 'General'),
('M25.5', 'Pain in joint', 'የመገጣጠሚያ ህመም', 'General');


--------------------------------------------------------------------------------
-- SECTION 2: Laboratory Test Types and Parameters
--------------------------------------------------------------------------------

-- HAEMATOLOGY
INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(100, 'Full Blood Count (CBC)', 'ሙሉ የደም ምርመራ (ሲቢሲ)', 'haematology', 'blood', 2, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(100, 'WBC (White Blood Cells)', 'ነጭ የደም ህዋሳት', '10³/μL', 4.5, 11.0, '4.5 - 11.0', 1),
(100, 'RBC (Red Blood Cells)', 'ቀይ የደም ህዋሳት', '10⁶/μL', 3.6, 5.4, '4.2-5.4 (M), 3.6-5.0 (F)', 2),
(100, 'Haemoglobin (Hb)', 'ሂሞግሎቢን', 'g/dL', 12.0, 17.0, '13.0-17.0 (M), 12.0-16.0 (F)', 3),
(100, 'Haematocrit (Hct)', 'ሄማቶክሪት', '%', 36.0, 51.0, '39.0-51.0 (M), 36.0-47.0 (F)', 4),
(100, 'MCV', 'ኤም.ሲ.ቪ', 'fL', 80.0, 100.0, '80.0 - 100.0', 5),
(100, 'MCH', 'ኤም.ሲ.ኤች', 'pg', 27.0, 33.0, '27.0 - 33.0', 6),
(100, 'MCHC', 'ኤም.ሲ.ኤች.ሲ', 'g/dL', 32.0, 36.0, '32.0 - 36.0', 7),
(100, 'Platelets', 'ፕሌትሌትስ', '10³/μL', 150.0, 400.0, '150.0 - 400.0', 8),
(100, 'Neutrophils', 'ኒውትሮፊልስ', '%', 50.0, 70.0, '50.0 - 70.0', 9),
(100, 'Lymphocytes', 'ሊምፎሳይትስ', '%', 20.0, 40.0, '20.0 - 40.0', 10),
(100, 'Monocytes', 'ሞኖሳይትስ', '%', 2.0, 8.0, '2.0 - 8.0', 11),
(100, 'Eosinophils', 'ኢኦሲኖፊልስ', '%', 1.0, 4.0, '1.0 - 4.0', 12);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(101, 'Erythrocyte Sedimentation Rate (ESR)', 'ኢ.ኤስ.አር (ESR)', 'haematology', 'blood', 2, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(101, 'ESR', 'ኢ.ኤስ.አር', 'mm/hr', 0.0, 30.0, '<20 (M), <30 (F)', 1);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(102, 'Blood Film for Malaria Parasites', 'የወባ ጥገኛ ህዋስ የደም ምርመራ', 'haematology', 'blood', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(102, 'Malaria Smear Result', 'የወባ ምርመራ ውጤት', NULL, NULL, NULL, 'Negative', 1),
(102, 'Plasmodium Species', 'የወባ ዓይነት', NULL, NULL, NULL, 'None', 2),
(102, 'Parasite Density', 'የጥገኛ ህዋስ ክምችት', NULL, NULL, NULL, 'Negative/+/++/+++/++++', 3);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(103, 'Blood Group & Rh Factor', 'የደም ዓይነት እና አር.ኤች ፋክተር', 'haematology', 'blood', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(103, 'ABO Group', 'የደም ዓይነት', NULL, NULL, NULL, 'A, B, AB, O', 1),
(103, 'Rh Factor', 'አር.ኤች ፋክተር', NULL, NULL, NULL, 'Positive / Negative', 2);


-- BIOCHEMISTRY
INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(104, 'Fasting Blood Sugar (FBS)', 'የስኳር ምርመራ (FBS)', 'biochemistry', 'blood', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(104, 'FBS', 'FBS ምርመራ', 'mmol/L', 3.9, 6.1, '3.9 - 6.1 mmol/L (70 - 110 mg/dL)', 1);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(105, 'Random Blood Sugar (RBS)', 'ደቂቃዊ የስኳር ምርመራ (RBS)', 'biochemistry', 'blood', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(105, 'RBS', 'RBS ምርመራ', 'mmol/L', 0.0, 7.8, '< 7.8 mmol/L (< 140 mg/dL)', 1);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(106, 'HbA1c', 'ኤች.ቢ.ኤ.ワン.ሲ (HbA1c)', 'biochemistry', 'blood', 4, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(106, 'HbA1c Value', 'HbA1c ዋጋ', '%', 0.0, 5.6, '<5.7% (Normal), 5.7-6.4% (Pre-diabetic), >=6.5% (Diabetic)', 1);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(107, 'Lipid Profile', 'የስብ መጠን ምርመራ', 'biochemistry', 'blood', 3, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(107, 'Total Cholesterol', 'ጠቅላላ ኮሌስትሮል', 'mmol/L', 0.0, 5.2, '< 5.2 mmol/L', 1),
(107, 'HDL Cholesterol', 'ጥሩ ኮሌስትሮል', 'mmol/L', 1.0, 2.0, '> 1.0 (M), > 1.2 (F)', 2),
(107, 'LDL Cholesterol', 'መጥፎ ኮሌስትሮል', 'mmol/L', 0.0, 2.6, '< 2.6 mmol/L', 3),
(107, 'Triglycerides', 'ትራይግሊሰራይድ', 'mmol/L', 0.0, 1.7, '< 1.7 mmol/L', 4);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(108, 'Liver Function Tests (LFT)', 'የጉበት ተግባር ምርመራ (LFT)', 'biochemistry', 'blood', 3, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(108, 'ALT (SGPT)', 'ALT (SGPT)', 'U/L', 7.0, 40.0, '7 - 40 U/L', 1),
(108, 'AST (SGOT)', 'AST (SGOT)', 'U/L', 10.0, 40.0, '10 - 40 U/L', 2),
(108, 'ALP (Alkaline Phosphatase)', 'ALP', 'U/L', 44.0, 147.0, '44 - 147 U/L', 3),
(108, 'Total Bilirubin', 'ጠቅላላ ቢሊሩቢን', 'μmol/L', 3.4, 20.5, '3.4 - 20.5 μmol/L', 4),
(108, 'Direct Bilirubin', 'ቀጥተኛ ቢሊሩቢን', 'μmol/L', 0.0, 6.8, '0.0 - 6.8 μmol/L', 5),
(108, 'Total Protein', 'ጠቅላላ ፕሮቲን', 'g/L', 64.0, 83.0, '64 - 83 g/L', 6),
(108, 'Albumin', 'አልቡሚን', 'g/L', 35.0, 52.0, '35 - 52 g/L', 7);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(109, 'Renal Function Tests (RFT)', 'የኩላሊት ተግባር ምርመራ (RFT)', 'biochemistry', 'blood', 3, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(109, 'Creatinine', 'ክሬአቲኒን', 'μmol/L', 44.0, 106.0, '53-106 (M), 44-88 (F)', 1),
(109, 'BUN (Blood Urea Nitrogen)', 'ዩሪያ', 'mmol/L', 2.5, 6.4, '2.5 - 6.4 mmol/L', 2),
(109, 'Uric Acid', 'ዩሪክ አሲድ', 'μmol/L', 143.0, 416.0, '202-416 (M), 143-339 (F)', 3),
(109, 'eGFR', 'eGFR', 'mL/min/1.73m²', 90.0, 999.0, '>= 90', 4);


-- SEROLOGY
INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(110, 'HIV 1&2 Antibody Test', 'የኤች.አይ.ቪ ፈጣን ምርመራ', 'serology', 'blood', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(110, 'HIV Result', 'ውጤት', NULL, NULL, NULL, 'Non-reactive', 1);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(111, 'Hepatitis B Surface Antigen (HBsAg)', 'የጃንዲሽ ቢ ምርመራ (HBsAg)', 'serology', 'blood', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(111, 'HBsAg Result', 'HBsAg ውጤት', NULL, NULL, NULL, 'Negative', 1);

INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(112, 'Widal Test (Typhoid)', 'የታይፎይድ ደም ምርመራ (ዊዳል)', 'serology', 'blood', 2, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(112, 'Salmonella Typhi O', 'S. Typhi O', NULL, NULL, NULL, 'Titre (e.g. < 1:80)', 1),
(112, 'Salmonella Typhi H', 'S. Typhi H', NULL, NULL, NULL, 'Titre (e.g. < 1:80)', 2),
(112, 'Salmonella Paratyphi AO', 'S. Paratyphi AO', NULL, NULL, NULL, 'Titre (e.g. < 1:80)', 3),
(112, 'Salmonella Paratyphi AH', 'S. Paratyphi AH', NULL, NULL, NULL, 'Titre (e.g. < 1:80)', 4);


-- URINALYSIS
INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(113, 'Urine Routine & Microscopy', 'የሽንት ምርመራ', 'urinalysis', 'urine', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(113, 'Colour', 'ቀለም', NULL, NULL, NULL, 'Straw / Yellow', 1),
(113, 'Appearance', 'አይነት', NULL, NULL, NULL, 'Clear', 2),
(113, 'pH', 'pH', NULL, 4.5, 8.0, '4.5 - 8.0', 3),
(113, 'Specific Gravity', 'ስፔሲፊክ ግራቪቲ', NULL, 1.005, 1.030, '1.005 - 1.030', 4),
(113, 'Urine Glucose', 'ስኳር በሽንት', NULL, NULL, NULL, 'Negative', 5),
(113, 'Urine Protein', 'ፕሮቲን በሽንት', NULL, NULL, NULL, 'Negative', 6),
(113, 'Ketones', 'ኪቶንስ', NULL, NULL, NULL, 'Negative', 7),
(113, 'Blood/Hemoglobin', 'ደም በሽንት', NULL, NULL, NULL, 'Negative', 8),
(113, 'Leucocytes', 'ሉኮሳይት', NULL, NULL, NULL, 'Negative', 9),
(113, 'Nitrites', 'ናይትራይት', NULL, NULL, NULL, 'Negative', 10),
(113, 'Bilirubin', 'ቢሊሩቢን', NULL, NULL, NULL, 'Negative', 11),
(113, 'Urobilinogen', 'ዩሮቢሊኖጅን', NULL, NULL, NULL, 'Normal', 12),
(113, 'Microscopy WBC', 'WBC (ማይክሮስኮፒ)', '/hpf', 0.0, 5.0, '< 5 /hpf', 13),
(113, 'Microscopy RBC', 'RBC (ማይክሮስኮፒ)', '/hpf', 0.0, 3.0, '< 3 /hpf', 14),
(113, 'Epithelial cells', 'የኤፒተልያል ሴሎች', NULL, NULL, NULL, 'Nil / Scanty', 15),
(113, 'Casts', 'ካስትስ', NULL, NULL, NULL, 'Nil', 16),
(113, 'Crystals', 'ክሪስታልስ', NULL, NULL, NULL, 'Nil', 17),
(113, 'Bacteria', 'ባክቴሪያ', NULL, NULL, NULL, 'Nil', 18);


-- MICROBIOLOGY
INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(114, 'Stool Routine & Microscopy', 'የሰገራ ምርመራ', 'microbiology', 'stool', 1, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(114, 'Consistency', 'ሁኔታ', NULL, NULL, NULL, 'Formed / Semi-formed', 1),
(114, 'Colour', 'ቀለም', NULL, NULL, NULL, 'Brownish', 2),
(114, 'Blood', 'ደም', NULL, NULL, NULL, 'No', 3),
(114, 'Mucus', 'አክታ / ሙከስ', NULL, NULL, NULL, 'No', 4),
(114, 'Ova and Parasites', 'የጥገኛ ትላትል እንቁላል', NULL, NULL, NULL, 'Negative / Not seen', 5),
(114, 'Stool WBC', 'WBC በሰገራ', '/hpf', 0.0, 5.0, '< 5 /hpf', 6);


-- HISTOLOGY/CYTOLOGY
INSERT INTO lab_test_types (id, name_en, name_am, category, sample_type, turnaround_hours, price, is_active) VALUES
(115, 'Pap Smear', 'የማህፀን በር ካንሰር ምርመራ (ፓፕ ስሚር)', 'histology', 'swab', 72, 0.00, TRUE);

INSERT INTO lab_result_parameters (test_type_id, parameter_name_en, parameter_name_am, unit, normal_range_min, normal_range_max, normal_range_text, sort_order) VALUES
(115, 'Specimen Adequacy', 'የናሙና ጥራት', NULL, NULL, NULL, 'Satisfactory / Unsatisfactory', 1),
(115, 'Pap Smear Result', 'ውጤት', NULL, NULL, NULL, 'Normal / ASCUS / LSIL / HSIL / Malignant', 2),
(115, 'Recommendation', 'ምክረ ሃሳብ', NULL, NULL, NULL, 'Follow up / Biopsy', 3);

COMMIT;
