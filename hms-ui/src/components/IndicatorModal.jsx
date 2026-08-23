import { useState, useEffect } from 'react'
import { adminApi, apiError } from '../api'
import toast from 'react-hot-toast'
import IndicatorRulesEditor from './IndicatorRulesEditor'

export const EMR_FIELD_LABELS = {
  anc_contact: "ANC Visit Contact",
  delivery_outcome: "Delivery Outcome",
  delivery_mode: "Delivery Mode",
  contraceptive_method: "Contraceptive Method Acceptance",
  ncd_screening: "NCD Screening & Enrollment",
  malnutrition_status: "Malnutrition Status",
  notifiable_diagnosis: "Notifiable Disease Diagnosis"
}

export const REPORT_EVENT_CODES = [
  "hiv_test_positive",
  "hiv_test_negative",
  "malaria_rdt_positive_pfalciparum",
  "malaria_rdt_positive_pvivax",
  "malaria_rdt_negative",
  "htn_enrollment",
  "dm_enrollment",
  "anc_first_contact",
  "anc_fourth_contact",
  "anc_eight_contacts",
  "maternal_death",
  "contraceptive_new_implant",
  "contraceptive_repeat_implant",
  "contraceptive_new_pill",
  "contraceptive_repeat_pill",
  "contraceptive_new_injectable",
  "contraceptive_repeat_injectable",
  "contraceptive_new_iud",
  "contraceptive_repeat_iud",
  "live_birth",
  "stillbirth",
  "delivery_mode_spontaneous",
  "delivery_mode_cesarean",
  "delivery_mode_instrumental",
  "perinatal_death",
  "obstetric_fistula",
  "measles_case",
  "cholera_case",
  "afp_case",
  "sam_new_case",
  "mam_new_case",
  "anthrax_case",
  "dracunculiasis_case",
  "chikungunya_case",
  "aefi_case",
  "rabies_exposure",
  "new_subtype_flu",
  "neonatal_tetanus",
  "sars_case",
  "dengue_case",
  "human_rabies",
  "smallpox_case",
  "vhf_case",
  "yellow_fever_case",
  "rift_valley_fever",
  "monkeypox_case",
  "covid19_case",
  "brucellosis_case",
  "other_notifiable"
]

