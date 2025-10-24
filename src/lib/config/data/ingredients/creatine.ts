import { SupplementInfo } from './types';

// Creatine supplements with scientifically-backed dosage recommendations
export const creatineSupplements: SupplementInfo[] = [
  {
    name: 'creatine_monohydrate_mg',
    label: 'Creatine Monohydrate',
    placeholder: '5000',
    unit: 'mg',
    description: 'Most researched form of creatine for muscle strength and power',
    section: 'Creatine',
    minDailyDosage: 3000, // 3g minimum effective dose
    maxDailyDosage: 5000, // 5g maximum safe dose
    dangerousDosage: 10000, // 10g+ may cause GI distress
    dosageNotes: 'Most researched form. Loading phase: 20g/day for 5-7 days, then 3-5g maintenance.',
    cautions: 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 100
  },
  {
    name: 'creatine_hcl_mg',
    label: 'Creatine Hydrochloride',
    placeholder: '2000',
    unit: 'mg',
    description: 'More soluble creatine form requiring lower doses',
    section: 'Creatine',
    minDailyDosage: 1000, // 1g minimum effective dose
    maxDailyDosage: 2000, // 2g maximum safe dose
    dangerousDosage: 4000, // 4g+ may cause GI distress
    dosageNotes: 'More soluble, requires lower doses. No loading phase needed.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 120
  },
  {
    name: 'creatine_citrate_mg',
    label: 'Creatine Citrate',
    placeholder: '4000',
    unit: 'mg',
    description: 'Better solubility than monohydrate with moderate dosing',
    section: 'Creatine',
    minDailyDosage: 2000, // 2g minimum effective dose
    maxDailyDosage: 4000, // 4g maximum safe dose
    dangerousDosage: 8000, // 8g+ may cause GI distress
    dosageNotes: 'Better solubility than monohydrate. Moderate dosing required.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 110
  },
  {
    name: 'creatine_malate_mg',
    label: 'Creatine Malate',
    placeholder: '4000',
    unit: 'mg',
    description: 'Creatine combined with malic acid for enhanced energy production',
    section: 'Creatine',
    minDailyDosage: 2000, // 2g minimum effective dose
    maxDailyDosage: 4000, // 4g maximum safe dose
    dangerousDosage: 8000, // 8g+ may cause GI distress
    dosageNotes: 'Combined with malic acid. May enhance energy production.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 110
  },
  {
    name: 'creatine_pyruvate_mg',
    label: 'Creatine Pyruvate',
    placeholder: '3000',
    unit: 'mg',
    description: 'Enhanced absorption creatine with lower dose requirements',
    section: 'Creatine',
    minDailyDosage: 1500, // 1.5g minimum effective dose
    maxDailyDosage: 3000, // 3g maximum safe dose
    dangerousDosage: 6000, // 6g+ may cause GI distress
    dosageNotes: 'Enhanced absorption. Lower doses needed.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 130
  },
  {
    name: 'creatine_nitrate_mg',
    label: 'Creatine Nitrate',
    placeholder: '3000',
    unit: 'mg',
    description: 'Nitrate form providing additional cardiovascular benefits',
    section: 'Creatine',
    minDailyDosage: 1500, // 1.5g minimum effective dose
    maxDailyDosage: 3000, // 3g maximum safe dose
    dangerousDosage: 6000, // 6g+ may cause GI distress
    dosageNotes: 'Nitrate form may provide additional cardiovascular benefits.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function',
      'low blood pressure'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 125
  },
  {
    name: 'creatine_ethyl_ester_mg',
    label: 'Creatine Ethyl Ester',
    placeholder: '4000',
    unit: 'mg',
    description: 'Esterified creatine with potentially better absorption',
    section: 'Creatine',
    minDailyDosage: 2000, // 2g minimum effective dose
    maxDailyDosage: 4000, // 4g maximum safe dose
    dangerousDosage: 8000, // 8g+ may cause GI distress
    dosageNotes: 'Esterified form. May have better absorption.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 115
  },
  {
    name: 'micronized_creatine_mg',
    label: 'Micronized Creatine Monohydrate',
    placeholder: '5000',
    unit: 'mg',
    description: 'Smaller particle size for better mixing and absorption',
    section: 'Creatine',
    minDailyDosage: 3000, // 3g minimum effective dose
    maxDailyDosage: 5000, // 5g maximum safe dose
    dangerousDosage: 10000, // 10g+ may cause GI distress
    dosageNotes: 'Smaller particle size for better mixing. Same dosing as regular monohydrate.',
    cautions: 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 105
  },
  {
    name: 'buffered_creatine_mg',
    label: 'Buffered Creatine',
    placeholder: '4000',
    unit: 'mg',
    description: 'Buffered creatine to reduce stomach acidity',
    section: 'Creatine',
    minDailyDosage: 2000, // 2g minimum effective dose
    maxDailyDosage: 4000, // 4g maximum safe dose
    dangerousDosage: 8000, // 8g+ may cause GI distress
    dosageNotes: 'Buffered to reduce stomach acidity. Lower doses needed.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 115
  },
  {
    name: 'creapure_mg',
    label: 'Creapure',
    placeholder: '5000',
    unit: 'mg',
    description: 'High-purity German creatine monohydrate',
    section: 'Creatine',
    minDailyDosage: 3000, // 3g minimum effective dose
    maxDailyDosage: 5000, // 5g maximum safe dose
    dangerousDosage: 10000, // 10g+ may cause GI distress
    dosageNotes: 'High-purity German creatine monohydrate. Same dosing as monohydrate.',
    cautions: 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 100
  }
];
