import { ProductCategory } from './types';

// Protein powder supplement configuration
export const proteinPowderProduct: ProductCategory = {
  name: 'protein_powder',
  label: 'Protein Powder',
  description: 'Protein supplements for muscle building, recovery, and daily protein intake',
  ingredients: [
    {
      name: 'protein_content_g',
      label: 'Total Protein',
      placeholder: '25',
      unit: 'g',
      description: 'Total protein content per serving',
      minDailyDosage: 20, // 20g minimum effective dose
      maxDailyDosage: 50, // 50g maximum per serving
      dangerousDosage: 80, // 80g+ may cause GI distress
      dosageNotes: 'Optimal serving: 20-50g protein. Take post-workout or between meals. Higher doses may cause GI issues.',
      cautions: 'Very high doses (80g+) may cause GI distress, bloating, or digestive issues. Spread intake throughout the day.',
      precaution_people: [
        'kidney disease',
        'liver disease',
        'protein metabolism disorders',
        'taking medications that affect kidney function'
      ],
      dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
      cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3879660/',
      required: true,
      step: '5',
      type: 'number'
    },
    {
      name: 'l_leucine_mg',
      label: 'L-Leucine',
      placeholder: '3000',
      unit: 'mg',
      description: 'L-Leucine content for muscle protein synthesis',
      minDailyDosage: 2000, // 2g minimum for muscle protein synthesis
      maxDailyDosage: 5000, // 5g maximum per serving
      dangerousDosage: 10000, // 10g+ may cause GI distress
      dosageNotes: 'Protein powder optimal: 2-5g per serving. Most important amino acid for muscle protein synthesis.',
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
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Isoleucine content',
      minDailyDosage: 1000, // 1g minimum
      maxDailyDosage: 2500, // 2.5g maximum per serving
      dangerousDosage: 5000, // 5g+ may cause GI distress
      dosageNotes: 'Protein powder optimal: 1-2.5g per serving. Works synergistically with leucine and valine.',
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
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Valine content',
      minDailyDosage: 1000, // 1g minimum
      maxDailyDosage: 2500, // 2.5g maximum per serving
      dangerousDosage: 5000, // 5g+ may cause GI distress
      dosageNotes: 'Protein powder optimal: 1-2.5g per serving. Important for muscle metabolism and recovery.',
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
      name: 'creatine_monohydrate_mg',
      label: 'Creatine Monohydrate',
      placeholder: '3000',
      unit: 'mg',
      description: 'Creatine for strength and power output',
      minDailyDosage: 2000, // 2g minimum
      maxDailyDosage: 5000, // 5g maximum per serving
      dangerousDosage: 10000, // 10g+ may cause GI distress
      dosageNotes: 'Protein powder optimal: 2-5g per serving. Take with plenty of water. Consistent daily use is key.',
      cautions: 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.',
      precaution_people: [
        'kidney disease',
        'diabetes',
        'bipolar disorder',
        'taking medications that affect kidney function'
      ],
      dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
      cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
      required: false,
      step: '500',
      type: 'number'
    },
    {
      name: 'glutamine_mg',
      label: 'L-Glutamine',
      placeholder: '5000',
      unit: 'mg',
      description: 'L-Glutamine for recovery and immune support',
      minDailyDosage: 3000, // 3g minimum for recovery
      maxDailyDosage: 10000, // 10g maximum per serving
      dangerousDosage: 20000, // 20g+ may cause GI distress
      dosageNotes: 'Protein powder optimal: 3-10g per serving. May help with recovery and immune function.',
      cautions: 'May cause GI upset at very high doses. Generally well-tolerated.',
      precaution_people: [
        'liver disease',
        'kidney disease',
        'taking medications that affect liver function'
      ],
      dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3501276/',
      cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3501276/',
      required: false,
      step: '500',
      type: 'number'
    }
  ]
};