export default function IndicatorModal({ defn, labTests = [], defaultContextType = 'lab_test', onClose, onSaved }) {
  const isEdit = !!defn
  const [label, setLabel] = useState(defn?.label || '')
  const [section, setSection] = useState(defn?.section || '')
  const [contextType, setContextType] = useState(defn?.context_type || defaultContextType)
  const [contextRef, setContextRef] = useState(defn?.context_ref || '')
  const [outcomeShape, setOutcomeShape] = useState(defn?.outcome_shape || 'buttons')
  const [enabled, setEnabled] = useState(defn?.enabled !== false)
  const [minAge, setMinAge] = useState(defn?.min_age ?? '')
  const [maxAge, setMaxAge] = useState(defn?.max_age ?? '')

  // Options and Thresholds lists
  const [options, setOptions] = useState(defn?.options || [])
  const [thresholds, setThresholds] = useState(defn?.thresholds || [])
  
  const [saving, setSaving] = useState(false)

  // Sync contextRef list defaults when contextType changes
  useEffect(() => {
    if (!isEdit) {
      if (contextType === 'emr_field') {
        setContextRef('anc_contact')
        setOutcomeShape('buttons')
      } else {
        setContextRef(labTests[0]?.id ? String(labTests[0].id) : '')
      }
    }
  }, [contextType])

  // Threshold contiguity verification on client side
  const validateThresholdsClient = () => {
    if (outcomeShape !== 'threshold') return null
    if (thresholds.length === 0) return 'Must add at least one threshold range.'
    
    const parsed = thresholds.map((t, idx) => {
      const min = t.min_value === '' || t.min_value === null ? -Infinity : Number(t.min_value)
      const max = t.max_value === '' || t.max_value === null ? Infinity : Number(t.max_value)
      return { min, max, label: t.label || `Range ${idx+1}`, raw: t }
    })

    parsed.sort((a, b) => a.min - b.min)

    if (parsed[0].min !== -Infinity) {
      return 'The lowest range must have an open-ended minimum (leave minimum blank) to avoid gaps.'
    }

    if (parsed[parsed.length - 1].max !== Infinity) {
      return 'The highest range must have an open-ended maximum (leave maximum blank) to avoid gaps.'
    }

    for (let i = 0; i < parsed.length; i++) {
      const curr = parsed[i]
      if (curr.min >= curr.max) {
        return `Range "${curr.label}" has invalid boundaries: min (${curr.raw.min_value}) must be less than max (${curr.raw.max_value}).`
      }
      if (i < parsed.length - 1) {
        const next = parsed[i+1]
        if (curr.max < next.min) {
          return `Gap detected: no classification between ${curr.raw.max_value} and ${next.raw.min_value}.`
        }
        if (curr.max > next.min) {
          return `Overlap detected: range "${curr.label}" ends at ${curr.raw.max_value} but range "${next.label}" starts at ${next.raw.min_value}.`
        }
      }
    }

    return null
  }

  const validationError = validateThresholdsClient()

  const submit = async (e) => {
    e.preventDefault()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    const payload = {
      label,
      section,
      context_type: contextType,
      context_ref: contextRef,
      outcome_shape: outcomeShape,
      enabled,
      min_age: minAge === '' ? null : Number(minAge),
      max_age: maxAge === '' ? null : Number(maxAge),
      options: outcomeShape === 'buttons' ? options : [],
      thresholds: outcomeShape === 'threshold' ? thresholds.map(t => ({
        ...t,
        min_value: t.min_value === '' ? null : Number(t.min_value),
        max_value: t.max_value === '' ? null : Number(t.max_value)
      })) : []
    }

    try {
      if (isEdit) {
        await adminApi.updateIndicator(defn.id, {
          label,
          section,
          enabled,
          min_age: payload.min_age,
          max_age: payload.max_age,
          options: payload.options,
          thresholds: payload.thresholds
        })
        toast.success('Indicator definition updated')
      } else {
        await adminApi.createIndicator(payload)
        toast.success('Indicator definition created')
      }
      onSaved()
    } catch (err) {
      toast.error(apiError(err, 'Failed to save indicator definition'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '680px', width: '90%' }}>
        <div className="modal-header">
          <h3>{isEdit ? `Edit Indicator: ${defn.label}` : 'Create Reportable Indicator'}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Indicator Label (Text on forms) *</label>
              <input className="form-input" value={label} onChange={e => setLabel(e.target.value)} required placeholder="e.g. HIV Tests" />
            </div>

            <div className="form-group">
              <label className="form-label">Government Form Section *</label>
              <input className="form-input" value={section} onChange={e => setSection(e.target.value)} required placeholder="e.g. HIV Testing" />
            </div>

            <div className="form-group">
              <label className="form-label">Context Type *</label>
              <select className="form-select" value={contextType} onChange={e => setContextType(e.target.value)} disabled={isEdit}>
                <option value="lab_test">Lab Test Type</option>
                <option value="emr_field">EMR Note Field</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Attach To (Target Concept) *</label>
              {contextType === 'lab_test' ? (
                <select className="form-select" value={contextRef} onChange={e => setContextRef(e.target.value)} disabled={isEdit}>
                  <option value="">Select Lab Test Type...</option>
                  {labTests.map(t => <option key={t.id} value={String(t.id)}>{t.name_en}</option>)}
                </select>
              ) : (
                <select className="form-select" value={contextRef} onChange={e => setContextRef(e.target.value)} disabled={isEdit}>
                  {Object.entries(EMR_FIELD_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Outcome Selection Shape *</label>
              <select 
                className="form-select" 
                value={outcomeShape} 
                onChange={e => setOutcomeShape(e.target.value)}
                disabled={isEdit || contextType === 'emr_field'}
              >
                <option value="buttons">Pill Selection Buttons</option>
                <option value="threshold" disabled={contextType === 'emr_field'}>Numeric Threshold Ranges</option>
              </select>
              {contextType === 'emr_field' && <small className="form-hint" style={{ color: 'var(--text-muted)' }}>Threshold classification is only supported for numeric lab tests.</small>}
            </div>

            <div className="form-group">
              <label className="form-label">Min Age (Years - Exception Tracking)</label>
              <input type="number" step="any" className="form-input" value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="Optional min bound" />
            </div>

            <div className="form-group">
              <label className="form-label">Max Age (Years - Exception Tracking)</label>
              <input type="number" step="any" className="form-input" value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="Optional max bound" />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                Enabled (Active in clinical workflow)
              </label>
            </div>
          </div>

          <IndicatorRulesEditor
            outcomeShape={outcomeShape}
            setOutcomeShape={setOutcomeShape}
            options={options}
            setOptions={setOptions}
            thresholds={thresholds}
            setThresholds={setThresholds}
            minAge={minAge}
            setMinAge={setMinAge}
            maxAge={maxAge}
            setMaxAge={setMaxAge}
            disabledShape={isEdit || contextType === 'emr_field'}
          />

          <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !!validationError}>
              {saving ? 'Saving…' : 'Save Indicator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
