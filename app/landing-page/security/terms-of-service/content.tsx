import {
  DocList,
  type LegalSection,
  Para,
  Term,
} from '@/components/legal-document'

/** Effective date shown beneath the title (ISO for `<time>`, label for humans). */
export const TERMS_LAST_UPDATED = {
  iso: '2026-09-01',
  label: 'September 1, 2026',
}

/**
 * Terms of Service copy in document order, mirrored verbatim from the live Ando
 * site (Asari Inc.) maintained in the `landing-page` repo.
 */
export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: (
      <Para>
        These Terms of Service (<Term>“Terms”</Term>) govern your access to and
        use of the Ando platform and related services provided by{' '}
        <Term>Asari Inc.</Term> (<Term>“we,”</Term> <Term>“us,”</Term> or{' '}
        <Term>“our”</Term>). By accessing or using our services, you agree to be
        bound by these Terms.
      </Para>
    ),
  },
  {
    id: 'acceptance-of-terms',
    title: 'Acceptance of Terms',
    number: 1,
    body: (
      <DocList
        items={[
          'By creating an account or using our services, you confirm that you are at least 13 years of age and have the legal capacity to enter into these Terms.',
          'If you are using our services on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.',
        ]}
      />
    ),
  },
  {
    id: 'account-registration',
    title: 'Account Registration',
    number: 2,
    body: (
      <DocList
        items={[
          'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
          'You agree to provide accurate, current, and complete information during registration and to update such information as needed.',
          'You must notify us immediately of any unauthorized use of your account by contacting hello@ando.so.',
        ]}
      />
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    number: 3,
    body: (
      <DocList
        items={[
          'You agree not to use our services for any unlawful purpose or in any way that could damage, disable, or impair the platform.',
          'You may not attempt to gain unauthorized access to any part of the services, other accounts, or systems connected to our platform.',
          'You may not use the services to transmit spam, malware, or any harmful or disruptive content.',
          'You may not reverse engineer, decompile, or disassemble any part of the services.',
        ]}
      />
    ),
  },
  {
    id: 'user-content',
    title: 'User Content',
    number: 4,
    body: (
      <DocList
        items={[
          'You retain ownership of content you create and transmit through our platform. By using our services, you grant us a limited license to host, store, and process your content solely to provide and improve our services.',
          'You are solely responsible for the content you transmit and must ensure it does not violate any applicable laws or third-party rights.',
          'We reserve the right to remove content that violates these Terms or applicable law.',
        ]}
      />
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    number: 5,
    body: (
      <DocList
        items={[
          'The Ando platform, including its design, features, and underlying technology, is owned by Asari Inc. and protected by intellectual property laws.',
          'These Terms do not grant you any right to use our trademarks, logos, or brand features without prior written consent.',
        ]}
      />
    ),
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    number: 6,
    body: (
      <DocList
        items={[
          'Our platform may integrate with or link to third-party services. We are not responsible for the content, policies, or practices of any third-party services.',
          'Your use of third-party services is subject to their respective terms and privacy policies.',
        ]}
      />
    ),
  },
  {
    id: 'fees-and-payment',
    title: 'Fees & Payment',
    number: 7,
    body: (
      <DocList
        items={[
          'Certain features of our services may require payment. You agree to pay all applicable fees as described at the time of purchase.',
          'We reserve the right to change our pricing with reasonable notice. Continued use of paid features after a price change constitutes acceptance of the new pricing.',
          'All fees are non-refundable unless otherwise stated or required by law.',
        ]}
      />
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    number: 8,
    body: (
      <DocList
        items={[
          'You may terminate your account at any time by contacting us at hello@ando.so.',
          'We may suspend or terminate your access to the services at any time, with or without cause, including for violation of these Terms.',
          'Upon termination, your right to use the services ceases immediately. We may delete your account data in accordance with our Privacy Policy.',
        ]}
      />
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    number: 9,
    body: (
      <DocList
        items={[
          'Our services are provided “as is” and “as available” without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
          'We do not guarantee that the services will be uninterrupted, secure, or error-free.',
        ]}
      />
    ),
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    number: 10,
    body: (
      <DocList
        items={[
          'To the maximum extent permitted by law, Asari Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising from your use of the services.',
          'Our total liability for any claim arising out of or relating to these Terms or the services shall not exceed the amount you paid us in the twelve (12) months preceding the claim.',
        ]}
      />
    ),
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    number: 11,
    body: (
      <Para>
        You agree to indemnify and hold harmless Asari Inc., its officers,
        directors, employees, and agents from any claims, damages, losses, or
        expenses arising out of your use of the services or violation of these
        Terms.
      </Para>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    number: 12,
    body: (
      <Para>
        These Terms are governed by the laws of the State of California, without
        regard to its conflict of law principles. Any disputes arising from
        these Terms shall be resolved in the courts located in San Francisco,
        California.
      </Para>
    ),
  },
  {
    id: 'changes-to-these-terms',
    title: 'Changes to These Terms',
    number: 13,
    body: (
      <Para>
        We may update these Terms from time to time. We will notify you of
        material changes by posting the updated Terms on this page and updating
        the “Last updated” date. Your continued use of our services after any
        changes constitutes acceptance of the updated Terms.
      </Para>
    ),
  },
]
