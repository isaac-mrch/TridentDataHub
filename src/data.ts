import type { Dataset } from "./types";

// Parse TSV data
function parseTSV(tsvContent: string): Dataset[] {
  const lines = tsvContent.trim().split("\n");

  const datasets: Dataset[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t").map((v) => v.trim());
    if (values.length !== 9) {
      console.warn(
        `Skipping malformed TSV row at Line ${i + 1}: expected 9 columns, got ${values.length}`,
      );
      continue;
    }
    const dataset: Dataset = {
      researcher: values[0],
      researcherEmail: values[1],
      institution: values[2],
      datasetName: values[3],
      datasetDescription: values[4],
      datasetType: values[5],
      disease: values[6],
      drug: values[7],
      url: values[8],
      tags: [],
    };
    dataset.tags = assignTags(dataset);
    datasets.push(dataset);
  }

  return datasets;
}

// Import TSV file
// @ts-expecter-error - Vite handles ?raw imports
import dataTsvContent from "./data.tsv?raw";

export const datasets: Dataset[] = parseTSV(dataTsvContent);

// Debug: Check parsing
if (import.meta.env.DEV) {
  console.debug("Datasets parsed:", datasets.length);
}

// Extract unique values for filters
export const datasetTypes = Array.from(
  new Set(datasets.map((d) => d.datasetType)),
).sort();
export const institutions = Array.from(
  new Set(datasets.map((d) => d.institution)),
).sort();
export const diseases = Array.from(
  new Set(datasets.map((d) => d.disease).filter(Boolean)),
).sort();
export const drugs = Array.from(
  new Set(datasets.map((d) => d.drug).filter(Boolean)),
).sort();

export const allTags = Array.from(
  new Set(datasets.flatMap((d) => d.tags))
).sort();

function assignTags(d: Omit<Dataset, "tags">): string[] {
  const tags: string[] = [];
  if (d.datasetDescription.toLowerCase().includes("mouse")) tags.push("Mouse model");
  if (d.datasetDescription.toLowerCase().includes("synuclein")) tags.push("Synucleinopathies");
  // This is where to add tags
  return tags;
}