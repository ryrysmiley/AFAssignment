"use client";
import { useState } from "react";
import { importAFSCs } from "../../modules/client/CsvImportExport";
import * as XLSX from "xlsx";

export default function AfscEditor({ afscs, setAfscs }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;  // You can change this to adjust how many rows per page.

    // Function to handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0]; // Use the first sheet
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                setAfscs(importAFSCs(csv)); // Save the CSV data
            };
            reader.readAsArrayBuffer(file);
        }
        event.target.value = null; // Clear the file input
    }

    // Function to export AFSCs
    function exportAFSCs(afscs) {
        const formattedAFSCs = afscs.map((afsc) => ({
            afsc: afsc.afsc,
            target: afsc.target,
            overclass_factor: afsc.overclassFactor,
            mandatory_education_min: afsc.mandatoryDegreeBounds.min,
            mandatory_education_max: afsc.mandatoryDegreeBounds.max,
            usafa_bound_min: afsc.usaCadetBounds.min,
            usafa_bound_max: afsc.usaCadetBounds.max,
            merit_bound_min: afsc.meritBounds.min,
            merit_bound_max: afsc.meritBounds.max,
            weighted_distribution: afsc.weightedDistribution,
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedAFSCs);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AFSCs");

        const fileName = "afscs.xlsx";
        XLSX.writeFile(workbook, fileName);
    }

    // Update the correct index relative to the full list
    function updateAFSCValue(index, key, value) {
        if (isNaN(value) && key !== "afsc") {
            value = 0; // Default to 0 if the value is not a number
        }
        console.log(value);
        const actualIndex = startIndex + index; // Correct index based on pagination
        const newAfscs = [...afscs];
        if (key.includes(".")) {
            // Handle nested properties like mandatoryDegreeBounds.min
            const [parentKey, childKey] = key.split(".");
            newAfscs[actualIndex][parentKey][childKey] = value;
        }
        else {
            newAfscs[actualIndex][key] = value;
        }
        setAfscs(newAfscs);
    }
    // Function to delete an AFSC
    function deleteAFSC(index) {
        const newAfscs = afscs.filter((_, i) => i !== index);
        setAfscs(newAfscs);
    }

    // Function to add a new AFSC
    function addAFSC() {
        const newAfsc = {
            afsc: "newafsc",
            target: 0,
            overclassFactor: 1,
            mandatoryDegreeBounds: { min: 0, max: 1 },
            usaCadetBounds: { min: 0, max: 1 },
            meritBounds: { min: 0, max: 1 },
            weightedDistribution: 0,
        };
        setAfscs([...afscs, newAfsc]);
    }

    // Calculate the start and end index for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = currentPage * itemsPerPage;
    const currentAFSCs = afscs.slice(startIndex, endIndex);

    const totalPages = Math.ceil(afscs.length / itemsPerPage);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">AFSC Editor</h1>
            <p className="mb-4 text-gray-600">Manage the Air Force Specialty Codes (AFSCs) and their parameters.</p>
            <div className="mb-4 flex">
                <div className="me-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        Import AFSCs File (Will overwrite existing AFSCs)
                    </label>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-200 focus:outline-none"
                    />
                </div>
                <div className="me-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        Export AFSCs to File
                    </label>
                    <button
                        onClick={() => exportAFSCs(afscs)}
                        disabled={afscs.length === 0}
                        className="p-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Export AFSCs
                    </button>
                </div>
                <div className="me-4">
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        New AFSC
                    </label>
                    <button
                        onClick={addAFSC}
                        className="mb-4 p-2 bg-red-700 text-white rounded-md hover:bg-red-800"
                    >
                        Add AFSC
                    </button>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-600">
                        Delete AFSCs
                    </label>
                    <button
                        onClick={() => setAfscs([])}
                        disabled={afscs.length === 0}
                        className="p-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Clear AFSCs
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto mb-4">
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-red-700 text-white">
                            <th className="px-4 py-2 text-left">AFSC</th>
                            <th className="px-4 py-2 text-left">Target</th>
                            <th className="px-4 py-2 text-left">Overclass Factor</th>
                            <th className="px-4 py-2 text-left">Mandatory Degree Bounds</th>
                            <th className="px-4 py-2 text-left">USAFA Cadet Bounds</th>
                            <th className="px-4 py-2 text-left">Merit Bounds</th>
                            <th className="px-4 py-2 text-left">Weighted Distribution</th>
                            <th className="px-4 py-2 text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentAFSCs.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center text-gray-500 py-4">
                                    No AFSCs created. Please add AFSCs to get started.
                                </td>
                            </tr>
                        )}
                        {currentAFSCs.map((afsc, index) => (
                            <tr
                                key={index}
                                className={`${index % 2 === 0 ? "bg-gray-50" : "bg-gray-200"
                                    } hover:bg-red-100`}
                            >
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={afsc.afsc}
                                        onChange={(e) => updateAFSCValue(index, "afsc", e.target.value)}
                                        className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={afsc.target}
                                        onChange={(e) => updateAFSCValue(index, "target", isNaN(e.target.value) ? 0 : parseInt(e.target.value))}
                                        className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={afsc.overclassFactor}
                                        onChange={(e) => updateAFSCValue(index, "overclassFactor", parseFloat(e.target.value))}
                                        className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            value={afsc.mandatoryDegreeBounds.min}
                                            onChange={(e) => updateAFSCValue(index, "mandatoryDegreeBounds.min", parseFloat(e.target.value))}
                                            className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={afsc.mandatoryDegreeBounds.max}
                                            onChange={(e) => updateAFSCValue(index, "mandatoryDegreeBounds.max", parseFloat(e.target.value))}
                                            className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            value={afsc.usaCadetBounds.min}
                                            onChange={(e) => updateAFSCValue(index, "usaCadetBounds.min", parseFloat(e.target.value))}
                                            className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={afsc.usaCadetBounds.max}
                                            onChange={(e) => updateAFSCValue(index, "usaCadetBounds.max", parseFloat(e.target.value))}
                                            className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            value={afsc.meritBounds.min}
                                            onChange={(e) => updateAFSCValue(index, "meritBounds.min", parseFloat(e.target.value))}
                                            className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={afsc.meritBounds.max}
                                            onChange={(e) => updateAFSCValue(index, "meritBounds.max", parseFloat(e.target.value))}
                                            className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            value={afsc.weightedDistribution}
                                            onChange={(e) => updateAFSCValue(index, "weightedDistribution", parseFloat(e.target.value))}
                                            className="p-2 text-sm border border-gray-300 rounded-md box-border"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <button onClick={() => deleteAFSC(index)}>
                                        <span className="text-red-500 text-md font-bold hover:text-red-700 active:text-red-800">✖</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {afscs.length !== 0 &&
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1 || afscs.length === 0}
                        className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-200 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700">{`Page ${currentPage} of ${totalPages}`}</span>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages || afscs.length === 0}
                        className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-200 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            }
        </div>
    );
}
