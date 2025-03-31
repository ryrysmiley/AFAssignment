import { DegreeEnum } from '../models/DegreeEnum.js';
import glpk from 'glpk.js';

// CadetAssignment Class
export class CadetAssignment {
    // Class Constructor
    constructor(cadetHashSet, afscHashSet, deviationPenalty, glpk = null) {
        this.cadetData = cadetHashSet; // all cadets in dictionary
        this.afscData = afscHashSet; // all afscs in dictionary
        this.deviationPenalty = deviationPenalty; // penalty for not meeting requirements
        
        // glpk
        if (glpk == null) {
            this.glpkInstance = glpk();
        }
        else {
            this.glpkInstance = glpk;
        }

        // Initialize the LP problem
        this.lp = this.InitializeLP();
    }

    // Function: Utility Calculation of every cadet AFSC pair
    GetUtility(cadet, afsc) {
        const CadetPercentile = this.cadetData[cadet].cadetPercentile; // Cadet percentile
        const CadetPreferenceRanking = this.cadetData[cadet].cadetPreferences[afsc]; // Preference score
        const CadetDegree = this.cadetData[cadet].cadetDegrees[afsc]; // Degree requirement

        // Calculate utility based on degree requirements and preferences
        if (CadetDegree === DegreeEnum.MANDATORY && CadetPreferenceRanking !== null) {
            return (10 * CadetPercentile * (1 / CadetPreferenceRanking)) + 250; // Mandatory degree + preference
        } 
        else if (CadetDegree === DegreeEnum.DESIRED && CadetPreferenceRanking !== null) {
            return (10 * CadetPercentile * (1 / CadetPreferenceRanking)) + 150; // Desired degree + preference
        } 
        else if (CadetDegree === DegreeEnum.PERMITTED && CadetPreferenceRanking !== null) {
            return 10 * CadetPercentile * (1 / CadetPreferenceRanking); // Permitted degree + preference
        } 
        else if (CadetDegree === DegreeEnum.MANDATORY) {
            return 100 * CadetPercentile; // Mandatory degree but no preference
        } 
        else if (CadetDegree === DegreeEnum.DESIRED) {
            return 50 * CadetPercentile; // Desired degree but no preference
        }
        else if (CadetDegree === DegreeEnum.PERMITTED) {
            return 0; // Permitted degree but no preference
        } 
        else {
            return this.deviationPenalty; // Penalize ineligible assignments
        }
    }

    // Function: Initialize LP Problem 
    InitializeLP() {
        let lp = {
            name: 'Cadet Assignment',
            objective: {
                direction: this.glpkInstance.GLP_MAX,
                name: 'Total Utility',
                vars: []
            },
            subjectTo: [],
            binaries: [],
            bounds: []
        };

        // Create decision variables and objective function
        Object.keys(this.cadetData).forEach(cadet => {
            Object.keys(this.afscData).forEach(afsc => {
                let varName = `${cadet}_${afsc}`;
                let utility = this.GetUtility(cadet, afsc);

                // Add variable to the objective function
                lp.objective.vars.push({
                    name: varName,
                    coef: utility
                });

                // Define binary decision variables
                lp.binaries.push(varName);
            });
        });

        // Constraints
        this.AddConstraints(lp);

        return lp;
    }

