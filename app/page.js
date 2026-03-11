"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

const demoUsers = {
    assistante: { role: "assistante", name: "Assistante", pin: "1234" },
    medecin: { role: "medecin", name: "Dr Hammach Yassine", pin: "2026" },
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

function badgeColor(level) {
    if (level === "rouge") return "bg-red-100 text-red-800 border-red-200";
    if (level === "orange") return "bg-amber-100 text-amber-800 border-amber-200";
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
                (form.risks || []).includes("HTA") ||
                (form.risks || []).includes("Tabac") ||
                (form.risks || []).includes("Antécédent cardiaque")
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
            if (has("Crépitants") || (form.risks || []).includes("Insuffisance cardiaque")) {
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
            diagnoses.push({ label: "Infection urinaire", score: has("Brûlures urinaires") ? 70 : 25 });
            diagnoses.push({ label: "Pneumonie", score: has("Toux") || has("Dyspnée") ? 70 : 30 });
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
            diagnoses.push({ label: "Colique néphrétique", score: has("Brûlures urinaires") ? 30 : 45 });
            exams.add("Examen neurologique des membres inférieurs");
            actions.add("Rechercher rétention urinaire, anesthésie en selle, déficit moteur");
            break;
        }
        case "Douleur mollet": {
            diagnoses.push({
                label: "Thrombose veineuse profonde",
                score:
                    (form.risks || []).includes("Voyage prolongé récent") || has("Douleur mollet unilatérale")
                        ? 90
                        : 60,
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
            if (
                (form.risks || []).includes("Grossesse possible") ||
                has("Grossesse possible") ||
                has("Saignement vaginal")
            ) {
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

function MultiSelectChips({ options, selected, setSelected }) {
    const toggle = (option) => {
        setSelected(
            selected.includes(option)
                ? selected.filter((x) => x !== option)
                : [...selected, option]
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">CABINET DR HAMMACH YASSINE</h1>
                <p className="mt-2 text-sm text-slate-600">Connexion V2 — synchronisation Supabase</p>
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
                            placeholder="1234 ou 2026"
                        />
                    </div>
                    {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
                    <button
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white"
                        onClick={submit}
                    >
                        Se connecter
                    </button>
                    <div className="text-xs text-slate-500">Démo : Assistante = 1234 · Médecin = 2026</div>
                </div>
            </div>
        </div>
    );
}

function PatientCard({ p, onOpen }) {
    const priorityStyles = badgeColor(p.priority);
    return (
        <button
            onClick={() => onOpen(p.id)}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-medium text-slate-900">{p.patient_name || "Patient sans nom"}</div>
                    <div className="mt-1 text-sm text-slate-600">
                        {p.patient_age || "?"} ans · {p.patient_sex} · {p.main_symptom}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        {new Date(p.created_at).toLocaleString("fr-FR")}
                    </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs ${priorityStyles}`}>
                    {p.priority}
                </span>
            </div>
            <div className="mt-3 text-sm text-slate-700">{p.diagnoses?.[0]?.label || "Aucun diagnostic"}</div>
        </button>
    );
}

export default function CabinetDrHammachYassineV2() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState("assistante");
    const [form, setForm] = useState(emptyForm);
    const [records, setRecords] = useState([]);
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [loading, setLoading] = useState(false);

    const summary = useMemo(() => computeClinicalSummary(form), [form]);

    const loadRecords = async () => {
        const { data, error } = await supabase
            .from("triage_forms")
            .select(`
        id,
        main_symptom,
        priority,
        alerts,
        diagnoses,
        exams,
        actions,
        notes,
        ta,
        fc,
        spo2,
        temperature,
        created_at,
        patients (
          full_name,
          age,
          sex,
          phone
        )
      `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        const normalized = (data || []).map((row) => ({
            id: row.id,
            main_symptom: row.main_symptom,
            priority: row.priority,
            alerts: row.alerts || [],
            diagnoses: row.diagnoses || [],
            exams: row.exams || [],
            actions: row.actions || [],
            notes: row.notes || "",
            ta: row.ta || "",
            fc: row.fc || "",
            spo2: row.spo2 || "",
            temperature: row.temperature || "",
            created_at: row.created_at,
            patient_name: row.patients?.full_name || "",
            patient_age: row.patients?.age || "",
            patient_sex: row.patients?.sex || "",
            patient_phone: row.patients?.phone || "",
        }));

        setRecords(normalized);
        if (!selectedRecordId && normalized[0]) setSelectedRecordId(normalized[0].id);
    };

    useEffect(() => {
        loadRecords();
        const interval = setInterval(loadRecords, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (user) setView(user.role);
    }, [user]);

    const selectedRecord = useMemo(
        () => records.find((r) => r.id === selectedRecordId) || null,
        [records, selectedRecordId]
    );

    const section = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
    const label = "mb-1 block text-sm font-medium text-slate-700";
    const input = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";
    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const saveRecord = async () => {
        try {
            setLoading(true);

            const { data: patient, error: patientError } = await supabase
                .from("patients")
                .insert({
                    full_name: form.fullName,
                    age: form.age ? Number(form.age) : null,
                    sex: form.sex,
                    phone: form.phone,
                })
                .select()
                .single();

            if (patientError) throw patientError;

            const clinical = computeClinicalSummary(form);

            const { data: triage, error: triageError } = await supabase
                .from("triage_forms")
                .insert({
                    patient_id: patient.id,
                    created_by: user?.name || "Assistante",
                    main_symptom: form.mainSymptom,
                    onset: form.onset,
                    duration: form.duration,
                    pain_scale: form.painScale ? Number(form.painScale) : null,
                    ta: form.ta,
                    fc: form.fc ? Number(form.fc) : null,
                    spo2: form.spo2 ? Number(form.spo2) : null,
                    temperature: form.temperature ? Number(form.temperature) : null,
                    fr: form.fr ? Number(form.fr) : null,
                    glycemia: form.glycemia,
                    associated: form.associated,
                    risks: form.risks,
                    notes: form.notes,
                    priority: clinical.priority,
                    alerts: clinical.alerts,
                    diagnoses: clinical.diagnoses,
                    exams: clinical.exams,
                    actions: clinical.actions,
                })
                .select()
                .single();

            if (triageError) throw triageError;

            setForm(emptyForm);
            setView("medecin");
            await loadRecords();
            setSelectedRecordId(triage.id);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'enregistrement dans Supabase");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <LoginScreen onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">CABINET DR HAMMACH YASSINE</h1>
                        <p className="mt-1 text-slate-600">V2 — synchronisation cloud assistante → médecin</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            className={`rounded-full px-4 py-2 text-sm ${view === "assistante" ? "bg-slate-900 text-white" : "bg-white border border-slate-300"}`}
                            onClick={() => setView("assistante")}
                        >
                            Vue assistante
                        </button>
                        <button
                            className={`rounded-full px-4 py-2 text-sm ${view === "medecin" ? "bg-slate-900 text-white" : "bg-white border border-slate-300"}`}
                            onClick={() => setView("medecin")}
                        >
                            Vue médecin
                        </button>
                        <button
                            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm"
                            onClick={() => setUser(null)}
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    {view === "assistante" ? (
                        <section className={section}>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Nouvelle fiche patient</h2>
                                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeColor(summary.priority)}`}>
                                    Priorité {summary.priority}
                                </span>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className={label}>Nom complet</label>
                                    <input className={input} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
                                </div>
                                <div>
                                    <label className={label}>Téléphone</label>
                                    <input className={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                                </div>
                                <div>
                                    <label className={label}>Âge</label>
                                    <input className={input} value={form.age} onChange={(e) => update("age", e.target.value)} />
                                </div>
                                <div>
                                    <label className={label}>Sexe</label>
                                    <select className={input} value={form.sex} onChange={(e) => update("sex", e.target.value)}>
                                        <option>Femme</option>
                                        <option>Homme</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={label}>Motif principal</label>
                                    <select className={input} value={form.mainSymptom} onChange={(e) => update("mainSymptom", e.target.value)}>
                                        {symptomCatalog.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={label}>Intensité douleur /10</label>
                                    <input className={input} value={form.painScale} onChange={(e) => update("painScale", e.target.value)} />
                                </div>
                            </div>

                            <h3 className="mb-3 mt-6 text-lg font-medium">Constantes</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div><label className={label}>TA</label><input className={input} value={form.ta} onChange={(e) => update("ta", e.target.value)} /></div>
                                <div><label className={label}>FC</label><input className={input} value={form.fc} onChange={(e) => update("fc", e.target.value)} /></div>
                                <div><label className={label}>SpO₂</label><input className={input} value={form.spo2} onChange={(e) => update("spo2", e.target.value)} /></div>
                                <div><label className={label}>Température</label><input className={input} value={form.temperature} onChange={(e) => update("temperature", e.target.value)} /></div>
                                <div><label className={label}>FR</label><input className={input} value={form.fr} onChange={(e) => update("fr", e.target.value)} /></div>
                                <div><label className={label}>Glycémie</label><input className={input} value={form.glycemia} onChange={(e) => update("glycemia", e.target.value)} /></div>
                            </div>

                            <h3 className={"mb-3 mt-6 text-lg font-medium"}>Questionnaire rapide</h3>
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
                                <MultiSelectChips options={associatedSymptoms} selected={form.associated} setSelected={(v) => update("associated", v)} />
                            </div>

                            <div className="mt-6">
                                <label className={label}>Facteurs de risque / antécédents</label>
                                <MultiSelectChips options={riskFactorsList} selected={form.risks} setSelected={(v) => update("risks", v)} />
                            </div>

                            <div className="mt-6">
                                <label className={label}>Notes assistante</label>
                                <textarea className={`${input} min-h-28`} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm text-white disabled:opacity-50"
                                    onClick={saveRecord}
                                    disabled={loading}
                                >
                                    {loading ? "Enregistrement..." : "Créer et envoyer au médecin"}
                                </button>
                                <button
                                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm"
                                    onClick={() => setForm(emptyForm)}
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        </section>
                    ) : (
                        <section className={section}>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Synthèse médecin</h2>
                                {selectedRecord ? (
                                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeColor(selectedRecord.priority)}`}>
                                        Priorité {selectedRecord.priority}
                                    </span>
                                ) : null}
                            </div>

                            {selectedRecord ? (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm text-slate-500">Patient</div>
                                            <div className="mt-1 font-medium text-slate-900">{selectedRecord.patient_name || "Patient sans nom"}</div>
                                            <div className="mt-1 text-sm text-slate-600">{selectedRecord.patient_age || "?"} ans · {selectedRecord.patient_sex}</div>
                                            <div className="mt-1 text-sm text-slate-600">{selectedRecord.patient_phone || "Téléphone non renseigné"}</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm text-slate-500">Motif et constantes</div>
                                            <div className="mt-1 font-medium text-slate-900">{selectedRecord.main_symptom}</div>
                                            <div className="mt-1 text-sm text-slate-600">
                                                TA {selectedRecord.ta || "-"} · FC {selectedRecord.fc || "-"} · SpO₂ {selectedRecord.spo2 || "-"}% · T {selectedRecord.temperature || "-"}°C
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {new Date(selectedRecord.created_at).toLocaleString("fr-FR")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                                        <div className="text-sm text-slate-500">Alertes immédiates</div>
                                        {selectedRecord.alerts?.length ? (
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                {selectedRecord.alerts.map((a) => <li key={a}>{a}</li>)}
                                            </ul>
                                        ) : (
                                            <div className="mt-2 text-sm text-slate-600">Aucune alerte majeure détectée.</div>
                                        )}
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                                        <div className="text-sm text-slate-500">Top 3 diagnostics probables</div>
                                        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-800">
                                            {(selectedRecord.diagnoses || []).map((d, i) => (
                                                <li key={`${d.label}-${i}`}>
                                                    <span className="font-medium">{d.label}</span>
                                                    <span className="text-slate-500"> — score {d.score}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm text-slate-500">Examens suggérés</div>
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                {(selectedRecord.exams || []).map((e, i) => <li key={`${e}-${i}`}>{e}</li>)}
                                            </ul>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="text-sm text-slate-500">Conduite suggérée</div>
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
                                                {(selectedRecord.actions || []).length
                                                    ? (selectedRecord.actions || []).map((a, i) => <li key={`${a}-${i}`}>{a}</li>)
                                                    : <li>À compléter par l'examen clinique</li>}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                        <div className="text-sm text-slate-500">Notes assistante</div>
                                        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                            {selectedRecord.notes || "Aucune note"}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                                    Aucune fiche reçue pour le moment.
                                </div>
                            )}
                        </section>
                    )}

                    <aside className="space-y-6">
                        <section className={section}>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Files patient</h2>
                                <button className="text-xs text-slate-500" onClick={loadRecords}>Actualiser</button>
                            </div>
                            <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
                                {records.length ? (
                                    records.map((r) => (
                                        <PatientCard
                                            key={r.id}
                                            p={r}
                                            onOpen={(id) => {
                                                setSelectedRecordId(id);
                                                setView("medecin");
                                            }}
                                        />
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                        Aucun patient enregistré.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className={section}>
                            <h2 className="text-lg font-semibold">Notes V2</h2>
                            <div className="mt-3 space-y-2 text-sm text-slate-700">
                                <div>• Données synchronisées via Supabase</div>
                                <div>• Visible sur les deux tablettes</div>
                                <div>• Rechargement automatique toutes les 3 secondes</div>
                                <div>• Base prête pour authentification réelle plus tard</div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}