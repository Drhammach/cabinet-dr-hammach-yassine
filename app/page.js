"use client";

import React, { useEffect, useMemo, useState } from "react";

const symptomCatalog = [
    "Douleur thoracique",
    "Dyspnée",
    "Douleur abdominale",
    "Vertiges",
    "Brûlures urinaires",
    "Fièvre",
    "Douleur lombaire",
    "Douleur mollet",
    "Palpitations",
    "Douleur pelvienne",
    "Céphalée",
];

const associatedSymptoms = [
    "Fièvre",
    "Dyspnée",
    "Toux",
    "Nausées / vomissements",
    "Brûlures urinaires",
    "Vertiges",
    "Palpitations",
    "Douleur irradiant bras gauche",
    "Saignement vaginal",
    "Arrêt des gaz / selles",
    "Douleur à l'effort",
    "Douleur à l'inspiration",
    "Crépitants",
    "Douleur mollet unilatérale",
    "Déficit neurologique",
    "Grossesse possible",
    "Douleur fosse iliaque droite",
    "Douleur lombaire",
    "Pollakiurie",
    "Frissons",
    "Défense abdominale",
    "Vomissements",
];

const riskFactorsList = [
    "HTA",
    "Diabète",
    "Tabac",
    "Antécédent cardiaque",
    "Chirurgie abdominale",
    "Voyage prolongé récent",
    "Cancer",
    "Grossesse possible",
    "Anticoagulants",
    "Insuffisance cardiaque",
];

const statusOptions = [
    { value: "en_attente", label: "En attente" },
    { value: "vu", label: "Vu" },
    { value: "termine", label: "Terminé" },
];

const appointmentStatusOptions = [
    { value: "planifie", label: "Planifié" },
    { value: "honore", label: "Honoré" },
    { value: "annule", label: "Annulé" },
];

const ASSISTANTE_PIN = process.env.NEXT_PUBLIC_ASSISTANTE_PIN || "1234";
const MEDECIN_PIN = process.env.NEXT_PUBLIC_MEDECIN_PIN || "2026";

const demoUsers = {
    assistante: { role: "assistante", name: "Assistante", pin: ASSISTANTE_PIN },
    medecin: { role: "medecin", name: "Dr Hammach Yassine", pin: MEDECIN_PIN },
};

const emptyForm = {
    fullName: "",
    age: "",
    sex: "Femme",
    phone: "",
    mainSymptom: "Douleur thoracique",
    onset: "Brutal",
    duration: "< 24 h",
    painScale: "",
    ta: "",
    fc: "",
    spo2: "",
    temperature: "",
    fr: "",
    glycemia: "",
    associated: [],
    risks: [],
    notes: "",
};

const emptyAppointment = {
    patientName: "",
    phone: "",
    date: "",
    time: "",
    reason: "",
    notes: "",
};

