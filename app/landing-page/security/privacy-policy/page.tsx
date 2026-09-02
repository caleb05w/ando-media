import type { Metadata } from 'next'

import { LegalDocument } from '@/components/legal-document'
import { SecuritySubNavigation } from '@/components/security-sub-navigation'
import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'
import { PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from './content'

export const metadata: Metadata = {
  title: { absolute: 'Privacy Policy · Ando' },
  description:
    'How Asari Inc. collects, uses, discloses, and safeguards your information when you use the Ando platform and related services.',
}

/** The /security/privacy-policy route: the Privacy Policy inside the shared site chrome. */
export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteNavigation />
      <SecuritySubNavigation active="privacy-policy" />
      <LegalDocument
        lastUpdated={PRIVACY_LAST_UPDATED}
        sections={PRIVACY_SECTIONS}
        title="Privacy Policy"
        tocLabel="Privacy Policy"
      />
      <SiteFooter />
    </>
  )
}
