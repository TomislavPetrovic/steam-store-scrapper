function scrapeGameLinks() {
    // Specify your query selector here
    const selector = "#search_resultsRows > a";

    // Find and store the matching elements
    const elements = document.querySelectorAll(selector);

    // Extract and store the links
    let links = [];
    elements.forEach((element) => {
        links.push(element.href);
    });

    return links;
}

async function fetchHTMLData(links) {
    const htmlData = [];

    for (const link of links) {
        try {
            const response = await fetch(link);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch ${link}: ${response.status} ${response.statusText}`
                );
            }
            const html = await response.text();
            htmlData.push({ link, html });
        } catch (error) {
            console.error(`Error fetching ${link}:`, error);
        }
    }

    return htmlData;
}

function extractStorageRequirements(htmlData) {
    const storageRequirements = [];

    for (const { link, html } of htmlData) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const strongElements = doc.querySelectorAll("strong");
        for (const strongElement of strongElements) {
            if (strongElement.textContent.trim() === "Storage") {
                const liElement = strongElement.parentElement;
                if (liElement) {
                    const storageText = liElement.textContent
                        .replace("Storage:", "")
                        .trim();
                    storageRequirements.push({ link, storage: storageText });
                    break; // Once found, break out of the loop
                }
            }
        }
    }

    return storageRequirements;
}


// Usage:
const gameLinks = scrapeGameLinks(); // Assuming you already have the links
fetchHTMLData(gameLinks)
    .then((htmlData) => {
        console.log(htmlData);
        const storageRequirements = extractStorageRequirements(htmlData);
        console.log("Storage Requirements:", storageRequirements);
    })
    .catch((error) => {
        console.error("Error:", error);
    });
