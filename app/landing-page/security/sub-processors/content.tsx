import { Text } from '@repo/design-system-ui/text'

import { type LegalSection, Para, Term } from '@/components/legal-document'

/** Effective date shown beneath the title (ISO for `<time>`, label for humans). */
export const SUBPROCESSORS_LAST_UPDATED = {
  iso: '2026-09-01',
  label: 'September 1, 2026',
}

interface Subprocessor {
  name: string
  purpose: string
  location: string
}

/**
 * Keep the register as data so vendor, purpose, and location changes can be
 * reviewed independently from the page layout.
 */
const SUBPROCESSORS: Subprocessor[] = [
  {
    name: 'Amazon Web Services',
    purpose: 'Cloud infrastructure, data storage, and processing',
    location: 'United States',
  },
  {
    name: 'Anthropic',
    purpose: 'AI model processing',
    location: 'United States',
  },
  {
    name: 'Cloudflare',
    purpose: 'Network security, content delivery, and file storage',
    location: 'Global',
  },
  {
    name: 'Convex',
    purpose: 'Application database and backend infrastructure',
    location: 'United States',
  },
  {
    name: 'Honeycomb',
    purpose: 'Application performance monitoring and diagnostics',
    location: 'United States',
  },
  {
    name: 'OpenAI',
    purpose: 'AI model processing and embeddings',
    location: 'United States',
  },
  {
    name: 'Render',
    purpose: 'Application hosting and compute',
    location: 'United States',
  },
  {
    name: 'Sentry',
    purpose: 'Error monitoring and diagnostics',
    location: 'United States',
  },
  {
    name: 'Stytch',
    purpose: 'Authentication and identity management',
    location: 'United States',
  },
]

function SubprocessorRegister() {
  return (
    <>
      <div className="border-border-default border-y md:hidden">
        {SUBPROCESSORS.map((subprocessor) => (
          <dl
            className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-border-subtle border-t py-4 first:border-t-0"
            key={subprocessor.name}
          >
            <dt className="text-size-sm text-text-tertiary">Provider</dt>
            <dd className="text-size-sm text-text-primary">
              {subprocessor.name}
            </dd>
            <dt className="text-size-sm text-text-tertiary">Purpose</dt>
            <dd className="text-pretty text-size-sm text-text-secondary">
              {subprocessor.purpose}
            </dd>
            <dt className="text-size-sm text-text-tertiary">Location</dt>
            <dd className="text-size-sm text-text-secondary">
              {subprocessor.location}
            </dd>
          </dl>
        ))}
      </div>

      <div className="hidden border-border-default border-y md:block">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">
            Ando sub-processors, their purpose, and primary processing location
          </caption>
          <thead>
            <tr>
              <th className="w-[27%] py-4 pr-5 text-left" scope="col">
                <Text as="span" size="sm" weight="medium">
                  Provider
                </Text>
              </th>
              <th className="w-[50%] py-4 pr-5 text-left" scope="col">
                <Text as="span" size="sm" weight="medium">
                  Purpose
                </Text>
              </th>
              <th className="w-[23%] py-4 text-left" scope="col">
                <Text as="span" size="sm" weight="medium">
                  Location
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((subprocessor) => (
              <tr
                className="border-border-subtle border-t align-top"
                key={subprocessor.name}
              >
                <th className="py-4 pr-5 text-left font-normal" scope="row">
                  <Text as="span" size="sm">
                    {subprocessor.name}
                  </Text>
                </th>
                <td className="py-4 pr-5">
                  <Text
                    as="span"
                    className="text-pretty"
                    color="secondary"
                    size="sm"
                  >
                    {subprocessor.purpose}
                  </Text>
                </td>
                <td className="py-4">
                  <Text as="span" color="secondary" size="sm">
                    {subprocessor.location}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export const SUBPROCESSOR_SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <Para>
        <Term>Asari Inc.</Term> (<Term>“Ando,”</Term> <Term>“we,”</Term> or{' '}
        <Term>“our”</Term>) engages the third-party service providers below to
        help deliver Ando. These sub-processors may process personal data that
        customers provide through our services. Each is authorized to process
        data only as needed to provide its contracted services and is subject to
        written data protection obligations.
      </Para>
    ),
  },
  {
    id: 'current-sub-processors',
    title: 'Current Sub-processors',
    number: 1,
    body: <SubprocessorRegister />,
  },
  {
    id: 'changes-to-sub-processors',
    title: 'Changes to Sub-processors',
    number: 2,
    body: (
      <Para>
        We may update this list as our services change. Where required by our
        agreement with you, we will provide notice before a new sub-processor
        begins processing personal data and give you an opportunity to raise a
        reasonable objection.
      </Para>
    ),
  },
]