function badgeColor(level) {
    if (level === "rouge") return "bg-red-100 text-red-800 border-red-200";
    if (level === "orange") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function statusColor(status) {
    if (status === "termine") return "bg-slate-100 text-slate-800 border-slate-200";
    if (status === "vu") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-violet-100 text-violet-800 border-violet-200";
}

function appointmentColor(status) {
    if (status === "annule") return "bg-red-100 text-red-800 border-red-200";
    if (status === "honore") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function parseSystolic(ta) {
    if (!ta) return null;
    const m = String(ta).match(/(\d+)/);
    return m ? Number(m[1]) : null;
}

function computeClinicalSummary(form) {
    const alerts = [];
    const diagnoses = [];
    const exams = new Set();
    const actions = new Set();
    let priority = "verte";

    const spo2 = Number(form.spo2 || 0);
    const temp = Number(form.temperature || 0);
    const fc = Number(form.fc || 0);
    const age = Number(form.age || 0);
    const pas = parseSystolic(form.ta);
    const has = (v) =>
        (form.associated || []).includes(v) ||
        (form.risks || []).includes(v) ||
        form.mainSymptom === v;

    if (spo2 > 0 && spo2 < 94) {
        alerts.push("SpO₂ < 94 % : évaluer urgence respiratoire ou cardiovasculaire");
        priority = "rouge";
    }
    if (temp >= 39) {
        alerts.push("Fièvre élevée : rechercher foyer infectieux ou sepsis");
        if (priority !== "rouge") priority = "orange";
    }
    if (fc >= 120) {
        alerts.push("Tachycardie importante : réévaluer stabilité hémodynamique");
        if (priority !== "rouge") priority = "orange";
    }
    if (pas !== null && pas < 90) {
        alerts.push("Hypotension : patient potentiellement instable");
        priority = "rouge";
    }

    switch (form.mainSymptom) {
        case "Douleur thoracique": {
            if (
                has("Douleur irradiant bras gauche") ||
                has("Douleur à l'effort") ||
                has("HTA") ||
                has("Tabac") ||
                has("Antécédent cardiaque")
            ) {
                diagnoses.push({ label: "Syndrome coronarien aigu", score: 95 });
                diagnoses.push({ label: "Angor instable", score: 82 });
                diagnoses.push({ label: "Douleur pariétale thoracique", score: 28 });
                exams.add("ECG immédiat");
                exams.add("Troponines si orientation urgente");
                actions.add("Ne pas laisser repartir le patient si douleur typique");
                actions.add("Orientation urgente si ECG évocateur ou douleur persistante");
                alerts.push("Douleur thoracique à risque cardiovasculaire");
                priority = "rouge";
            } else if (has("Douleur à l'inspiration") || has("Dyspnée")) {
                diagnoses.push({ label: "Embolie pulmonaire", score: 72 });
                diagnoses.push({ label: "Douleur pleurale", score: 58 });
                diagnoses.push({ label: "Douleur pariétale thoracique", score: 45 });
                exams.add("ECG");
                exams.add("Évaluer probabilité clinique d'embolie pulmonaire");
                actions.add("Rechercher tachycardie, désaturation et douleur mollet associée");
                if (priority !== "rouge") priority = "orange";
            } else {
                diagnoses.push({ label: "Douleur pariétale thoracique", score: 68 });
                diagnoses.push({ label: "Reflux gastro-œsophagien", score: 46 });
                diagnoses.push({ label: "Anxiété", score: 35 });
                exams.add("ECG si doute ou facteurs de risque");
            }
            break;
        }

        case "Dyspnée": {
            if (has("Crépitants") || has("Insuffisance cardiaque")) {
                diagnoses.push({ label: "Œdème aigu pulmonaire", score: 90 });
                diagnoses.push({ label: "SCA avec décompensation", score: 62 });
                diagnoses.push({ label: "Pneumonie", score: 35 });
                exams.add("SpO₂ immédiate");
                exams.add("ECG");
                exams.add("Radio thorax");
                actions.add("Position assise");
                actions.add("Oxygène si SpO₂ basse");
                priority = "rouge";
            } else {
                diagnoses.push({ label: "Asthme / bronchospasme", score: 60 });
                diagnoses.push({ label: "Pneumonie", score: temp >= 38 ? 65 : 35 });
                diagnoses.push({ label: "Embolie pulmonaire", score: spo2 < 94 ? 75 : 40 });
                exams.add("SpO₂");
                exams.add("Auscultation pulmonaire");
                exams.add("Radio thorax");
                if (spo2 < 94) priority = "rouge";
            }
            break;
        }

        case "Douleur abdominale": {
            if (has("Douleur fosse iliaque droite") && (temp >= 38 || has("Défense abdominale"))) {
                diagnoses.push({ label: "Appendicite aiguë", score: 92 });
                diagnoses.push({ label: "Colique néphrétique", score: 36 });
                diagnoses.push({ label: "Pathologie gynécologique", score: 30 });
                exams.add("NFS");
                exams.add("CRP");
                exams.add("Échographie abdomino-pelvienne");
                actions.add("Ne pas faire rentrer si défense ou aggravation");
                if (priority !== "rouge") priority = "orange";
            } else if (has("Arrêt des gaz / selles") || has("Vomissements")) {
                diagnoses.push({ label: "Occlusion intestinale", score: 90 });
                diagnoses.push({ label: "Iléus", score: 45 });
                diagnoses.push({ label: "Constipation sévère", score: 25 });
                exams.add("Scanner abdomino-pelvien");
                actions.add("Orientation urgente");
                priority = "rouge";
            } else {
                diagnoses.push({ label: "Gastro-entérite", score: 55 });
                diagnoses.push({ label: "Gastrite / ulcère", score: 50 });
                diagnoses.push({ label: "Colopathie fonctionnelle", score: 35 });
                exams.add("Examen clinique ciblé");
            }
            break;
        }

        case "Vertiges": {
            if (has("Déficit neurologique") || age >= 60) {
                diagnoses.push({ label: "AVC cérébelleux / postérieur", score: 82 });
                diagnoses.push({ label: "VPPB", score: 50 });
                diagnoses.push({ label: "Neurite vestibulaire", score: 40 });
                exams.add("Examen neurologique");
                exams.add("IRM cérébrale si disponible / orientation urgente");
                actions.add("Ne pas laisser repartir si ataxie, déficit ou doute central");
                if (priority !== "rouge") priority = "orange";
            } else {
                diagnoses.push({ label: "VPPB", score: 80 });
                diagnoses.push({ label: "Neurite vestibulaire", score: 50 });
                diagnoses.push({ label: "Anxiété", score: 25 });
                exams.add("Test de Dix-Hallpike");
            }
            break;
        }

        case "Brûlures urinaires": {
            if (temp >= 38 || has("Douleur lombaire") || has("Frissons")) {
                diagnoses.push({ label: "Pyélonéphrite", score: 90 });
                diagnoses.push({ label: "Cystite compliquée", score: 50 });
                diagnoses.push({ label: "Lithiase infectée", score: 35 });
                exams.add("BU");
                exams.add("ECBU");
                actions.add("Orientation urgente si sepsis, grossesse, vomissements ou obstacle");
                if (priority !== "rouge") priority = "orange";
            } else {
                diagnoses.push({ label: "Cystite simple", score: 88 });
                diagnoses.push({ label: "Urétrite / IST", score: 35 });
                diagnoses.push({ label: "Vaginite", score: 25 });
                exams.add("BU");
            }
            break;
        }

        case "Fièvre": {
            diagnoses.push({ label: "Infection virale", score: 55 });
            diagnoses.push({
                label: "Infection urinaire",
                score: has("Brûlures urinaires") ? 70 : 25,
            });
            diagnoses.push({
                label: "Pneumonie",
                score: has("Toux") || has("Dyspnée") ? 70 : 30,
            });
            exams.add("NFS");
            exams.add("CRP");
            if (has("Brûlures urinaires")) exams.add("BU");
            if (temp >= 39 && fc >= 110) {
                alerts.push("Syndrome infectieux marqué : rechercher sepsis");
                if (priority !== "rouge") priority = "orange";
            }
            break;
        }

        case "Douleur lombaire": {
            diagnoses.push({ label: "Lombosciatique", score: 75 });
            diagnoses.push({ label: "Lombalgie mécanique", score: 70 });
            diagnoses.push({
                label: "Colique néphrétique",
                score: has("Brûlures urinaires") ? 30 : 45,
            });
            exams.add("Examen neurologique des membres inférieurs");
            actions.add("Rechercher rétention urinaire, anesthésie en selle, déficit moteur");
            break;
        }

        case "Douleur mollet": {
            diagnoses.push({
                label: "Thrombose veineuse profonde",
                score: has("Voyage prolongé récent") || has("Douleur mollet unilatérale") ? 90 : 60,
            });
            diagnoses.push({ label: "Contracture musculaire", score: 40 });
            diagnoses.push({ label: "Kyste poplité", score: 20 });
            exams.add("Score de Wells");
            exams.add("Écho-doppler veineux");
            actions.add("Rechercher dyspnée ou douleur thoracique associée");
            if (priority !== "rouge") priority = "orange";
            break;
        }

        case "Palpitations": {
            diagnoses.push({ label: "Tachycardie sinusale", score: 70 });
            diagnoses.push({ label: "TSV / trouble du rythme", score: 60 });
            diagnoses.push({ label: "Trouble anxieux", score: 45 });
            exams.add("ECG");
            exams.add("TSH");
            exams.add("NFS");
            exams.add("Ionogramme");
            if (fc >= 140) {
                alerts.push("Palpitations avec FC élevée : vérifier stabilité et ECG rapidement");
                if (priority !== "rouge") priority = "orange";
            }
            break;
        }

        case "Douleur pelvienne": {
            if (has("Grossesse possible") || has("Saignement vaginal")) {
                diagnoses.push({ label: "Grossesse extra-utérine", score: 92 });
                diagnoses.push({ label: "Fausse couche", score: 50 });
                diagnoses.push({ label: "Kyste ovarien", score: 45 });
                exams.add("β-HCG");
                exams.add("Échographie pelvienne");
                actions.add("Orientation urgente si douleur intense, malaise, hypotension ou saignement important");
                priority = "rouge";
            } else {
                diagnoses.push({ label: "Kyste ovarien", score: 60 });
                diagnoses.push({ label: "Infection pelvienne", score: 45 });
                diagnoses.push({ label: "Douleur fonctionnelle", score: 30 });
                exams.add("Examen gynécologique orienté");
            }
            break;
        }

        case "Céphalée": {
            diagnoses.push({ label: "Migraine", score: 60 });
            diagnoses.push({ label: "Céphalée de tension", score: 55 });
            diagnoses.push({ label: "Sinusite", score: 35 });
            if (form.onset === "Brutal") {
                diagnoses.unshift({ label: "Hémorragie sous-arachnoïdienne", score: 88 });
                exams.add("Scanner cérébral urgent");
                priority = "rouge";
            }
            break;
        }

        default:
            diagnoses.push({ label: "À orienter par l'examen clinique", score: 50 });
    }

    diagnoses.sort((a, b) => b.score - a.score);

    return {
        priority,
        alerts: [...new Set(alerts)],
        diagnoses: diagnoses.slice(0, 3),
        exams: Array.from(exams),
        actions: Array.from(actions),
    };
}

function generateManagementSuggestions(selectedRecord) {
    if (!selectedRecord) return [];
    const topDx = selectedRecord.diagnoses?.[0]?.label || "";

    const plans = {
        "Cystite simple": [
            "Faire BU si non réalisée et traiter en ambulatoire si absence de fièvre ou douleur lombaire",
            "Conseiller hydratation, réévaluation si aggravation ou absence d'amélioration sous 48–72 h",
            "Demander ECBU si récidive, grossesse, homme ou tableau atypique",
        ],
        "Pyélonéphrite": [
            "Faire BU + ECBU avant antibiothérapie si possible",
            "Évaluer critères de gravité : vomissements, grossesse, sepsis, obstacle, douleur importante",
            "Orienter en urgence si terrain fragile ou mauvaise tolérance",
        ],
        "Syndrome coronarien aigu": [
            "ECG immédiat et surveillance des constantes",
            "Ne pas laisser repartir le patient",
            "Orientation urgente / service d'urgence",
        ],
        "Appendicite aiguë": [
            "Confirmer par examen abdominal ciblé et biologie / imagerie selon disponibilité",
            "Ne pas laisser rentrer si défense, aggravation ou tableau évocateur franc",
            "Orientation chirurgicale / urgences si suspicion forte",
        ],
    };

    return (
        plans[topDx] || [
            "Vérifier les diagnostics différentiels et les red flags",
            "Adapter bilan, traitement et orientation au contexte clinique",
            "Tracer la décision finale dans les notes médecin",
        ]
    );
}

function generatePrescriptionSuggestions(selectedRecord) {
    if (!selectedRecord) return [];
    const topDx = selectedRecord.diagnoses?.[0]?.label || "";

    const suggestions = {
        "Cystite simple": [
            "BU immédiate si non faite",
            "Traitement probabiliste selon protocole du cabinet et terrain du patient",
            "Consignes : hydratation, consulter si fièvre, douleur lombaire ou aggravation",
        ],
        "Pyélonéphrite": [
            "BU + ECBU avant antibiothérapie si possible",
            "Antibiothérapie adaptée au contexte clinique et au terrain",
            "Orientation urgente si vomissements, sepsis, grossesse ou obstacle suspect",
        ],
        "Syndrome coronarien aigu": [
            "ECG immédiat et surveillance continue",
            "Orientation urgente / service d'urgence",
            "Ne pas laisser repartir le patient",
        ],
    };

    return (
        suggestions[topDx] || [
            "Mesure thérapeutique à adapter au diagnostic retenu",
            "Réévaluer après examen clinique complet",
            "Formaliser la prescription / orientation dans les notes médecin",
        ]
    );
}

function NavButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full px-4 py-2 text-sm ${active ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-700"
                }`}
        >
            {children}
        </button>
    );
}

function MultiSelectChips({ options, selected, setSelected }) {
    const toggle = (option) => {
        setSelected(
            selected.includes(option) ? selected.filter((x) => x !== option) : [...selected, option]
        );
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const active = selected.includes(option);
                return (
                    <button
                        type="button"
                        key={option}
                        onClick={() => toggle(option)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${active
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-300"
                            }`}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
}

