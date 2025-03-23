export class AFSC {
    constructor(target, overclassFactor, mandatoryDegreeBounds, usaCadetBounds, meritBounds){
        this.target = target; // minimum number of cadets assigned
        this.overclassFactor = overclassFactor; // scale factor
        this.mandatoryDegreeBounds = mandatoryDegreeBounds; // min and max bounds of mandatory degrees
        this.usaCadetBounds = usaCadetBounds; // min and max bounds of USAFA cadets
        this.meritBounds = meritBounds; // min and max bounds of merit
    }
}