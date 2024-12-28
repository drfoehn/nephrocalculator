from flask import Flask, render_template, request
import math

app = Flask(__name__)

def convert_krea_to_mgdl(krea, unit):
    """
    Konvertiert Kreatinin zu mg/dl wenn nötig
    """
    if unit == 'umol/l':
        return krea / 88.4
    return krea

def ckd_epi_2021(krea, alter, geschlecht, unit='mg/dl'):
    """
    Berechnet GFR nach CKD-EPI 2021 Formel
    krea in mg/dl oder umol/l
    alter in jahren
    geschlecht: 'm' oder 'w'
    """
    krea_mgdl = convert_krea_to_mgdl(krea, unit)
    k = 0.7 if geschlecht == 'w' else 0.9
    a = -0.241 if geschlecht == 'w' else -0.302
    
    krea_k = krea_mgdl/k
    if krea_k <= 1:
        krea_term = krea_k ** a
    else:
        krea_term = krea_k ** -1.200
    
    gfr = 142 * krea_term * 0.9938**alter
    if geschlecht == 'w':
        gfr *= 1.012
        
    return round(gfr, 1)

def ckd_epi_cys_krea_2021(krea, cystatin, alter, geschlecht, unit='mg/dl'):
    """
    Berechnet GFR nach CKD-EPI 2021 Kreatinin-Cystatin C Formel
    """
    krea_mgdl = convert_krea_to_mgdl(krea, unit)
    k = 0.7 if geschlecht == 'w' else 0.9
    a = -0.219 if geschlecht == 'w' else -0.144
    
    krea_k = krea_mgdl/k
    if krea_k <= 1:
        krea_term = krea_k ** a 
    else:
        krea_term = krea_k ** -0.544

    cys_term = cystatin ** -0.323

    gfr = 135 * krea_term * cys_term * 0.9961**alter
    if geschlecht == 'w':
        gfr *= 1.008
        
    return round(gfr, 1)

def cys_gfr(cystatin, alter, geschlecht):
    """
    Berechnet GFR nach CKD-EPI Cystatin C Formel
    """
    gfr = 133 * (cystatin/0.8)**(-0.499)
    if cystatin > 0.8:
        gfr = 133 * (cystatin/0.8)**(-1.328)
    
    gfr *= 0.996**alter
    if geschlecht == 'w':
        gfr *= 0.932
        
    return round(gfr, 1)

def get_ckd_stage(gfr, acr=None, prot_krea=None):
    """
    Bestimmt CKD Stadium nach KDIGO basierend auf GFR und ggf. ACR/Prot-Krea
    """
    if gfr >= 90:
        stage = "G1"
    elif gfr >= 60:
        stage = "G2" 
    elif gfr >= 45:
        stage = "G3a"
    elif gfr >= 30:
        stage = "G3b"
    elif gfr >= 15:
        stage = "G4"
    else:
        stage = "G5"
        
    # Albuminurie Kategorie
    if acr is not None:
        if acr < 30:
            stage += " A1"
        elif acr <= 300:
            stage += " A2"
        else:
            stage += " A3"
    elif prot_krea is not None:
        if prot_krea < 150:
            stage += " A1"
        elif prot_krea <= 500:
            stage += " A2"
        else:
            stage += " A3"
            
    return stage

