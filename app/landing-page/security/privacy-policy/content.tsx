import {
  DocList,
  type LegalSection,
  Para,
  Term,
} from '@/components/legal-document'

/** Effective date shown beneath the title (ISO for `<time>`, label for humans). */
export const PRIVACY_LAST_UPDATED = {
  iso: '2026-09-01',
  label: 'September 1, 2026',
}

/**
 * Privacy Policy copy in document order for Asari Inc.'s Ando services.
 */
export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: (
      <Para>
        <Term>Asari Inc.</Term> (<Term>“we,”</Term> <Term>“us,”</Term> or{' '}
        <Term>“our”</Term>) operates the Ando platform and related services.
        This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you use our services.
      </Para>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    number: 1,
    body: (
      <DocList
        items={[
          {
            key: 'account-information',
            content: (
              <>
                <Term>Account Information:</Term> When you create an account, we
                collect your name, email address, and organization details.
              </>
            ),
          },
          {
            key: 'usage-data',
            content: (
              <>
                <Term>Usage Data:</Term> We automatically collect information
                about how you interact with our services, including pages
                visited, features used, and timestamps.
              </>
            ),
          },
          {
            key: 'device-information',
            content: (
              <>
                <Term>Device Information:</Term> We collect device type,
                operating system, browser type, and IP address.
              </>
            ),
          },
          {
            key: 'messages-content',
            content: (
              <>
                <Term>Messages &amp; Content:</Term> We process messages, files,
                and other content you transmit through our platform to provide
                and improve our services.
              </>
            ),
          },
          {
            key: 'cookies-tracking',
            content: (
              <>
                <Term>Cookies &amp; Tracking:</Term> We use cookies and similar
                technologies to maintain sessions, remember preferences, and
                analyze usage patterns.
              </>
            ),
          },
        ]}
      />
    ),
  },
  {
    id: 'how-we-use-your-information',
    title: 'How We Use Your Information',
    number: 2,
    body: (
      <DocList
        items={[
          'To provide, maintain, and improve our services',
          'To process transactions and send related information',
          'To send administrative information, such as updates, security alerts, and support messages',
          'To personalize your experience and deliver relevant content',
          'To monitor and analyze usage trends to improve functionality',
          'To detect, prevent, and address technical issues and abuse',
          'To comply with legal obligations',
        ]}
      />
    ),
  },
  {
    id: 'how-we-share-your-information',
    title: 'How We Share Your Information',
    number: 3,
    body: (
      <>
        <DocList
          items={[
            {
              key: 'service-providers',
              content: (
                <>
                  <Term>Service Providers:</Term> We share information with
                  third-party vendors who perform services on our behalf, such
                  as hosting, analytics, and customer support.
                </>
              ),
            },
            {
              key: 'business-transfers',
              content: (
                <>
                  <Term>Business Transfers:</Term> In connection with a merger,
                  acquisition, or sale of assets, your information may be
                  transferred as a business asset.
                </>
              ),
            },
            {
              key: 'legal-requirements',
              content: (
                <>
                  <Term>Legal Requirements:</Term> We may disclose information
                  if required by law, regulation, or legal process.
                </>
              ),
            },
            {
              key: 'with-your-consent',
              content: (
                <>
                  <Term>With Your Consent:</Term> We may share information for
                  any other purpose with your consent.
                </>
              ),
            },
          ]}
        />
        <Para>We do not sell your personal information to third parties.</Para>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    number: 4,
    body: (
      <DocList
        items={[
          'We retain your information for as long as your account is active or as needed to provide you services. We may also retain and use your information to comply with legal obligations, resolve disputes, and enforce our agreements.',
          'You can request deletion of your account and associated data by contacting us at hello@ando.so.',
        ]}
      />
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    number: 5,
    body: (
      <DocList
        items={[
          'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
          'While we strive to protect your information, no method of transmission over the Internet or method of electronic storage is 100% secure.',
        ]}
      />
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    number: 6,
    body: (
      <DocList
        items={[
          {
            key: 'access-portability',
            content: (
              <>
                <Term>Access &amp; Portability:</Term> You may request a copy of
                the personal data we hold about you in a portable format or,
                where applicable and technically feasible, ask us to transmit it
                to another service.
              </>
            ),
          },
          {
            key: 'correction',
            content: (
              <>
                <Term>Correction:</Term> You may request that we correct
                inaccurate or incomplete information.
              </>
            ),
          },
          {
            key: 'deletion',
            content: (
              <>
                <Term>Deletion:</Term> You may request deletion of your personal
                data, subject to certain legal exceptions.
              </>
            ),
          },
          {
            key: 'opt-out',
            content: (
              <>
                <Term>Opt-Out:</Term> You may opt out of marketing
                communications at any time by following the unsubscribe
                instructions in our emails.
              </>
            ),
          },
          'To exercise any of these rights, including access, data portability, correction, or deletion, please contact us at hello@ando.so.',
        ]}
      />
    ),
  },
  {
    id: 'childrens-privacy',
    title: 'Children’s Privacy',
    number: 7,
    body: (
      <Para>
        Our services are not directed to individuals under the age of 13. We do
        not knowingly collect personal information from children under 13. If we
        learn that we have collected information from a child under 13, we will
        take steps to delete such information promptly.
      </Para>
    ),
  },
  {
    id: 'international-data-transfers',
    title: 'International Data Transfers',
    number: 8,
    body: (
      <Para>
        Your information may be transferred to and processed in countries other
        than your country of residence. These countries may have data protection
        laws that differ from the laws of your country. We take appropriate
        safeguards to ensure your information remains protected.
      </Para>
    ),
  },
  {
    id: 'changes-to-this-policy',
    title: 'Changes to This Policy',
    number: 9,
    body: (
      <Para>
        We may update this Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page and
        updating the “Last updated” date. Your continued use of our services
        after any changes constitutes acceptance of the updated policy.
      </Para>
    ),
  },
]
