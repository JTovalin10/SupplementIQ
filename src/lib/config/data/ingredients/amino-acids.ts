import { SupplementInfo } from './types';

// Amino acids and performance ingredients with scientifically-backed dosage recommendations
export const aminoAcidSupplements: SupplementInfo[] = [
  {
    name: 'l_citrulline_mg',
    label: 'L-Citrulline',
    placeholder: '5000',
    unit: 'mg',
    description: 'L-Citrulline for nitric oxide production and vasodilation',
    section: 'Performance Ingredients',
    minDailyDosage: 3000, // 3g minimum effective dose
    maxDailyDosage: 8000, // 8g maximum safe dose
    dangerousDosage: 15000, // 15g+ may cause GI distress
    dosageNotes: 'More effective than L-arginine for NO production. Take 30-60 minutes before exercise. Effects peak 1-2 hours after consumption.',
    cautions: 'May cause mild GI upset at high doses. Avoid if you have low blood pressure or are taking blood pressure medications.',
    precaution_people: [
      'low blood pressure',
      'taking blood pressure medications',
      'kidney disease',
      'taking medications that affect blood pressure'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5094736/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5094736/',
    required: false,
    step: '500',
    type: 'number'
  },
  {
    name: 'l_tyrosine_mg',
    label: 'L-Tyrosine',
    placeholder: '2500',
    unit: 'mg',
    description: 'L-Tyrosine for cognitive enhancement and stress support',
    section: 'Cognitive Enhancement',
    minDailyDosage: 1000, // 1g minimum effective dose
    maxDailyDosage: 5000, // 5g maximum safe dose
    dangerousDosage: 10000, // 10g+ may cause headaches
    dosageNotes: 'Take on empty stomach for better absorption. Effects may be enhanced under stress or sleep deprivation.',
    cautions: 'May cause headaches, nausea, or fatigue at high doses. Avoid if you have hyperthyroidism or are taking MAOIs.',
    precaution_people: [
      'hyperthyroidism',
      'taking MAOIs',
      'taking L-DOPA',
      'taking thyroid medications'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2929774/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2929774/',
    required: false,
    step: '250',
    type: 'number'
  },
  {
    name: 'l_leucine_mg',
    label: 'L-Leucine',
    placeholder: '5000',
    unit: 'mg',
    description: 'L-Leucine content for muscle protein synthesis',
    section: 'BCAA Ingredients',
    minDailyDosage: 2000, // 2g minimum effective dose
    maxDailyDosage: 10000, // 10g maximum safe dose
    dangerousDosage: 20000, // 20g+ may cause GI distress
    dosageNotes: 'Most important BCAA for muscle protein synthesis. Take with other EAAs for optimal effect. Ideal ratio is 2:1:1 (leucine:isoleucine:valine).',
    cautions: 'May cause GI upset at very high doses. Avoid if you have maple syrup urine disease.',
    precaution_people: [
      'maple syrup urine disease',
      'kidney disease',
      'liver disease'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
    required: false,
    step: '500',
    type: 'number'
  },
  {
    name: 'l_isoleucine_mg',
    label: 'L-Isoleucine',
    placeholder: '2000',
    unit: 'mg',
    description: 'L-Isoleucine content',
    section: 'BCAA Ingredients',
    minDailyDosage: 1000, // 1g minimum effective dose
    maxDailyDosage: 5000, // 5g maximum safe dose
    dangerousDosage: 10000, // 10g+ may cause GI distress
    dosageNotes: 'Essential BCAA. Works synergistically with leucine and valine. Important for glucose uptake and energy production.',
    cautions: 'May cause GI upset at very high doses. Avoid if you have maple syrup urine disease.',
    precaution_people: [
      'maple syrup urine disease',
      'kidney disease',
      'liver disease'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
    required: false,
    step: '250',
    type: 'number'
  },
  {
    name: 'l_valine_mg',
    label: 'L-Valine',
    placeholder: '2000',
    unit: 'mg',
    description: 'L-Valine content',
    section: 'BCAA Ingredients',
    minDailyDosage: 1000, // 1g minimum effective dose
    maxDailyDosage: 5000, // 5g maximum safe dose
    dangerousDosage: 10000, // 10g+ may cause GI distress
    dosageNotes: 'Essential BCAA. Important for muscle metabolism and recovery. Works best in combination with leucine and isoleucine.',
    cautions: 'May cause GI upset at very high doses. Avoid if you have maple syrup urine disease.',
    precaution_people: [
      'maple syrup urine disease',
      'kidney disease',
      'liver disease'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
    required: false,
    step: '250',
    type: 'number'
  },
  {
    name: 'betaine_anhydrous_mg',
    label: 'Betaine Anhydrous',
    placeholder: '2000',
    unit: 'mg',
    description: 'Betaine for power and strength enhancement',
    section: 'Performance Ingredients',
    minDailyDosage: 1500, // 1.5g minimum effective dose
    maxDailyDosage: 3000, // 3g maximum safe dose
    dangerousDosage: 5000, // 5g+ may cause GI distress
    dosageNotes: 'Take with food to reduce GI issues. Works synergistically with creatine. Effects may take 1-2 weeks to notice.',
    cautions: 'May cause GI upset, nausea, or diarrhea at high doses. Avoid if you have kidney disease or are taking medications that affect kidney function.',
    precaution_people: [
      'kidney disease',
      'taking medications that affect kidney function',
      'liver disease'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4595384/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4595384/',
    required: false,
    step: '250',
    type: 'number'
  },
  {
    name: 'agmatine_sulfate_mg',
    label: 'Agmatine Sulfate',
    placeholder: '1000',
    unit: 'mg',
    description: 'Agmatine for nitric oxide and pumps',
    section: 'Additional Ingredients',
    minDailyDosage: 500, // 500mg minimum effective dose
    maxDailyDosage: 2000, // 2g maximum safe dose
    dangerousDosage: 4000, // 4g+ may cause GI distress
    dosageNotes: 'May enhance pumps and nitric oxide. Take on empty stomach. Effects may be enhanced when taken with citrulline.',
    cautions: 'May cause GI upset, nausea, or diarrhea. Avoid if you have kidney disease or are taking medications that affect blood pressure.',
    precaution_people: [
      'kidney disease',
      'taking medications that affect blood pressure',
      'low blood pressure',
      'taking blood pressure medications'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4595384/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4595384/',
    required: false,
    step: '250',
    type: 'number'
  },
  {
    name: 'taurine_mg',
    label: 'Taurine',
    placeholder: '1000',
    unit: 'mg',
    description: 'Taurine for energy and hydration',
    section: 'Additional Ingredients',
    minDailyDosage: 500, // 500mg minimum effective dose
    maxDailyDosage: 3000, // 3g maximum safe dose
    dangerousDosage: 6000, // 6g+ may cause GI distress
    dosageNotes: 'Conditionally essential amino acid. May help with hydration, energy, and exercise performance. Often combined with caffeine.',
    cautions: 'Generally safe, but may cause GI upset at very high doses. Avoid if you have bipolar disorder or are taking lithium.',
    precaution_people: [
      'bipolar disorder',
      'taking lithium',
      'kidney disease',
      'liver disease'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3501276/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3501276/',
    required: false,
    step: '250',
    type: 'number'
  }
];
