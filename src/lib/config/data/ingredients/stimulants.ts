import { SupplementInfo } from './types';

// Stimulants and energy ingredients with scientifically-backed dosage recommendations
export const stimulantSupplements: SupplementInfo[] = [
  {
    name: 'caffeine_anhydrous_mg',
    label: 'Caffeine Anhydrous',
    placeholder: '200',
    unit: 'mg',
    description: 'Caffeine for energy and focus enhancement',
    section: 'Energy & Stimulants',
    minDailyDosage: 100, // 100mg minimum effective dose
    maxDailyDosage: 400, // 400mg FDA recommended daily limit
    dangerousDosage: 600, // 600mg+ may cause anxiety, jitters, insomnia
    dosageNotes: 'FDA recommends max 400mg/day for healthy adults. Effects peak 30-60 minutes after consumption. Avoid within 6 hours of bedtime.',
    cautions: 'May cause anxiety, jitters, insomnia, increased heart rate, or digestive issues. Tolerance builds quickly with regular use.',
    precaution_people: [
      'pregnant or breastfeeding',
      'heart conditions',
      'anxiety disorders',
      'sleep disorders',
      'high blood pressure'
    ],
    dosage_citation: 'https://www.fda.gov/food/nutrition-education-resources-materials/spilling-beans-how-much-caffeine-too-much',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3777290/',
    required: false,
    step: '25',
    type: 'number'
  },
  {
    name: 'caffeine_mg',
    label: 'Caffeine',
    placeholder: '160',
    unit: 'mg',
    description: 'Caffeine content for energy',
    section: 'Energy & Stimulants',
    minDailyDosage: 100, // 100mg minimum effective dose
    maxDailyDosage: 400, // 400mg FDA recommended daily limit
    dangerousDosage: 600, // 600mg+ may cause adverse effects
    dosageNotes: 'FDA recommends max 400mg/day for healthy adults. Effects peak 30-60 minutes after consumption. Avoid within 6 hours of bedtime.',
    cautions: 'May cause anxiety, jitters, insomnia, increased heart rate, or digestive issues. Avoid if pregnant, breastfeeding, or have heart conditions, anxiety disorders, or sleep disorders.',
    dosage_citation: 'https://www.fda.gov/food/nutrition-education-resources-materials/spilling-beans-how-much-caffeine-too-much',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3777290/',
    required: false,
    step: '25',
    type: 'number'
  },
  {
    name: 'n_phenethyl_dimethylamine_citrate_mg',
    label: 'N-Phenethyl Dimethylamine Citrate (DMHA)',
    placeholder: '0',
    unit: 'mg',
    description: 'DMHA - BANNED BY FDA',
    section: 'Energy & Stimulants',
    minDailyDosage: 0, // BANNED - NO SAFE DOSE
    maxDailyDosage: 0, // BANNED - NO SAFE DOSE
    dangerousDosage: 0, // ANY DOSE IS DANGEROUS
    dosageNotes: '⚠️ BANNED BY FDA AS OF 2019. This ingredient is illegal and dangerous. Do not use.',
    cautions: '🚨 FDA BANNED: Illegal ingredient linked to serious cardiovascular events, heart attacks, and strokes. Any amount is dangerous.',
    precaution_people: [
      'ALL PEOPLE - This ingredient is banned',
      'Anyone with cardiovascular conditions',
      'Anyone taking medications'
    ],
    dosage_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-dmha',
    cautions_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-dmha',
    required: false,
    step: '50',
    type: 'number'
  },
  {
    name: 'n_acetyl_l_tyrosine_mg',
    label: 'N-Acetyl L-Tyrosine (NALT)',
    placeholder: '500',
    unit: 'mg',
    description: 'N-Acetyl L-Tyrosine for focus and cognitive enhancement',
    section: 'Energy & Stimulants',
    minDailyDosage: 300, // 300mg minimum effective dose
    maxDailyDosage: 1000, // 1000mg maximum safe dose
    dangerousDosage: 2000, // 2000mg+ may cause headaches, nausea
    dosageNotes: 'More bioavailable than L-Tyrosine. Take on empty stomach for better absorption. Effects may be enhanced under stress. No specific ratio formulations - this is a single compound.',
    cautions: [
      'May cause headaches at high doses',
      'Nausea or fatigue',
      'Heartburn'
    ],
    precaution_people: [
      'hyperthyroidism',
      'taking MAOIs',
      'taking L-DOPA',
      'taking thyroid medications'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2929774/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2929774/',
    required: false,
    step: '100',
    type: 'number'
  },
  {
    name: 'green_tea_extract_mg',
    label: 'Green Tea Extract',
    placeholder: '500',
    unit: 'mg',
    description: 'Green tea extract for metabolism and mild stimulation',
    section: 'Stimulants',
    minDailyDosage: 300, // 300mg minimum effective dose
    maxDailyDosage: 1000, // 1000mg maximum safe dose
    dangerousDosage: 2000, // 2000mg+ may cause liver issues
    dosageNotes: 'Contains EGCG (epigallocatechin gallate) and caffeine. Take with food to reduce GI upset. Effects may take 2-4 weeks to notice.',
    cautions: 'May cause liver toxicity at high doses. Avoid if you have liver disease or are taking blood thinners. May interact with certain medications.',
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2855614/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2855614/',
    required: false,
    step: '100',
    type: 'number'
  },
  {
    name: 'ephedra_mg',
    label: 'Ephedra (Ma Huang)',
    placeholder: '0',
    unit: 'mg',
    description: 'Ephedra - BANNED BY FDA',
    section: 'Stimulants',
    minDailyDosage: 0, // BANNED - NO SAFE DOSE
    maxDailyDosage: 0, // BANNED - NO SAFE DOSE
    dangerousDosage: 0, // ANY DOSE IS DANGEROUS
    dosageNotes: '⚠️ BANNED BY FDA AS OF 2004. This ingredient is illegal and dangerous. Do not use.',
    cautions: '🚨 FDA BANNED: This ingredient is illegal and has been linked to serious cardiovascular events, including heart attacks, strokes, and deaths.',
    dosage_citation: 'https://www.fda.gov/news-events/press-announcements/fda-announces-final-rule-prohibiting-sale-dietary-supplements-containing-ephedrine-alkaloids',
    cautions_citation: 'https://www.fda.gov/news-events/press-announcements/fda-announces-final-rule-prohibiting-sale-dietary-supplements-containing-ephedrine-alkaloids',
    required: false,
    step: '50',
    type: 'number'
  },
  {
    name: '1_3_dimethylamylamine_mg',
    label: '1,3-Dimethylamylamine (DMAA)',
    placeholder: '0',
    unit: 'mg',
    description: 'DMAA - BANNED BY FDA',
    section: 'Stimulants',
    minDailyDosage: 0, // BANNED - NO SAFE DOSE
    maxDailyDosage: 0, // BANNED - NO SAFE DOSE
    dangerousDosage: 0, // ANY DOSE IS DANGEROUS
    dosageNotes: '⚠️ BANNED BY FDA AS OF 2012. This ingredient is illegal and dangerous. Do not use.',
    cautions: '🚨 FDA BANNED: This ingredient is illegal and has been linked to serious cardiovascular events, including heart attacks, strokes, and deaths.',
    dosage_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-dmaa',
    cautions_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-dmaa',
    required: false,
    step: '50',
    type: 'number'
  },
  {
    name: '1_5_dimethylhexylamine_mg',
    label: '1,5-Dimethylhexylamine (DMBA/Octodrine)',
    placeholder: '0',
    unit: 'mg',
    description: 'DMBA/Octodrine - BANNED BY FDA',
    section: 'Stimulants',
    minDailyDosage: 0, // BANNED - NO SAFE DOSE
    maxDailyDosage: 0, // BANNED - NO SAFE DOSE
    dangerousDosage: 0, // ANY DOSE IS DANGEROUS
    dosageNotes: '⚠️ BANNED BY FDA. This ingredient is illegal and dangerous. Do not use.',
    cautions: '🚨 FDA BANNED: This ingredient is illegal and has been linked to serious cardiovascular events, including elevated blood pressure and heart issues.',
    dosage_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-dmba',
    cautions_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-dmba',
    required: false,
    step: '50',
    type: 'number'
  },
  {
    name: 'beta_methylphenethylamine_mg',
    label: 'Beta-Methylphenethylamine (BMPEA)',
    placeholder: '0',
    unit: 'mg',
    description: 'BMPEA - BANNED BY FDA',
    section: 'Stimulants',
    minDailyDosage: 0, // BANNED - NO SAFE DOSE
    maxDailyDosage: 0, // BANNED - NO SAFE DOSE
    dangerousDosage: 0, // ANY DOSE IS DANGEROUS
    dosageNotes: '⚠️ BANNED BY FDA. This ingredient is illegal and dangerous. Do not use.',
    cautions: '🚨 FDA BANNED: This ingredient is illegal and has been linked to serious cardiovascular events and adverse health effects.',
    dosage_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-bmpea',
    cautions_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-bmpea',
    required: false,
    step: '50',
    type: 'number'
  },
  {
    name: 'picamilon_mg',
    label: 'Picamilon',
    placeholder: '0',
    unit: 'mg',
    description: 'Picamilon - BANNED BY FDA',
    section: 'Stimulants',
    minDailyDosage: 0, // BANNED - NO SAFE DOSE
    maxDailyDosage: 0, // BANNED - NO SAFE DOSE
    dangerousDosage: 0, // ANY DOSE IS DANGEROUS
    dosageNotes: '⚠️ BANNED BY FDA. This ingredient is illegal and dangerous. Do not use.',
    cautions: '🚨 FDA BANNED: This ingredient is illegal and has been linked to serious adverse health effects.',
    dosage_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-picamilon',
    cautions_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-picamilon',
    required: false,
    step: '50',
    type: 'number'
  },
  {
    name: 'oxilofrine_mg',
    label: 'Oxilofrine (Methylsynephrine)',
    placeholder: '0',
    unit: 'mg',
    description: 'Oxilofrine - BANNED BY FDA',
    section: 'Stimulants',
    minDailyDosage: 0, // BANNED - NO SAFE DOSE
    maxDailyDosage: 0, // BANNED - NO SAFE DOSE
    dangerousDosage: 0, // ANY DOSE IS DANGEROUS
    dosageNotes: '⚠️ BANNED BY FDA. This ingredient is illegal and dangerous. Do not use.',
    cautions: '🚨 FDA BANNED: This ingredient is illegal and has been linked to serious cardiovascular events and adverse health effects.',
    dosage_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-oxilofrine',
    cautions_citation: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-stop-using-dietary-supplements-containing-oxilofrine',
    required: false,
    step: '50',
    type: 'number'
  }
];
