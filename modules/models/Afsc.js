export class AFSC {
    constructor(afsc, target, overclassFactor, mandatoryDegreeBounds, usaCadetBounds, meritBounds){
        this.afsc = afsc; // code of the AFSC
        this.target = target; // minimum number of cadets assigned
        this.overclassFactor = overclassFactor; // scale factor
        this.mandatoryDegreeBounds = mandatoryDegreeBounds; // min and max bounds of mandatory degrees
        this.usaCadetBounds = usaCadetBounds; // min and max bounds of USAFA cadets
        this.meritBounds = meritBounds; // min and max bounds of merit
        this.weightedDistribution = 0; // weighted distribution of cadets wanting this AFSC
    }

    // Static method to create an AFSC object from a CSV row
    static fromCSV(row) {
        return new AFSC(
            row.afsc, 
            parseInt(row.target), 
            parseFloat(row.overclass_factor), 
            { min: parseFloat(row.mandatory_education_min), max: parseFloat(row.mandatory_education_max) }, 
            { min: parseFloat(row.usafa_bound_min), max: parseFloat(row.usafa_bound_max) }, 
            { min: parseFloat(row.merit_bound_min), max: parseFloat(row.merit_bound_max) }, 
            parseFloat(row.weighted_distribution) || 0
        );
    }
}