def calculate_ratios(albumin=None, protein=None, urin_krea=None, albumin_unit='mg/dl', protein_unit='g/l', krea_unit='mg/dl'):
    """
    Berechnet ACR und PCR aus Einzelwerten
    Einheiten werden konvertiert zu mg/g für die Ratios
    """
    results = {}
    
    if urin_krea:
        # Konvertiere Kreatinin zu mg/dl falls nötig
        krea_mgdl = convert_krea_to_mgdl(urin_krea, krea_unit)
        
        if albumin:
            # Konvertiere Albumin zu mg/dl falls nötig
            albumin_mgdl = albumin
            if albumin_unit == 'g/l':
                albumin_mgdl = albumin * 100  # g/L zu mg/dl
            
            # Berechne ACR in mg/g
            results['acr'] = (albumin_mgdl * 100) / krea_mgdl
            
        if protein:
            # Konvertiere Protein zu mg/dl falls nötig
            protein_mgdl = protein
            if protein_unit == 'g/l':
                protein_mgdl = protein * 100  # g/L zu mg/dl
            
            # Berechne PCR in mg/g
            results['pcr'] = (protein_mgdl * 100) / krea_mgdl
            
    return results

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
            krea = float(request.form['krea'])
            krea_unit = request.form['krea_unit']
            alter = int(request.form['alter'])
            geschlecht = request.form['geschlecht']
            
            # Optionale Parameter für Cystatin C
            cystatin = request.form.get('cystatin', '')
            
            # Optionale Parameter für Urin
            albumin = request.form.get('albumin', '')
            albumin_unit = request.form.get('albumin_unit', 'mg/dl')
            protein = request.form.get('protein', '')
            protein_unit = request.form.get('protein_unit', 'g/l')
            urin_krea = request.form.get('urin_krea', '')
            urin_krea_unit = request.form.get('urin_krea_unit', 'mg/dl')
            
            # Direkt eingegebene Ratios
            acr = request.form.get('acr', '')
            pcr = request.form.get('prot_krea', '')
            
            # GFR Berechnungen
            results = {
                'ckd_epi': ckd_epi_2021(krea, alter, geschlecht, krea_unit)
            }
            
            if cystatin:
                cystatin = float(cystatin)
                results['ckd_epi_cys_krea'] = ckd_epi_cys_krea_2021(krea, cystatin, alter, geschlecht, krea_unit)
                results['cys_gfr'] = cys_gfr(cystatin, alter, geschlecht)
            
            # Berechne Ratios aus Einzelwerten wenn möglich
            if urin_krea:
                ratios = calculate_ratios(
                    albumin=float(albumin) if albumin else None,
                    protein=float(protein) if protein else None,
                    urin_krea=float(urin_krea),
                    albumin_unit=albumin_unit,
                    protein_unit=protein_unit,
                    krea_unit=urin_krea_unit
                )
                if 'acr' in ratios:
                    acr = str(round(ratios['acr'], 1))
                if 'pcr' in ratios:
                    pcr = str(round(ratios['pcr'], 1))
            
            # CKD Stadium
            if acr:
                results['acr'] = float(acr)
                results['ckd_stage'] = get_ckd_stage(results['ckd_epi'], acr=float(acr))
            elif pcr:
                results['pcr'] = float(pcr)
                results['ckd_stage'] = get_ckd_stage(results['ckd_epi'], prot_krea=float(pcr))
            else:
                results['ckd_stage'] = get_ckd_stage(results['ckd_epi'])
                
            # Farbskalen für die Visualisierung
            if results:
                results['gfr_color'] = get_gfr_color(results['ckd_epi'])
                if 'acr' in results:
                    results['acr_color'] = get_acr_color(results['acr'])
            
            return render_template('index.html', results=results)
            
        except ValueError:
            error = "Bitte geben Sie gültige Zahlen ein"
            return render_template('index.html', error=error)
            
    return render_template('index.html')

def get_gfr_color(gfr):
    """
    Gibt Farbe basierend auf GFR-Wert zurück
    """
    if gfr >= 90:
        return "#4CAF50"  # Grün
    elif gfr >= 60:
        return "#8BC34A"  # Hellgrün
    elif gfr >= 45:
        return "#FFEB3B"  # Gelb
    elif gfr >= 30:
        return "#FFC107"  # Orange
    elif gfr >= 15:
        return "#FF5722"  # Orange-Rot
    else:
        return "#F44336"  # Rot

def get_acr_color(acr):
    """
    Gibt Farbe basierend auf ACR-Wert zurück
    """
    if acr < 30:
        return "#4CAF50"  # Grün
    elif acr <= 300:
        return "#FFEB3B"  # Gelb
    else:
        return "#F44336"  # Rot

if __name__ == '__main__':
    app.run(debug=True) 