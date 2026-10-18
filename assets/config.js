/* =============================================================================
   HER HEALTH, HER VOICE — STUDY CONFIGURATION
   -----------------------------------------------------------------------------
   This is the ONE file to edit for wording, eligibility rules, contact details
   and backend URLs. You should not need to touch app.js or schedule.js.

   Search for "TODO(go-live)" to find everything that must change before launch.
   ============================================================================= */

window.STUDY_CONFIG = {

  /* ---------------------------------------------------------------------------
     1. BACKEND + SCHEDULING
     Leave both empty to run as a self-contained demo: submissions and name
     lookups are simulated in the browser and the mock calendar is shown.
     --------------------------------------------------------------------------- */

  // TODO(go-live): paste the Web app URL from Apps Script → Deploy → Manage
  // deployments (it ends in /exec).
  APPS_SCRIPT_URL: '',

  // TODO(go-live): paste the embed URL of your Google Calendar appointment
  // schedule (Calendar → your appointment schedule → Share → Website embed →
  // copy only the src="…" value of the iframe).
  GOOGLE_APPOINTMENT_EMBED_URL: '',

  // TODO(go-live): your custom domain (no trailing slash). Must match SITE_URL
  // in Code.gs so scheduling links point to the right place.
  SITE_URL: 'https://ctnguy16.github.io/her-health-her-voice',

  /* ---------------------------------------------------------------------------
     2. STUDY DETAILS (shown on the pages)
     --------------------------------------------------------------------------- */
  STUDY: {
    title: 'Her Health, Her Voice',                                   // TODO(go-live): final study name
    purpose: 'A UC Irvine research study listening to Vietnamese American women about their experiences with cervical cancer screening.',
    researcher: 'Christine Nguyen',                                    // TODO(go-live): name + credentials as approved by the IRB
    researcherRole: 'Doctoral student',
    affiliation: 'Joe C. Wen School of Population & Public Health, University of California, Irvine',
    facultyAdvisor: '[Faculty advisor name], PhD',                     // TODO(go-live)
    contactEmail: 'ctnguy16@uci.edu',                            // TODO(go-live): study email participants can write to
    giftAmount: '$25 e-gift card',                                     // TODO(go-live): thank-you gift as approved by the IRB
    interviewLength: '60–90 minutes',
    screenerLength: 'about 2 minutes',
    irbNumber: 'UCI IRB #[pending]',                                   // TODO(go-live)
    responseTime: 'within 2 weeks',                                    // how soon you reply to eligible people
    screeningResourcesUrl: 'https://www.cdc.gov/cervical-cancer/screening/index.html', // TODO(go-live): confirm the resource link you want to share
    screeningResourcesLabel: 'Learn about cervical cancer screening (CDC)'
  },

  /* Link for "Click here to see the study information sheet." on the home page.
     TODO(go-live): paste the Google Doc link (Share → General access: "Anyone with the
     link" → Viewer). While empty, the link opens the placeholder sheet below instead. */
  STUDY_INFO_DOC_URL: '',

  /* ---------------------------------------------------------------------------
     3. STUDY INFORMATION SHEET (placeholder for the IRB-approved text)
     TODO(go-live): replace every section with the IRB-approved study
     information sheet. Each item is a heading and one or more paragraphs.
     --------------------------------------------------------------------------- */
  STUDY_INFO: [
    { heading: 'Why we are doing this study',
      body: ['[Placeholder] We want to understand what shapes Vietnamese American women’s decisions and experiences around cervical cancer screening, so that screening services can better meet their needs.'] },
    { heading: 'What you would do',
      body: ['[Placeholder] First, answer a few short questions to see if you can take part. If you may be a good fit and choose to share your contact details, the researcher may invite you to one private interview on Zoom lasting 60–90 minutes.',
             '[Placeholder] You can skip any question and stop at any time.'] },
    { heading: 'Risks and benefits',
      body: ['[Placeholder] Some questions are personal. There is no direct benefit to you, but your experiences may help improve care for other women.'] },
    { heading: 'Thank-you gift',
      body: ['[Placeholder] People who complete an interview receive a $25 e-gift card.'] },
    { heading: 'Your privacy',
      body: ['[Placeholder] The eligibility questions are anonymous. If you share your name and email, they are stored securely by UC Irvine and used only to contact you about this study. Interview recordings and notes will not include your name.'] },
    { heading: 'Taking part is your choice',
      body: ['[Placeholder] Participation is voluntary. Choosing not to take part will not affect your health care or any services you receive.'] },
    { heading: 'Questions',
      body: ['[Placeholder] Contact the study team at ctnguy16@uci.edu. For questions about your rights as a research participant, contact the UC Irvine Office of Research, Institutional Review Board.'] }
  ],

  /* ---------------------------------------------------------------------------
     4. ELIGIBILITY QUESTIONS
     Each question:
       id        – the field name saved in the data (keep it stable)
       label     – short column label used in the spreadsheet and emails
       type      – 'number' | 'choice' | 'state'
       text      – the question
       helper    – optional plain explanation under the question
       why       – optional gentle "Why we ask" note (currently only on question 5)
       options   – for 'choice': [{ value, label, result, flags?, followUp? }]
                   result: 'eligible' | 'ineligible' | 'review' | 'followUp'
                   followUp: id of a follow-up question shown next (it is not
                   counted in "Question X of 7"; its answer decides the result)
       eligibleMin / eligibleMax – for 'number'
     Everyone answers every question before any result is shown.
     --------------------------------------------------------------------------- */
  QUESTIONS: [
    {
      id: 'age', label: 'Age', type: 'number',
      text: 'How old are you?',
      placeholder: 'Your age in years',
      eligibleMin: 30, eligibleMax: 65,
      validMin: 1, validMax: 120,
      invalidMessage: 'Please enter your age as a number, like 42.'
    },
    {
      id: 'vietnamese', label: 'Identifies as Vietnamese / Vietnamese American', type: 'choice',
      text: 'Do you identify as Vietnamese and/or Vietnamese American?',
      helper: 'This includes people who are Vietnamese along with another background.',
      options: [
        { value: 'yes', label: 'Yes', result: 'eligible' },
        { value: 'no',  label: 'No',  result: 'ineligible' }
      ]
    },
    {
      id: 'woman', label: 'Identifies as a woman', type: 'choice',
      text: 'Do you identify as a woman?',
      options: [
        { value: 'yes', label: 'Yes', result: 'eligible' },
        { value: 'no',  label: 'No',  result: 'ineligible' }
      ]
    },
    {
      id: 'hysterectomy', label: 'Total hysterectomy', type: 'choice',
      text: 'Have you had surgery to remove your uterus and cervix (a total hysterectomy)?',
      options: [
        { value: 'yes',      label: 'Yes', result: 'ineligible' },
        { value: 'no',       label: 'No',  result: 'eligible' }
      ]
    },
    {
      id: 'last_test', label: 'Most recent Pap/HPV test', type: 'choice',
      text: 'About how long ago was your most recent Pap test or HPV test?',
      helper: 'These are tests that check for cervical cancer. A sample is collected from the cervix, either by a provider or by yourself with a kit. It’s okay if you’re not sure of the exact time.',
      why: 'There are no wrong answers. Many women have not had a recent test, and their experiences are exactly what this study wants to hear.',
      options: [
        { value: 'lt3',      label: 'Less than 3 years ago',  result: 'ineligible' },           // up to date
        { value: '3to5',     label: '3 to 5 years ago',       result: 'followUp', followUp: 'test_type' },
        { value: 'gt5',      label: 'More than 5 years ago',  result: 'eligible' },             // under-screened
        { value: 'never',    label: 'I have never had one',   result: 'eligible', flags: { neverScreened: true } },
        { value: 'not_sure', label: 'I’m not sure',           result: 'review' }
      ]
    },
    {
      // Follow-up: shown ONLY after "3 to 5 years ago". Not counted in the progress total.
      id: 'test_type', label: 'Which test (if 3–5 years ago)', type: 'choice', followUpOnly: true,
      text: 'Do you know which test it was?',
      helper: 'A Pap test looks at cells from the cervix. An HPV test checks for the virus that can cause cervical cancer. Sometimes both are done at the same visit.',
      options: [
        { value: 'pap_only', label: 'A Pap test only',                               result: 'eligible' },   // under-screened (Pap every 3 years)
        { value: 'hpv',      label: 'An HPV test (alone or together with a Pap test)', result: 'ineligible' }, // up to date (HPV/co-test every 5 years)
        { value: 'not_sure', label: 'I’m not sure',                                  result: 'review' }
      ]
    },
    {
      id: 'state', label: 'State of residence', type: 'state',
      text: 'Which state do you live in?',
      helper: 'Start typing, then choose your state from the list.',
      outsideLabel: 'I live outside the United States',
      outsideValue: 'outside_us'
    },
    {
      id: 'english', label: 'Comfortable with an English interview', type: 'choice',
      text: 'Are you comfortable reading and speaking in English for an interview of about 60–90 minutes?',
      options: [
        { value: 'yes', label: 'Yes', result: 'eligible' },
        { value: 'no',  label: 'No',  result: 'ineligible' }
      ]
    }
  ],

  /* States accepted for question 6. Edit this list to narrow or widen recruitment.
     Anything not on the list (including "outside the United States") = not eligible. */
  ACCEPTED_STATES: [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ],

  /* How answers combine into one outcome (do not reveal which answer decided it):
     any 'ineligible' → Not eligible; otherwise any 'review' → Needs review;
     otherwise → Eligible. "Needs review" looks like Eligible to the participant. */
  OUTCOME_LABELS: { eligible: 'Eligible', review: 'Needs review', ineligible: 'Not eligible' },

  /* ---------------------------------------------------------------------------
     5. SCHEDULING PAGE
     --------------------------------------------------------------------------- */
  SCHEDULING: {
    // Mock calendar only (used when GOOGLE_APPOINTMENT_EMBED_URL is empty).
    // Interview start times in the study team's time zone; each lasts 90 minutes.
    teamTimeZone: 'America/Los_Angeles',
    slotMinutes: 90,
    weekdaySlots: ['09:00', '12:00', '17:30', '19:00'],
    saturdaySlots: ['10:00', '13:00'],
    daysAhead: 14
  },

  // DEMO ONLY: fake participants for the scheduling page when APPS_SCRIPT_URL is
  // empty. Try schedule/?id=abc123. Delete or ignore once the backend is live.
  MOCK_PARTICIPANTS: {
    abc123: 'Lan',
    xk72pq: 'Mai',
    h9w3rt: 'Thu'
  }
};
