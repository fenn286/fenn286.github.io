
function handleFiles() {
    const backfillFile = document.getElementById("backfillFile").files[0];
    const specFile = document.getElementById("specFile").files[0];

    if (!backfillFile || !specFile) {
        alert("Please upload both files.");
        return;
    }

    Promise.all([parseCSV(backfillFile), parseCSV(specFile)]).then(([backfillData, specData]) => {
        const backfillIDs = new Set(backfillData.map(row => row.spec_ID));
        const missingSpecs = specData.filter(row => !backfillIDs.has(row.spec_ID));

        showResults(specData.length, backfillIDs.size, missingSpecs.length);
        showChart(specData.length, specData.length - missingSpecs.length, missingSpecs.length);
        prepareDownload(missingSpecs);
    });
}

function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                resolve(results.data);
            },
            error: reject
        });
    });
}

function showResults(total, found, missing) {
    document.getElementById("results").innerHTML = `
        <h3>Results</h3>
        <ul>
            <li>Total Specs in Spec File: ${total}</li>
            <li>Specs Found in Backfill: ${found}</li>
            <li><b>Missing Specs</b>: ${missing}</li>
        </ul>
    `;
}

function showChart(total, found, missing) {
    const ctx = document.getElementById("chartCanvas").getContext("2d");
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Found', 'Missing'],
            datasets: [{
                data: [found, missing],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        }
    });
}

function prepareDownload(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MissingSpecs");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.style.display = "inline-block";
    downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "missing_specs.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}
