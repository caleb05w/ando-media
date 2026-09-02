import type { Metadata } from 'next'

import { LegalDocument } from '@/components/legal-document'
import { SecuritySubNavigation } from '@/components/security-sub-navigation'
import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from './content'

export const metadata: Metadata = {
  title: { absolute: 'Terms of Service · Ando' },
  description:
    'The terms that govern your access to and use of the Ando platform and related services provided by Asari Inc.',
}

/** The /security/terms-of-service route: the Terms document inside the shared site chrome. */
export default function TermsOfServicePage() {
  return (
    <>
      <SiteNavigation />
      <SecuritySubNavigation active="terms-of-service" />
      <LegalDocument
        lastUpdated={TERMS_LAST_UPDATED}
        sections={TERMS_SECTIONS}
        title="Terms of Service"
        tocLabel="Terms of Service"
      />
      <SiteFooter />
    </>
  )
}
