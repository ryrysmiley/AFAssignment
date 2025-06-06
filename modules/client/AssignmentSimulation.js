import { DegreeEnum } from '../models/DegreeEnum.js';
import glpk from 'glpk.js';
import { GenerateCadets } from './CadetGeneration.js';
import * as XLSX from "xlsx";

// CadetAssignment Class
export class CadetAssignment {
    // Class Constructor
    constructor(cadetHashSet, afscHashSet, deviationPenalty, glpk = null) {
        this.cadetData = cadetHashSet; // all cadets in dictionary
        this.afscData = afscHashSet; // all afscs in dictionary
        this.deviationPenalty = deviationPenalty; // penalty for not meeting requirements
        this.results = {};
        this.afscsResults = {};
        
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
        let res = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, "Not preferred": 0};
        Object.keys(this.cadetData).forEach(cadet => {
            Object.keys(this.afscData).forEach(afsc => {
                let varName = `${cadet}_${afsc}`;
                if (vars[varName] === 1) {
                    // add cadet to afsc
                    if(this.afscsResults[afsc] === undefined) {
                        this.afscsResults[afsc] = [];
                    }
                    this.afscsResults[afsc].push(this.cadetData[cadet]);

                    if(this.cadetData[cadet].cadetPreferences !== null){
                        if(this.cadetData[cadet].cadetPreferences[afsc])
                        {
                            res[this.cadetData[cadet].cadetPreferences[afsc]] += 1;
                        }
                        else
                        {
                            res["Not preferred"] += 1;
                        }
                    }
                }
            });
        });
        // console.log('1st preference:', res[1]);
        // console.log('2nd preference:', res[2]);
        // console.log('3rd preference:', res[3]);
        // console.log('4th preference:', res[4]);
        // console.log('5th preference:', res[5]);
        // console.log('6th preference:', res[6]);
        // console.log('Not preferred:', res["Not preferred"]);
        this.results = res;
    }
}

