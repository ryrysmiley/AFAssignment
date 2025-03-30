import { AFSC } from '../models/Afsc.js';
import { Cadet } from '../models/Cadet.js';
import { DegreeEnum } from "../models/DegreeEnum.js";

// function to import csv file to get a list of afscs
export function importAFSCs(text) {
    const rows = text.split("\n").filter((row) => row.trim() !== "");
    const headers = rows[0].split(",").map((header) => header.trim());

    const data = rows.slice(1).map((row) => {
        const values = row.split(",").map((value) => value.trim());
        const rowObject = headers.reduce((obj, header, index) => {
        obj[header] = values[index] || "";
        return obj;
        }, {});
        return AFSC.fromCSV(rowObject);
    });

    return data;
}

// function to import csv file to get a list of cadets
export function importCadets(text) {
    const rows = text.split("\n").filter((row) => row.trim() !== "");
    const headers = rows[0].split(",").map((header) => header.trim());

    const data = rows.slice(1).map((row) => {
        const values = row.split(",").map((value) => value.trim());
        const rowObject = headers.reduce((obj, header, index) => {
        obj[header] = values[index] || "";
        return obj;
        }, {});
        return Cadet.fromCSV(rowObject);
    });

    return data;
}
