COUNTRIES = [
    {"id": "ARG", "name": "Argentina"},
    {"id": "BLZ", "name": "Belize"},
    {"id": "BOL", "name": "Bolivia"},
    {"id": "BRA", "name": "Brazil"},
    {"id": "CHL", "name": "Chile"},
    {"id": "COL", "name": "Colombia"},
    {"id": "CRI", "name": "Costa Rica"},
    {"id": "ECU", "name": "Ecuador"},
    {"id": "SLV", "name": "El Salvador"},
    {"id": "GTM", "name": "Guatemala"},
    {"id": "GUY", "name": "Guyana"},
    {"id": "HND", "name": "Honduras"},
    {"id": "MEX", "name": "Mexico"},
    {"id": "NIC", "name": "Nicaragua"},
    {"id": "PAN", "name": "Panama"},
    {"id": "PRY", "name": "Paraguay"},
    {"id": "PER", "name": "Peru"},
    {"id": "SUR", "name": "Surinam"},
    {"id": "URY", "name": "Uruguay"},
    {"id": "VEN", "name": "Venezuela"},
]

OBLIGATIONS = [
    {
        "id": "IHR_Art04_NFP_Designation",
        "ihr_provision": "Art. 4",
        "normative_content": "Each State Party shall designate or establish a National IHR Focal Point and ensure it is accessible at all times for communication with WHO.",
        "required_domestic_functions": "Formal designation authority; intersectoral information access; international communication mandate.",
        "observance": "Explicit legal designation of NFP; mandate to collect multisectoral data; authority to communicate internationally without prior political approval.",
        "compliance_indicator": "NFP established by law (Yes/No); 24/7 availability mandated (Yes/No); autonomous notification authority (Yes/No)."
    },
    {
        "id": "IHR_Art05_Core_Surveillance",
        "ihr_provision": "Art. 5 + Annex 1A",
        "normative_content": "Each State Party shall develop, strengthen and maintain the capacity to detect, assess, notify and report events.",
        "required_domestic_functions": "National surveillance system; mandatory reporting duties; risk assessment mechanism.",
        "observance": "Legal obligation for public and private entities to report notifiable events; defined surveillance authority; incorporation of Annex 1 capacities.",
        "compliance_indicator": "Mandatory reporting established (Yes/No); legal surveillance authority defined (Yes/No)."
    },
    {
        "id": "IHR_Art13_Response_Capacity",
        "ihr_provision": "Art. 13 + Annex 1A",
        "normative_content": "Each State Party shall develop, strengthen and maintain capacity to respond promptly and effectively to public health risks.",
        "required_domestic_functions": "Emergency health powers; rapid response teams; coordination authority.",
        "observance": "Legal framework for declaring health emergency; defined emergency powers; rapid response authority established.",
        "compliance_indicator": "Emergency powers defined in law (Yes/No); rapid response structure legally established (Yes/No)."
    },
    {
        "id": "IHR_Art19_PoE_Designation",
        "ihr_provision": "Art. 19–20",
        "normative_content": "States Parties shall designate points of entry and develop required capacities.",
        "required_domestic_functions": "Formal designation of PoE; border health authority; inspection powers.",
        "observance": "Legal act designating PoE; defined sanitary inspection powers at borders.",
        "compliance_indicator": "PoE designated by law (Yes/No); border health authority defined (Yes/No)."
    },
    {
        "id": "IHR_Art21_Competent_Authorities",
        "ihr_provision": "Art. 21–22",
        "normative_content": "States Parties shall ensure competent authorities are responsible for implementation of health measures.",
        "required_domestic_functions": "Allocation of enforcement powers; inspection and control authority.",
        "observance": "Explicit legal attribution of coercive health powers; defined enforcement competence.",
        "compliance_indicator": "Competent authority defined in law (Yes/No); enforcement powers specified (Yes/No)."
    },
    {
        "id": "IHR_Art23_Health_Measures_Travellers",
        "ihr_provision": "Art. 23",
        "normative_content": "States Parties may require medical examination or other health measures in accordance with the Regulations.",
        "required_domestic_functions": "Authority to impose medical exams; proportionality standards.",
        "observance": "Legal basis for compulsory examination; due process safeguards; proportionality clause.",
        "compliance_indicator": "Compulsory medical exam authorized in law (Yes/No); safeguards included (Yes/No)."
    },
    {
        "id": "IHR_Art30_Observation",
        "ihr_provision": "Art. 30",
        "normative_content": "States Parties may place travellers under public health observation.",
        "required_domestic_functions": "Movement restriction authority; monitoring mechanism.",
        "observance": "Explicit legal authority for observation measures; duration limits specified.",
        "compliance_indicator": "Observation measure legally defined (Yes/No); time limits defined (Yes/No)."
    },
    {
        "id": "IHR_Art31_Entry_Conditions",
        "ihr_provision": "Art. 31",
        "normative_content": "States Parties may require vaccination, prophylaxis or quarantine as condition of entry.",
        "required_domestic_functions": "Vaccination requirement authority; quarantine power.",
        "observance": "Legal authority for mandatory vaccination or quarantine; appeal mechanism provided.",
        "compliance_indicator": "Vaccination/quarantine legally authorized (Yes/No); appeal mechanism exists (Yes/No)."
    },
    {
        "id": "IHR_Art32_Treatment_of_Travellers",
        "ihr_provision": "Art. 32",
        "normative_content": "States Parties shall treat travellers with respect for dignity, human rights and fundamental freedoms.",
        "required_domestic_functions": "Rights safeguards in emergency measures.",
        "observance": "Legal incorporation of human rights safeguards in public health measures.",
        "compliance_indicator": "Rights protection clause included in law (Yes/No)."
    },
    {
        "id": "IHR_Art33_Goods_Control",
        "ihr_provision": "Art. 33–34",
        "normative_content": "States Parties may apply health measures to goods, containers and loading areas.",
        "required_domestic_functions": "Inspection, seizure or restriction authority over goods.",
        "observance": "Legal basis for inspection, detention or destruction of goods; compensation rules if applicable.",
        "compliance_indicator": "Inspection/seizure powers legally defined (Yes/No)."
    },
    {
        "id": "IHR_Art36_Vaccination_Certificates",
        "ihr_provision": "Art. 35–36 + Annex 6–7",
        "normative_content": "States Parties shall recognize and regulate certificates of vaccination or prophylaxis.",
        "required_domestic_functions": "Certification recognition authority; documentation regulation.",
        "observance": "Legal validity of international vaccination certificates recognized; authority to verify authenticity.",
        "compliance_indicator": "Certificate recognition codified (Yes/No)."
    },
    {
        "id": "IHR_Art40_Charges_Travellers",
        "ihr_provision": "Art. 40",
        "normative_content": "States Parties shall not charge travellers except as permitted under the Regulations.",
        "required_domestic_functions": "Fee imposition authority; fiscal regulation.",
        "observance": "Legal authorization for public health fees; limits consistent with IHR.",
        "compliance_indicator": "Health-related fees established by law (Yes/No)."
    },
    {
        "id": "IHR_Art41_Charges_Goods",
        "ihr_provision": "Art. 41",
        "normative_content": "States Parties shall not charge for health measures except as permitted.",
        "required_domestic_functions": "Fiscal authority over sanitary charges on goods.",
        "observance": "Legal basis for sanitary fees; tariff transparency provision.",
        "compliance_indicator": "Sanitary charges legally regulated (Yes/No)."
    },
    {
        "id": "IHR_Art43_Additional_Measures",
        "ihr_provision": "Art. 43",
        "normative_content": "States Parties implementing additional health measures shall ensure they are based on scientific principles and evidence.",
        "required_domestic_functions": "Authority to impose stricter measures; review and justification mechanism.",
        "observance": "Legal requirement for proportionality, scientific basis, and review of additional measures.",
        "compliance_indicator": "Scientific justification clause in law (Yes/No); review procedure defined (Yes/No)."
    },
    {
        "id": "IHR_Art44_Collaboration",
        "ihr_provision": "Art. 44",
        "normative_content": "States Parties shall collaborate with each other in detection and response.",
        "required_domestic_functions": "Authority to share information and resources internationally.",
        "observance": "Legal basis for international cooperation and assistance; authority to exchange data.",
        "compliance_indicator": "International cooperation mandate in law (Yes/No)."
    },
    {
        "id": "IHR_Art45_Data_Protection",
        "ihr_provision": "Art. 45",
        "normative_content": "States Parties shall process personal data in accordance with applicable national law and ensure confidentiality.",
        "required_domestic_functions": "Data protection authority; international data transfer mechanism.",
        "observance": "Explicit legal authorization for collection and international transfer of health data; confidentiality safeguards.",
        "compliance_indicator": "Health data transfer legally authorized (Yes/No); confidentiality safeguards defined (Yes/No)."
    },
    {
        "id": "IHR_Art27_Affected_Conveyances",
        "ihr_provision": "Art. 27",
        "normative_content": "States Parties may apply control measures, including inspection, detention, disinfection, disinsection or other sanitary measures, to conveyances suspected of carrying infection or contamination.",
        "required_domestic_functions": "Inspection authority; detention and sanitary control powers over conveyances; enforcement and compensation mechanisms.",
        "observance": "Explicit legal authorization for inspection and detention of conveyances; defined sanitary control powers; due process and compensation safeguards where applicable.",
        "compliance_indicator": "Inspection/detention powers defined in law (Yes/No); procedural safeguards included (Yes/No)."
    },
    {
        "id": "IHR_Art28_Ships_at_Ports",
        "ihr_provision": "Art. 28",
        "normative_content": "States Parties may apply health measures to ships at ports, including delaying departure when necessary to prevent international spread of disease.",
        "required_domestic_functions": "Authority to delay departure; maritime sanitary enforcement powers; coordination with port authorities.",
        "observance": "Legal basis for restricting departure of ships; defined maritime health enforcement competence; proportionality and review safeguards.",
        "compliance_indicator": "Departure restriction authority defined in law (Yes/No); review mechanism established (Yes/No)."
    },
    {
        "id": "IHR_Art29_Ground_Crossings",
        "ihr_provision": "Art. 29",
        "normative_content": "States Parties may apply health measures at ground crossings to prevent international spread of disease.",
        "required_domestic_functions": "Border sanitary control authority; enforcement powers at land crossings; jurisdictional competence allocation.",
        "observance": "Explicit legal authority for sanitary measures at land borders; defined jurisdiction between national and subnational authorities.",
        "compliance_indicator": "Border health authority defined in law (Yes/No); competence allocation specified (Yes/No)."
    }
]
