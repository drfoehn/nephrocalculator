// Komponenten zuerst definieren
const GfrScale = {
    props: ['value', 'category'],
    template: `
        <div class="scale-container">
            <div class="scale-bar">
                <div v-for="stage in stages" 
                     :key="stage.name"
                     class="stage"
                     :style="{ 
                         backgroundColor: stage.color,
                         flex: stage.width
                     }">
                    {{ stage.name }}
                </div>
                <div v-if="value" 
                     class="marker"
                     :style="{ left: getMarkerPosition() + '%' }">
                    {{ value }}
                </div>
            </div>
            <div class="scale-labels">
                <span>0</span>
                <span>15</span>
                <span>30</span>
                <span>45</span>
                <span>60</span>
                <span>90</span>
                <span>120</span>
            </div>
        </div>
    `,
    data() {
        return {
            stages: [
                { name: 'G5', color: '#F44336', width: 1, range: [0, 15] },
                { name: 'G4', color: '#FF5722', width: 1, range: [15, 30] },
                { name: 'G3b', color: '#FFC107', width: 1, range: [30, 45] },
                { name: 'G3a', color: '#FFEB3B', width: 1, range: [45, 60] },
                { name: 'G2', color: '#8BC34A', width: 2, range: [60, 90] },
                { name: 'G1', color: '#4CAF50', width: 2, range: [90, 120] }
            ]
        }
    },
    methods: {
        getMarkerPosition() {
            return Math.min(Math.max(this.value, 0), 120) / 120 * 100
        }
    }
}

