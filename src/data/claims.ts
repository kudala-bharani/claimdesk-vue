import { DEMO_REVIEWER, type Claim } from '../types/claim'

// All names, providers, identifiers, and amounts are invented for this demo.
const records: Omit<Claim, 'activity'>[] = [
  { id: 'CLM-1042', memberName: 'Morgan Ellis', memberId: 'DEMO-80241', provider: 'Evergreen Family Care', type: 'Medical', service: 'Outpatient consultation', serviceDate: '2026-10-08', receivedAt: '2026-10-14T10:15:00Z', dueDate: '2026-10-18', amount: 1240, status: 'In review', priority: 'High', owner: DEMO_REVIEWER, summary: 'Review the submitted service details and confirm that the supporting documentation is complete.' },
  { id: 'CLM-1041', memberName: 'Avery Bennett', memberId: 'DEMO-80238', provider: 'Riverbend Dental Studio', type: 'Dental', service: 'Preventive dental visit', serviceDate: '2026-10-10', receivedAt: '2026-10-16T14:30:00Z', dueDate: '2026-10-19', amount: 285, status: 'New', priority: 'Normal', owner: 'Unassigned', summary: 'A new preventive-care submission is ready for its initial documentation review.' },
  { id: 'CLM-1040', memberName: 'Jordan Brooks', memberId: 'DEMO-80216', provider: 'Northline Diagnostics', type: 'Medical', service: 'Diagnostic imaging', serviceDate: '2026-10-06', receivedAt: '2026-10-13T09:45:00Z', dueDate: '2026-10-19', amount: 2180, status: 'Needs information', priority: 'High', owner: 'Alex Rivera', summary: 'The itemized service attachment is missing. The reviewer requested an updated document from the fictional provider.' },
  { id: 'CLM-1039', memberName: 'Taylor Monroe', memberId: 'DEMO-80209', provider: 'Clearview Vision Center', type: 'Vision', service: 'Routine vision exam', serviceDate: '2026-10-11', receivedAt: '2026-10-16T11:05:00Z', dueDate: '2026-10-20', amount: 160, status: 'New', priority: 'Normal', owner: 'Unassigned', summary: 'A routine vision-exam submission with the service form and provider details included.' },
  { id: 'CLM-1038', memberName: 'Riley Parker', memberId: 'DEMO-80194', provider: 'Oakwell Physical Therapy', type: 'Medical', service: 'Physical therapy session', serviceDate: '2026-10-09', receivedAt: '2026-10-14T15:20:00Z', dueDate: '2026-10-20', amount: 475, status: 'In review', priority: 'Normal', owner: DEMO_REVIEWER, summary: 'Check the submitted dates of service against the attached session summary before completing review.' },
  { id: 'CLM-1037', memberName: 'Cameron Hayes', memberId: 'DEMO-80181', provider: 'Evergreen Family Care', type: 'Medical', service: 'Follow-up consultation', serviceDate: '2026-10-12', receivedAt: '2026-10-17T08:20:00Z', dueDate: '2026-10-21', amount: 195, status: 'New', priority: 'Normal', owner: 'Unassigned', summary: 'A follow-up visit is ready for an initial check of the service and provider information.' },
  { id: 'CLM-1036', memberName: 'Quinn Spencer', memberId: 'DEMO-80172', provider: 'Riverbend Dental Studio', type: 'Dental', service: 'Restorative dental care', serviceDate: '2026-10-05', receivedAt: '2026-10-12T16:40:00Z', dueDate: '2026-10-21', amount: 840, status: 'Needs information', priority: 'Normal', owner: DEMO_REVIEWER, summary: 'The review is waiting for a readable copy of the fictional provider’s service statement.' },
  { id: 'CLM-1035', memberName: 'Reese Sullivan', memberId: 'DEMO-80165', provider: 'Lakeside Wellness Clinic', type: 'Medical', service: 'Outpatient procedure', serviceDate: '2026-10-10', receivedAt: '2026-10-15T12:10:00Z', dueDate: '2026-10-22', amount: 1860, status: 'In review', priority: 'High', owner: 'Alex Rivera', summary: 'Review the complete documentation packet and record the next workflow step.' },
  { id: 'CLM-1034', memberName: 'Emerson Blake', memberId: 'DEMO-80152', provider: 'Clearview Vision Center', type: 'Vision', service: 'Prescription lenses', serviceDate: '2026-10-12', receivedAt: '2026-10-17T10:00:00Z', dueDate: '2026-10-23', amount: 320, status: 'New', priority: 'Normal', owner: 'Unassigned', summary: 'A prescription-lens submission is ready for its initial service-document review.' },
  { id: 'CLM-1033', memberName: 'Finley Carter', memberId: 'DEMO-80143', provider: 'Northline Diagnostics', type: 'Medical', service: 'Laboratory services', serviceDate: '2026-10-07', receivedAt: '2026-10-13T13:50:00Z', dueDate: '2026-10-22', amount: 630, status: 'Needs information', priority: 'Normal', owner: 'Sam Chen', summary: 'A clarification was requested because the submitted service description is incomplete.' },
  { id: 'CLM-1032', memberName: 'Alexis Reed', memberId: 'DEMO-80130', provider: 'Lakeside Wellness Clinic', type: 'Medical', service: 'Preventive consultation', serviceDate: '2026-10-04', receivedAt: '2026-10-11T09:20:00Z', dueDate: '2026-10-17', amount: 210, status: 'Resolved', priority: 'Normal', owner: 'Sam Chen', summary: 'The demo documentation review is complete. Resolved does not represent a coverage or payment decision.' },
  { id: 'CLM-1031', memberName: 'Drew Collins', memberId: 'DEMO-80121', provider: 'Riverbend Dental Studio', type: 'Dental', service: 'Dental consultation', serviceDate: '2026-10-03', receivedAt: '2026-10-10T11:30:00Z', dueDate: '2026-10-17', amount: 150, status: 'Resolved', priority: 'Normal', owner: DEMO_REVIEWER, summary: 'The demo documentation review is complete, with the reviewer’s note recorded in the activity history.' },
]

export const claimFixtures: Claim[] = records.map((claim) => ({
  ...claim,
  activity: [
    ...(claim.status !== 'New' ? [{
      id: `${claim.id}-review`,
      at: '2026-10-16T15:10:00Z',
      author: claim.owner,
      description: `Moved to ${claim.status.toLowerCase()}`,
      note: claim.status === 'Needs information'
        ? 'Requested the supporting service document to continue the review.'
        : claim.status === 'Resolved'
          ? 'Documentation review completed for this fictional submission.'
          : 'Started the documentation review and checked the submitted service details.',
    }] : []),
    { id: `${claim.id}-received`, at: claim.receivedAt, author: 'Demo intake', description: 'Claim received', note: 'Fictional submission added to the worklist.' },
  ],
}))
