'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useState } from 'react';

// Import new components
import ContributeHero from '@/components/contribute/ContributeHero';
import CTASection from '@/components/contribute/CTASection';
import GuidelinesSection from '@/components/contribute/GuidelinesSection';
import OverviewTabContent from '@/components/contribute/OverviewTabContent';
import TabNavigation from '@/components/contribute/TabNavigation';
import TypesTabContent from '@/components/contribute/TypesTabContent';

export default function ContributePage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'types'>('overview');
  const [showGuidelines, setShowGuidelines] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <ContributeHero 
        isAuthenticated={isAuthenticated}
        onShowGuidelines={() => setShowGuidelines(!showGuidelines)}
        showGuidelines={showGuidelines}
      />

      <GuidelinesSection showGuidelines={showGuidelines} />

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <OverviewTabContent onShowGuidelines={() => setShowGuidelines(true)} />
          )}

          {activeTab === 'types' && (
            <TypesTabContent />
          )}
        </div>
      </section>

      <CTASection isAuthenticated={isAuthenticated} />
    </div>
  );
}