const KdigoMatrix = {
    props: ['gfrCategory', 'albuminuriaCategory'],
    template: `
        <div class="kdigo-matrix">
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th></th>
                        <th colspan="3">Albuminurie Kategorien (mg/g)</th>
                    </tr>
                    <tr>
                        <th>GFR Kategorien<br>(ml/min/1.73m²)</th>
                        <th>A1<br><small>Normal bis<br>leicht erhöht<br>&lt;30</small></th>
                        <th>A2<br><small>Moderat<br>erhöht<br>30-300</small></th>
                        <th>A3<br><small>Stark<br>erhöht<br>&gt;300</small></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="stage-label">G1<br><small>≥90</small></td>
                        <td :class="getCellClass('G1', 'A1')">Niedrig</td>
                        <td :class="getCellClass('G1', 'A2')">Moderat</td>
                        <td :class="getCellClass('G1', 'A3')">Hoch</td>
                    </tr>
                    <tr>
                        <td class="stage-label">G2<br><small>60-89</small></td>
                        <td :class="getCellClass('G2', 'A1')">Niedrig</td>
                        <td :class="getCellClass('G2', 'A2')">Moderat</td>
                        <td :class="getCellClass('G2', 'A3')">Hoch</td>
                    </tr>
                    <tr>
                        <td class="stage-label">G3a<br><small>45-59</small></td>
                        <td :class="getCellClass('G3a', 'A1')">Moderat</td>
                        <td :class="getCellClass('G3a', 'A2')">Hoch</td>
                        <td :class="getCellClass('G3a', 'A3')">Sehr hoch</td>
                    </tr>
                    <tr>
                        <td class="stage-label">G3b<br><small>30-44</small></td>
                        <td :class="getCellClass('G3b', 'A1')">Hoch</td>
                        <td :class="getCellClass('G3b', 'A2')">Hoch</td>
                        <td :class="getCellClass('G3b', 'A3')">Sehr hoch</td>
                    </tr>
                    <tr>
                        <td class="stage-label">G4<br><small>15-29</small></td>
                        <td :class="getCellClass('G4', 'A1')">Sehr hoch</td>
                        <td :class="getCellClass('G4', 'A2')">Sehr hoch</td>
                        <td :class="getCellClass('G4', 'A3')">Sehr hoch</td>
                    </tr>
                    <tr>
                        <td class="stage-label">G5<br><small>&lt;15</small></td>
                        <td :class="getCellClass('G5', 'A1')">Sehr hoch</td>
                        <td :class="getCellClass('G5', 'A2')">Sehr hoch</td>
                        <td :class="getCellClass('G5', 'A3')">Sehr hoch</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    methods: {
        getCellClass(gfrStage, albStage) {
            const riskClasses = {
                'G1': { 'A1': 'risk-low', 'A2': 'risk-moderate', 'A3': 'risk-high' },
                'G2': { 'A1': 'risk-low', 'A2': 'risk-moderate', 'A3': 'risk-high' },
                'G3a': { 'A1': 'risk-moderate', 'A2': 'risk-high', 'A3': 'risk-very-high' },
                'G3b': { 'A1': 'risk-high', 'A2': 'risk-high', 'A3': 'risk-very-high' },
                'G4': { 'A1': 'risk-very-high', 'A2': 'risk-very-high', 'A3': 'risk-very-high' },
                'G5': { 'A1': 'risk-very-high', 'A2': 'risk-very-high', 'A3': 'risk-very-high' }
            }
            
            return {
                [riskClasses[gfrStage][albStage]]: true,
                'current': this.isCurrentPosition(gfrStage, albStage)
            }
        },
        isCurrentPosition(gfrStage, albStage) {
            return this.gfrCategory?.stage === gfrStage && 
                   this.albuminuriaCategory?.stage === albStage
        }
    }
}

// Haupt-App-Konfiguration
const appConfig = {
    components: {
        'gfr-scale': GfrScale,
        'kdigo-matrix': KdigoMatrix
    },
    data() {
        return {
            input: {
                // Patientendaten
                age: null,
                sex: 'm',
                height: null,
                weight: null,

                // Serum/Plasma-Werte
                krea: null,
                kreaUnit: 'mg/dl',
                cysC: null,
                cysCUnit: 'mg/l',
                serumNa: null,
                serumUrea: null,
                serumUreaUnit: 'mg/dl',

                // Urin-Werte
                urineAlb: null,
                urineAlbUnit: 'mg/dl',
                urineKrea: null,
                urineKreaUnit: 'mg/dl',
                urineNa: null,
                urineUrea: null,
                urineUreaUnit: 'mg/dl'
            },
            results: null,
            validationError: null
        }
    },
    methods: {
        // Einheiten-Konvertierung
        convertKreaToMgdl(value, unit) {
            return unit === 'umol/l' ? value / 88.4 : value
        },
        
        convertUreaToMgdl(value, unit) {
            return unit === 'mmol/l' ? value * 6.006 : value
        },

        // GFR Berechnungen
        calculateCkdEpi2021(krea, age, sex, unit = 'mg/dl') {
            const kreaMgdl = this.convertKreaToMgdl(krea, unit)
            const k = sex === 'f' ? 0.7 : 0.9
            const a = sex === 'f' ? -0.241 : -0.302
            
            const kreaK = kreaMgdl/k
            const kreaTerm = kreaK <= 1 ? Math.pow(kreaK, a) : Math.pow(kreaK, -1.200)
            
            let gfr = 142 * kreaTerm * Math.pow(0.9938, age)
            if (sex === 'f') gfr *= 1.012
            
            return Math.round(gfr * 10) / 10
        },

        calculateCysC(cysC, age, sex) {
            const a = Math.pow(cysC/0.8, -0.499)
            const b = Math.pow(cysC/0.8, -1.328)
            const cysTerm = cysC <= 0.8 ? a : b
            
            let gfr = 133 * cysTerm * Math.pow(0.996, age)
            if (sex === 'f') gfr *= 0.932
            
            return Math.round(gfr * 10) / 10
        },

        calculateCombinedGfr(krea, cysC, age, sex, kreaUnit = 'mg/dl') {
            const kreaMgdl = this.convertKreaToMgdl(krea, kreaUnit)
            const k = sex === 'f' ? 0.7 : 0.9
            const a = sex === 'f' ? -0.219 : -0.144
            
            const kreaK = kreaMgdl/k
            const kreaTerm = kreaK <= 1 ? Math.pow(kreaK, a) : Math.pow(kreaK, -0.544)
            
            const b = Math.pow(cysC/0.8, -0.323)
            const c = Math.pow(cysC/0.8, -0.778)
            const cysTerm = cysC <= 0.8 ? b : c
            
            let gfr = 135 * kreaTerm * cysTerm * Math.pow(0.995, age)
            if (sex === 'f') gfr *= 0.969
            
            return Math.round(gfr * 10) / 10
        },

        // Validierung
        validateInputs() {
            const errors = []
            
            // Grundlegende Validierung
            if (!this.input.age) {
                errors.push("Bitte geben Sie das Alter ein")
            } else if (this.input.age < 0 || this.input.age > 120) {
                errors.push("Alter muss zwischen 0 und 120 Jahren liegen")
            }
            
            if (!this.input.sex) {
                errors.push("Bitte wählen Sie das Geschlecht aus")
            }
            
            // Spezifische Validierung für Kinder
            if (this.input.age < 18 && !this.input.height) {
                errors.push("Bitte geben Sie die Körperlänge für Kinder/Jugendliche ein")
            }
            
            // Kreatinin Validierung
            if (this.input.krea) {
                const kreaMgdl = this.convertKreaToMgdl(this.input.krea, this.input.kreaUnit)
                if (kreaMgdl < 0.1 || kreaMgdl > 20) {
                    errors.push("Kreatinin sollte zwischen 0.1 und 20 mg/dl (8.8 und 1768 µmol/l) liegen")
                }
            }
            
            // Cystatin C Validierung
            if (this.input.cysC && (this.input.cysC < 0.1 || this.input.cysC > 10)) {
                errors.push("Cystatin C sollte zwischen 0.1 und 10 mg/l liegen")
            }
            
            return errors
        },

        showValidationErrors(errors) {
            this.validationError = errors.join('\n')
            setTimeout(() => {
                this.validationError = null
            }, 5000)
        },

        // Ausscheidungsberechnungen
        calculateExcretion() {
            const results = {}
            
            // Fraktionelle Natrium-Ausscheidung
            if (this.input.serumNa && this.input.urineNa && this.input.krea && this.input.urineKrea) {
                const urineKreaMgdl = this.convertKreaToMgdl(this.input.urineKrea, this.input.urineKreaUnit)
                const serumKreaMgdl = this.convertKreaToMgdl(this.input.krea, this.input.kreaUnit)
                
                results.feNa = (this.input.urineNa * serumKreaMgdl) / (this.input.serumNa * urineKreaMgdl) * 100
                results.feNa = Math.round(results.feNa * 100) / 100
            }
            
            // Fraktionelle Harnstoff-Ausscheidung
            if (this.input.serumUrea && this.input.urineUrea && this.input.krea && this.input.urineKrea) {
                const urineKreaMgdl = this.convertKreaToMgdl(this.input.urineKrea, this.input.urineKreaUnit)
                const serumKreaMgdl = this.convertKreaToMgdl(this.input.krea, this.input.kreaUnit)
                const urineUreaMgdl = this.convertUreaToMgdl(this.input.urineUrea, this.input.urineUreaUnit)
                const serumUreaMgdl = this.convertUreaToMgdl(this.input.serumUrea, this.input.serumUreaUnit)
                
                results.feUrea = (urineUreaMgdl * serumKreaMgdl) / (serumUreaMgdl * urineKreaMgdl) * 100
                results.feUrea = Math.round(results.feUrea * 100) / 100
            }
            
            return results
        },

        // Albumin-Kreatinin-Ratio
        calculateAcr() {
            if (!this.input.urineAlb || !this.input.urineKrea) return null
            
            // Konvertiere Albumin zu mg/dl wenn nötig
            let albMgdl = this.input.urineAlb
            if (this.input.urineAlbUnit === 'mg/l') albMgdl = albMgdl / 10
            if (this.input.urineAlbUnit === 'g/l') albMgdl = albMgdl * 100
            
            // Konvertiere Kreatinin zu mg/dl
            const kreaMgdl = this.convertKreaToMgdl(this.input.urineKrea, this.input.urineKreaUnit)
            
            // Berechne ACR in mg/g
            return Math.round((albMgdl / kreaMgdl) * 1000)
        },

        // KDIGO Klassifikation
        getGfrCategory(gfr) {
            if (!gfr) return null
            if (gfr >= 90) return { stage: 'G1', description: 'Normal oder hoch', color: '#4CAF50' }
            if (gfr >= 60) return { stage: 'G2', description: 'Leicht vermindert', color: '#8BC34A' }
            if (gfr >= 45) return { stage: 'G3a', description: 'Leicht bis moderat vermindert', color: '#FFEB3B' }
            if (gfr >= 30) return { stage: 'G3b', description: 'Moderat bis schwer vermindert', color: '#FFC107' }
            if (gfr >= 15) return { stage: 'G4', description: 'Schwer vermindert', color: '#FF5722' }
            return { stage: 'G5', description: 'Nierenversagen', color: '#F44336' }
        },

        getAlbuminuriaCategory(acr) {
            if (acr < 30) return { stage: 'A1', description: 'Normal bis leicht erhöht', color: '#4CAF50' }
            if (acr <= 300) return { stage: 'A2', description: 'Moderat erhöht', color: '#FFEB3B' }
            return { stage: 'A3', description: 'Stark erhöht', color: '#F44336' }
        },

        getKdigoRiskCategory(gfrStage, albStage) {
            const riskMatrix = {
                'G1': { 'A1': 'low', 'A2': 'moderate', 'A3': 'high' },
                'G2': { 'A1': 'low', 'A2': 'moderate', 'A3': 'high' },
                'G3a': { 'A1': 'moderate', 'A2': 'high', 'A3': 'very-high' },
                'G3b': { 'A1': 'high', 'A2': 'high', 'A3': 'very-high' },
                'G4': { 'A1': 'very-high', 'A2': 'very-high', 'A3': 'very-high' },
                'G5': { 'A1': 'very-high', 'A2': 'very-high', 'A3': 'very-high' }
            }
            
            return {
                level: riskMatrix[gfrStage][albStage],
                color: {
                    'low': '#4CAF50',
                    'moderate': '#FFEB3B',
                    'high': '#FF5722',
                    'very-high': '#F44336'
                }[riskMatrix[gfrStage][albStage]]
            }
        },

        // Neue Methode zur KOF-Berechnung nach DuBois
        calculateBsa(height, weight) {
            // height in cm, weight in kg
            return 0.007184 * Math.pow(height, 0.725) * Math.pow(weight, 0.425)
        },

        // Methode zur Umrechnung der normalisierten in absolute GFR
        calculateAbsoluteGfr(normalizedGfr, height, weight) {
            const bsa = this.calculateBsa(height, weight)
            return (normalizedGfr * bsa) / 1.73
        },

        // Erweiterte Hauptberechnungsmethode
        calculateAll() {
            const validationErrors = this.validateInputs()
            if (validationErrors.length > 0) {
                this.showValidationErrors(validationErrors)
                return
            }

            try {
                const results = {
                    gfr: {},
                    excretion: {},
                    kdigo: {}
                }
                
                // GFR Berechnungen
                if (this.input.krea) {
                    if (this.input.age < 18) {
                        // Schwartz-Formel für Kinder
                        results.gfr.schwartz = this.calculateSchwartzGfr(
                            this.input.krea,
                            this.input.height,
                            this.input.sex,
                            this.input.kreaUnit
                        )
                        results.kdigo.gfrCategory = this.getGfrCategory(results.gfr.schwartz)
                        
                        // Absolute GFR wenn Gewicht vorhanden
                        if (this.input.weight) {
                            results.gfr.schwartzAbsolute = this.calculateAbsoluteGfr(
                                results.gfr.schwartz,
                                this.input.height,
                                this.input.weight
                            )
                        }
                    } else {
                        // CKD-EPI nur für Erwachsene
                        results.gfr.ckdEpi = this.calculateCkdEpi2021(
                            this.input.krea,
                            this.input.age,
                            this.input.sex,
                            this.input.kreaUnit
                        )
                        results.kdigo.gfrCategory = this.getGfrCategory(results.gfr.ckdEpi)
                        
                        if (this.input.height && this.input.weight) {
                            results.gfr.ckdEpiAbsolute = this.calculateAbsoluteGfr(
                                results.gfr.ckdEpi,
                                this.input.height,
                                this.input.weight
                            )
                        }
                    }
                }
                
                // Cystatin C und kombinierte GFR nur für Erwachsene
                if (this.input.age >= 18) {
                    if (this.input.cysC) {
                        results.gfr.cysC = this.calculateCysC(
                            this.input.cysC,
                            this.input.age,
                            this.input.sex
                        )
                        if (this.input.height && this.input.weight) {
                            results.gfr.cysCAbsolute = this.calculateAbsoluteGfr(
                                results.gfr.cysC,
                                this.input.height,
                                this.input.weight
                            )
                        }
                    }
                    
                    if (this.input.krea && this.input.cysC) {
                        results.gfr.combined = this.calculateCombinedGfr(
                            this.input.krea,
                            this.input.cysC,
                            this.input.age,
                            this.input.sex,
                            this.input.kreaUnit
                        )
                        if (this.input.height && this.input.weight) {
                            results.gfr.combinedAbsolute = this.calculateAbsoluteGfr(
                                results.gfr.combined,
                                this.input.height,
                                this.input.weight
                            )
                        }
                    }
                }
                
                // Ausscheidungsberechnungen
                results.excretion = this.calculateExcretion()
                
                // ACR Berechnung
                results.acr = this.calculateAcr()
                if (results.acr !== null) {  // Wichtig: Prüfung auf null statt falsy
                    results.kdigo.albuminuriaCategory = this.getAlbuminuriaCategory(results.acr)
                }
                
                // KDIGO Risikokategorie
                if (results.kdigo.gfrCategory) {  // Nur GFR-Kategorie prüfen
                    results.kdigo.riskCategory = this.getKdigoRiskCategory(
                        results.kdigo.gfrCategory.stage,
                        results.kdigo.albuminuriaCategory?.stage || 'A1'  // Default zu A1 wenn keine Albuminurie
                    )
                }
                
                this.results = results
                this.validationError = null
                
            } catch (error) {
                this.showValidationErrors([error.message])
            }
        },

        getAlertClass(color) {
            const colorMap = {
                '#4CAF50': 'success',
                '#8BC34A': 'success',
                '#FFEB3B': 'warning',
                '#FFC107': 'warning',
                '#FF5722': 'danger',
                '#F44336': 'danger'
            }
            return colorMap[color] || 'info'
        },

        getFeNaInterpretation(feNa) {
            if (feNa < 1) return 'Hinweis auf prärenales Nierenversagen'
            if (feNa > 2) return 'Hinweis auf intrarenales Nierenversagen'
            return 'Grenzwertig, weitere Diagnostik erforderlich'
        },

        getFeNaAlertClass(feNa) {
            if (feNa < 1) return 'alert-warning'
            if (feNa > 2) return 'alert-danger'
            return 'alert-info'
        },

        getFeUreaInterpretation(feUrea) {
            if (feUrea < 35) return 'Hinweis auf prärenales Nierenversagen'
            if (feUrea > 50) return 'Hinweis auf intrarenales Nierenversagen'
            return 'Grenzwertig, weitere Diagnostik erforderlich'
        },

        getFeUreaAlertClass(feUrea) {
            if (feUrea < 35) return 'alert-warning'
            if (feUrea > 50) return 'alert-danger'
            return 'alert-info'
        },

        getRiskCategoryText(level) {
            const texts = {
                'low': 'Niedriges Risiko - Regelmäßige Kontrolle',
                'moderate': 'Moderat erhöhtes Risiko - Engmaschige Kontrolle empfohlen',
                'high': 'Hohes Risiko - Nephrologische Mitbetreuung empfohlen',
                'very-high': 'Sehr hohes Risiko - Dringende nephrologische Vorstellung'
            }
            return texts[level]
        },

        calculateSchwartzGfr(krea, height, sex, kreaUnit = 'mg/dl') {
            const kreaMgdl = this.convertKreaToMgdl(krea, kreaUnit)
            const k = sex === 'f' ? 0.413 : 0.413 // Gleicher k-Wert für beide Geschlechter nach neuerer Schwartz-Formel
            
            const gfr = (k * height) / kreaMgdl
            return Math.round(gfr * 10) / 10
        }
    }
}

// App initialisieren wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const app = Vue.createApp(appConfig)
    app.mount('#app')
    document.getElementById('loading').style.display = 'none'
}) 