import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UploadCloud, ImagePlus, FileText, MessageSquareHeart, RotateCcw, AlertTriangle } from "lucide-react";
import Layout from "../components/ui/Layout";
import SectionHeading from "../components/ui/SectionHeading";
import GlassCard from "../components/ui/GlassCard";
import GradientButton from "../components/ui/GradientButton";
import ScanRing from "../components/skin/ScanRing";
import ProgressRing from "../components/ui/ProgressRing";
import SkinCellBackground from "../components/skin/SkinCellBackground";
import { analyzeImage, getConfidenceThreshold } from "../services/analyzerService";
import { useReports } from "../context/ReportsContext";
import { useToast } from "../context/ToastContext";
import { MODEL_LABELS } from "../utils/modelLabels";

const STAGES = [
  "Image Received",
  "Image Preprocessing",
  "Feature Extraction",
  "AI Model Analysis",
  "Prediction",
  "Insight",
];

const MODEL_OPTIONS = [
  { value: "dermnet", label: "Skin Condition" },
  { value: "ham10000", label: "Mole / Lesion Check" },
  { value: "burns", label: "Burn Severity" },
];

const DEMO_IMAGE_URL =
  "https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=600&q=60&auto=format&fit=crop";

const GENERAL_HOME_CARE = [
  "Keep the affected area clean and gently moisturized.",
  "Avoid unnecessary scratching or irritation.",
];

const DEFAULT_TREATMENT_GUIDANCE = [
  "Consider discussing appropriate treatment options with a healthcare professional.",
];

const DEFAULT_WHEN_TO_SEE_DOCTOR =
  "Seek professional medical evaluation if symptoms worsen, spread rapidly, become severely painful, show signs of infection, or do not improve.";

const DERMNET_DESCRIPTIONS = {
  "Acne and Rosacea":
    "A common skin condition causing pimples, redness, or visible blood vessels, often affecting the face. Can range from mild to more persistent forms.",
  "Eczema and Dermatitis":
    "A group of conditions causing dry, itchy, inflamed skin, often triggered by irritants, allergens, or genetic factors.",
  "Skin Infections Bacterial Fungal Parasitic":
    "Infections of the skin caused by bacteria, fungi, or parasites, which can cause redness, swelling, itching, or discharge depending on the cause.",
  "Viral Skin Infections":
    "Skin conditions caused by viral infections, which may present as blisters, sores, or other lesions.",
  "Precancerous and Cancerous Lesions":
    "Skin growths or changes that may range from harmless to potentially serious, including some that require prompt medical evaluation to rule out skin cancer.",
  "Benign Growths":
    "Non-cancerous skin growths that are generally harmless but may be monitored for changes over time.",
  "Autoimmune and Systemic Conditions":
    "Skin changes that may reflect an underlying autoimmune or systemic health condition, often requiring broader medical evaluation beyond the skin itself.",
  "Psoriasis and Related Disorders":
    "A chronic condition causing scaly, thickened patches of skin, often related to immune system activity.",
  "Pigmentation Disorders":
    "Conditions affecting skin color, causing areas that are lighter or darker than surrounding skin.",
  "Drug Reactions and Blistering Conditions":
    "Skin reactions that can occur in response to medications or other triggers, ranging from mild rashes to more serious blistering conditions.",
  "Hair and Scalp Disorders":
    "Conditions affecting hair growth or the scalp, which can include hair thinning, loss, or scalp irritation.",
};

