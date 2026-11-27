import type { IconName } from "@/components/Icons";

export type HelpArticle = {
  id: string;
  title: string;
  category: HelpCategory;
  icon: IconName;
  summary: string;
  /** Markdown subset: ## headings, - lists, 1. steps, **bold**. */
  body: string;
  /** Where in WHSCOMPLY to go to do this. */
  open?: { href: string; label: string };
};

export const HELP_CATEGORIES = [
  "Getting started",
  "Site safety",
  "Site management",
  "Plant and materials",
  "People",
  "Assistance and AI",
  "Business and settings",
] as const;
export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export const HELP: HelpArticle[] = [
  /* ---------- getting started ---------- */
  {
    id: "getting-around",
    title: "Getting around WHSCOMPLY",
    category: "Getting started",
    icon: "grid",
    summary: "The sidebar, the top bar and where everything lives.",
    open: { href: "/dashboard", label: "Open the dashboard" },
    body: `## The sidebar
The menu on the left holds every module, in groups:
- **Dashboard, Assistance and AI toolkit** at the top.
- **Project management**: projects, the programme, site diary, drawings, RFIs, defects, photos and site notices. Open a project to find its **Site access** tab: induction approvals, worker sign in and out, and visitors.
- **Personnel**: workers and tickets, the training matrix and subcontractors.
- **Site safety**: SWMS, permits to work, the risk register, inspections, incidents, actions and emergency management.
- **Meetings**: pre-starts, toolbox talks and WHS meetings.
- **Plant and equipment**: the plant register.
- **Hazardous chemicals**: the chemical register.
- **Compliance and records**: reports, the ISO Vault, documents and the audit log.

The list scrolls if your screen is short. On a phone, tap the menu button at the top left to open it.

## The top bar
- **The project picker** switches everything to one project. See "Switching between projects".
- **Search** finds records and pages. See "Searching WHSCOMPLY".
- **The bell** lists what needs action.
- **The question mark** opens this help centre.
- **The gear** opens Settings.

## The demo banner
This is a demo workspace with sample data. Changes are saved in your browser only. Choose **Reset demo** in the banner to go back to the starting data.`,
  },
  {
    id: "projects-switcher",
    title: "Switching between projects",
    category: "Getting started",
    icon: "building",
    summary: "Run several projects from one account and see one at a time.",
    open: { href: "/dashboard/projects", label: "Open projects" },
    body: `## The project picker
The button at the top left of every page shows **All projects** or the project you have chosen. Open it and pick one: every page, the bell, the reports and the Assistant then show only that project.

## Why it matters
- Lists, counts and the needs-attention list narrow to the project.
- New records start on the project you picked, so you are not asked again.
- The audit log and the audit pack cover that project only.
- Choose **All projects** to see the whole business.

## Adding a project
Go to **Projects** and choose **New project**. Give it a name, address, client, stage and site manager. You can then invite subcontractors to it.

## Closing a project
When a project is finished, choose **Close project** on its card. You see anything still open (incidents, actions, defects, permits) before you confirm. Closing signs everyone off, marks the subcontractors as finished on it, cancels invitations nobody answered and moves the project to **Archived**. Nothing is deleted: SWMS, inspections, incidents, signatures and the audit log stay. Choose **Reopen** if you need it back.`,
  },
  {
    id: "search",
    title: "Searching WHSCOMPLY",
    category: "Getting started",
    icon: "search",
    summary: "Find anything from the search bar, with the mouse or keyboard.",
    body: `## Search as you type
Click the search bar at the top of any page, or press **/** on your keyboard, and start typing. A list drops down straight away, grouped by kind: pages, projects, SWMS, risks, permits, incidents, actions, defects, inspections, plant, chemicals, RFIs, meetings, the diary, documents, drawings, notices and people.

Every word you type must match, so "scaffold alteration" narrows to the scaffold SWMS. Search covers every project, not just the one you have picked.

## Choosing a result
- Click a result to open it.
- Or use the **up** and **down** arrow keys and press **Enter**.
- Press **Escape** to clear the box, and again to close it.

When the box is empty, the list shows the main pages so you can jump straight to one. On a phone, search is at the top of the menu.`,
  },
  {
    id: "notifications",
    title: "The bell and what needs attention",
    category: "Getting started",
    icon: "bell",
    summary: "How WHSCOMPLY tells you what is overdue or about to be.",
    open: { href: "/dashboard/settings", label: "Notification settings" },
    body: `## The bell
The bell shows a count of items that need action. Open it to see each one and go straight to the record. The same list, ranked by urgency, is on the dashboard under **Needs attention**.

## What appears
- Tickets, licences and insurances that have expired or are expiring.
- Active SWMS that someone still has to sign.
- Corrective actions, defects and RFIs that are due or overdue.
- Incidents that are not closed, and those where notifiability is not assessed.
- Permits that are still open after they expired, plant out of service, service or test and tag due.
- Chemicals with no safety data sheet, emergency drills and document reviews that are due.

## Choosing what you see
Go to **Settings**, then **Notifications**. You can switch groups on or off and set how many days of warning you want before something expires.`,
  },

  /* ---------- site safety ---------- */
  {
    id: "swms",
    title: "Writing and signing a SWMS",
    category: "Site safety",
    icon: "file",
    summary: "Draft a safe work method statement and collect signatures.",
    open: { href: "/dashboard/swms", label: "Open SWMS" },
    body: `## Create one
1. Go to **SWMS** and choose **New SWMS**.
2. Give it a title, pick the project and say whether it is high risk construction work.
3. Describe the work and choose **Draft SWMS** to have the AI write the steps, or fill in the first step yourself.
4. Create it. It starts as a **Draft**.

## Each step
A step has the task, the hazard, the controls and a risk rating before controls. Add or remove steps on the SWMS page.

## Activating and signing
- Choose **Activate** when it is ready. Only active SWMS can be signed.
- Everyone assigned to the project must sign. Open the SWMS and use **Sign** beside each name.
- Changing the steps **clears the signatures**, so the crew signs the new method.

## New versions
Choose **New version** to start a revised draft. The old version is kept as superseded, so you can show which was in force on a given day.

## AI review
On any SWMS, **AI safety review** checks for missing hazards, weak controls and gaps, with the wording to fix each one.`,
  },
  {
    id: "permits",
    title: "Permits to work",
    category: "Site safety",
    icon: "lock",
    summary: "Request, check, approve and close permits for high-risk tasks.",
    open: { href: "/dashboard/permits", label: "Open permits" },
    body: `## Request a permit
1. Go to **Permits to work** and choose **Request permit**.
2. Pick the type: hot work, confined space, excavation, work at height, electrical isolation, crane lift or demolition.
3. Say what the work is, where, who it is issued to and the dates it is valid.

Each type comes with its own safety checks.

## Checks and approval
Open the permit and tick each check as it is confirmed on site. **Approve** is only available once every check is ticked.

## Closing out
When the work is done, choose **Close out permit**. A permit that is still approved after its end date shows as **Expired, close out** and appears in your needs-attention list.`,
  },
  {
    id: "risk-register",
    title: "The risk register",
    category: "Site safety",
    icon: "alert",
    summary: "Record hazards, rate them, and keep controls under review.",
    open: { href: "/dashboard/risks", label: "Open the risk register" },
    body: `## Add a risk
Choose **Add risk**, name the hazard and rate it on the 5 by 5 matrix: likelihood times consequence, before and after controls. Use **Suggest** to have the AI propose the category, ratings and controls.

## The heat map
The grid on the left shows open and controlled risks by their rating after controls. Click a cell to filter the list to that rating, and click it again to clear.

## Keeping it current
Each risk has an owner and a **next review** date. Reviews that pass their date show as overdue. Change the status between **Open**, **Controlled** and **Closed** from the list.

## From a photo
Choose **Spot hazards in a photo**, add a picture of the work area, and the AI lists the hazards it can see. Add any of them to the register in one click.`,
  },
  {
    id: "toolbox-talks",
    title: "Toolbox talks and meetings",
    category: "Site safety",
    icon: "users",
    summary: "Start or schedule a briefing, then everyone signs.",
    open: { href: "/dashboard/toolbox", label: "Open toolbox talks" },
    body: `## Start now or schedule it
Choose **Start toolbox talk now** when a briefing happens on the spot, or **Schedule for later** to set a day and time. Each opens its own page rather than a pop-up. Pick the project, the template and who presents. Choose **Draft** to have the AI write the key points from what has happened on the project recently.

Scheduled ones appear in your needs-action list when their day and time arrive. Open it and choose **Start now**.

## Complete the form
Fill in your template: tick boxes, yes/no answers, written answers and numbers. Items marked * are required.

## Attendance and signatures
Everyone assigned to the project is on the list, and you can add anyone else from the project. Each attendee is linked to their own profile and signs by drawing their signature. Choose **Sign on this device** to hand over the screen, or **Send to their profile** so they sign from their own WHSCOMPLY profile. When you choose **Complete**, any listed person who has not signed is recorded as not attending.

## Your templates
Choose **Customise template** to decide what is recorded. Add sections and items, mark items required, add several templates and pick a default. A record keeps the template as it was when it started, so changing a template never rewrites past records.

## Other meetings
**Pre-start** holds the daily briefing before work starts. **WHS Meetings** holds WHS committee and coordination meetings. Both work the same way as toolbox talks.`,
  },
  {
    id: "inspections",
    title: "Inspections and checklists",
    category: "Site safety",
    icon: "clipboard",
    summary:
      "Run checklists, raise actions from failures and schedule routine checks.",
    open: { href: "/dashboard/inspections", label: "Open inspections" },
    body: `## Start an inspection
Choose **Start inspection** and pick a checklist: daily site walk, scaffold, plant and equipment, electrical and leads, excavation, or one you have built.

## Answering
Mark each item **Pass**, **Fail** or **N/A**. A **fail** raises a corrective action automatically and lets you add a photo and a note. When every item is answered, choose **Complete inspection**. Completed results are locked.

## Your own checklists
**Build a checklist with AI** turns a pasted checklist, or a photo or PDF of a paper form, into a checklist you can use. Edit it before saving.

## Schedules
The **Inspection schedule** card on the page sets how often each check is due, such as the daily walk or a weekly scaffold check. Overdue checks appear in your needs-attention list, and **Start now** opens one.`,
  },
  {
    id: "incidents",
    title: "Reporting and closing out an incident",
    category: "Site safety",
    icon: "shield",
    summary: "Report quickly, then follow the same steps every time.",
    open: { href: "/dashboard/incidents", label: "Open incidents" },
    body: `## Report it
Choose **Report incident**. You can speak it, photograph handwritten notes or type it, then choose **Fill the report** and the AI fills in the type, severity, location and times. It also says whether the incident may be notifiable, and suggests first corrective actions. Check everything before you save.

## The steps
Every incident moves through **Reported**, **Investigating**, **Corrective actions** and **Closed**.
- Before investigating, decide whether it is **notifiable** to the regulator. WHSCOMPLY cannot decide this for you.
- Record the **cause**. **Help me investigate** suggests root causes and actions.
- All corrective actions must be done before you can close it.

## Lost time injuries
Tick **Lost time injury** on an injury so it counts in the injury frequency rates on Reports.`,
  },
  {
    id: "actions",
    title: "Corrective actions",
    category: "Site safety",
    icon: "check",
    summary: "Track everything that has to be fixed, with an owner and a date.",
    open: { href: "/dashboard/actions", label: "Open actions" },
    body: `## Where actions come from
- A failed inspection item.
- An incident or its investigation.
- A risk, or something you raise by hand with **New action**.

## Working through them
Each action has an owner and a due date. Tick the box when it is done, or reopen it. Use the chips to see **Open**, **Overdue**, **Done** or **All**. Overdue actions appear in the bell and the dashboard.`,
  },

  /* ---------- site management ---------- */
  {
    id: "site-diary",
    title: "The site diary",
    category: "Site management",
    icon: "book",
    summary: "Record the day: weather, work, delays, safety and who was there.",
    open: { href: "/dashboard/diary", label: "Open the site diary" },
    body: `## New entry
Choose **New entry**, pick the project and date, and fill in the weather, a summary, the work completed, any delays and safety notes. Add photos if you have them.

## Attendance is automatic
The entry captures who is signed on at the gate when you write it. Sign people on and off from **Projects**.

## Weekly summary
Choose **Weekly summary** to have the AI write a client-ready summary from your records, which you can edit and copy.`,
  },
  {
    id: "defects",
    title: "Logging and closing defects",
    category: "Site management",
    icon: "pencil",
    summary: "Log defects with a priority and a person responsible.",
    open: { href: "/dashboard/defects", label: "Open defects" },
    body: `## Log one
Choose **Log defect**. Say it out loud or type it in the box at the top and choose **Fill the record**: the AI fills in the title, location, priority and due date, and only assigns people on your project. Add photos.

## Moving it along
Defects move **Open**, **In progress**, **Ready to inspect**, **Closed**. Critical defects, such as missing edge protection, appear at the top and in your needs-attention list.`,
  },
  {
    id: "drawings-rfis-programme",
    title: "Drawings, RFIs and the programme",
    category: "Site management",
    icon: "file",
    summary: "Keep the current set, chase answers and plan the work.",
    open: { href: "/dashboard/drawings", label: "Open drawings" },
    body: `## Drawings
Add a drawing and upload the sheet: the AI reads the number, title and revision. If the number already exists it is filed as a **new revision** and the old one is marked superseded, so nobody builds from an out-of-date sheet.

## RFIs
**Raise RFI** numbers the request, records who it is to and when you need an answer. Open the RFI to record the reply, then close it. Unanswered RFIs that are due soon appear in your needs-attention list.

## Programme
Add tasks with start and finish dates and drag the **progress** slider as work is done. For high risk tasks, WHSCOMPLY shows whether a matching SWMS is signed before the start date.`,
  },
  {
    id: "notices-photos",
    title: "Site notices and photos",
    category: "Site management",
    icon: "bell",
    summary:
      "Tell the crew what they need to know, and see every photo in one place.",
    open: { href: "/dashboard/notices", label: "Open site notices" },
    body: `## Site notices
Post a safety alert or update for one project or the whole business. Notices show who has read them, and you can mark people as read from the notice. Safety alerts are pinned.

## Photos
Photos added to diary entries, defects, incidents, inspection items and safety data sheets appear together on the **Photos** page, filtered by where they came from. Photos are stored in this browser in the demo.`,
  },

  /* ---------- plant and materials ---------- */
  {
    id: "plant",
    title: "Plant and equipment",
    category: "Plant and materials",
    icon: "settings",
    summary: "Onboard plant, then track pre-starts, services, test and tag, and defects.",
    open: { href: "/dashboard/plant", label: "Open plant" },
    body: `## Onboarding comes first
Plant is not added straight to the register. Choose **Onboard plant** (or open **Plant onboarding**) and put it forward for a site, whether it is yours or a subcontractor's. You then verify each document, inspect the plant when it arrives, and choose **Approve for site**. You can decline it with a reason. Plant that is not approved cannot be used and does not appear in the register.

Subcontractors put their own plant forward from their portal under **My plant**. They can only choose a site they have been allocated to, and they see why anything is declined, so they can correct it and send it again.

## What each type of plant has to supply
Pick the type of plant first and the form asks for what that type needs. Every field, document and file is required, and so is a photo of the whole machine.
- **Every type:** the manufacturer's instructions, evidence of the logbook (recent entries), the plant risk assessment, service and maintenance dates, and the meter reading for plant with an hours or kilometre meter.
- **Registration:** design registration and item registration are separate documents. Tower cranes, concrete booms and mobile cranes over 10 tonnes need both. Boom-type EWPs and hoists that lift people need design registration only. Road registration is asked for when the plant is road registered, and is always needed for mobile cranes and portable concrete booms.
- **Cranes:** a CraneSafe inspection report, the 10 yearly major inspection report, the lifting equipment register and the load chart. Tower plant also needs the engineer's specifications and design for its base. A tower crane's commissioning paperwork is not needed at onboarding because it is installed later: upload it afterwards from the plant's page (or the contractor's portal), verify it, and until then the crane cannot be pre-started.
- **Concrete booms:** a line thickness test report.
- **Insurance:** public liability insurance is not uploaded with the plant. It is checked against the contractor's own compliance documents, and plant cannot be approved if that is missing or expired.

Service is the scheduled check-up, fluid and part changes, or a call-out to fix a fault. Maintenance is routine care. Each has its own due date and, for plant with a meter, its own due reading in hours or kilometres.

## The register
Approved plant is grouped by site, with company plant and contractor plant shown separately, the project on every row and the plant's photo. Contractor plant is labelled. Choose **Take off site** when it leaves, and **Return to site** to bring it back.

## Operators and the daily pre-start
Open a piece of plant to choose its operators. They are picked from people inducted to that site, including labour hire, and each needs the right licence or competency for the plant type. Plant cannot be pre-started until it has an operator.

Choose **Log pre-start** once a day. It opens its own page: pick who is operating it, enter the meter reading (it cannot be lower than the last one), and answer the daily checks. A failed check takes the plant out of service. Items without a pre-start show that none is done today.

## Service and maintenance
Choose **Record service** or **Record maintenance** to open its page. Enter the reading it was done at and when it is next due, by date and by meter. Plant that is close to or past a due reading appears in your needs-action list.

## Defects
**Report defect** takes an item **out of service** and puts it in your needs-attention list. Choose **Return to service** once it is fixed.

## Service and tagging
**Record service** and **Record test and tag** log the work and set the next due date.`,
  },
  {
    id: "chemicals",
    title: "Hazardous chemicals and SDS",
    category: "Plant and materials",
    icon: "flag",
    summary:
      "Keep a register with a current safety data sheet for each product, and onboard subcontractors' SWMS and SDS.",
    open: { href: "/dashboard/chemicals", label: "Open chemicals" },
    body: `## Subcontractor onboarding
When a subcontractor accepts an invitation to a project, an onboarding starts for that project. It supplies its SWMS and a safety data sheet for every hazardous chemical it will bring, or says it will bring none. Plant can be skipped at first and put forward later.

Open **Chemical onboarding** to review it. Verify each SWMS and SDS, then choose **Approve for site**. You can decline with a reason, and the subcontractor corrects it and sends it again. This is a hold point: until you approve it, that subcontractor's workers cannot be approved for the site or signed on. Approved chemicals go onto the register, labelled with the subcontractor.

## The register
Add each hazardous chemical with its supplier, hazard class, quantity and where it is stored. Attach the safety data sheet file. Choose **Add chemical** for your own chemicals; it opens its own page.

## Keeping SDSs current
- Products with **no SDS** are flagged.
- An SDS more than five years old is flagged for renewal. Choose **Record new SDS** when you receive one.
- Choose **Removed from site** when a product leaves.`,
  },
  {
    id: "emergency",
    title: "Emergency management",
    category: "Plant and materials",
    icon: "bell",
    summary:
      "Assembly points, wardens and the drills that keep the plan working.",
    open: { href: "/dashboard/emergency", label: "Open emergency" },
    body: `## Emergency details
Each project has an assembly point, nearest hospital, emergency contact and wardens. Choose **Edit** on a project to change them. First aiders are listed from workers who hold a first aid ticket.

## Drills and checks
Choose **Record drill or check** for evacuation drills, warden checks, first aid kit checks and plan reviews. Set the next due date: when it passes, it appears in your needs-attention list.`,
  },

  /* ---------- people ---------- */
  {
    id: "workers-tickets",
    title: "Workers, tickets and licences",
    category: "People",
    icon: "id",
    summary: "Keep every white card and licence on file, with expiry alerts.",
    open: { href: "/dashboard/people", label: "Open workers" },
    body: `## Add a worker
Choose **Add worker**, enter their role and employer, and tick the projects they work on.

## Tickets
Open a worker and choose **Add ticket**. You can photograph a white card or licence and the AI reads the type, number and expiry, and warns you if the name does not match. White cards do not expire: leave the date blank.

## Expiry
Tickets that expire within your warning window show as expiring, and expired ones block sign-on at the gate. The **Training matrix** shows who holds which competency.`,
  },
  {
    id: "inductions",
    title: "Site access, inductions and the gate",
    category: "People",
    icon: "user",
    summary: "Approve contractor workers, induct them and sign them on and off.",
    open: { href: "/dashboard/projects", label: "Open projects" },
    body: `Open a project from **Projects** and choose its **Site access** tab.

## Contractor access requests
A subcontractor asks for each worker through its portal. The request appears here. **Approve** is available once the subcontractor is approved, the worker has a white card on file and no ticket has expired. **Decline** needs a reason, which the subcontractor sees.

## Induction content
Each project has its own list of induction topics. Choose **Edit** to add topics specific to that site, or remove any you do not need.

## Inducting a worker
Choose **Review and induct** next to a worker who is waiting. They tick each topic and type their full name to sign. The record shows who inducted them and when.

## Signing on and off
**Sign on** is available once a worker is inducted, has a white card and has no expired ticket. **Sign off** when they leave. Each sign on and off is logged with the time, and the dashboard and the diary show who is on site.`,
  },
  {
    id: "subcontractors",
    title: "Subcontractors and prequalification",
    category: "People",
    icon: "store",
    summary: "Check their paperwork before they start, and keep it current.",
    open: { href: "/dashboard/subcontractors", label: "Open subcontractors" },
    body: `## Add a subcontractor
Choose **Add subcontractor**, enter their email and choose the projects to invite them to. They join when they sign up with that email and accept. They start as **Pending**.

## When their work is done
A subcontractor can press **Mark my work complete** on a project. You get an alert, and you confirm it with the tick on their chip on this page. Their crew come off the project, and the job is kept as finished. You can also finish or remove a subcontractor yourself at any time.

## Prequalification
Open the **Prequalification** list and tick each check as you confirm it. **Approve for site** is only available when every check is ticked and no document has lapsed.

## Documents
Add insurances, workers' compensation and licences with their expiry dates, and attach the certificate. You can photograph a certificate and the AI reads the expiry. Documents that are expiring or lapsed appear in your needs-attention list.`,
  },
  {
    id: "visitors",
    title: "Visitors",
    category: "People",
    icon: "user",
    summary: "Sign visitors in and out and know who is on site.",
    open: { href: "/dashboard/projects", label: "Open projects" },
    body: `Open a project and choose its **Site access** tab. Choose **Sign in visitor**, enter who they are, their company, why they are here and who is hosting them. Say whether they have had a visitor induction: if not, they must be escorted at all times.

Choose **Sign out** when they leave. A visitor who is still signed in from an earlier day is flagged.`,
  },

  /* ---------- assistance and AI ---------- */
  {
    id: "assistance",
    title: "Using Assistance",
    category: "Assistance and AI",
    icon: "sparkle",
    summary: "Ask questions, or tell it what to get done.",
    open: { href: "/dashboard/assistant", label: "Open Assistance" },
    body: `## What it does
Assistance answers questions about Australian WHS, and about your own sites. It looks across your projects, SWMS, tickets, permits, plant, incidents and more. It can also **make changes**: raise actions, report incidents, add risks, schedule talks, log defects, raise RFIs, write diary entries, post notices, sign workers on and off, add programme tasks, sign visitors in, request permits and start inspections.

## You approve every change
Each change appears as a card with **Approve** and **Skip**. When there are several you can **Approve all** or **Skip all**. Switch off **Ask before making changes** if you would rather it just did them.

## What it will not do
Safety decisions stay with people. It cannot sign a SWMS or induction for anyone, approve a permit or tick its checks, approve a subcontractor, record inspection results, decide if an incident is notifiable, or close or delete records. It will link you to the right page instead.

## Demo mode
If the AI is not connected, a scripted run shows how it works using your real data.`,
  },
  {
    id: "ai-toolkit",
    title: "The AI toolkit",
    category: "Assistance and AI",
    icon: "list",
    summary: "Voice, photo and drafting tools built into each module.",
    open: { href: "/dashboard/ai", label: "Open the AI toolkit" },
    body: `The **AI toolkit** page lists every tool and where it lives:
- **Incident capture** and **scan notes** in Report incident.
- **SWMS drafter** and **safety review**.
- **Risk assessor** and **hazard spotting from a photo**.
- **Toolbox talk writer**, **checklist builder** and **investigation helper**.
- **Ticket and insurance scanners**, **voice defects** and the **drawing title-block reader**.
- **Weekly safety summary** and **text tools** (tidy, shorten, bullets, translate).

Every result is a draft you can edit. Nothing is saved until you press the normal save button, and AI can make mistakes, so check anything safety-critical.`,
  },

  /* ---------- business and settings ---------- */
  {
    id: "reports",
    title: "Reports and safety numbers",
    category: "Business and settings",
    icon: "scale",
    summary: "Injury rates, compliance and the weekly summary.",
    open: { href: "/dashboard/reports", label: "Open reports" },
    body: `## The numbers
Reports shows **LTIFR**, **TRIFR**, days since the last lost time injury and near miss and hazard reports, plus compliance for SWMS signatures, tickets, inspections, actions, documents and attendance.

## Hours worked
Injury frequency rates need hours worked. Enter them for each project in the table near the bottom. Definitions vary by industry body, so confirm which your clients use.

## Export
Choose **Export (CSV)** to download the numbers.`,
  },
  {
    id: "iso-vault",
    title: "ISO Vault: ISO 9001, 45001 and 14001 documents",
    category: "Business and settings",
    icon: "shield",
    summary: "Generate, review and approve the documents for quality, safety and environmental certification.",
    open: { href: "/dashboard/iso-vault", label: "Open ISO Vault" },
    body: `## What it is
ISO Vault writes the documentation for three standards: **ISO 9001** (quality), **ISO 45001** (health and safety) and **ISO 14001** (environmental). Each set has the policy, scope, procedures, registers, forms, an internal audit checklist and a management review template that an auditor expects.

## Cost
Each standard is a one-off **A$1,500**, with no subscription. You can browse the whole set for free, then choose **Unlock** on a standard to pay and start generating. Each standard is bought separately, and receipts are under **Settings, Billing**.

## Set it up
1. Open **ISO Vault** and fill in your business details. Everything is written from these, so the more specific you are, the better the documents.
2. Open a standard and choose **Generate** on one document, or **Generate all** for the whole set.
3. Open each document and read it. Choose **Edit** to change anything that is not how you work.
4. Choose **Approve** when you are happy. Required documents are marked, and the progress bar counts only approved ones.
5. **Download manual** gives you the whole set as one Word file. Each document also downloads as Word or Markdown, or print it to PDF.

## Your own records
Registers such as the hazard register, plant, chemicals and subcontractor lists are filled from what you already keep in WHSCOMPLY.

## Clause coverage
The **Clause coverage** tab lists every clause of the standard, the question an auditor asks and the documents that answer it.

## What it does not do
Documents do not certify you. A certification body accredited by JAS-ANZ audits a system you have put into practice and issues the certificate. Treat everything generated as a draft, and check anything with legal consequences with your regulator or adviser.`,
  },
  {
    id: "billing-plans",
    title: "Changing your plan and billing",
    category: "Business and settings",
    icon: "scale",
    summary: "Upgrade, downgrade, update your card and download tax invoices.",
    open: { href: "/dashboard/settings", label: "Open settings" },
    body: `## Your plan
Open **Settings**, then **Billing**. Small is A$149, Medium A$349 and Large A$549 a month plus GST, by the number of live projects, never per worker. Subcontractors are free. Billing runs by calendar month and renews on the 1st.

## Upgrading
Choose a bigger plan. It starts straight away. You see the exact figures first: the rest of the month on the new plan, less the unused part of the old one, plus GST. That difference is charged to your card now, with a tax invoice. From the next billing date you pay the new monthly price.

## Downgrading
Choose a smaller plan. You keep your current plan until the next billing date and then move down. There is no refund for the rest of the month. You can cancel the change before then. You cannot move to a plan with fewer live projects than you have, so close or archive finished projects first.

## During the free trial
Switching plan is free and takes effect immediately. The first charge is when the trial ends.

## Card and invoices
**Update card** replaces the card on file. Only the brand, last four digits and expiry are kept. Every charge has a tax invoice you can download, with GST shown separately.`,
  },
  {
    id: "documents-audit",
    title: "Documents and the audit pack",
    category: "Business and settings",
    icon: "book",
    summary: "Policies that people sign, and records you can prove.",
    open: { href: "/dashboard/documents", label: "Open documents" },
    body: `## Documents
Add policies, procedures and plans and attach the file. Open one to see who has read and signed it, and choose **Mark read** beside each person. **Issue new version** clears the signatures so everyone signs the new one. Each document has a review date.

## The audit log
Every change in WHSCOMPLY writes an entry: who, what, when and what it was before. Entries cannot be edited or deleted. Filter by area, or search.

## The audit pack
On **Audit log**, choose **Log (CSV)** for the log, or **Audit pack** to download every record for the project you have picked.`,
  },
  {
    id: "settings",
    title: "Settings, team and notifications",
    category: "Business and settings",
    icon: "settings",
    summary:
      "Business details, who has access, and what you are reminded about.",
    open: { href: "/dashboard/settings", label: "Open settings" },
    body: `## Company
Your business name, ABN, phone and safety contact email, which appear on audit packs. **Reset demo** here returns the workspace to its starting data.

## Team
Invite people and choose their role: Owner, Admin, Site manager, Worker or Inspector. Inspectors get free, read-only access. Change a role from the list, or remove someone.

## Notifications
Switch reminders on or off and set how many days of warning you want before tickets and documents expire.`,
  },
];

export const helpById = (id: string) => HELP.find((a) => a.id === id);