    // Function: Add Constraints 
    AddConstraints(lp) {
        // Constraint: Assign each cadet to exactly one AFSC or none
        Object.keys(this.cadetData).forEach(cadet => {
            let constraint = {
                name: `One_AFSC_${cadet}`,
                vars: [],
                bnds: { type: this.glpkInstance.GLP_FX, ub: 1, lb: 1 }
            };
            Object.keys(this.afscData).forEach(afsc => {
                constraint.vars.push({ name: `${cadet}_${afsc}`, coef: 1 });
            });
            lp.subjectTo.push(constraint);
        });

        // Constraint: Ensure AFSC targets and overclassification limits
        Object.keys(this.afscData).forEach(afsc => {
            let afscInfo = this.afscData[afsc];

            // Set lower bound as the target
            let constraintLower = {
                name: `Target_Lower_${afsc}`,
                vars: [],
                bnds: { type: this.glpkInstance.GLP_LO, lb: afscInfo.target, ub: Infinity }
            };

            // Set upper bound as the target multiplied by the overclassification factor
            let constraintUpper = {
                name: `Target_Upper_${afsc}`,
                vars: [],
                bnds: { type: this.glpkInstance.GLP_UP, lb: -Infinity, ub: afscInfo.target * afscInfo.overclassFactor }
            };

            // Add variables to both constraints
            Object.keys(this.cadetData).forEach(cadet => {
                constraintLower.vars.push({ name: `${cadet}_${afsc}`, coef: 1 });
                constraintUpper.vars.push({ name: `${cadet}_${afsc}`, coef: 1 });
            });

            lp.subjectTo.push(constraintLower);
            lp.subjectTo.push(constraintUpper);
        });

        // Constraint: Mandatory education requirement distribution
        Object.keys(this.afscData).forEach(afsc => {
            let afscInfo = this.afscData[afsc];
            // Mandatory education lower bound
            let constraintMandatoryLower = {
                name: `Mandatory_Education_Lower_${afsc}`,
                vars: [],
                bnds: {
                    type: this.glpkInstance.GLP_LO,
                    lb: afscInfo.target * afscInfo.mandatoryDegreeBounds.min,
                    ub: Infinity
                }
            };
            // Mandatory education upper bound
            let constraintMandatoryUpper = {
                name: `Mandatory_Education_Upper_${afsc}`,
                vars: [],
                bnds: {
                    type: this.glpkInstance.GLP_UP,
                    lb: -Infinity,
                    ub: afscInfo.target * afscInfo.mandatoryDegreeBounds.max
                }
            };
            // Add variables for mandatory education
            Object.keys(this.cadetData).forEach(cadet => {
                let cadetInfo = this.cadetData[cadet];
                constraintMandatoryLower.vars.push({
                    name: `${cadet}_${afsc}`,
                    coef: cadetInfo.cadetDegrees[afsc] === DegreeEnum.MANDATORY ? 1 : 0
                });
                constraintMandatoryUpper.vars.push({
                    name: `${cadet}_${afsc}`,
                    coef: cadetInfo.cadetDegrees[afsc] === DegreeEnum.MANDATORY ? 1 : 0
                });
            });
            lp.subjectTo.push(constraintMandatoryLower);
            lp.subjectTo.push(constraintMandatoryUpper);
        });

        // Constraint: Balance USAFA cadet distribution
        Object.keys(this.afscData).forEach(afsc => {
            let afscInfo = this.afscData[afsc];
            let constraintLower = {
                name: `USAFA_Min_${afsc}`,
                vars: [],
                bnds: { type: this.glpkInstance.GLP_LO, lb: afscInfo.target * afscInfo.usaCadetBounds.min, ub: Infinity }
            };
            let constraintUpper = {
                name: `USAFA_Max_${afsc}`,
                vars: [],
                bnds: { type: this.glpkInstance.GLP_UP, lb: -Infinity, ub: afscInfo.target * afscInfo.usaCadetBounds.max }
            };
            Object.keys(this.cadetData).forEach(cadet => {
                let cadetInfo = this.cadetData[cadet];
                constraintLower.vars.push({ name: `${cadet}_${afsc}`, coef: cadetInfo.cadetFromUSAFA ? 1 : 0 });
                constraintUpper.vars.push({ name: `${cadet}_${afsc}`, coef: cadetInfo.cadetFromUSAFA ? 1 : 0 });
            });
            lp.subjectTo.push(constraintLower);
            lp.subjectTo.push(constraintUpper);
        });

        // Constraint: Maintain merit balance across cadets
        Object.keys(this.afscData).forEach(afsc => {
            let afscInfo = this.afscData[afsc];
            let constraintLower = {
                name: `Merit_Min_${afsc}`,
                vars: [],
                bnds: { type: this.glpkInstance.GLP_LO, lb: afscInfo.target * afscInfo.meritBounds.min, ub: Infinity }
            };
            let constraintUpper = {
                name: `Merit_Max_${afsc}`,
                vars: [],
                bnds: { type: this.glpkInstance.GLP_UP, lb: -Infinity, ub: afscInfo.target * afscInfo.meritBounds.max }
            };
            Object.keys(this.cadetData).forEach(cadet => {
                let cadetInfo = this.cadetData[cadet];
                constraintLower.vars.push({ name: `${cadet}_${afsc}`, coef: cadetInfo.cadetPercentile });
                constraintUpper.vars.push({ name: `${cadet}_${afsc}`, coef: cadetInfo.cadetPercentile });
            });
            lp.subjectTo.push(constraintLower);
            lp.subjectTo.push(constraintUpper);
        });
    }

    // Function: Solve LP
    async Solve() {
        try {
            // Solve the LP problem
            const result = await this.glpkInstance.solve(this.lp, { msglev: this.glpkInstance.GLP_MSG_ALL });
    
            if (result.result.status === this.glpkInstance.GLP_OPT) {
                console.log('✅ Optimal solution found!');
                this.DisplayResults(result.result.vars);
            } else {
                console.log('❌ No feasible solution found.');
            }
        } catch (error) {
            console.error('Error solving LP problem:', error);
        }
    }

    // Function: Display Results
    DisplayResults(vars) {
        let results = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, "Not preferred": 0};
        Object.keys(this.cadetData).forEach(cadet => {
            Object.keys(this.afscData).forEach(afsc => {
                let varName = `${cadet}_${afsc}`;
                if (vars[varName] === 1) {
                    console.log(`${cadet} assigned to ${afsc}`);
                    if(this.cadetData[cadet].cadetPreferences !== null){
                        if(this.cadetData[cadet].cadetPreferences[afsc])
                        {
                            results[this.cadetData[cadet].cadetPreferences[afsc]] += 1;
                        }
                        else
                        {
                            results["Not preferred"] += 1;
                        }
                    }
                }
            });
        });
        console.log('1st preference:', results[1]);
        console.log('2nd preference:', results[2]);
        console.log('3rd preference:', results[3]);
        console.log('4th preference:', results[4]);
        console.log('5th preference:', results[5]);
        console.log('6th preference:', results[6]);
        console.log('Not preferred:', results["Not preferred"]);
    }
}
