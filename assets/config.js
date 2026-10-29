/* =============================================================================
   SPEAKING OF SCREENING — STUDY CONFIGURATION
   -----------------------------------------------------------------------------
   This is the ONE file to edit for wording, eligibility rules, contact details
   and backend URLs. You should not need to touch app.js or schedule.js.

   Search for "TODO(go-live)" to find everything that must change before launch.
   ============================================================================= */

window.STUDY_CONFIG = {

  /* ---------------------------------------------------------------------------
     1. BACKEND
     Leave APPS_SCRIPT_URL empty to run as a self-contained demo: submissions,
     name lookups and bookings are simulated in the browser and mock interview
     times are shown. Once it is set, the scheduling page shows the open times
     from your Google Calendar and books them (times are set in Code.gs).
     --------------------------------------------------------------------------- */

  // TODO(go-live): paste the Web app URL from Apps Script → Deploy → Manage
  // deployments (it ends in /exec).
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby5_kej8PiSdVgGgjW6q6rYgoS9u_dVFaiBnwBi1oGL8Xca4MaB1UcgJ5uAiEVibSBXWg/exec',

  // TODO(go-live): your custom domain (no trailing slash). Must match SITE_URL
  // in Code.gs so scheduling links point to the right place.
  SITE_URL: 'https://speakingofscreening.com',

  /* ---------------------------------------------------------------------------
     2. STUDY DETAILS (shown on the pages)
     --------------------------------------------------------------------------- */
  STUDY: {
    title: 'Speaking of Screening',                                   // TODO(go-live): final study name
    purpose: 'A UC Irvine research study listening to Vietnamese American women about their experiences with cervical cancer screening.',
    researcher: 'Christine Nguyen',                                    // TODO(go-live): name + credentials as approved by the IRB
    researcherRole: 'Doctoral student',
    affiliation: 'Joe C. Wen School of Population & Public Health, University of California, Irvine',
    facultyAdvisor: '[Faculty advisor name], PhD',                     // TODO(go-live)
    contactEmail: 'ctnguy16@uci.edu',                            // TODO(go-live): study email participants can write to
    giftAmount: '$25',                                                // TODO(go-live): thank-you gift as approved by the IRB
    interviewLength: '60–90 minutes',
    screenerLength: 'about 2 minutes',
    irbNumber: 'UCI IRB #STUDY00001839',
    responseTime: 'within 2 weeks',                                    // how soon you reply to eligible people
    screeningResourcesUrl: 'https://www.cdc.gov/cervical-cancer/screening/index.html', // TODO(go-live): confirm the resource link you want to share
    screeningResourcesLabel: 'Learn about cervical cancer screening (CDC)'
  },

  /* Link for "Click here to see the study information sheet." on the home page.
     Leave empty so the link opens the study information sheet below, inside the site.
     (If a URL is set here, the link opens that page in a new tab instead.) */
  STUDY_INFO_DOC_URL: '',

  /* ---------------------------------------------------------------------------
     3. STUDY INFORMATION SHEET (IRB-approved text, word for word)
     Source: https://docs.google.com/document/d/122cAlYqWAD0s9K7O6APSY7Yg-mNhDYZW/edit
     When that document changes, copy the new wording here exactly.
     Inline formatting: **bold** and _italic_. Email addresses become links.
     items: each string is one bullet; { heading, body } is a bullet with a
     title line and a paragraph under it.
     --------------------------------------------------------------------------- */
  STUDY_INFO: {
    version: 'UCI IRB Version: Study Info Sheet – Exempt – October 2026',
    institution: 'University of California, Irvine',
    title: 'Study Information Sheet',
    studyTitle: 'Speaking of Screening: Understanding Cervical Cancer Screening Perceptions and Acceptance among Vietnamese American Women',
    people: [
      { role: 'PRINCIPAL INVESTIGATOR',
        lines: ['Christine T. Nguyen, MPH', 'Public Health: Health, Society, & Behavior', 'Ctnguy16@uci.edu'] },
      { role: 'FACULTY ADVISOR',
        lines: ['Sora Park Tanjasiri, MPH, DrPH', 'Public Health: Health, Society, & Behavior', 'tanjasir@hs.uci.edu'] }
    ],
    items: [
      'Please read the information below and ask questions about anything that you do not understand.  A researcher listed above will be available to answer your questions.',
      'You are being asked to participate in a research study. Participation in this study is voluntary.  You may choose to skip a question or a study procedure. You may refuse to participate or discontinue your involvement at any time without penalty or loss of benefits.  You are free to withdraw from this study at any time. **If you decide to withdraw from this study you should notify the research team immediately**.',
      'We would like you to complete an interview to learn more about cervical cancer screening knowledge, perceptions, needs, and self-efficacy among never- and under-screened Vietnamese American women aged 30–65, comparing perceptions of three screening modalities: (1) clinician-collected Pap/HPV testing, (2) HPV self-sampling in a clinic, and (3) HPV self-sampling at home. A secondary goal is to examine how nativity, age at arrival, and length of U.S. residence shape these perceptions.',
      'The study procedures will last about 60 to 90 minutes.',
      'Possible risks/discomforts associated with the study are minimal. Further, participation in this study does not place participants at risk for criminal or civil liability. Participation is voluntary and participants will be told that they do not need to respond to any question that they choose not to answer. However, some questions may result in physical, mental, or emotional discomfort, particularly recounting experiences related to cancer and cervical cancer screening.',
      'There are no direct benefits from participation in the study.  However, this study may contibute to the knowledge about how to understand, support, and promote cervical cancer screening access, acceptance, and uptake among non- and under-screened Vietnamese American women to close the cervical cancer burden.',
      'You will receive $30 for your participation in this study.',
      'All research data collected will be stored securely and confidentially. Research data will be stored electronically on a laptop computer in an encrypted file that is password protected. The audio recordings will contain no personal identifiers that can be used to identify you; they will also be stored in a secure location, and deleted after transcription is completed.',
      { heading: '_Future Research Use_',
        body: 'Researchers will use your information to conduct this study. Once the study is done using your information, we may share them with other researchers so they can use them for other studies in the future. We will not share your name or any other private identifiable information that would let the researchers know who you are. We will not ask you for additional permission to share this de-identified information.' },
      'Questions? If you have any comments, concerns, or questions regarding this study please contact the researchers listed at the top of this form.',
      'If you have questions or concerns about your rights as a research participant, you can contact the UCI Institutional Review Board by phone, (949) 824-8170, by e-mail at IRB@research.uci.edu or by mail at University of California, Irvine, Office of Research, Irvine, CA 92697-7600.'
    ],
    closing: '**What is an IRB?**  An Institutional Review Board (IRB) is a committee made up of scientists and non-scientists.  The IRB’s role is to protect the rights and welfare of human subjects involved in research.  The IRB also assures that the research complies with applicable regulations, laws, and institutional policies.'
  },

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
     An 'ineligible' answer ends the screener right away (remaining questions
     are skipped); otherwise everyone answers every question before a result.
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
      text: 'Are you comfortable speaking in English for an interview of about 60–90 minutes?',
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

  /* How answers combine into one outcome (the result screen does not say which
     answer decided it): an 'ineligible' answer → Not eligible as soon as it is
     given; otherwise any 'review' → Needs review;
     otherwise → Eligible. "Needs review" looks like Eligible to the participant. */
  OUTCOME_LABELS: { eligible: 'Eligible', review: 'Needs review', ineligible: 'Not eligible' },

  /* ---------------------------------------------------------------------------
     5. SCHEDULING PAGE
     --------------------------------------------------------------------------- */
  SCHEDULING: {
    // DEMO ONLY (used while APPS_SCRIPT_URL is empty). On the live site the
    // interview times, length and booking window come from the INTERVIEW
    // SCHEDULING settings in Code.gs; keep these similar so the demo looks right.
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