// Running multiple simulations in parallel to get average results given afscs
// Add another stat about what the cadet percentile was and what pref they got (probably write a file with this data)
// average cadet merit in a afsc
// source of commissioning in an afsc
export async function RunSimulations(afscs, numSimulations, glpkInstance) {
    /* Each simulation gets a new set of cadets based on the afscs */
    let multipleResults = [];
    let allAfscsResults = [];
    let excelRowsCadetData = []; // Store all cadet data for excel file
    let averagePreferences = {};

    // Properly assign afsc data
    let afscData = {};
    for (let afsc of afscs) {
        afscData[afsc.afsc] = afsc;
    }

    let totalFailed = 0;
    let totalPassed = 0;
    // Run multiple simulations
    for (let i = 0; i < numSimulations; i++) {
        // Create a new instance of CadetAssignment for each simulation
        let cadetData = {};
        const cadets = GenerateCadets(afscs); // Create a new cadet data object for each simulation
        // store cadet data for excel file with headers Name, Percentile, Degree, Preference Ranking
        excelRowsCadetData = cadets.map((cadet) => {
            const prefReorder = {};
            Object.entries(cadet.cadetPreferences).forEach(([key, value]) => {
                prefReorder[value] = key;
            });

            return {
                name: cadet.name,
                p1: prefReorder[1] || "",
                p2: prefReorder[2] || "",
                p3: prefReorder[3] || "",
                p4: prefReorder[4] || "",
                p5: prefReorder[5] || "",
                p6: prefReorder[6] || "",
                percentile: cadet.cadetPercentile,
                usafa_origin: cadet.cadetFromUSAFA ? "TRUE" : "FALSE",
                mandatory_degree: Object.entries(cadet.cadetDegrees)
                    .filter(([_, value]) => value === DegreeEnum.MANDATORY)
                    .map(([key]) => key).join("|"),
                desired_degree: Object.entries(cadet.cadetDegrees)
                    .filter(([_, value]) => value === DegreeEnum.DESIRED)
                    .map(([key]) => key).join("|"),
                permitted_degree: Object.entries(cadet.cadetDegrees)
                    .filter(([_, value]) => value === DegreeEnum.PERMITTED)
                    .map(([key]) => key).join("|")
            };
        });

        for (let cadet of cadets) {
            cadetData[cadet.name] = cadet;
            const preferences = cadet.cadetPreferences;
			for (let afsc in preferences) {
				if (averagePreferences[afsc]) {
					averagePreferences[afsc]++; // Increment count if AFSC already exists
				} else {
					averagePreferences[afsc] = 1; // Initialize count if it's the first occurrence
				}
			}
        }

        const cadetAssignment = new CadetAssignment(cadetData, afscData, -50000, glpkInstance);
        await cadetAssignment.Solve();
        // Check if the simulation was successful
        if (cadetAssignment.results.length === 0) {
            totalFailed += 1;
        } else {
            totalPassed += 1;
        }
        // Store the results of each simulation
        multipleResults[i] = cadetAssignment.results;
        allAfscsResults.push(cadetAssignment.afscsResults);
    }
    
    // Calculate average results across all simulations 
    let averageResults = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, "Not preferred": 0};
    let averagePercents = {1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0, "Not preferred": 0.0};
    let excelRowsAfscCadetMatch = []; // Store all cadet data for excel file

    for (let i = 0; i < numSimulations; i++) {
        let total = 0;
        // Calculate total for each simulation
        Object.keys(multipleResults[i]).forEach(key => {
            total += multipleResults[i][key];
            averageResults[key] += multipleResults[i][key];
        });

        // Calculate percentages for each preference
        Object.keys(multipleResults[i]).forEach(key => {
            averagePercents[key] += (multipleResults[i][key] / total);
        });

        // Put all details of afscs into excel file with headers Run Number, AFSC, Cadet Name, Cadet Percentile, Cadet Degree, Cadet Preference Ranking
        Object.keys(allAfscsResults[i]).forEach(afsc => {
            if (allAfscsResults[i][afsc] !== undefined) {
                for (let cadet of allAfscsResults[i][afsc]) {
                    excelRowsAfscCadetMatch.push({
                        "Run Number": i + 1,
                        "AFSC": afsc,
                        "Cadet Name": allAfscsResults[i][afsc].name,
                        "Cadet Percentile": cadet.cadetPercentile,
                        "Cadet Degree": cadet.cadetDegrees[afsc],
                        "Cadet Preference Ranking": cadet.cadetPreferences[afsc]
                    });
                }
            }
            else {
                console.log(`No cadets assigned to ${afsc} in simulation ${i}`);
            }
        });
    }

    // Divide by the number of simulations to get average
    Object.keys(averageResults).forEach(key => {
        averageResults[key] = (averageResults[key] / numSimulations);
    });
    // Divide by the total number of cadets to get average percentages
    Object.keys(averagePercents).forEach(key => {
        averagePercents[key] = (averagePercents[key] / numSimulations);
    });
    // Write the excel file with the cadet data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRowsAfscCadetMatch);
    XLSX.utils.book_append_sheet(wb, ws, "AFSC Cadet Match");
    // Write the excel file with the cadet data summary
    const wsCadetData = XLSX.utils.json_to_sheet(excelRowsCadetData);
    XLSX.utils.book_append_sheet(wb, wsCadetData, "Cadet Data Summary");
    // Write the excel file with the average results by converting object with afscs and their counts
    const wsAverageResults = XLSX.utils.json_to_sheet([averagePreferences]);
    XLSX.utils.book_append_sheet(wb, wsAverageResults, "Average Results");
    XLSX.writeFile(wb, "CadetAssignmentResults.xlsx");

    console.log(`Simulation Ran: ${numSimulations}`);
    console.log(`Total Passed: ${totalPassed}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log('Average Results:', averageResults);
    console.log('Average Percentages:', averagePercents);
    console.log('Average Preferences:', averagePreferences);
}