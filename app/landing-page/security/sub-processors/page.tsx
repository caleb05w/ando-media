import type { Metadata } from 'next'

import { LegalDocument } from '@/components/legal-document'
import { SecuritySubNavigation } from '@/components/security-sub-navigation'
import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'
import { SUBPROCESSOR_SECTIONS, SUBPROCESSORS_LAST_UPDATED } from './content'

export const metadata: Metadata = {
  title: { absolute: 'Sub-processors · Ando' },
  description:
    'The third-party service providers that may process personal data to help Asari Inc. deliver Ando.',
}

/** The /security/sub-processors route inside the shared site chrome. */
export default function SubprocessorsPage() {
  return (
    <>
      <SiteNavigation />
      <SecuritySubNavigation active="sub-processors" />
      <LegalDocument
        lastUpdated={SUBPROCESSORS_LAST_UPDATED}
        sections={SUBPROCESSOR_SECTIONS}
        title="Sub-processors"
        tocLabel="Sub-processors"
      />
      <SiteFooter />
    </>
  )
}
