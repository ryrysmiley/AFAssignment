import { DegreeEnum } from '../models/DegreeEnum';
// Import models
const glpk = require('glpk.js');

// CadetAssignment Class
class CadetAssignment {
    // Class Constructor
    constructor(cadetHashSet, afscHashSet, deviationPenalty) {
        this.cadetData = cadetHashSet; // all cadets in dictionary
        this.afscData = afscHashSet; // all afscs in dictionary
        this.deviationPenalty = deviationPenalty; // penalty for not meeting requirments

        // Initialize the LP problem
        this.lp = this.InitializeLP();
    }

    // Function: Utility Calculation of every cadet afsc pair
    GetUtility(cadet, afsc) {
        const CadetPercentile = this.cadetData[cadet].cadetPercentile; // Cadet percentile
        const CadetPreferenceRanking = this.cadetData[cadet].cadetPreferences[afsc]; // Preference score
        const CadetDegree = this.cadetData[cadet].cadetDegrees[afsc]; // Degree requirement

        // Calculate utility based on degree requirements and preferences
        if (CadetDegree === DegreeEnum.MANDATORY && CadetPreferenceRanking !== null) {
            return (10 * CadetPercentile * wc) + 250; // Mandatory degree + preference
        } 
        else if (CadetDegree === DegreeEnum.DESIRED && CadetPreferenceRanking !== null) {
            return (10 * rc * wc) + 150; // Desired degree + preference
        } 
        else if (CadetDegree === DegreeEnum.PERMITTED && CadetPreferenceRanking !== null) {
            return 10 * CadetPercentile * wc; // Permitted degree + preference
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
                direction: glpk.GLP_MAX,
                name: 'Total Utility',
                vars: []
            },
            subjectTo: [],
            binaries: [],
            bounds: []
        };

        // Create decision variables and objective function
        this.cadetData.forEach(cadet => {
            this.afscData.forEach(afsc => {
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

        // === Constraints ===
        this.AddConstraints(lp);

        return lp;
    }

    // Function: Add Constraints 
    AddConstraints(lp) {
        // Constraint: Assign each cadet to exactly one AFSC or none
        this.cadetData.forEach(cadet => {
            let constraint = {
                name: `One_AFSC_${cadet}`,
                vars: [],
                bnds: { type: glpk.GLP_FX, ub: 1, lb: 1 }
            };
            this.afscData.forEach(afsc => {  // For each AFSC
                constraint.vars.push({ name: `${cadet}_${afsc}`, coef: 1 });
            });
            lp.subjectTo.push(constraint);
        });

        // Constraint: Ensure AFSC targets and overclassification limits
        this.afscData.forEach(afsc => {
            let constraint = {
                name: `Target_${afsc}`,
                vars: [],
                bnds: { type: glpk.GLP_LO, lb: this.targets[afsc], ub: this.targets[afsc] * this.overclassFactor[afsc] } // lowerbound is target, upperbound is target times some factor
            };
            this.cadetData.forEach(cadet => {
                constraint.vars.push({ name: `${cadet}_${afsc}`, coef: 1 });
            });
            lp.subjectTo.push(constraint);
        });

        // Constraint: Mandatory education requirment distribution

        this.afscData.forEach(afsc => {
            let constraint = {
                name: `Mandatory_Education_${afsc}`,
                vars: [],
                bnds: { type: glpk.GLP_LO, lb: afsc.target * afsc.mandatory["lower"], ub: afsc.target * afsc.mandatory["upper"] } // lowerbound is target times some factor, upperbound is target times some factor
            };
            this.cadetData.forEach(cadet => {
                constraint.vars.push({ name: `${cadet}_${afsc}`, coef: cadet.cadetDegrees[afsc] === DegreeEnum.MANDATORY ? 1 : 0 });
            });
            lp.subjectTo.push(constraint);
        });
        
        // Constraint: Balance USAFA cadet distribution
        this.afscData.forEach(afsc => {
            let constraintLower = {
                name: `USAFA_Min_${afsc}`,
                vars: [],
                bnds: { type: glpk.GLP_LO, lb: this.targets[afsc] * this.usaCadetLimits.min, ub: Infinity }
            };
            let constraintUpper = {
                name: `USAFA_Max_${afsc}`,
                vars: [],
                bnds: { type: glpk.GLP_UP, lb: -Infinity, ub: this.targets[afsc] * this.usaCadetLimits.max }
            };
            this.cadetData.forEach(cadet => {
                constraintLower.vars.push({ name: `${cadet}_${afsc}`, coef: this.cadet.cadetFromUSAFA ? 1 : 0 });
                constraintUpper.vars.push({ name: `${cadet}_${afsc}`, coef: this.cadet.cadetFromUSAFA ? 1 : 0 });
            });
            lp.subjectTo.push(constraintLower);
            lp.subjectTo.push(constraintUpper);
        });

        // Constraint: Maintain merit balance across cadets
        this.afscData.forEach(afsc => {
            let constraintLower = {
                name: `Merit_Min_${afsc}`,
                vars: [],
                bnds: { type: glpk.GLP_LO, lb: this.targets[afsc] * this.meritBounds.min, ub: Infinity }
            };
            let constraintUpper = {
                name: `Merit_Max_${afsc}`,
                vars: [],
                bnds: { type: glpk.GLP_UP, lb: -Infinity, ub: this.targets[afsc] * this.meritBounds.max }
            };
            this.cadetData.forEach(cadet => {
                constraintLower.vars.push({ name: `${cadet}_${afsc}`, coef: this.cadet.cadetPercentile });
                constraintUpper.vars.push({ name: `${cadet}_${afsc}`, coef: this.cadet.cadetPercentile });
            });
            lp.subjectTo.push(constraintLower);
            lp.subjectTo.push(constraintUpper);
        });
    }

    // Function: Solve LP ===
    Solve() {
        glpk().then(glpkInstance => {
            let result = glpkInstance.solve(this.lp, { msglev: glpk.GLP_MSG_ALL });
            if (result.result.status === glpk.GLP_OPT) {
                console.log('✅ Optimal solution found!');
                this.DisplayResults(result.result.vars);
            } else {
                console.log('❌ No feasible solution found.');
            }
        });
    }

    // Function: Display Results ===
    DisplayResults(vars) {
        this.cadetData.forEach(cadet => {
            this.afscData.forEach(afsc => {
                let varName = `${cadet}_${afsc}`;
                if (vars[varName] === 1) {
                    console.log(`${cadet} assigned to ${afsc}`);
                }
            });
        });
    }
}