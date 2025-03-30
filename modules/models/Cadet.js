import { DegreeEnum } from "./DegreeEnum.js";

export class Cadet {
    constructor(name, cadetPreferences, cadetPercentile, cadetFromUSAFA, cadetDegrees){
        this.name = name;
        this.cadetPreferences = cadetPreferences; // dictionary of preferences
        this.cadetPercentile = cadetPercentile; // percentile of cadet
        this.cadetFromUSAFA = cadetFromUSAFA; // boolean if cadet is from USAFA
        this.cadetDegrees = cadetDegrees; // dictionary of degrees
    }

    // Create a Cadet object from a CSV row
    static fromCSV(row) {
        let cadetPreferences = {};
        for (let i = 1; i <= 6; i++) {
            cadetPreferences[row[`p${i}`]] = i; 
        }

        let cadetDegrees = {};
        let m_degrees = row.mandatory_degree.split("|").map(degree => degree.trim());
        let d_degrees = row.desired_degree.split("|").map(degree => degree.trim());
        let p_degrees = row.permitted_degree.split("|").map(degree => degree.trim());
        
        for (let degree of m_degrees) {
            cadetDegrees[degree] = DegreeEnum.MANDATORY; // mandatory degrees
        }
        for (let degree of d_degrees) {
            cadetDegrees[degree] = DegreeEnum.DESIRED; // desired degrees
        }
        for (let degree of p_degrees) {
            cadetDegrees[degree] = DegreeEnum.PERMITTED; // permitted degrees
        }

        return new Cadet(
            row.name, // name of the cadet
            cadetPreferences, // dictionary of preferences
            row.percentile, // percentile of cadet
            row.usafa_origin === "TRUE", // boolean if cadet is from USAFA
            cadetDegrees // dictionary of degrees
        );
    }
}