const HAM10000_DESCRIPTIONS = {
  nv: "A common mole (melanocytic nevus), which is usually benign but should be monitored for changes in size, shape, or color.",
  mel: "A pattern associated with melanoma, a serious form of skin cancer. Prompt evaluation by a dermatologist is strongly recommended.",
  bkl: "A benign lesion type (seborrheic keratosis-like growth), generally non-cancerous but worth having checked if new or changing.",
  bcc: "A pattern associated with basal cell carcinoma, the most common form of skin cancer. It grows slowly but should be evaluated by a doctor.",
  akiec:
    "A pattern associated with actinic keratosis or early squamous cell changes, which can sometimes progress and should be evaluated by a dermatologist.",
  vasc: "A vascular skin lesion (related to blood vessels), which is usually benign but worth having assessed if new or changing.",
  df: "A dermatofibroma, a common benign skin growth that typically does not require treatment unless it changes.",
};

const BURNS_DESCRIPTIONS = {
  first_degree:
    "A first-degree burn affects only the outer layer of skin, causing redness and pain, similar to a mild sunburn. It typically heals within a week without scarring.",
  second_degree:
    "A second-degree burn affects deeper skin layers, causing blistering, swelling, and significant pain. Healing takes longer and may require medical care.",
  third_degree:
    "A third-degree burn affects all layers of skin and possibly underlying tissue, and may appear white, leathery, or charred. This is a medical emergency requiring immediate care.",
};

function getConditionDescription(model, prediction) {
  if (model === "dermnet") return DERMNET_DESCRIPTIONS[prediction] || "";
  if (model === "ham10000") return HAM10000_DESCRIPTIONS[prediction] || "";
  if (model === "burns") return BURNS_DESCRIPTIONS[prediction] || "";
  return "";
}

const DERMNET_SIMPLE_LABELS = {
  "Acne and Rosacea": "Pimples & facial redness",
  "Eczema and Dermatitis": "Dry, itchy, irritated skin",
  "Skin Infections Bacterial Fungal Parasitic": "Skin infection (germs, fungus, or parasites)",
  "Viral Skin Infections": "Viral skin infection",
  "Precancerous and Cancerous Lesions": "Concerning skin growth needing checkup",
  "Benign Growths": "Harmless skin growth",
  "Autoimmune and Systemic Conditions": "Skin sign of a body-wide condition",
  "Psoriasis and Related Disorders": "Scaly, thickened skin patches",
  "Pigmentation Disorders": "Skin color changes",
  "Drug Reactions and Blistering Conditions": "Reaction or blistering (possibly from medication)",
  "Hair and Scalp Disorders": "Hair or scalp issue",
};

const HAM10000_SIMPLE_LABELS = {
  nv: "Common mole",
  mel: "Concerning mole (melanoma pattern)",
  bkl: "Harmless skin growth",
  bcc: "Common skin cancer type (slow-growing)",
  akiec: "Early skin change needing checkup",
  vasc: "Blood vessel-related mark",
  df: "Harmless firm bump",
};

const BURNS_SIMPLE_LABELS = {
  first_degree: "Mild burn (top layer only)",
  second_degree: "Moderate burn (deeper layers, blistering)",
  third_degree: "Severe burn (all layers, emergency)",
};

function getSimpleLabel(model, prediction) {
  if (model === "dermnet") return DERMNET_SIMPLE_LABELS[prediction] || "";
  if (model === "ham10000") return HAM10000_SIMPLE_LABELS[prediction] || "";
  if (model === "burns") return BURNS_SIMPLE_LABELS[prediction] || "";
  return "";
}

