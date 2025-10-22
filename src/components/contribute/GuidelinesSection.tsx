'use client';

import Link from 'next/link';

interface GuidelinesSectionProps {
  showGuidelines: boolean;
}

const guidelines = [
  {
    title: 'Get Information from Verified Sources',
    description: 'Get all information directly from the supplier or a verified supplier. All images of the product should also be uploaded with a direct web link from the brands website or a direct supplier.'
  },
  {
    title: 'Be Accurate',
    description: 'Double-check all information before submitting. Accuracy is more important than speed.'
  },
  {
    title: 'Provide Context',
    description: 'Include notes explaining your sources and any relevant context for your contribution.'
  },
  {
    title: 'Avoid Speculation',
    description: 'Only submit information you can verify. Don\'t guess or estimate without clear indicators.'
  },
  {
    title: 'Respect Privacy',
    description: 'Don\'t share personal information or confidential data in your contributions.'
  }
];

export default function GuidelinesSection({ showGuidelines }: GuidelinesSectionProps) {
  if (!showGuidelines) return null;

  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Contribution Guidelines
          </h2>
          <div className="space-y-6">
            {guidelines.map((guideline, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {guideline.title}
                  </h3>
                  <p className="text-gray-600">{guideline.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              Need Help Getting Started?
            </h3>
            <p className="text-blue-800 mb-6">
              Our community is here to help! Join our Discord server or check out our 
              detailed contribution guide for step-by-step instructions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/help"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Help Center
              </Link>
              <button className="bg-transparent text-blue-600 px-6 py-2 rounded-lg font-medium border border-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                Join Discord
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
