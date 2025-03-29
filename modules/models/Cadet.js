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
        return new Cadet(
            
        );
    }
}
