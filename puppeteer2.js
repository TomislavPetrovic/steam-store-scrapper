const puppeteer = require("puppeteer");

// Function to scrape game links from the Steam web store
async function scrapeGameLinks() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const startingPageURL =
        "https://store.steampowered.com/search/?sort_by=Reviews_DESC&maxprice=free&untags=19&category1=998&category3=2&category2=28&os=win&supportedlang=english&ndl=1";

    await page.goto(startingPageURL);
    await page.waitForSelector("#search_resultsRows > a");
    const gameLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("#search_resultsRows > a"));
        return links.map((link) => link.href);
    });
    await browser.close();
    return gameLinks;
}

// Function to scrape storage requirements from a game info page
async function scrapeStorageRequirements(links) {
    const browser = await puppeteer.launch(); // Open the browser once for all links
    const storageInfo = [];

    for (const link of links) {
        const page = await browser.newPage();

        try {
            await page.goto(link);
            await page.waitForSelector("strong");
            const storageRequirements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll("li"));
                for (const element of elements) {
                    if (element.textContent.includes("Storage: ")) {
                        return element.textContent;
                    }
                }
                return null; // Return null if storage requirements are not found
            });

            if (storageRequirements !== null) {
                const gameInfo = {
                    link,
                    storage: storageRequirements,
                };
                storageInfo.push(gameInfo);

                // Display the data as it arrives
                console.log("Game Link:", gameInfo.link);
                console.log("Storage Requirements:", gameInfo.storage);
                console.log("\n");
            } else {
                console.warn("Storage requirements not found for", link);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            await page.close();
        }
    }

    await browser.close(); // Close the browser after processing all links
    return storageInfo;
}

// Extract both the number and unit from a storage requirement string
const getSizeAndUnit = (str) => {
    const sizeRegex = /(\d+(\.\d+)?)(\s*GB|\s*MB)/i;
    const matches = str.match(sizeRegex);

    if (matches && matches.length >= 4) {
        const size = parseFloat(matches[1]);
        const unit = matches[3].toLowerCase();
        return { size, unit };
    }

    return { size: 0, unit: "" }; // Default values in case of no match
};

// Main function to scrape game links and storage requirements
async function main() {
    try {
        const gameLinks = await scrapeGameLinks();
        console.log("Scraped Game Links:", gameLinks);

        const chunkSize = 5; // You can adjust this value for the number of links to process simultaneously
        const storageInfo = [];
        for (let i = 0; i < gameLinks.length; i += chunkSize) {
            const chunk = gameLinks.slice(i, i + chunkSize);
            const storageInfoChunk = await scrapeStorageRequirements(chunk);
            storageInfo.push(...storageInfoChunk);
        }

        storageInfo.sort((a, b) => {
            let { size: sizeA, unit: unitA } = getSizeAndUnit(a.storage);
            let { size: sizeB, unit: unitB } = getSizeAndUnit(b.storage);

            if (unitA === "gb") {
                sizeA *= 1024;
            }
            if (unitB === "gb") {
                sizeB *= 1024;
            }

            return sizeA - sizeB;
        });

        console.log("\n\n\n");
        console.log("Sorted Storage Requirements:");
        storageInfo.forEach((info) => {
            console.log("Game Link:", info.link);
            console.log("Storage Requirements:", info.storage);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

// Run the main function
main();