function getCareGuidance(model, prediction) {
  if (model === "dermnet") {
    const homeCare = [...GENERAL_HOME_CARE];
    switch (prediction) {
      case "Acne and Rosacea":
        homeCare.push(
          "Consider an over-the-counter cleanser containing benzoyl peroxide or salicylic acid"
        );
        break;
      case "Eczema and Dermatitis":
        homeCare.push(
          "Use a fragrance-free moisturizer regularly",
          "A mild over-the-counter hydrocortisone cream may help with itching, used sparingly and short-term"
        );
        break;
      case "Skin Infections Bacterial Fungal Parasitic":
        homeCare.push(
          "An over-the-counter antifungal or antiseptic cream may help for mild cases",
          "Seek medical care promptly if the area spreads, oozes, or worsens"
        );
        break;
      case "Psoriasis and Related Disorders":
        homeCare.push(
          "A medicated moisturizer or coal tar-based product may help manage scaling",
          "For scalp involvement, a coal tar shampoo may help"
        );
        break;
      default:
        // Precancerous/Cancerous Lesions, Viral Skin Infections, Autoimmune and
        // Systemic Conditions, Benign Growths, Pigmentation Disorders, Drug
        // Reactions and Blistering Conditions, Hair and Scalp Disorders — these
        // need professional evaluation, so no OTC suggestion is added.
        break;
    }
    return {
      home_care: homeCare,
      treatment_guidance: [...DEFAULT_TREATMENT_GUIDANCE],
      when_to_see_doctor: DEFAULT_WHEN_TO_SEE_DOCTOR,
      condition_description: getConditionDescription(model, prediction),
      follow_up:
        prediction === "Precancerous and Cancerous Lesions"
          ? "Follow up with a dermatologist within 1-2 weeks for further evaluation, given the nature of this category."
          : "Follow up in 1-2 weeks if symptoms do not improve or worsen.",
      simple_label: getSimpleLabel(model, prediction),
    };
  }

  if (model === "burns") {
    if (prediction === "first_degree") {
      return {
        home_care: [
          "A cool compress or aloe vera gel may help soothe the area",
          "Keep the area clean and avoid friction",
        ],
        treatment_guidance: [...DEFAULT_TREATMENT_GUIDANCE],
        when_to_see_doctor: DEFAULT_WHEN_TO_SEE_DOCTOR,
        condition_description: getConditionDescription(model, prediction),
        follow_up: "Follow up in a few days if pain or redness persists.",
        simple_label: getSimpleLabel(model, prediction),
      };
    }
    if (prediction === "second_degree") {
      return {
        home_care: [
          "A cool compress may help with pain",
          "An over-the-counter antibiotic ointment and non-stick sterile dressing may help protect minor open areas",
        ],
        treatment_guidance: [...DEFAULT_TREATMENT_GUIDANCE],
        when_to_see_doctor: `${DEFAULT_WHEN_TO_SEE_DOCTOR} Second-degree burns larger than 3 inches, or on the face, hands, feet, groin, or major joints, need medical evaluation.`,
        condition_description: getConditionDescription(model, prediction),
        follow_up: "Follow up with a healthcare provider within 24-48 hours.",
        simple_label: getSimpleLabel(model, prediction),
      };
    }
    if (prediction === "third_degree") {
      return {
        home_care: [],
        treatment_guidance: [...DEFAULT_TREATMENT_GUIDANCE],
        when_to_see_doctor:
          "Third-degree burns require immediate emergency medical attention. Do not attempt home treatment. Seek emergency care right away.",
        condition_description: getConditionDescription(model, prediction),
        follow_up: "Seek immediate emergency care; no follow-up delay is appropriate.",
        simple_label: getSimpleLabel(model, prediction),
      };
    }
    return {
      home_care: [...GENERAL_HOME_CARE],
      treatment_guidance: [...DEFAULT_TREATMENT_GUIDANCE],
      when_to_see_doctor: DEFAULT_WHEN_TO_SEE_DOCTOR,
      condition_description: getConditionDescription(model, prediction),
      follow_up: "Follow up in 1-2 weeks if symptoms do not improve or worsen.",
      simple_label: getSimpleLabel(model, prediction),
    };
  }

  if (model === "ham10000") {
    return {
      home_care: [...GENERAL_HOME_CARE],
      treatment_guidance: [...DEFAULT_TREATMENT_GUIDANCE],
      when_to_see_doctor:
        "Any new, changing, or unusual mole or skin lesion should be evaluated by a dermatologist promptly, as early evaluation is important for skin health.",
      condition_description: getConditionDescription(model, prediction),
      follow_up:
        "Follow up with a dermatologist within 1-2 weeks, regardless of confidence level, for professional evaluation of this lesion.",
      simple_label: getSimpleLabel(model, prediction),
    };
  }

  return {
    home_care: [...GENERAL_HOME_CARE],
    treatment_guidance: [...DEFAULT_TREATMENT_GUIDANCE],
    when_to_see_doctor: DEFAULT_WHEN_TO_SEE_DOCTOR,
    condition_description: getConditionDescription(model, prediction),
    follow_up: "Follow up in 1-2 weeks if symptoms do not improve or worsen.",
    simple_label: getSimpleLabel(model, prediction),
  };
}

