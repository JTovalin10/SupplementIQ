import { ProductCategory } from './types';

// Pre-workout supplement configuration
export const preWorkoutProduct: ProductCategory = {
  name: 'pre-workout',
  label: 'Pre-Workout Supplement',
  description: 'Pre-workout supplements for energy, focus, and performance enhancement',
  ingredients: [
    {
      name: 'caffeine_anhydrous_mg',
      label: 'Caffeine Anhydrous',
      placeholder: '200',
      unit: 'mg',
      description: 'Caffeine for energy and focus enhancement',
      minDailyDosage: 100, // 100mg minimum effective dose for pre-workout
      maxDailyDosage: 300, // 300mg max for pre-workout (lower than daily limit)
      dangerousDosage: 400, // 400mg+ dangerous for pre-workout context
      dosageNotes: 'Optimal for pre-workout: 100-300mg. Take 30-60 minutes before exercise. Avoid within 6 hours of bedtime.',
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
      name: 'l_citrulline_mg',
      label: 'L-Citrulline',
      placeholder: '6000',
      unit: 'mg',
      description: 'L-Citrulline for nitric oxide production and pumps',
      minDailyDosage: 4000, // 4g minimum for pre-workout pumps
      maxDailyDosage: 8000, // 8g maximum for pre-workout
      dangerousDosage: 12000, // 12g+ may cause GI distress
      dosageNotes: 'Pre-workout optimal: 4-8g. Take 30-60 minutes before exercise. Effects peak 1-2 hours after consumption.',
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
      name: 'beta_alanine_mg',
      label: 'Beta-Alanine',
      placeholder: '3000',
      unit: 'mg',
      description: 'Beta-Alanine for muscular endurance and performance',
      minDailyDosage: 2000, // 2g minimum effective dose
      maxDailyDosage: 5000, // 5g maximum safe dose
      dangerousDosage: 8000, // 8g+ may cause paresthesia
      dosageNotes: 'Pre-workout optimal: 2-5g. May cause tingling sensation (paresthesia). Take consistently for 2-4 weeks for full effects.',
      cautions: 'May cause tingling sensation (paresthesia) at higher doses. This is normal and harmless.',
      precaution_people: [
        'sensitive to tingling sensations',
        'taking medications that affect nerve function'
      ],
      dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4501114/',
      cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4501114/',
      required: false,
      step: '500',
      type: 'number'
    },
    {
      name: 'l_tyrosine_mg',
      label: 'L-Tyrosine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Tyrosine for focus and cognitive enhancement',
      minDailyDosage: 1000, // 1g minimum for cognitive effects
      maxDailyDosage: 3000, // 3g maximum for pre-workout
      dangerousDosage: 5000, // 5g+ may cause headaches
      dosageNotes: 'Pre-workout optimal: 1-3g. Take on empty stomach for better absorption. Effects enhanced under stress.',
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
      name: 'creatine_monohydrate_mg',
      label: 'Creatine Monohydrate',
      placeholder: '3000',
      unit: 'mg',
      description: 'Creatine for strength and power output',
      minDailyDosage: 2000, // 2g minimum for pre-workout
      maxDailyDosage: 5000, // 5g maximum for pre-workout
      dangerousDosage: 10000, // 10g+ may cause GI distress
      dosageNotes: 'Pre-workout optimal: 2-5g. Take with plenty of water. Consistent daily use is more important than timing.',
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
      name: 'taurine_mg',
      label: 'Taurine',
      placeholder: '2000',
      unit: 'mg',
      description: 'Taurine for energy and hydration support',
      minDailyDosage: 1000, // 1g minimum for energy effects
      maxDailyDosage: 3000, // 3g maximum for pre-workout
      dangerousDosage: 5000, // 5g+ may cause GI distress
      dosageNotes: 'Pre-workout optimal: 1-3g. Often combined with caffeine to reduce jitters. May help with hydration.',
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
  ]
};
