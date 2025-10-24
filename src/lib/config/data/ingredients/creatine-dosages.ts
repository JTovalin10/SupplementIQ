// Creatine type-specific dosage recommendations based on scientific research
export interface CreatineTypeDosage {
  type: string;
  minDailyDosage: number; // mg
  maxDailyDosage: number; // mg
  dangerousDosage: number; // mg
  dosageNotes: string;
  cautions: string; // Safety warnings and contraindications (general warnings)
  precaution_people: string[]; // Specific warnings for people with preconditions (array for easier parsing)
  dosage_citation: string; // URL to scientific source for dosage
  cautions_citation: string; // URL to scientific source for cautions
  bioavailability?: number; // percentage
  loadingPhase?: {
    dosage: number; // mg
    duration: number; // days
  };
}

export const creatineTypeDosages: CreatineTypeDosage[] = [
  {
    type: 'Creatine Monohydrate',
    minDailyDosage: 3000, // 3g
    maxDailyDosage: 5000, // 5g
    dangerousDosage: 10000, // 10g+
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
    bioavailability: 100,
    loadingPhase: { dosage: 20000, duration: 7 }
  },
  {
    type: 'Creatine Anhydrous',
    minDailyDosage: 3000, // 3g
    maxDailyDosage: 5000, // 5g
    dangerousDosage: 10000, // 10g+
    dosageNotes: 'Creatine without water molecules. Same dosing as monohydrate.',
    cautions: 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 100,
    loadingPhase: { dosage: 20000, duration: 7 }
  },
  {
    type: 'Creatine Hydrochloride',
    minDailyDosage: 1000, // 1g
    maxDailyDosage: 2000, // 2g
    dangerousDosage: 4000, // 4g+
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
    type: 'Creatine Citrate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
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
    bioavailability: 110,
    loadingPhase: { dosage: 12000, duration: 5 }
  },
  {
    type: 'Creatine Malate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
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
    bioavailability: 110,
    loadingPhase: { dosage: 12000, duration: 5 }
  },
  {
    type: 'Creatine Pyruvate',
    minDailyDosage: 1500, // 1.5g
    maxDailyDosage: 3000, // 3g
    dangerousDosage: 6000, // 6g+
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
    type: 'Creatine Nitrate',
    minDailyDosage: 1500, // 1.5g
    maxDailyDosage: 3000, // 3g
    dangerousDosage: 6000, // 6g+
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
    type: 'Creatine Ethyl Ester',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
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
    type: 'Micronized Creatine Monohydrate',
    minDailyDosage: 3000, // 3g
    maxDailyDosage: 5000, // 5g
    dangerousDosage: 10000, // 10g+
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
    bioavailability: 105,
    loadingPhase: { dosage: 20000, duration: 7 }
  },
  {
    type: 'Buffered Creatine',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
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
    type: 'Creapure',
    minDailyDosage: 3000, // 3g
    maxDailyDosage: 5000, // 5g
    dangerousDosage: 10000, // 10g+
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
    bioavailability: 100,
    loadingPhase: { dosage: 20000, duration: 7 }
  },
  {
    type: 'Creatine Phosphate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'Phosphate-bound creatine. May enhance ATP production.',
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
    type: 'Free Acid Creatine',
    minDailyDosage: 1500, // 1.5g
    maxDailyDosage: 3000, // 3g
    dangerousDosage: 6000, // 6g+
    dosageNotes: 'Acid-stable form. Lower doses required.',
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
    type: 'Creatine Gluconate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'Gluconate-bound creatine. Moderate dosing.',
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
    type: 'Creatine Orotate',
    minDailyDosage: 1500, // 1.5g
    maxDailyDosage: 3000, // 3g
    dangerousDosage: 6000, // 6g+
    dosageNotes: 'Orotic acid-bound creatine. Enhanced absorption.',
    cautions: 'May cause mild GI upset at high doses. Take with water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 125
  },
  {
    type: 'Creatine Alpha-Ketoglutarate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'AKG-bound creatine. May enhance energy metabolism.',
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
    type: 'Creatine Taurinate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'Taurine-bound creatine. May provide additional benefits.',
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
    type: 'Creatine Ethyl Ester Malate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'Esterified creatine with malic acid. Enhanced absorption.',
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
    type: 'Creatine Magnesium Chelate',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'Magnesium-chelated creatine. May enhance absorption.',
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
    type: 'Crea-Trona',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'Buffered creatine complex. Lower doses needed.',
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
    type: 'Effervescent Creatine',
    minDailyDosage: 3000, // 3g
    maxDailyDosage: 5000, // 5g
    dangerousDosage: 10000, // 10g+
    dosageNotes: 'Effervescent form for better mixing. Same dosing as monohydrate.',
    cautions: 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.',
    precaution_people: [
      'kidney disease',
      'diabetes',
      'bipolar disorder',
      'taking medications that affect kidney function'
    ],
    dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
    bioavailability: 105,
    loadingPhase: { dosage: 20000, duration: 7 }
  },
  {
    type: 'Liquid Creatine',
    minDailyDosage: 2000, // 2g
    maxDailyDosage: 4000, // 4g
    dangerousDosage: 8000, // 8g+
    dosageNotes: 'Liquid form. May have stability issues. Use quickly.',
    cautions: 'May cause mild GI upset at high doses. Take with water. Liquid form may degrade over time.',
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
    type: 'Creatinol-O-Phosphate',
    minDailyDosage: 1500, // 1.5g
    maxDailyDosage: 3000, // 3g
    dangerousDosage: 6000, // 6g+
    dosageNotes: 'Phosphorylated creatine. Enhanced bioavailability.',
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
  }
];

// Helper function to get dosage data for a specific creatine type
export function getCreatineTypeDosage(creatineType: string): CreatineTypeDosage | undefined {
  return creatineTypeDosages.find(dosage => dosage.type === creatineType);
}