export default function Analyzer() {
  const [imageUrl, setImageUrl] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | scanning | result
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [modelType, setModelType] = useState("dermnet");
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    bloodGroup: "",
    symptomDuration: "",
    knownAllergies: "",
    currentMedications: "",
  });
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { addReport } = useReports();
  const { push } = useToast();

  const updateField = (field, value) => setPatientInfo((prev) => ({ ...prev, [field]: value }));

  const runAnalysis = async (file, previewUrl) => {
    setImageUrl(previewUrl);
    setStatus("scanning");
    setStageIndex(0);
    const stageTimer = setInterval(() => {
      setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
    }, 420);

    const res = await analyzeImage(file, modelType);
    clearInterval(stageTimer);
    setStageIndex(STAGES.length - 1);
    setTimeout(() => {
      setResult(res);
      setStatus("result");
    }, 500);
  };

  const onFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    runAnalysis(file, url);
  };

  const onDemoImage = async () => {
    try {
      const response = await fetch(DEMO_IMAGE_URL);
      const blob = await response.blob();
      const demoFile = new File([blob], "demo-image.jpg", { type: blob.type });
      runAnalysis(demoFile, DEMO_IMAGE_URL);
    } catch (err) {
      push("Could not load the demo image", "error");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    onFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setStatus("idle");
    setImageUrl(null);
    setResult(null);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      const careGuidance = getCareGuidance(result.model, result.prediction);

      const response = await fetch("http://127.0.0.1:8000/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patientInfo.name || "Guest User",
          patient_age: patientInfo.age || "Not provided",
          patient_gender: patientInfo.gender || "Not provided",
          patient_weight: patientInfo.weight || "Not provided",
          patient_height: patientInfo.height || "Not provided",
          patient_blood_group: patientInfo.bloodGroup || "Not provided",
          model_type: result.model,
          prediction: result.prediction,
          confidence: result.confidence,
          alternatives: result.alternatives,
          home_care: careGuidance.home_care,
          treatment_guidance: careGuidance.treatment_guidance,
          when_to_see_doctor: careGuidance.when_to_see_doctor,
          condition_description: careGuidance.condition_description,
          follow_up: careGuidance.follow_up,
          simple_label: careGuidance.simple_label,
          symptom_duration: patientInfo.symptomDuration || null,
          known_allergies: patientInfo.knownAllergies || null,
          current_medications: patientInfo.currentMedications || null,
          model_version_note: `Model: ${result.model} · Trained on public dermatology datasets for educational purposes`,
          image_base64: imageBase64,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const pdfBlob = await response.blob();
      const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      addReport({
        type: "analysis",
        patient: { name: patientInfo.name || "Guest User" },
        consultation: {
          consultationId: `ANLZ-${Date.now()}`,
          date: new Date().toISOString(),
          type: "skin_condition",
        },
        image: {
          imageUrl: imageUrl || null,
          qualityStatus: "Good",
        },
        aiAssessment: {
          ...result,
          prediction: careGuidance.simple_label || result.prediction,
        },
        recommendations: {
          homeCare: careGuidance.home_care,
          generalTreatmentGuidance: careGuidance.treatment_guidance,
          whenToSeeDoctor: careGuidance.when_to_see_doctor,
        },
        pdfBase64,
      });

      push("Report saved to your Reports.", "success");
      setPatientInfo({
        name: "",
        age: "",
        gender: "",
        weight: "",
        height: "",
        bloodGroup: "",
        symptomDuration: "",
        knownAllergies: "",
        currentMedications: "",
      });
      navigate("/reports");
    } catch (err) {
      push("Could not generate the report. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const threshold = getConfidenceThreshold();
  const isHighStakesCategory =
    result &&
    ((result.model === "dermnet" &&
      (result.prediction === "Precancerous and Cancerous Lesions" ||
        result.prediction === "Autoimmune and Systemic Conditions")) ||
      (result.model === "ham10000" && (result.prediction === "mel" || result.prediction === "bcc")));
  const isLowConfidence =
    result && (result.confidence < threshold || (isHighStakesCategory && result.confidence < 50));
  const showHighStakesCaution =
    isHighStakesCategory && result.confidence >= 50 && result.confidence < 70;
  const highStakesCautionText =
    result && result.model === "ham10000"
      ? "This result falls into a sensitive lesion type with moderate confidence. This is not a diagnosis — please do not be alarmed. Prompt evaluation by a dermatologist is recommended to confirm or rule this out."
      : "This result falls into a sensitive category with moderate confidence. This is not a diagnosis — please do not be alarmed. Prompt evaluation by a dermatologist is recommended to confirm or rule this out.";
  const simpleLabel = result ? getSimpleLabel(result.model, result.prediction) : "";

  return (
    <Layout>
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <SkinCellBackground variant="cells" />
        <SectionHeading
          eyebrow="AI Skin Analyzer"
          title="Analyze Your Skin with AI"
          subtitle="Upload a clear photo and receive an AI-assisted, educational demo analysis in seconds."
        />

        <div className="relative mx-auto mt-14 max-w-3xl">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-6 flex flex-wrap justify-center gap-3">
                  {MODEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setModelType(opt.value)}
                      aria-pressed={modelType === opt.value}
                      className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                        modelType === opt.value
                          ? "border-transparent bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] text-white shadow"
                          : "border-[var(--border-strong)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <GlassCard
                  className="flex flex-col items-center gap-4 border-2 border-dashed border-[var(--border-strong)] p-14 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                >
                  <UploadCloud className="h-10 w-10 text-[var(--accent-1)]" />
                  <p className="text-lg font-semibold text-[var(--text)]">Drop your skin image here</p>
                  <p className="text-sm text-[var(--text-faint)]">Supports JPG, JPEG, PNG, WEBP</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <GradientButton icon={ImagePlus} onClick={() => fileRef.current?.click()}>
                      Upload Image
                    </GradientButton>
                    <GradientButton variant="secondary" onClick={onDemoImage}>
                      Use Demo Image
                    </GradientButton>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                </GlassCard>
              </motion.div>
            )}

            {status === "scanning" && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="flex flex-col items-center gap-8 p-12">
                  <div className="relative flex h-64 w-64 items-center justify-center">
                    <ScanRing size={256} />
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Uploaded skin"
                        className="absolute h-36 w-36 rounded-full object-cover opacity-80"
                      />
                    )}
                  </div>
                  <div className="w-full max-w-sm">
                    {STAGES.map((s, i) => (
                      <div key={s} className="mb-2 flex items-center gap-3">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            i <= stageIndex ? "bg-[var(--accent-1)]" : "bg-[var(--border-strong)]"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            i === stageIndex
                              ? "font-semibold text-[var(--text)]"
                              : i < stageIndex
                              ? "text-[var(--text-muted)]"
                              : "text-[var(--text-faint)]"
                          }`}
                        >
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {status === "result" && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <GlassCard className="p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
                      AI Result
                    </span>
                    {imageUrl && <img src={imageUrl} alt="Analyzed" className="h-14 w-14 rounded-xl object-cover" />}
                  </div>

                  <div className="mt-6 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
                    <ProgressRing value={result.confidence} sublabel="Confidence" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                        {isLowConfidence ? "Result" : "Possible Condition"}
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-[var(--text)]">
                        {isLowConfidence ? "No Clear Match" : result.prediction}
                      </h3>
                      {!isLowConfidence && simpleLabel && (
                        <p className="mt-0.5 text-sm text-[var(--text-muted)]">{simpleLabel}</p>
                      )}
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        {isLowConfidence
                          ? "The AI model could not identify a sufficiently confident match from the provided image."
                          : `AI-assisted result${result.severity ? ` · Severity: ${result.severity}` : ""}`}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-faint)]">Model: {MODEL_LABELS[result.model] ?? result.model}</p>
                    </div>
                  </div>

                  {!isLowConfidence && (
                    <div className="mt-8">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                        Top Predictions
                      </p>
                      <div className="space-y-2">
                        {result.alternatives.map((a) => (
                          <div key={a.label} className="flex items-center gap-3">
                            <span className="w-28 flex-shrink-0 truncate text-sm text-[var(--text)]">{a.label}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${a.confidence}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))]"
                              />
                            </div>
                            <span className="w-12 text-right text-xs text-[var(--text-faint)]">{a.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">
                      This is an AI-assisted demo prediction for educational purposes only. It is not a
                      confirmed medical diagnosis. Consult a licensed dermatologist for any concerns.
                    </p>
                  </div>

                  {showHighStakesCaution && (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-xs leading-relaxed">{highStakesCautionText}</p>
                    </div>
                  )}
                </GlassCard>

                <GlassCard className="p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                    Patient Details (optional)
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Name</label>
                      <input
                        type="text"
                        value={patientInfo.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Age</label>
                      <input
                        type="number"
                        value={patientInfo.age}
                        onChange={(e) => updateField("age", e.target.value)}
                        placeholder="e.g. 32"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Gender</label>
                      <select
                        value={patientInfo.gender}
                        onChange={(e) => updateField("gender", e.target.value)}
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Weight</label>
                      <input
                        type="text"
                        value={patientInfo.weight}
                        onChange={(e) => updateField("weight", e.target.value)}
                        placeholder="e.g. 65 kg"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Height</label>
                      <input
                        type="text"
                        value={patientInfo.height}
                        onChange={(e) => updateField("height", e.target.value)}
                        placeholder="e.g. 170 cm"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Blood Group</label>
                      <select
                        value={patientInfo.bloodGroup}
                        onChange={(e) => updateField("bloodGroup", e.target.value)}
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                        Symptom Duration
                      </label>
                      <input
                        type="text"
                        value={patientInfo.symptomDuration}
                        onChange={(e) => updateField("symptomDuration", e.target.value)}
                        placeholder="e.g. 3 days, 2 weeks"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                        Known Allergies
                      </label>
                      <input
                        type="text"
                        value={patientInfo.knownAllergies}
                        onChange={(e) => updateField("knownAllergies", e.target.value)}
                        placeholder="e.g. none, penicillin"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                        Current Medications
                      </label>
                      <input
                        type="text"
                        value={patientInfo.currentMedications}
                        onChange={(e) => updateField("currentMedications", e.target.value)}
                        placeholder="e.g. none, ibuprofen"
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-1)] focus:ring-2 focus:ring-[var(--accent-1)]/20"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <GradientButton icon={FileText} loading={generating} onClick={handleGenerateReport}>
                      Generate Report
                    </GradientButton>
                    <GradientButton variant="secondary" icon={MessageSquareHeart} onClick={() => navigate("/ai-doctor")}>
                      Ask AI About This
                    </GradientButton>
                    <GradientButton variant="ghost" icon={RotateCcw} onClick={reset}>
                      Analyze Another Image
                    </GradientButton>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
}
