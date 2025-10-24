#!/bin/bash

# Generate SQL insert statements for ingredient dosage configurations
# This script creates INSERT statements for all the ingredient dosage data
# Organized by category to avoid duplicates and make finding easier

echo "-- =================================================================
-- INGREDIENT DOSAGE CONFIGURATIONS INSERT STATEMENTS
-- Generated from comprehensive ingredient dosage data
-- Organized by category to avoid duplicates
-- =================================================================

-- Clear existing data to avoid duplicates
DELETE FROM public.ingredient_dosage_configs;

-- Insert creatine dosages (25 types)
INSERT INTO public.ingredient_dosage_configs (ingredient_name, ingredient_type, category, dosage_unit, min_daily_dosage, max_daily_dosage, dangerous_dosage, dosage_notes, cautions, precaution_people, dosage_citation, cautions_citation) VALUES"

# Creatine dosages - organized by category
cat << 'EOF'
-- Fundamental Creatine Forms
('Creatine Monohydrate', 'creatine', 'fundamental', 'mg', 3000, 5000, 10000, 'Most researched form. Loading phase: 20g/day for 5-7 days, then 3-5g maintenance.', 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Anhydrous', 'creatine', 'fundamental', 'mg', 3000, 5000, 10000, 'Creatine without water molecules. Same dosing as monohydrate.', 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Phosphate', 'creatine', 'fundamental', 'mg', 2000, 4000, 8000, 'Phosphate-bound creatine. May enhance ATP production.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Free Acid Creatine', 'creatine', 'fundamental', 'mg', 1500, 3000, 6000, 'Acid-stable form. Lower doses required.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),

-- Salt Forms
('Creatine Hydrochloride', 'creatine', 'salt', 'mg', 1000, 2000, 4000, 'More soluble, requires lower doses. No loading phase needed.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Citrate', 'creatine', 'salt', 'mg', 2000, 4000, 8000, 'Better solubility than monohydrate. Moderate dosing required.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Malate', 'creatine', 'salt', 'mg', 2000, 4000, 8000, 'Combined with malic acid. May enhance energy production.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Pyruvate', 'creatine', 'salt', 'mg', 1500, 3000, 6000, 'Enhanced absorption. Lower doses needed.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Nitrate', 'creatine', 'salt', 'mg', 1500, 3000, 6000, 'Nitrate form may provide additional cardiovascular benefits.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function', 'low blood pressure'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Gluconate', 'creatine', 'salt', 'mg', 2000, 4000, 8000, 'Gluconate-bound creatine. Moderate dosing.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Orotate', 'creatine', 'salt', 'mg', 1500, 3000, 6000, 'Orotic acid-bound creatine. Enhanced absorption.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Alpha-Ketoglutarate', 'creatine', 'salt', 'mg', 2000, 4000, 8000, 'AKG-bound creatine. May enhance energy metabolism.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Taurinate', 'creatine', 'salt', 'mg', 2000, 4000, 8000, 'Taurine-bound creatine. May provide additional benefits.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),

-- Ester Forms
('Creatine Ethyl Ester', 'creatine', 'ester', 'mg', 2000, 4000, 8000, 'Esterified form. May have better absorption.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatine Ethyl Ester Malate', 'creatine', 'ester', 'mg', 2000, 4000, 8000, 'Esterified creatine with malic acid. Enhanced absorption.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),

-- Chelate Forms
('Creatine Magnesium Chelate', 'creatine', 'chelate', 'mg', 2000, 4000, 8000, 'Magnesium-chelated creatine. May enhance absorption.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),

-- Processed Forms
('Micronized Creatine', 'creatine', 'processed', 'mg', 3000, 5000, 10000, 'Smaller particle size for better mixing. Same dosing as regular monohydrate.', 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Buffered Creatine', 'creatine', 'processed', 'mg', 2000, 4000, 8000, 'Buffered to reduce stomach acidity. Lower doses needed.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creapure', 'creatine', 'processed', 'mg', 3000, 5000, 10000, 'High-purity German creatine monohydrate. Same dosing as monohydrate.', 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Crea-Trona', 'creatine', 'processed', 'mg', 2000, 4000, 8000, 'Buffered creatine complex. Lower doses needed.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Effervescent Creatine', 'creatine', 'processed', 'mg', 3000, 5000, 10000, 'Effervescent form for better mixing. Same dosing as monohydrate.', 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Liquid Creatine', 'creatine', 'processed', 'mg', 2000, 4000, 8000, 'Liquid form. May have stability issues. Use quickly.', 'May cause mild GI upset at high doses. Take with water. Liquid form may degrade over time.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'),
('Creatinol-O-Phosphate', 'creatine', 'processed', 'mg', 1500, 3000, 6000, 'Phosphorylated creatine. Enhanced bioavailability.', 'May cause mild GI upset at high doses. Take with water.', ARRAY['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/');

-- Insert vitamin and mineral dosages (16 types)
INSERT INTO public.ingredient_dosage_configs (ingredient_name, ingredient_type, category, dosage_unit, min_daily_dosage, max_daily_dosage, dangerous_dosage, dosage_notes, cautions, precaution_people, dosage_citation, cautions_citation) VALUES
EOF

# Vitamin and mineral dosages
cat << 'EOF'
-- B Vitamins
('Vitamin B3 (Niacin)', 'vitamin', 'vitamin (water_soluble)', 'mg', 14, 16, 35, 'RDA. Essential for energy metabolism and skin health - Nicotinic acid form.', 'UL: 35 mg. Toxicity symptoms: Flushing, liver damage, stomach ulcers, vision problems.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/Niacin-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Niacin-HealthProfessional/#h8'),
('Vitamin B3 (Niacinamide)', 'vitamin', 'vitamin (water_soluble)', 'mg', 14, 16, 35, 'RDA. Essential for energy metabolism and skin health - Niacinamide form (no flush).', 'UL: 35 mg. Toxicity symptoms: Rare - excess excreted in urine.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/Niacin-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Niacin-HealthProfessional/#h8'),
('Vitamin B5 (Pantothenic Acid)', 'vitamin', 'vitamin (water_soluble)', 'mg', 5, 5, NULL, 'RDA. Essential for energy metabolism and hormone production - D-pantothenic acid form.', 'No UL established. Toxicity symptoms: Rare - excess excreted in urine.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/#h8'),
('Vitamin B5 (Pantethine)', 'vitamin', 'vitamin (water_soluble)', 'mg', 5, 5, NULL, 'RDA. Essential for energy metabolism and hormone production - Pantethine form (more bioavailable).', 'No UL established. Toxicity symptoms: Rare - excess excreted in urine.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/#h8'),
('Vitamin B6 (Pyridoxine)', 'vitamin', 'vitamin (water_soluble)', 'mg', 1.3, 1.3, 100, 'RDA. Important for protein metabolism and brain function - Pyridoxine hydrochloride form.', 'UL: 100 mg. Toxicity symptoms: Nerve damage, skin lesions, photosensitivity.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/#h8'),
('Vitamin B6 (PLP)', 'vitamin', 'vitamin (water_soluble)', 'mg', 1.3, 1.3, 100, 'RDA. Important for protein metabolism and brain function - Pyridoxal 5-phosphate form (most active).', 'UL: 100 mg. Toxicity symptoms: Nerve damage, skin lesions, photosensitivity.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/#h8'),
('Vitamin B12 (Cyanocobalamin)', 'vitamin', 'vitamin (water_soluble)', 'mcg', 2.4, 2.4, NULL, 'RDA (2.4 mcg). Essential for nerve function and red blood cell formation - Cyanocobalamin form (synthetic).', 'No UL established. Toxicity symptoms: Rare - excess excreted in urine.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/#h8'),
('Vitamin B12 (Methylcobalamin)', 'vitamin', 'vitamin (water_soluble)', 'mcg', 2.4, 2.4, NULL, 'RDA (2.4 mcg). Essential for nerve function and red blood cell formation - Methylcobalamin form (active).', 'No UL established. Toxicity symptoms: Rare - excess excreted in urine.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/#h8'),

-- Macrominerals
('Magnesium', 'mineral', 'mineral (macromineral)', 'mg', 320, 420, 350, 'RDA. Essential for muscle and nerve function, bone health.', 'UL: 350 mg (from supplements only, not food). Toxicity symptoms: Diarrhea, nausea, muscle weakness, low blood pressure.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/#h8'),

-- Electrolytes
('Sodium', 'mineral', 'mineral (electrolyte)', 'mg', 1500, 2300, 2300, 'RDA/UL. Essential for fluid balance and nerve function. Athletes may need more.', 'UL: 2300 mg. Toxicity symptoms: High blood pressure, heart disease, stroke, kidney disease.', ARRAY['high blood pressure'], 'https://www.cdc.gov/salt/index.htm', 'https://www.cdc.gov/salt/index.htm'),
('Potassium', 'mineral', 'mineral (electrolyte)', 'mg', 2600, 3400, NULL, 'RDA. Essential for heart rhythm and muscle function.', 'No UL established from food. High-dose supplements can cause heart rhythm problems, muscle weakness, nausea.', ARRAY['kidney disease', 'taking ACE inhibitors'], 'https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/#h8'),

-- Microminerals
('Chromium', 'mineral', 'mineral (micromineral)', 'mcg', 25, 35, NULL, 'RDA (25-35 mcg). Helps regulate blood sugar levels.', 'No UL established. Toxicity symptoms: Rare - excess excreted in urine.', ARRAY[]::text[], 'https://ods.od.nih.gov/factsheets/Chromium-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Chromium-HealthProfessional/#h8'),
('Zinc (Picolinate)', 'mineral', 'Mineral', 'mg', 15, 30, 40, 'Essential mineral for immune function and hormone (testosterone) support. Picolinate is a highly bioavailable form.', 'UL: 40 mg/day (long-term). High doses can cause copper deficiency, nausea, and GI upset.', ARRAY['taking antibiotics', 'hemochromatosis'], 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/#h8'),
('Selenium', 'mineral', 'Mineral', 'mcg', 55, 200, 400, 'Essential antioxidant mineral, crucial for thyroid function. Dosage is in micrograms (mcg).', 'Very easy to overdose. UL: 400 mcg/day. Chronic high intake can lead to hair loss, brittle nails, and nerve damage.', ARRAY['thyroid conditions'], 'https://ods.od.nih.gov/factsheets/Selenium-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Selenium-HealthProfessional/#h8'),
('Iodine (from Kelp)', 'mineral', 'Mineral', 'mcg', 150, 300, 1100, 'RDA is 150mcg. Essential for thyroid function. Dosage is in micrograms (mcg).', 'UL: 1100 mcg/day. Excess can cause thyroid dysfunction, similar to deficiency.', ARRAY['thyroid conditions'], 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/', 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/#h8');

-- Insert preworkout dosages (11 types)
INSERT INTO public.ingredient_dosage_configs (ingredient_name, ingredient_type, category, dosage_unit, min_daily_dosage, max_daily_dosage, dangerous_dosage, dosage_notes, cautions, precaution_people, dosage_citation, cautions_citation) VALUES
EOF

# Preworkout dosages
cat << 'EOF'
-- Pump Ingredients
('L-Citrulline', 'amino_acid', 'Amino Acid (Pump)', 'mg', 3000, 6000, NULL, 'Standard pre-workout dose for nitric oxide production (pump). 6-10g if using Citrulline Malate 2:1.', 'Very safe. Doses >10,000mg may cause mild GI discomfort.', ARRAY['People on nitrate or ED medication'], 'https://examine.com/supplements/citrulline/#dosage-information', 'https://examine.com/supplements/citrulline/#safety-and-side-effects'),
('Glycerol', 'other', 'Hyper-hydrator (Pump)', 'mg', 1000, 4000, NULL, 'Increases water retention in muscles (''hyper-hydration'') for pumps. Must be taken with significant water.', 'Must be taken with significant water. Can cause bloating or headache if taken with insufficient fluids.', ARRAY['kidney disease', 'diabetes'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3590833/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3590833/'),

-- Power Ingredients
('Betaine Anhydrous', 'amino_acid', 'Amino Acid Derivative (Power)', 'mg', 1500, 4000, NULL, 'Supports power output and cellular hydration. Clinical dose is typically 2500mg.', 'Generally very safe. May cause minor GI upset or fishy body odor.', ARRAY['kidney disease'], 'https://examine.com/supplements/betaine/#dosage-information', 'https://examine.com/supplements/betaine/#safety-and-side-effects'),

-- Focus/Nootropic Ingredients
('Agmatine Sulfate', 'nootropic', 'Nootropic (Pump/Focus)', 'mg', 500, 1500, 2500, 'Modulates nitric oxide (pump) and acts as a neurotransmitter (focus).', 'Generally well-tolerated. Doses >2,500mg may cause GI upset.', ARRAY['low blood pressure', 'taking SSRIs'], 'https://examine.com/supplements/agmatine/#dosage-information', 'https://examine.com/supplements/agmatine/#safety-and-side-effects'),
('L-Tyrosine', 'amino_acid', 'Amino Acid (Focus)', 'mg', 500, 2000, NULL, 'Nootropic. Improves focus and cognition under stress (e.g., intense exercise).', 'Very safe. High doses (>150mg/kg) may cause GI upset, headache.', ARRAY['thyroid conditions', 'taking MAOIs'], 'https://examine.com/supplements/l-tyrosine/#dosage-information', 'https://examine.com/supplements/l-tyrosine/#safety-and-side-effects'),
('Alpha-GPC', 'nootropic', 'Nootropic (Focus/Power)', 'mg', 300, 600, NULL, 'Potent choline source. This is a performance dose for improving focus and power output.', 'Generally safe. High doses (>1200mg) can cause headache, heartburn.', ARRAY['bipolar disorder'], 'https://examine.com/supplements/alpha-gpc/#dosage-information', 'https://examine.com/supplements/alpha-gpc/#safety-and-side-effects'),
('Huperzine A', 'nootropic', 'Nootropic (Focus)', 'mcg', 50, 200, NULL, 'Acetylcholinesterase inhibitor (boosts choline). *Must be cycled*. Dosage is in micrograms (mcg).', 'Do not take daily; must be cycled (e.g., 2 wks on, 1 wk off) to prevent downregulation.', ARRAY['heart conditions', 'seizure disorders'], 'https://examine.com/supplements/huperzine-a/#dosage-information', 'https://examine.com/supplements/huperzine-a/#safety-and-side-effects'),

-- Stimulants
('Caffeine Anhydrous', 'stimulant', 'Stimulant (Energy)', 'mg', 100, 400, 600, 'Performance dose: 3-6 mg/kg body weight. 400mg is the common daily upper limit.', 'Doses >400mg can cause anxiety, jitters, insomnia, arrhythmia. Acute overdose is possible.', ARRAY['Heart conditions', 'high blood pressure', 'anxiety disorders', 'pregnant'], 'https://www.efsa.europa.eu/en/efsajournal/pub/4102', 'https://www.efsa.europa.eu/en/efsajournal/pub/4102'),
('N-Phenethyl Dimethylamine (Eria Jarensis)', 'stimulant', 'Stimulant (Energy/Mood)', 'mg', 100, 250, 350, 'Potent ''grey market'' stimulant. Provides energy and strong euphoria. Start low.', 'High potential for side effects: anxiety, crash, high heart rate. Do not combine with other potent stimulants.', ARRAY['Heart conditions', 'high blood pressure', 'anxiety disorders'], 'https://blog.priceplow.com/eria-jarensis-extract-n-phenethyl-dimethylamine', 'https://blog.priceplow.com/eria-jarensis-extract-n-phenethyl-dimethylamine'),

-- Mood/Herbal
('Kanna (Sceletium tortuosum)', 'herb', 'Nootropic (Mood)', 'mg', 25, 50, 100, 'Used for mood elevation and stress reduction. Dose is for a standardized extract.', 'Acts as an SRI. Do not combine with SSRIs or other serotonergic drugs.', ARRAY['taking SSRIs', 'bipolar disorder'], 'https://examine.com/supplements/sceletium-tortuosum/', 'https://examine.com/supplements/sceletium-tortuosum/'),

-- Bioavailability Enhancer
('Piperine (from Black Pepper Extract)', 'herb', 'Bioavailability Enhancer', 'mg', 5, 20, NULL, 'Enhances absorption of other compounds. Often branded as Bioperine.', 'Generally safe. Can inhibit drug metabolism (CYP3A4), interfering with prescription medications.', ARRAY['taking any prescription medication'], 'https://examine.com/supplements/black-pepper/#dosage-information', 'https://examine.com/supplements/black-pepper/#safety-and-side-effects');

-- Insert non-stim preworkout dosages (8 types)
INSERT INTO public.ingredient_dosage_configs (ingredient_name, ingredient_type, category, dosage_unit, min_daily_dosage, max_daily_dosage, dangerous_dosage, dosage_notes, cautions, precaution_people, dosage_citation, cautions_citation) VALUES
EOF

# Non-stim preworkout dosages
cat << 'EOF'
-- Pump Ingredients (Non-Stim)
('L-Citrulline', 'amino_acid', 'Amino Acid (Pump)', 'mg', 3000, 10000, NULL, 'High-end dose for maximal nitric oxide production. Often the main ingredient in stim-free products.', 'Very safe. Doses >10,000mg may cause mild GI discomfort.', ARRAY['People on nitrate or ED medication'], 'https://examine.com/supplements/citrulline/#dosage-information', 'https://examine.com/supplements/citrulline/#safety-and-side-effects'),
('Glycerol', 'other', 'Hyper-hydrator (Pump)', 'mg', 1000, 4000, NULL, 'Increases water retention in muscles (''hyper-hydration'') for pumps. Must be taken with significant water.', 'Must be taken with significant water. Can cause bloating or headache if taken with insufficient fluids.', ARRAY['kidney disease', 'diabetes'], 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3590833/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3590833/'),
('Sodium Nitrate', 'mineral', 'Pump (Nitrate)', 'mg', 500, 1500, 2000, 'Potent pump ingredient, converts to nitric oxide. Do not stack with other nitrates.', 'Can cause a rapid drop in blood pressure. Start low.', ARRAY['low blood pressure', 'taking ED medication'], 'https://examine.com/supplements/sodium-nitrate/', 'https://examine.com/supplements/sodium-nitrate/'),
('Agmatine Sulfate', 'nootropic', 'Nootropic (Pump/Focus)', 'mg', 500, 1500, 2500, 'Modulates nitric oxide (pump) and acts as a neurotransmitter (focus).', 'Generally well-tolerated. Doses >2,500mg may cause GI upset.', ARRAY['low blood pressure', 'taking SSRIs'], 'https://examine.com/supplements/agmatine/#dosage-information', 'https://examine.com/supplements/agmatine/#safety-and-side-effects'),
('VasoDrive-AP (Casein Hydrolysate)', 'protein', 'Pump (ACE Inhibitor)', 'mg', 254, 508, NULL, 'Casein-derived tripeptides that inhibit ACE, leading to vasodilation (pump).', 'Generally safe. Can lower blood pressure.', ARRAY['milk allergy', 'low blood pressure'], 'https://blog.priceplow.com/vasodrive-ap', 'https://blog.priceplow.com/vasodrive-ap'),

-- Power/Endurance Ingredients
('Betaine Anhydrous', 'amino_acid', 'Amino Acid Derivative (Power)', 'mg', 1500, 4000, NULL, 'Supports power output and cellular hydration. Clinical dose is typically 2500mg-4000mg.', 'Generally very safe. May cause minor GI upset or fishy body odor.', ARRAY['kidney disease'], 'https://examine.com/supplements/betaine/#dosage-information', 'https://examine.com/supplements/betaine/#safety-and-side-effects'),
('Malic Acid', 'other', 'Endurance', 'mg', 1000, 3000, NULL, 'Component of the Krebs cycle. Aids endurance. Often included as part of Citrulline Malate.', 'Generally safe. High doses may cause mild GI upset.', ARRAY[]::text[], 'https://examine.com/supplements/malic-acid/', 'https://examine.com/supplements/malic-acid/'),

-- Hydration
('Taurine', 'amino_acid', 'Amino Acid (Hydration/Pump)', 'mg', 500, 3000, NULL, 'Aids in hydration, electrolyte balance, and can improve blood flow (pump).', 'Very safe, even at high doses.', ARRAY['bipolar disorder'], 'https://examine.com/supplements/taurine/#dosage-information', 'https://examine.com/supplements/taurine/#safety-and-side-effects');

-- Insert energy drink dosages (7 types)
INSERT INTO public.ingredient_dosage_configs (ingredient_name, ingredient_type, category, dosage_unit, min_daily_dosage, max_daily_dosage, dangerous_dosage, dosage_notes, cautions, precaution_people, dosage_citation, cautions_citation) VALUES
EOF

# Energy drink dosages
cat << 'EOF'
-- Stimulants
('Caffeine Anhydrous', 'stimulant', 'Stimulant (Energy)', 'mg', 100, 300, 500, 'Standard dose for an energy drink, intended for general alertness and focus.', 'Doses >400mg (from all sources) can cause anxiety, jitters, insomnia.', ARRAY['Heart conditions', 'high blood pressure', 'anxiety disorders', 'pregnant'], 'https://www.efsa.europa.eu/en/efsajournal/pub/4102', 'https://www.efsa.europa.eu/en/efsajournal/pub/4102'),

-- Focus/Nootropic Ingredients
('N-Acetyl L-Tyrosine', 'amino_acid', 'Amino Acid (Focus)', 'mg', 350, 700, NULL, 'More water-soluble form of Tyrosine, but less bioavailable. Used for mental focus.', 'Same as L-Tyrosine.', ARRAY['thyroid conditions', 'taking MAOIs'], 'https://examine.com/supplements/n-acetyl-l-tyrosine/#dosage-information', 'https://examine.com/supplements/n-acetyl-l-tyrosine/#safety-and-side-effects'),
('Alpha-GPC', 'nootropic', 'Nootropic (Focus)', 'mg', 150, 300, NULL, 'A moderate dose for cognitive enhancement and focus, as seen in energy drinks/nootropics.', 'Generally safe. High doses (>1200mg) can cause headache, heartburn.', ARRAY['bipolar disorder'], 'https://examine.com/supplements/alpha-gpc/#dosage-information', 'https://examine.com/supplements/alpha-gpc/#safety-and-side-effects'),
('L-Theanine', 'amino_acid', 'Amino Acid (Focus)', 'mg', 100, 200, NULL, 'Promotes ''calm focus.'' Paired with caffeine to smooth out jitters. Often 1:1 or 2:1 ratio (Theanine:Caffeine).', 'Extremely safe, no established upper limit.', ARRAY['low blood pressure'], 'https://examine.com/supplements/l-theanine/#dosage-information', 'https://examine.com/supplements/l-theanine/#safety-and-side-effects'),
('Huperzine A', 'nootropic', 'Nootropic (Focus)', 'mcg', 50, 200, NULL, 'Acetylcholinesterase inhibitor (boosts choline). *Must be cycled*. Dosage is in micrograms (mcg).', 'Do not take daily; must be cycled (e.g., 2 wks on, 1 wk off) to prevent downregulation.', ARRAY['heart conditions', 'seizure disorders'], 'https://examine.com/supplements/huperzine-a/#dosage-information', 'https://examine.com/supplements/huperzine-a/#safety-and-side-effects'),
('Uridine Monophosphate', 'nootropic', 'Nootropic (Focus)', 'mg', 150, 300, NULL, 'A nucleotide that supports synaptic function and brain health. Often paired with choline.', 'Generally well-tolerated.', ARRAY[]::text[], 'https://examine.com/supplements/uridine/', 'https://examine.com/supplements/uridine/'),

-- Mood/Herbal
('Saffron Extract', 'herb', 'Nootropic (Mood)', 'mg', 20, 30, 200, 'Standardized extract used for mood enhancement and focus.', 'Very high doses (>5g) are toxic. Stick to standard extract doses.', ARRAY['pregnant'], 'https://examine.com/supplements/saffron/', 'https://examine.com/supplements/saffron/');

-- Insert amino acid dosages (7 types)
INSERT INTO public.ingredient_dosage_configs (ingredient_name, ingredient_type, category, dosage_unit, min_daily_dosage, max_daily_dosage, dangerous_dosage, dosage_notes, cautions, precaution_people, dosage_citation, cautions_citation) VALUES
EOF

# Amino acid dosages
cat << 'EOF'
-- Essential Amino Acids
('Total EAAs', 'amino_acid', 'Amino Acid (Recovery)', 'mg', 6000, 10000, NULL, 'Total dose for a full spectrum of Essential Amino Acids to trigger muscle protein synthesis.', 'Generally safe.', ARRAY[]::text[], 'https://examine.com/supplements/essential-amino-acids/', 'https://examine.com/supplements/essential-amino-acids/'),
('L-Leucine', 'amino_acid', 'Amino Acid (BCAA/Recovery)', 'mg', 2500, 5000, NULL, 'The primary BCAA responsible for signaling muscle protein synthesis (mTOR). Often the highest-dosed EAA.', 'Very safe.', ARRAY['Maple syrup urine disease'], 'https://examine.com/supplements/leucine/#dosage-information', 'https://examine.com/supplements/leucine/#safety-and-side-effects'),
('L-Isoleucine', 'amino_acid', 'Amino Acid (BCAA/Recovery)', 'mg', 1250, 2500, NULL, 'BCAA involved in glucose uptake and muscle recovery. Typically dosed at 2:1:1 ratio with Leucine and Valine.', 'Very safe.', ARRAY['Maple syrup urine disease'], 'https://examine.com/supplements/isoleucine/#dosage-information', 'https://examine.com/supplements/isoleucine/#safety-and-side-effects'),
('L-Valine', 'amino_acid', 'Amino Acid (BCAA/Recovery)', 'mg', 1250, 2500, NULL, 'BCAA involved in energy and muscle coordination. Typically dosed at 2:1:1 ratio with Leucine and Isoleucine.', 'Very safe.', ARRAY['Maple syrup urine disease'], 'https://examine.com/supplements/valine/#dosage-information', 'https://examine.com/supplements/valine/#safety-and-side-effects'),

-- Hydration/Recovery Support
('Betaine Anhydrous', 'amino_acid', 'Amino Acid Derivative (Hydration)', 'mg', 1500, 2500, NULL, 'Included in EAA/hydration products to support cellular hydration and recovery.', 'Generally very safe. May cause minor GI upset or fishy body odor.', ARRAY['kidney disease'], 'https://examine.com/supplements/betaine/#dosage-information', 'https://examine.com/supplements/betaine/#safety-and-side-effects'),
('Coconut Water Powder', 'other', 'Hydration (Electrolyte)', 'mg', 500, 1000, NULL, 'Natural source of electrolytes, particularly potassium, for hydration.', 'Generally safe.', ARRAY['severe hyperkalemia'], 'https://examine.com/supplements/coconut-water/', 'https://examine.com/supplements/coconut-water/'),

-- Bioavailability Enhancer
('AstraGin', 'herb', 'Bioavailability Enhancer', 'mg', 25, 50, NULL, 'Branded blend of Astragalus and Panax Notoginseng. Enhances absorption of amino acids.', 'Generally safe.', ARRAY['taking any prescription medication'], 'https://nulivscience.com/ingredients/astragin', 'https://nulivscience.com/ingredients/astragin');

-- Insert fat burner dosages (10 types)
INSERT INTO public.ingredient_dosage_configs (ingredient_name, ingredient_type, category, dosage_unit, min_daily_dosage, max_daily_dosage, dangerous_dosage, dosage_notes, cautions, precaution_people, dosage_citation, cautions_citation) VALUES
EOF

# Fat burner dosages
cat << 'EOF'
-- Fat Metabolism Support
('L-Carnitine L-Tartrate', 'amino_acid', 'Amino Acid (Fat Burner)', 'mg', 1000, 3000, NULL, 'Aids fat metabolism and improves androgen receptor sensitivity.', 'Generally safe. High doses may cause GI upset or fishy body odor.', ARRAY['thyroid conditions', 'seizure disorders'], 'https://examine.com/supplements/l-carnitine/#dosage-information', 'https://examine.com/supplements/l-carnitine/#safety-and-side-effects'),

-- Thermogenic Ingredients
('Green Tea Extract', 'herb', 'Fat Burner (Thermogenic)', 'mg', 400, 800, NULL, 'Standardized for EGCG. Potent antioxidant and mild thermogenic.', '*Must be taken with food.* Can be hepatotoxic (liver toxic) if taken fasted at high doses.', ARRAY['liver conditions', 'anemia'], 'https://examine.com/supplements/green-tea-catechins/#dosage-information', 'https://examine.com/supplements/green-tea-catechins/#safety-and-side-effects'),
('Capsaicin (from Capsimax)', 'herb', 'Fat Burner (Thermogenic)', 'mg', 50, 100, NULL, 'Active component of chili peppers. Increases thermogenesis. Dose is for a standardized, coated extract.', 'Can cause severe GI distress if not coated.', ARRAY['GERD', 'IBS'], 'https://examine.com/supplements/capsaicin/', 'https://examine.com/supplements/capsaicin/'),
('Grains of Paradise', 'herb', 'Fat Burner (Thermogenic)', 'mg', 30, 50, NULL, 'Activates brown adipose tissue (BAT) for increased calorie expenditure.', 'Generally safe.', ARRAY[]::text[], 'https://examine.com/supplements/aframomum-melegueta/', 'https://examine.com/supplements/aframomum-melegueta/'),

-- Stress/Cortisol Management
('Ashwagandha (Root Extract)', 'adaptogen', 'Adaptogen (Cortisol)', 'mg', 300, 600, NULL, 'Included in fat burners to help manage stress and lower cortisol, which can aid fat loss.', 'Generally safe. May cause mild drowsiness or GI upset.', ARRAY['pregnant', 'autoimmune disease', 'thyroid conditions'], 'https://examine.com/supplements/ashwagandha/#dosage-information', 'https://examine.com/supplements/ashwagandha/#safety-and-side-effects'),

-- Appetite Control
('5-HTP', 'nootropic', 'Nootropic (Appetite)', 'mg', 50, 100, 200, 'Precursor to serotonin. Used to help control appetite and improve mood during a diet.', 'Do not combine with SSRIs or other serotonergic drugs. Can cause serotonin syndrome.', ARRAY['taking SSRIs', 'bipolar disorder'], 'https://examine.com/supplements/5-htp/', 'https://examine.com/supplements/5-htp/'),

-- Stimulants
('Caffeine Anhydrous', 'stimulant', 'Stimulant (Thermogenic)', 'mg', 100, 300, 500, 'Increases metabolic rate, energy expenditure, and fat oxidation.', 'Doses >400mg (from all sources) can cause anxiety, jitters, insomnia.', ARRAY['Heart conditions', 'high blood pressure', 'anxiety disorders', 'pregnant'], 'https://www.efsa.europa.eu/en/efsajournal/pub/4102', 'https://www.efsa.europa.eu/en/efsajournal/pub/4102'),
('Halostachine', 'stimulant', 'Stimulant (Thermogenic)', 'mg', 30, 50, 75, 'A mild beta-agonist stimulant that can increase energy expenditure.', 'Stimulant side effects. Do not combine with other strong stimulants.', ARRAY['Heart conditions', 'high blood pressure'], 'https://examine.com/supplements/halostachine/', 'https://examine.com/supplements/halostachine/'),
('Rauwolscine (Alpha-Yohimbine)', 'stimulant', 'Stimulant (Fat Burner)', 'mg', 1, 3, 5, 'Potent stimulant, increases fat mobilization by blocking alpha-2 receptors. Very strong, start low.', 'High side-effect profile: extreme anxiety, jitters, high heart rate, cold sweats. Do not combine with other stimulants.', ARRAY['anxiety disorders', 'high blood pressure', 'heart conditions'], 'https://examine.com/supplements/yohimbine/#dosage-information', 'https://examine.com/supplements/yohimbine/#safety-and-side-effects'),

-- Bioavailability Enhancer
('Piperine (from Black Pepper Extract)', 'herb', 'Bioavailability Enhancer', 'mg', 5, 20, NULL, 'Enhances absorption of other compounds, especially thermogenics like capsaicin.', 'Generally safe. Can inhibit drug metabolism (CYP3A4), interfering with prescription medications.', ARRAY['taking any prescription medication'], 'https://examine.com/supplements/black-pepper/#dosage-information', 'https://examine.com/supplements/black-pepper/#safety-and-side-effects');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingredient_dosage_configs_name ON public.ingredient_dosage_configs (ingredient_name);
CREATE INDEX IF NOT EXISTS idx_ingredient_dosage_configs_type ON public.ingredient_dosage_configs (ingredient_type);
CREATE INDEX IF NOT EXISTS idx_ingredient_dosage_configs_category ON public.ingredient_dosage_configs (category);

-- Add comments for documentation
COMMENT ON TABLE public.ingredient_dosage_configs IS 'Comprehensive dosage and safety data for all supplement ingredients';
COMMENT ON COLUMN public.ingredient_dosage_configs.min_daily_dosage IS 'Minimum effective daily dosage';
COMMENT ON COLUMN public.ingredient_dosage_configs.max_daily_dosage IS 'Maximum safe daily dosage';
COMMENT ON COLUMN public.ingredient_dosage_configs.dangerous_dosage IS 'Dosage considered dangerous/unsafe';
COMMENT ON COLUMN public.ingredient_dosage_configs.precaution_people IS 'Array of medical conditions requiring doctor consultation';

EOF
