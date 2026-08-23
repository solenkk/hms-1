import { useState, useEffect } from 'react'
import { Plus, Info, AlertCircle, CheckCircle2, Play } from 'lucide-react'

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

export default function IndicatorRulesEditor({
  outcomeShape,
  setOutcomeShape,
  options,
  setOptions,
  thresholds,
  setThresholds,
  minAge,
  setMinAge,
  maxAge,
  setMaxAge,
  disabledShape = false
}) {
  const [testValue, setTestValue] = useState('')
  const [testResult, setTestResult] = useState(null)

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

  useEffect(() => {
    if (outcomeShape === 'threshold' && testValue !== '') {
      const val = Number(testValue)
      if (isNaN(val)) {
        setTestResult('Invalid numeric value')
        return
      }

      const match = thresholds.find(t => {
        const min = t.min_value === '' || t.min_value === null ? -Infinity : Number(t.min_value)
        const max = t.max_value === '' || t.max_value === null ? Infinity : Number(t.max_value)
        return val >= min && val < max
      })

      if (match) {
        setTestResult(`Classified as: "${match.label}" (creates ${match.report_event_code})`)
      } else {
        setTestResult('No matching range (gap exists!)')
      }
    } else {
      setTestResult(null)
    }
  }, [testValue, thresholds, outcomeShape])

  const addOption = () => {
    setOptions([...options, { option_label: '', option_value: '', report_event_code: REPORT_EVENT_CODES[0], sort_order: options.length }])
  }

  const removeOption = (idx) => {
    setOptions(options.filter((_, i) => i !== idx))
  }

  const changeOption = (idx, field, val) => {
    setOptions(options.map((opt, i) => i === idx ? { ...opt, [field]: val } : opt))
  }

  const addThreshold = () => {
    setThresholds([...thresholds, { min_value: '', max_value: '', label: '', report_event_code: REPORT_EVENT_CODES[0], sort_order: thresholds.length }])
  }

  const removeThreshold = (idx) => {
    setThresholds(thresholds.filter((_, i) => i !== idx))
  }

  const changeThreshold = (idx, field, val) => {
    setThresholds(thresholds.map((t, i) => i === idx ? { ...t, [field]: val === '' ? '' : val } : t))
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Outcome Selection Shape *</label>
          <select 
            className="form-select" 
            value={outcomeShape} 
            onChange={e => setOutcomeShape(e.target.value)}
            disabled={disabledShape}
          >
            <option value="buttons">Pill Selection Buttons</option>
            <option value="threshold">Numeric Threshold Ranges</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Min Age (Years - Exception Bound)</label>
          <input type="number" step="any" className="form-input" value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="No minimum bound" />
        </div>

        <div className="form-group">
          <label className="form-label">Max Age (Years - Exception Bound)</label>
          <input type="number" step="any" className="form-input" value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="No maximum bound" />
        </div>
      </div>

      {outcomeShape === 'buttons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Configure Pill Buttons</h4>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addOption}>
              <Plus size={14} style={{ marginRight: 4 }} /> Add Button
            </button>
          </div>

          {options.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <Info size={28} />
              <p style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>Add at least one button for clinicians to select in the workflow.</p>
            </div>
          ) : (
            options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                <input 
                  className="form-input" 
                  style={{ flex: 1, padding: '0.35rem' }} 
                  value={opt.option_label} 
                  onChange={e => {
                    const val = e.target.value
                    // Auto set option_value if blank or matching
                    const valKey = val.toLowerCase().includes('non') || val.toLowerCase().includes('neg') ? 'negative' : (val.toLowerCase().includes('pos') || val.toLowerCase().includes('react') ? 'positive' : val.toLowerCase().replace(/\s+/g, '_'))
                    setOptions(options.map((o, i) => i === idx ? { ...o, option_label: val, option_value: o.option_value || valKey } : o))
                  }} 
                  placeholder="Button Label (e.g. Reactive)" 
                  required 
                />
                <select 
                  className="form-select" 
                  style={{ flex: 1.5, padding: '0.35rem' }} 
                  value={opt.report_event_code} 
                  onChange={e => changeOption(idx, 'report_event_code', e.target.value)}
                >
                  {REPORT_EVENT_CODES.map(code => <option key={code} value={code}>{code}</option>)}
                </select>
                <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeOption(idx)}>✕</button>
              </div>
            ))
          )}
        </div>
      )}

      {outcomeShape === 'threshold' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Configure Contiguous Threshold Ranges</h4>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addThreshold}>
              <Plus size={14} style={{ marginRight: 4 }} /> Add Range
            </button>
          </div>

          <div className="threshold-row" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
            <div>Min (inclusive)</div>
            <div>Max (exclusive)</div>
            <div>Label (e.g. High)</div>
            <div>Report Event Code</div>
            <div></div>
          </div>

          {thresholds.map((t, idx) => (
            <div key={idx} className="threshold-row">
              <input 
                type="number" 
                step="any"
                className="form-input" 
                value={t.min_value} 
                onChange={e => changeThreshold(idx, 'min_value', e.target.value)} 
                placeholder="Blank for -inf" 
              />
              <input 
                type="number" 
                step="any"
                className="form-input" 
                value={t.max_value} 
                onChange={e => changeThreshold(idx, 'max_value', e.target.value)} 
                placeholder="Blank for +inf" 
              />
              <input 
                className="form-input" 
                value={t.label} 
                onChange={e => changeThreshold(idx, 'label', e.target.value)} 
                placeholder="Label" 
                required 
              />
              <select 
                className="form-select" 
                value={t.report_event_code} 
                onChange={e => changeThreshold(idx, 'report_event_code', e.target.value)}
              >
                {REPORT_EVENT_CODES.map(code => <option key={code} value={code}>{code}</option>)}
              </select>
              <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeThreshold(idx)}>✕</button>
            </div>
          ))}

          {validationError ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem', background: 'rgba(224,92,92,0.1)', padding: '0.5rem', borderRadius: '6px' }}>
              <AlertCircle size={15} />
              <span>{validationError}</span>
            </div>
          ) : (
            thresholds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-green)', fontSize: '0.8rem', marginTop: '0.5rem', background: 'rgba(46,201,140,0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                <CheckCircle2 size={15} />
                <span>All ranges are contiguous, validated, and cover the full range of outcomes!</span>
              </div>
            )
          )}

          {thresholds.length > 0 && !validationError && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0 }}>Test classifier value:</label>
              <input 
                type="number" 
                className="form-input" 
                style={{ width: '100px', padding: '0.25rem 0.5rem' }} 
                value={testValue} 
                onChange={e => setTestValue(e.target.value)} 
                placeholder="e.g. 120"
              />
              {testResult && (
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  <Play size={10} style={{ display: 'inline', marginRight: 4 }} /> {testResult}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live workflow preview box */}
      <div className="live-preview-box" style={{ marginTop: '1rem' }}>
        <div className="preview-title">Live Preview (Clinical Workflow UI rendering)</div>
        <div className="preview-content">
          {outcomeShape === 'buttons' ? (
            options.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>[No buttons defined yet]</span>
            ) : (
              options.map((opt, i) => (
                <button key={i} type="button" className="preview-btn-mock">
                  {opt.option_label || 'Pill Button'}
                </button>
              ))
            )
          ) : (
            <div style={{ width: '100%' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Enter Measurable Value:</label>
              <input className="form-input" style={{ width: '180px', padding: '0.35rem' }} placeholder="Value (classified by range)" disabled />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
