# Research Synthesis: Pneumonia Discharge Readiness & 30-Day Readmission Risk

> Literature foundation for the runtime's risk-scoring logic. All citations were verified against primary sources (journal, year, DOI/URL) during drafting. Items that could not be verified to a primary source are explicitly flagged. This is a synthesis to ground design choices for a **synthetic, non-clinical** reference implementation — not a clinical guideline.

## 1. CAP Severity & Discharge-Stability Tools

Two validated severity tools anchor community-acquired pneumonia (CAP) triage: **CURB-65** (Confusion, Urea >7 mmol/L, Respiratory rate ≥30, low Blood pressure, age ≥65) and the more granular 20-variable **Pneumonia Severity Index (PSI/PORT)**, which stratifies 30-day mortality into five risk classes. The **2019 ATS/IDSA guideline** recommends PSI over CURB-65 for the site-of-care decision and defines *clinical stability* for safe discharge: stable vitals (temperature, heart rate, respiratory rate, blood pressure, oxygen saturation), ability to maintain oral intake, and normal mental status. These stability criteria — not symptom resolution alone — govern discharge timing and directly motivate the runtime's "unresolved-infection" domain.

- Lim WS, van der Eerden MM, Laing R, et al. *Defining community acquired pneumonia severity on presentation to hospital.* **Thorax** 2003;58(5):377–382. doi:[10.1136/thorax.58.5.377](https://doi.org/10.1136/thorax.58.5.377)
- Fine MJ, Auble TE, Yealy DM, et al. *A prediction rule to identify low-risk patients with community-acquired pneumonia.* **N Engl J Med** 1997;336(4):243–250. doi:[10.1056/NEJM199701233360402](https://doi.org/10.1056/NEJM199701233360402)
- Metlay JP, Waterer GW, Long AC, et al. *Diagnosis and Treatment of Adults with Community-acquired Pneumonia. An Official ATS/IDSA Clinical Practice Guideline.* **Am J Respir Crit Care Med** 2019;200(7):e45–e67. doi:[10.1164/rccm.201908-1581ST](https://doi.org/10.1164/rccm.201908-1581ST)

## 2. 30-Day Readmission Risk Models

The **LACE index** (Length of stay, Acuity, Comorbidity/Charlson, Emergency-department visits) predicts 30-day death or unplanned readmission and was derived/validated in Ontario cohorts. The **HOSPITAL score** (Hemoglobin, discharge from Oncology, Sodium, Procedure, Index admission type, prior Admissions, Length of stay) specifically targets *potentially avoidable* readmissions. Pneumonia-specific evidence shows 30-day readmission rates of ~15–20%, with most readmissions driven by comorbidities (COPD, heart failure, sepsis) rather than recurrent pneumonia. Pneumonia is a **CMS Hospital Readmissions Reduction Program (HRRP)** tracked condition (among the original three since FY2013), making readmission both a clinical and financial endpoint.

- van Walraven C, Dhalla IA, Bell C, et al. *Derivation and validation of an index to predict early death or unplanned readmission after discharge.* **CMAJ** 2010;182(6):551–557. doi:[10.1503/cmaj.091117](https://doi.org/10.1503/cmaj.091117)
- Donzé J, Aujesky D, Williams D, Schnipper JL. *Potentially Avoidable 30-Day Hospital Readmissions in Medical Patients.* **JAMA Intern Med** 2013;173(8):632–638. doi:[10.1001/jamainternmed.2013.3023](https://doi.org/10.1001/jamainternmed.2013.3023)
- Centers for Medicare & Medicaid Services. *Hospital Readmissions Reduction Program (HRRP).* [cms.gov](https://www.cms.gov/medicare/payment/prospective-payment-systems/acute-inpatient-pps/hospital-readmissions-reduction-program-hrrp)
- *Pneumonia Readmissions: Risk Factors and Implications.* **Ochsner J** 2014;14(4):649–654.

## 3. Frailty Measurement

The **Rockwood Clinical Frailty Scale (CFS)** is a 9-point judgment-based ordinal scale derived from the Canadian Study of Health and Aging; the same group's **accumulation-of-deficits frailty index** quantifies frailty as the proportion of health deficits present. Frailty is independently associated with adverse post-discharge outcomes — mortality, prolonged recovery, and readmission — over and above age and individual comorbidities, supporting frailty as a distinct scoring domain.

- Rockwood K, Song X, MacKnight C, Mitnitski A, et al. *A global clinical measure of fitness and frailty in elderly people.* **CMAJ** 2005;173(5):489–495. doi:[10.1503/cmaj.050051](https://doi.org/10.1503/cmaj.050051)

> Note: the deficit-accumulation framework (Mitnitski & Rockwood) predates the 2005 CFS paper; the CFS itself is introduced in the 2005 CMAJ paper above.

## 4. Social Determinants of Health (SDOH) & Readmission

Empirical work links SDOH — low socioeconomic status, limited medication/pharmacy access, social isolation/living alone, and low health literacy — to elevated avoidable readmission risk. SDOH variables can improve predictive models beyond clinical features alone, though effect sizes vary and many studies remain observational. This evidence underpins the runtime's "environmental/medication-access" domain.

- Bensken WP, Alberti PM, Koroukian SM, et al. *Assessing the impact of social determinants of health on predictive models for potentially avoidable 30-day readmission or death.* **PLOS One** 2020;15(6):e0235064. doi:[10.1371/journal.pone.0235064](https://doi.org/10.1371/journal.pone.0235064)
- *Social Determinants of Health and 30-Day Readmissions Among Adults Hospitalized for Heart Failure (REGARDS).* **Circ Heart Fail** 2021;14(12):e008409. doi:[10.1161/CIRCHEARTFAILURE.121.008409](https://doi.org/10.1161/CIRCHEARTFAILURE.121.008409)

> Flag: specific SDOH effect magnitudes circulating in secondary sources were not traced to a single verifiable primary study and are omitted. Treat SDOH effect sizes as setting-dependent.

## 5. Health-Equity / Fairness Cautions

Obermeyer et al. demonstrated that a widely deployed risk algorithm exhibited substantial racial bias because it used **healthcare cost as a proxy for health need** — equally sick Black patients were scored lower-risk because less money had historically been spent on their care. The lesson for SDOH-driven scoring is twofold: proxy targets can encode structural inequity, and models must **not infer or act on protected-class membership**. SDOH features should *expand* support (e.g., flagging a patient who lives alone for pharmacy follow-up), never ration it, and must be auditable for differential impact.

- Obermeyer Z, Powers B, Vogeli C, Mullainathan S. *Dissecting racial bias in an algorithm used to manage the health of populations.* **Science** 2019;366(6464):447–453. doi:[10.1126/science.aax2342](https://doi.org/10.1126/science.aax2342)

## 6. "Institutional Memory / Reusable Clinical Tooling" Framing

A *reusable clinical tooling* framing is supported by industry/agency precedent, though "institutional memory" as a named construct is informal. AHRQ's **CDS Connect** and the **SMART** platform exemplify shared, interoperable, open-source clinical-logic artifacts; AHRQ has cited redundant guideline-to-CDS translation as a systemic cost — the core argument for reuse. We found no peer-reviewed source defining "institutional memory" as a clinical-informatics term; that framing is presented here as design philosophy, not established literature.

- Mandl KD, Mandel JC, Kohane IS, et al. *Health Care Transformation Through Collaboration on Open-Source Informatics Projects (SMART).* **Interact J Med Res** 2013;2(1):e11. doi:[10.2196/ijmr.2454](https://doi.org/10.2196/ijmr.2454)
- AHRQ. *CDS Connect* repository and authoring tools. [cds.ahrq.gov](https://cds.ahrq.gov/cdsconnect)

---

### How This Informs the Runtime's Scoring Choices

The evidence maps cleanly onto three risk domains. **Frailty** is scored as a distinct dimension because the Rockwood CFS and deficit-accumulation literature show it predicts post-discharge deterioration independently of age and diagnosis. **Unresolved-infection** draws on ATS/IDSA clinical-stability criteria and CAP severity tools (CURB-65, PSI) — the runtime weights unstable vitals and rising inflammatory markers as discharge-readiness blockers rather than relying on symptom resolution. **Environmental/medication-access** operationalizes the SDOH–readmission evidence (medication/pharmacy access, living alone, health literacy) and is constrained by the Obermeyer fairness lesson: these features may only *add* supportive follow-up, must avoid protected-class inference, and must be auditable for differential impact. Together the three domains reflect that pneumonia readmission is driven less by the index infection than by frailty, comorbidity, and the post-discharge environment.

*Scope reminder: the scoring weights in this repository are illustrative and synthetic. None of these instruments is clinically validated; real deployment would require local calibration, prospective validation, and regulatory review.*