function SearchInput({ value, onChange, placeholder = "Rechercher..." }) {
    return (
        <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

function AgendaView({ appointments, onStatusChange }) {
    const grouped = appointments.reduce((acc, appt) => {
        const key = appt.appointment_date || "Sans date";
        if (!acc[key]) acc[key] = [];
        acc[key].push(appt);
        return acc;
    }, {});

    const orderedDates = Object.keys(grouped).sort();

    return (
        <div className="space-y-4">
            {orderedDates.length ? (
                orderedDates.map((date) => (
                    <div key={date} className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm font-semibold text-slate-900">
                            {date === "Sans date" ? "Sans date" : date}
                        </div>
                        <div className="mt-3 space-y-3">
                            {grouped[date]
                                .sort((a, b) =>
                                    String(a.appointment_time || "").localeCompare(String(b.appointment_time || ""))
                                )
                                .map((a) => (
                                    <div key={a.id} className="rounded-xl border border-slate-100 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {a.appointment_time || "--:--"} · {a.patient_name}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-600">{a.phone || "-"}</div>
                                                <div className="mt-1 text-sm text-slate-600">{a.reason || "-"}</div>
                                            </div>
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs ${appointmentColor(
                                                    a.status || "planifie"
                                                )}`}
                                            >
                                                {(appointmentStatusOptions.find((s) => s.value === a.status)?.label) ||
                                                    "Planifié"}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {appointmentStatusOptions.map((s) => (
                                                <button
                                                    key={s.value}
                                                    onClick={() => onStatusChange(a.id, s.value)}
                                                    className={`rounded-xl border px-3 py-2 text-xs ${a.status === s.value
                                                            ? "bg-slate-900 text-white border-slate-900"
                                                            : "bg-white border-slate-300 text-slate-700"
                                                        }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Aucun rendez-vous.
                </div>
            )}
        </div>
    );
}

function LoginScreen({ onLogin }) {
    const [role, setRole] = useState("assistante");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    const submit = () => {
        const user = demoUsers[role];
        if (pin === user.pin) {
            setError("");
            onLogin(user);
        } else {
            setError("Code PIN incorrect");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
                <h1 className="text-center text-4xl font-semibold tracking-tight text-slate-900">
                    CABINET DR HAMMACH YASSINE
                </h1>

                <div className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Rôle</label>
                        <select
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="assistante">Assistante</option>
                            <option value="medecin">Médecin</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Code PIN</label>
                        <input
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Code PIN"
                        />
                    </div>

                    {error ? (
                        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                    ) : null}

                    <button
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white"
                        onClick={submit}
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        </div>
    );
}

function PatientCard({ p, onOpen, canSeeClinical }) {
    return (
        <button
            onClick={() => onOpen(p.id)}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-medium text-slate-900">{p.patient_name || "Patient sans nom"}</div>
                    <div className="mt-1 text-sm text-slate-600">
                        {p.patient_age || "?"} ans · {p.patient_sex || "-"} · {p.main_symptom}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        {new Date(p.created_at).toLocaleString("fr-FR")}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${statusColor(
                            p.status || "en_attente"
                        )}`}
                    >
                        {(statusOptions.find((s) => s.value === p.status)?.label) || "En attente"}
                    </span>
                    <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${badgeColor(
                            p.priority || "verte"
                        )}`}
                    >
                        {p.priority || "verte"}
                    </span>
                </div>
            </div>

            <div className="mt-3 text-sm text-slate-700">
                {canSeeClinical ? p.diagnoses?.[0]?.label || "Aucun diagnostic" : "Fiche patient"}
            </div>
        </button>
    );
}

export default function CabinetDrHammachYassineV7() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("consultation");

    const [form, setForm] = useState(emptyForm);
    const [records, setRecords] = useState([]);
    const [selectedRecordId, setSelectedRecordId] = useState(null);

    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);
    const [waitingRoom, setWaitingRoom] = useState([]);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [searchRecords, setSearchRecords] = useState("");
    const [searchPatients, setSearchPatients] = useState("");
    const [searchAppointments, setSearchAppointments] = useState("");
    const [searchWaitingRoom, setSearchWaitingRoom] = useState("");

    const [doctorNotesDraft, setDoctorNotesDraft] = useState("");
    const [savingDoctorNotes, setSavingDoctorNotes] = useState(false);

    const [editingPatientId, setEditingPatientId] = useState(null);
    const [patientEditForm, setPatientEditForm] = useState({
        full_name: "",
        age: "",
        sex: "",
        phone: "",
        clinical_notes: "",
        labs: "",
    });

    const [editingAppointmentId, setEditingAppointmentId] = useState(null);
    const [appointmentEditForm, setAppointmentEditForm] = useState({
        patient_name: "",
        phone: "",
        appointment_date: "",
        appointment_time: "",
        reason: "",
        notes: "",
    });

    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState("");

    const section = "rounded-3xl border border-slate-200 bg-white p-6 shadow-md";
    const label = "mb-1 block text-sm font-medium text-slate-700";
    const input =
        "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    const updateAppointment = (key, value) =>
        setAppointmentForm((prev) => ({ ...prev, [key]: value }));

    const summary = useMemo(() => computeClinicalSummary(form), [form]);
    const isDoctor = user?.role === "medecin";

    const loadRecords = async () => {
        const res = await fetch("/api/data/triage-forms");
        const json = await res.json();
        if (json.ok) {
            setRecords(json.data || []);
            if (!selectedRecordId && json.data?.[0]) setSelectedRecordId(json.data[0].id);
        }
    };

    const loadPatients = async () => {
        const res = await fetch("/api/data/patients");
        const json = await res.json();
        if (json.ok) setPatients(json.data || []);
    };

    const loadAppointments = async () => {
        const res = await fetch("/api/data/appointments");
        const json = await res.json();
        if (json.ok) setAppointments(json.data || []);
    };

    const loadWaitingRoom = async () => {
        const res = await fetch("/api/data/waiting-room");
        const json = await res.json();
        if (json.ok) setWaitingRoom(json.data || []);
    };

    const loadAll = async () => {
        setRefreshing(true);
        await Promise.all([loadRecords(), loadPatients(), loadAppointments(), loadWaitingRoom()]);
        setRefreshing(false);
    };

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (user) setActiveTab("consultation");
    }, [user]);

    const selectedRecord = useMemo(
        () => records.find((r) => r.id === selectedRecordId) || null,
        [records, selectedRecordId]
    );

    useEffect(() => {
        setDoctorNotesDraft(selectedRecord?.doctor_notes || "");
    }, [selectedRecordId, selectedRecord?.doctor_notes]);

    const managementSuggestions = useMemo(
        () => generateManagementSuggestions(selectedRecord),
        [selectedRecord]
    );

    const therapeuticSuggestions = useMemo(
        () => generatePrescriptionSuggestions(selectedRecord),
        [selectedRecord]
    );

    const filteredRecords = useMemo(() => {
        const q = searchRecords.trim().toLowerCase();
        if (!q) return records;
        return records.filter((r) =>
            [r.patient_name, r.patient_phone, r.main_symptom]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [records, searchRecords]);

    const filteredPatients = useMemo(() => {
        const q = searchPatients.trim().toLowerCase();
        if (!q) return patients;
        return patients.filter((p) =>
            [p.full_name, p.phone]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [patients, searchPatients]);

    const filteredAppointments = useMemo(() => {
        const q = searchAppointments.trim().toLowerCase();
        if (!q) return appointments;
        return appointments.filter((a) =>
            [a.patient_name, a.phone, a.reason]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [appointments, searchAppointments]);

    const filteredWaitingRoom = useMemo(() => {
        const q = searchWaitingRoom.trim().toLowerCase();
        if (!q) return waitingRoom;
        return waitingRoom.filter((w) =>
            [w.patient_name, w.phone, w.reason]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [waitingRoom, searchWaitingRoom]);

    const todaysPatients = useMemo(() => {
        const today = new Date().toLocaleDateString("en-CA");
        return records.filter(
            (r) => r.created_at && new Date(r.created_at).toLocaleDateString("en-CA") === today
        );
    }, [records]);

    const saveRecord = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/data/create-consultation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user,
                    form,
                    summary: computeClinicalSummary(form),
                }),
            });

            const json = await res.json();
            if (!json.ok) throw new Error("Erreur");

            setForm(emptyForm);
            await loadAll();
            if (json.triageId) setSelectedRecordId(json.triageId);
            setActiveTab("salle_attente");
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const saveAppointment = async () => {
        if (!appointmentForm.patientName) {
            alert("Nom du patient obligatoire");
            return;
        }

        const res = await fetch("/api/data/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patient_name: appointmentForm.patientName,
                phone: appointmentForm.phone || null,
                appointment_date: appointmentForm.date || null,
                appointment_time: appointmentForm.time || null,
                reason: appointmentForm.reason || null,
                notes: appointmentForm.notes || null,
                status: "planifie",
                created_by: user?.name || "",
            }),
        });

        const json = await res.json();
        if (!json.ok) {
            alert("Erreur lors de l'enregistrement du rendez-vous");
            return;
        }

        setAppointmentForm(emptyAppointment);
        await loadAppointments();
    };

    const updateAppointmentStatus = async (id, status) => {
        await fetch(`/api/data/appointments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        await loadAppointments();
    };

    const startEditAppointment = (appt) => {
        setEditingAppointmentId(appt.id);
        setAppointmentEditForm({
            patient_name: appt.patient_name || "",
            phone: appt.phone || "",
            appointment_date: appt.appointment_date || "",
            appointment_time: appt.appointment_time || "",
            reason: appt.reason || "",
            notes: appt.notes || "",
        });
    };

    const saveEditedAppointment = async () => {
        if (!editingAppointmentId) return;

        await fetch(`/api/data/appointments/${editingAppointmentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appointmentEditForm),
        });

        setEditingAppointmentId(null);
        await loadAppointments();
    };

    const startEditPatient = (p) => {
        setEditingPatientId(p.id);
        setPatientEditForm({
            full_name: p.full_name || "",
            age: p.age || "",
            sex: p.sex || "",
            phone: p.phone || "",
            clinical_notes: p.clinical_notes || "",
            labs: p.labs || "",
        });
    };

    const saveEditedPatient = async () => {
        if (!editingPatientId) return;

        await fetch(`/api/data/patients/${editingPatientId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: patientEditForm.full_name,
                age: patientEditForm.age ? Number(patientEditForm.age) : null,
                sex: patientEditForm.sex,
                phone: patientEditForm.phone || null,
                clinical_notes: patientEditForm.clinical_notes || null,
                labs: patientEditForm.labs || null,
            }),
        });

        setEditingPatientId(null);
        await loadPatients();
    };

    const updateWaitingStatus = async (id, room_status) => {
        if (room_status === "sorti") {
            await fetch(`/api/data/waiting-room/${id}`, { method: "DELETE" });
        } else {
            await fetch(`/api/data/waiting-room/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room_status }),
            });
        }
        await loadWaitingRoom();
    };

    const updateConsultationStatus = async (recordId, status) => {
        if (!isDoctor) return;

        await fetch(`/api/data/triage-forms/${recordId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status,
                seen_by_doctor_at:
                    status === "vu" || status === "termine" ? new Date().toISOString() : null,
            }),
        });

        await loadRecords();
        setSelectedRecordId(recordId);
    };

    const saveDoctorNotes = async () => {
        if (!isDoctor || !selectedRecord) return;

        try {
            setSavingDoctorNotes(true);

            await fetch(`/api/data/triage-forms/${selectedRecord.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ doctor_notes: doctorNotesDraft }),
            });

            await loadRecords();
        } finally {
            setSavingDoctorNotes(false);
        }
    };

    const runClinicalAssistant = async () => {
        if (!isDoctor || !selectedRecord) return;

        try {
            setAiLoading(true);
            setAiError("");
            setAiResult(null);

            const payload = {
                patient: {
                    nom: selectedRecord.patient_name || "",
                    age: selectedRecord.patient_age || "",
                    sexe: selectedRecord.patient_sex || "",
                    telephone: selectedRecord.patient_phone || "",
                },
                consultation: {
                    motif: selectedRecord.main_symptom || "",
                    ta: selectedRecord.ta || "",
                    fc: selectedRecord.fc || "",
                    spo2: selectedRecord.spo2 || "",
                    temperature: selectedRecord.temperature || "",
                    priorite: selectedRecord.priority || "",
                    diagnostics_probables_algorithme: selectedRecord.diagnoses || [],
                    alertes_algorithme: selectedRecord.alerts || [],
                    examens_algorithme: selectedRecord.exams || [],
                    conduite_algorithme: selectedRecord.actions || [],
                },
                notes:
                    `Notes assistante:\n${selectedRecord.notes || ""}\n\n` +
                    `Notes médecin:\n${doctorNotesDraft || ""}`,
            };

            const res = await fetch("/api/clinical-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok || !json.ok) {
                throw new Error(json?.error || "Erreur IA");
            }

            setAiResult(json.data);
        } catch (err) {
            console.error(err);
            setAiError("Impossible de lancer l'assistant IA.");
        } finally {
            setAiLoading(false);
        }
    };

    if (!user) return <LoginScreen onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-10">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="relative">
                    <button
                        className="absolute right-0 top-0 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
                        onClick={() => setUser(null)}
                    >
                        Déconnexion
                    </button>

                    <h1 className="text-center text-4xl font-semibold tracking-tight text-slate-900">
                        CABINET DR HAMMACH YASSINE
                    </h1>

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <NavButton active={activeTab === "consultation"} onClick={() => setActiveTab("consultation")}>
                            Consultation
                        </NavButton>
                        <NavButton active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")}>
                            Agenda partagé
                        </NavButton>
                        <NavButton active={activeTab === "patients"} onClick={() => setActiveTab("patients")}>
                            Fiches patients
                        </NavButton>
                        <NavButton active={activeTab === "salle_attente"} onClick={() => setActiveTab("salle_attente")}>
                            Salle d'attente
                        </NavButton>
                        <NavButton active={activeTab === "patients_du_jour"} onClick={() => setActiveTab("patients_du_jour")}>
                            Patients du jour
                        </NavButton>
                    </div>
                </div>

                <div className="text-xs text-slate-500">{refreshing ? "Actualisation..." : "Synchronisé"}</div>

                {activeTab === "consultation" && (
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                        {isDoctor ? (
                            <section className={section}>
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <h2 className="text-xl font-semibold">Synthèse médecin</h2>
                                </div>

                                {selectedRecord ? (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm text-slate-500">Patient</div>
                                                <div className="mt-1 font-medium text-slate-900">
                                                    {selectedRecord.patient_name || "Patient sans nom"}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-600">
                                                    {selectedRecord.patient_age || "?"} ans · {selectedRecord.patient_sex || "-"}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-600">
                                                    {selectedRecord.patient_phone || "Téléphone non renseigné"}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 p-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-sm text-slate-500">Statut consultation</div>
                                                    <span
                                                        className={`rounded-full border px-2.5 py-1 text-xs ${statusColor(
                                                            selectedRecord.status || "en_attente"
                                                        )}`}
                                                    >
                                                        {(statusOptions.find((s) => s.value === selectedRecord.status)?.label) ||
                                                            "En attente"}
                                                    </span>
                                                </div>

                                                <div className="mt-3 text-sm text-slate-600">
                                                    Créée le {new Date(selectedRecord.created_at).toLocaleString("fr-FR")}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-600">
                                                    {selectedRecord.seen_by_doctor_at
                                                        ? `Vue le ${new Date(selectedRecord.seen_by_doctor_at).toLocaleString("fr-FR")}`
                                                        : "Pas encore vue par le médecin"}
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {statusOptions.map((s) => (
                                                        <button
                                                            key={s.value}
                                                            onClick={() => updateConsultationStatus(selectedRecord.id, s.value)}
                                                            className={`rounded-xl border px-3 py-2 text-xs ${selectedRecord.status === s.value
                                                                    ? "bg-slate-900 text-white border-slate-900"
                                                                    : "bg-white border-slate-300 text-slate-700"
                                                                }`}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm text-slate-500">Motif et constantes</div>
                                                <div className="mt-1 font-medium text-slate-900">{selectedRecord.main_symptom}</div>
                                                <div className="mt-1 text-sm text-slate-600">
                                                    TA {selectedRecord.ta || "-"} · FC {selectedRecord.fc || "-"} ·
                                                    SpO₂ {selectedRecord.spo2 || "-"}% · T {selectedRecord.temperature || "-"}°C
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm text-slate-500">Niveau d'urgence</div>
                                                <div
                                                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${badgeColor(
                                                        selectedRecord.priority || "verte"
                                                    )}`}
                                                >
                                                    {selectedRecord.priority || "verte"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm text-slate-500">Alertes immédiates</div>
                                            {selectedRecord.alerts?.length ? (
                                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                    {selectedRecord.alerts.map((a, i) => (
                                                        <li key={`${a}-${i}`}>{a}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="mt-2 text-sm text-slate-600">
                                                    Aucune alerte majeure détectée.
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm text-slate-500">Top 3 diagnostics probables</div>
                                            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-800">
                                                {(selectedRecord.diagnoses || []).map((d, i) => (
                                                    <li key={`${d.label}-${i}`}>
                                                        <span className="font-medium">{d.label}</span>{" "}
                                                        <span className="text-slate-500">— score {d.score}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>

                                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm text-slate-500">Examens suggérés</div>
                                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                    {(selectedRecord.exams || []).map((e, i) => (
                                                        <li key={`${e}-${i}`}>{e}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 p-4">
                                                <div className="text-sm text-slate-500">Conduite suggérée</div>
                                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                    {(selectedRecord.actions || []).length
                                                        ? (selectedRecord.actions || []).map((a, i) => (
                                                            <li key={`${a}-${i}`}>{a}</li>
                                                        ))
                                                        : managementSuggestions.map((a, i) => <li key={`${a}-${i}`}>{a}</li>)}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm text-slate-500">
                                                Suggestions thérapeutiques / suite à donner
                                            </div>
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                {therapeuticSuggestions.map((item, i) => (
                                                    <li key={`${item}-${i}`}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                                <div className="text-sm text-slate-500">Notes assistante</div>
                                                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                                    {selectedRecord.notes || "Aucune note"}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                                <div className="text-sm text-slate-500">Notes médecin</div>
                                                <textarea
                                                    className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                                    value={doctorNotesDraft}
                                                    onChange={(e) => setDoctorNotesDraft(e.target.value)}
                                                    placeholder="Observations, examen clinique, conduite, prescription..."
                                                />
                                                <button
                                                    className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                                                    onClick={saveDoctorNotes}
                                                    disabled={savingDoctorNotes}
                                                >
                                                    {savingDoctorNotes ? "Enregistrement..." : "Enregistrer les notes médecin"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900">Assistant IA</h3>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Visible uniquement côté médecin
                                                    </p>
                                                </div>

                                                <button
                                                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                                                    onClick={runClinicalAssistant}
                                                    disabled={aiLoading}
                                                >
                                                    {aiLoading ? "Analyse..." : "Lancer l'analyse IA"}
                                                </button>
                                            </div>

                                            {aiError ? (
                                                <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                                                    {aiError}
                                                </div>
                                            ) : null}

                                            {aiResult ? (
                                                <div className="mt-5 space-y-4">
                                                    <div className="rounded-2xl border border-slate-200 p-4">
                                                        <div className="text-sm text-slate-500">Résumé clinique</div>
                                                        <div className="mt-2 text-sm text-slate-800">
                                                            {aiResult.resume_clinique}
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">Diagnostics probables</div>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                                {aiResult.diagnostics_probables.map((item, i) => (
                                                                    <li key={`dp-${i}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">
                                                                Diagnostics graves à éliminer
                                                            </div>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                                {aiResult.diagnostics_graves_a_eliminer.map((item, i) => (
                                                                    <li key={`dg-${i}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">Red flags</div>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                                {aiResult.red_flags.map((item, i) => (
                                                                    <li key={`rf-${i}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">Bilans recommandés</div>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                                {aiResult.bilans_recommandes.map((item, i) => (
                                                                    <li key={`br-${i}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">Conduite à tenir</div>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                                {aiResult.conduite_a_tenir.map((item, i) => (
                                                                    <li key={`ct-${i}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">
                                                                Propositions thérapeutiques
                                                            </div>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                                {aiResult.propositions_therapeutiques.map((item, i) => (
                                                                    <li key={`pt-${i}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">Questions utiles</div>
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                                {aiResult.questions_utiles.map((item, i) => (
                                                                    <li key={`qu-${i}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <div className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="text-sm text-slate-500">Niveau d'urgence</div>
                                                            <div className="mt-2 text-sm font-medium text-slate-900">
                                                                {aiResult.niveau_urgence}
                                                            </div>
                                                            <div className="mt-4 text-sm text-slate-500">Avertissement</div>
                                                            <div className="mt-2 text-sm text-slate-700">
                                                                {aiResult.avertissement}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                                        Aucune fiche reçue pour le moment.
                                    </div>
                                )}
                            </section>
                        ) : (
                            <section className={section}>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Nouvelle fiche patient</h2>
                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeColor(
                                            summary.priority
                                        )}`}
                                    >
                                        Priorité {summary.priority}
                                    </span>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className={label}>Nom complet</label>
                                        <input
                                            className={input}
                                            value={form.fullName}
                                            onChange={(e) => update("fullName", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Téléphone</label>
                                        <input
                                            className={input}
                                            value={form.phone}
                                            onChange={(e) => update("phone", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Âge</label>
                                        <input
                                            className={input}
                                            value={form.age}
                                            onChange={(e) => update("age", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>Sexe</label>
                                        <select
                                            className={input}
                                            value={form.sex}
                                            onChange={(e) => update("sex", e.target.value)}
                                        >
                                            <option>Femme</option>
                                            <option>Homme</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={label}>Motif principal</label>
                                        <select
                                            className={input}
                                            value={form.mainSymptom}
                                            onChange={(e) => update("mainSymptom", e.target.value)}
                                        >
                                            {symptomCatalog.map((s) => (
                                                <option key={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={label}>Intensité douleur /10</label>
                                        <input
                                            className={input}
                                            value={form.painScale}
                                            onChange={(e) => update("painScale", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <h3 className="mb-3 mt-6 text-lg font-medium">Constantes</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className={label}>TA</label>
                                        <input className={input} value={form.ta} onChange={(e) => update("ta", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={label}>FC</label>
                                        <input className={input} value={form.fc} onChange={(e) => update("fc", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={label}>SpO₂</label>
                                        <input className={input} value={form.spo2} onChange={(e) => update("spo2", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={label}>Température</label>
                                        <input
                                            className={input}
                                            value={form.temperature}
                                            onChange={(e) => update("temperature", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={label}>FR</label>
                                        <input className={input} value={form.fr} onChange={(e) => update("fr", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={label}>Glycémie</label>
                                        <input
                                            className={input}
                                            value={form.glycemia}
                                            onChange={(e) => update("glycemia", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <h3 className="mb-3 mt-6 text-lg font-medium">Questionnaire rapide</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className={label}>Début</label>
                                        <select className={input} value={form.onset} onChange={(e) => update("onset", e.target.value)}>
                                            <option>Brutal</option>
                                            <option>Progressif</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={label}>Durée</label>
                                        <select className={input} value={form.duration} onChange={(e) => update("duration", e.target.value)}>
                                            <option>{"< 24 h"}</option>
                                            <option>1–3 jours</option>
                                            <option>{"> 1 semaine"}</option>
                                            <option>Chronique</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className={label}>Symptômes associés</label>
                                    <MultiSelectChips
                                        options={associatedSymptoms}
                                        selected={form.associated}
                                        setSelected={(v) => update("associated", v)}
                                    />
                                </div>

                                <div className="mt-6">
                                    <label className={label}>Facteurs de risque / antécédents</label>
                                    <MultiSelectChips
                                        options={riskFactorsList}
                                        selected={form.risks}
                                        setSelected={(v) => update("risks", v)}
                                    />
                                </div>

                                <div className="mt-6">
                                    <label className={label}>Notes assistante</label>
                                    <textarea
                                        className={`${input} min-h-28`}
                                        value={form.notes}
                                        onChange={(e) => update("notes", e.target.value)}
                                    />
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm text-white disabled:opacity-50"
                                        onClick={saveRecord}
                                        disabled={loading}
                                    >
                                        {loading ? "Enregistrement..." : "Créer la fiche"}
                                    </button>

                                    <button
                                        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm"
                                        onClick={() => setForm(emptyForm)}
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            </section>
                        )}

                        <aside className="space-y-6">
                            <section className={section}>
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold">Dossiers consultation</h2>
                                    <button className="text-xs text-slate-500 underline" onClick={loadRecords}>
                                        Actualiser
                                    </button>
                                </div>

                                <SearchInput
                                    value={searchRecords}
                                    onChange={setSearchRecords}
                                    placeholder="Rechercher nom, téléphone ou motif"
                                />

                                <div className="mt-4 space-y-3 max-h-[70vh] overflow-auto pr-1">
                                    {filteredRecords.length ? (
                                        filteredRecords.map((r) => (
                                            <PatientCard
                                                key={r.id}
                                                p={r}
                                                onOpen={(id) => setSelectedRecordId(id)}
                                                canSeeClinical={isDoctor}
                                            />
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                            Aucun patient enregistré.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </aside>
                    </div>
                )}

                {activeTab === "agenda" && (
                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <section className={section}>
                            <h2 className="text-xl font-semibold">Nouveau rendez-vous</h2>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className={label}>Nom du patient</label>
                                    <input
                                        className={input}
                                        value={appointmentForm.patientName}
                                        onChange={(e) => updateAppointment("patientName", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={label}>Téléphone</label>
                                    <input
                                        className={input}
                                        value={appointmentForm.phone}
                                        onChange={(e) => updateAppointment("phone", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={label}>Date</label>
                                    <input
                                        type="date"
                                        className={input}
                                        value={appointmentForm.date}
                                        onChange={(e) => updateAppointment("date", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={label}>Heure</label>
                                    <input
                                        type="time"
                                        className={input}
                                        value={appointmentForm.time}
                                        onChange={(e) => updateAppointment("time", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className={label}>Motif</label>
                                <input
                                    className={input}
                                    value={appointmentForm.reason}
                                    onChange={(e) => updateAppointment("reason", e.target.value)}
                                />
                            </div>

                            <div className="mt-4">
                                <label className={label}>Notes</label>
                                <textarea
                                    className={`${input} min-h-24`}
                                    value={appointmentForm.notes}
                                    onChange={(e) => updateAppointment("notes", e.target.value)}
                                />
                            </div>

                            <div className="mt-4">
                                <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm text-white" onClick={saveAppointment}>
                                    Enregistrer le rendez-vous
                                </button>
                            </div>
                        </section>

                        <section className={section}>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Agenda partagé</h2>
                                <button className="text-xs text-slate-500 underline" onClick={loadAppointments}>
                                    Actualiser
                                </button>
                            </div>

                            <div className="mt-4">
                                <SearchInput
                                    value={searchAppointments}
                                    onChange={setSearchAppointments}
                                    placeholder="Rechercher nom, téléphone ou motif"
                                />
                            </div>

                            <div className="mt-4 max-h-[70vh] overflow-auto pr-1">
                                <AgendaView appointments={filteredAppointments} onStatusChange={updateAppointmentStatus} />

                                <div className="mt-6 space-y-3">
                                    {filteredAppointments.map((a) => (
                                        <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="font-medium text-slate-900">{a.patient_name}</div>
                                                    <div className="mt-1 text-sm text-slate-600">
                                                        {a.appointment_date || "-"} {a.appointment_time || ""}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-600">{a.reason || "-"}</div>
                                                </div>
                                                <button
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                                                    onClick={() => startEditAppointment(a)}
                                                >
                                                    Modifier
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {editingAppointmentId ? (
                                    <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                                        <div className="mb-3 font-medium text-slate-900">Modifier le rendez-vous</div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <input
                                                className={input}
                                                value={appointmentEditForm.patient_name}
                                                onChange={(e) =>
                                                    setAppointmentEditForm((p) => ({ ...p, patient_name: e.target.value }))
                                                }
                                                placeholder="Nom du patient"
                                            />
                                            <input
                                                className={input}
                                                value={appointmentEditForm.phone}
                                                onChange={(e) =>
                                                    setAppointmentEditForm((p) => ({ ...p, phone: e.target.value }))
                                                }
                                                placeholder="Téléphone"
                                            />
                                            <input
                                                type="date"
                                                className={input}
                                                value={appointmentEditForm.appointment_date}
                                                onChange={(e) =>
                                                    setAppointmentEditForm((p) => ({
                                                        ...p,
                                                        appointment_date: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="time"
                                                className={input}
                                                value={appointmentEditForm.appointment_time}
                                                onChange={(e) =>
                                                    setAppointmentEditForm((p) => ({
                                                        ...p,
                                                        appointment_time: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="mt-4 grid gap-4">
                                            <input
                                                className={input}
                                                value={appointmentEditForm.reason}
                                                onChange={(e) =>
                                                    setAppointmentEditForm((p) => ({ ...p, reason: e.target.value }))
                                                }
                                                placeholder="Motif"
                                            />
                                            <textarea
                                                className={`${input} min-h-24`}
                                                value={appointmentEditForm.notes}
                                                onChange={(e) =>
                                                    setAppointmentEditForm((p) => ({ ...p, notes: e.target.value }))
                                                }
                                                placeholder="Notes"
                                            />
                                        </div>

                                        <div className="mt-4 flex gap-3">
                                            <button
                                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
                                                onClick={saveEditedAppointment}
                                            >
                                                Enregistrer
                                            </button>
                                            <button
                                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
                                                onClick={() => setEditingAppointmentId(null)}
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "patients" && (
                    <section className={section}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Fiches patients</h2>
                            <button className="text-xs text-slate-500 underline" onClick={loadPatients}>
                                Actualiser
                            </button>
                        </div>

                        <div className="mt-4">
                            <SearchInput
                                value={searchPatients}
                                onChange={setSearchPatients}
                                placeholder="Rechercher nom ou téléphone"
                            />
                        </div>

                        <div className="mt-4 overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left">
                                        <th className="py-2 pr-4">Nom</th>
                                        <th className="py-2 pr-4">Âge</th>
                                        <th className="py-2 pr-4">Sexe</th>
                                        <th className="py-2 pr-4">Téléphone</th>
                                        <th className="py-2 pr-4">Créé le</th>
                                        <th className="py-2 pr-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map((p) => (
                                        <tr key={p.id} className="border-b border-slate-100 align-top">
                                            <td className="py-2 pr-4">{p.full_name}</td>
                                            <td className="py-2 pr-4">{p.age || "-"}</td>
                                            <td className="py-2 pr-4">{p.sex || "-"}</td>
                                            <td className="py-2 pr-4">{p.phone || "-"}</td>
                                            <td className="py-2 pr-4">
                                                {p.created_at ? new Date(p.created_at).toLocaleString("fr-FR") : "-"}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <button
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                                                    onClick={() => startEditPatient(p)}
                                                >
                                                    Modifier
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {editingPatientId ? (
                            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                                <div className="mb-3 font-medium text-slate-900">Modifier la fiche patient</div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <input
                                        className={input}
                                        value={patientEditForm.full_name}
                                        onChange={(e) =>
                                            setPatientEditForm((p) => ({ ...p, full_name: e.target.value }))
                                        }
                                        placeholder="Nom complet"
                                    />
                                    <input
                                        className={input}
                                        value={patientEditForm.phone}
                                        onChange={(e) =>
                                            setPatientEditForm((p) => ({ ...p, phone: e.target.value }))
                                        }
                                        placeholder="Téléphone"
                                    />
                                    <input
                                        className={input}
                                        value={patientEditForm.age}
                                        onChange={(e) =>
                                            setPatientEditForm((p) => ({ ...p, age: e.target.value }))
                                        }
                                        placeholder="Âge"
                                    />
                                    <select
                                        className={input}
                                        value={patientEditForm.sex}
                                        onChange={(e) =>
                                            setPatientEditForm((p) => ({ ...p, sex: e.target.value }))
                                        }
                                    >
                                        <option value="">Sexe</option>
                                        <option>Femme</option>
                                        <option>Homme</option>
                                    </select>
                                </div>

                                <div className="mt-4 grid gap-4">
                                    <textarea
                                        className={`${input} min-h-24`}
                                        value={patientEditForm.clinical_notes}
                                        onChange={(e) =>
                                            setPatientEditForm((p) => ({ ...p, clinical_notes: e.target.value }))
                                        }
                                        placeholder="Notes cliniques / évolution"
                                    />
                                    <textarea
                                        className={`${input} min-h-24`}
                                        value={patientEditForm.labs}
                                        onChange={(e) =>
                                            setPatientEditForm((p) => ({ ...p, labs: e.target.value }))
                                        }
                                        placeholder="Bilans / résultats / examens"
                                    />
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
                                        onClick={saveEditedPatient}
                                    >
                                        Enregistrer
                                    </button>
                                    <button
                                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
                                        onClick={() => setEditingPatientId(null)}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </section>
                )}

                {activeTab === "salle_attente" && (
                    <section className={section}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Salle d'attente</h2>
                            <button className="text-xs text-slate-500 underline" onClick={loadWaitingRoom}>
                                Actualiser
                            </button>
                        </div>

                        <div className="mt-4">
                            <SearchInput
                                value={searchWaitingRoom}
                                onChange={setSearchWaitingRoom}
                                placeholder="Rechercher nom, téléphone ou motif"
                            />
                        </div>

                        <div className="mt-4 space-y-3 max-h-[70vh] overflow-auto pr-1">
                            {filteredWaitingRoom.length ? (
                                filteredWaitingRoom.map((w) => (
                                    <div key={w.id} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium text-slate-900">{w.patient_name}</div>
                                                <div className="mt-1 text-sm text-slate-600">{w.phone || "-"}</div>
                                                <div className="mt-1 text-sm text-slate-600">{w.reason || "-"}</div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {w.created_at ? new Date(w.created_at).toLocaleString("fr-FR") : "-"}
                                                </div>
                                            </div>

                                            <span className="rounded-full border px-2.5 py-1 text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                                                Présent
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => updateWaitingStatus(w.id, "en_consultation")}
                                                className="rounded-xl border px-3 py-2 text-xs bg-white border-slate-300 text-slate-700"
                                            >
                                                En consultation
                                            </button>
                                            <button
                                                onClick={() => updateWaitingStatus(w.id, "sorti")}
                                                className="rounded-xl border px-3 py-2 text-xs bg-slate-900 text-white border-slate-900"
                                            >
                                                Sorti
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                    Aucun patient en salle d'attente.
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === "patients_du_jour" && (
                    <section className={section}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Patients du jour</h2>
                            <div className="text-sm text-slate-600">Total : {todaysPatients.length}</div>
                        </div>

                        <div className="mt-4 overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left">
                                        <th className="py-2 pr-4">Heure</th>
                                        <th className="py-2 pr-4">Patient</th>
                                        <th className="py-2 pr-4">Motif</th>
                                        <th className="py-2 pr-4">Statut</th>
                                        <th className="py-2 pr-4">Urgence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todaysPatients.map((p) => (
                                        <tr key={p.id} className="border-b border-slate-100">
                                            <td className="py-2 pr-4">
                                                {new Date(p.created_at).toLocaleTimeString("fr-FR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="py-2 pr-4">{p.patient_name}</td>
                                            <td className="py-2 pr-4">{p.main_symptom}</td>
                                            <td className="py-2 pr-4">
                                                {(statusOptions.find((s) => s.value === p.status)?.label) || "En attente"}
                                            </td>
                                            <td className="py-2 pr-4">{p.priority}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}