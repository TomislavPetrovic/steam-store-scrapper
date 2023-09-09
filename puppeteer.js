const puppeteer = require("puppeteer");

// Function to scrape game links from the Steam web store
async function scrapeGameLinks() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    //const startingPageURL = 'https://store.steampowered.com/';
    const startingPageURL =
        "https://store.steampowered.com/search/?maxprice=free&tags=19%2C1721%2C3877&supportedlang=english&ndl=1";

    await page.goto(startingPageURL);

    // Wait for the game links to load (you may need to adjust the selector)
    await page.waitForSelector("#search_resultsRows > a");

    // Extract game links
    const gameLinks = await page.evaluate(() => {
        const links = Array.from(
            document.querySelectorAll("#search_resultsRows > a")
        );
        return links.map((link) => link.href);
    });

    await browser.close();
    return gameLinks;
}

// Function to scrape storage requirements from a game info page
async function scrapeStorageRequirements(link) {
    let storageRequirements;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(link);

    // Wait for the storage requirements to appear (you may need to adjust the selector)
    //await page.waitForSelector('li:has(strong:contains("Storage"))');
    try {
        await page.waitForSelector("strong");

        // Extract storage requirements
        storageRequirements = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll("li"));
            for (const element of elements) {
                if (element.textContent.includes("Storage: ")) {
                    return element.textContent;
                }
            }
            return null; // Return null if storage requirements are not found
        });
    } catch (error) {
        console.error("Error:", error);
    } finally {
        // Close the page and browser even in case of an error
        await page.close();
        await browser.close();
    }

    return storageRequirements;
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

        const storageRequirementsPromises = gameLinks.map((link) =>
            scrapeStorageRequirements(link)
        );

        // Create an array to store the storage info as it arrives
        const storageInfo = [];

        for (const [index, promise] of storageRequirementsPromises.entries()) {
            promise
                .then((storageRequirements) => {
                    if (storageRequirements !== null) {
                        const gameInfo = {
                            link: gameLinks[index],
                            storage: storageRequirements,
                        };
                        storageInfo.push(gameInfo);

                        // Display the data as it arrives
                        console.log("Game Link:", gameInfo.link);
                        console.log("Storage Requirements:", gameInfo.storage);
                        console.log("\n");
                    } else {
                        console.warn(
                            "Storage requirements not found for",
                            gameLinks[index]
                        );
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        }

        // Wait for all promises to resolve
        await Promise.all(storageRequirementsPromises);

        storageInfo.sort((a, b) => {
            let { size: sizeA, unit: unitA } = getSizeAndUnit(a.storage);
            let { size: sizeB, unit: unitB } = getSizeAndUnit(b.storage);
            console.log(unitA)
            if (unitA === "gb") {
                sizeA = parseInt(sizeA) * 1024;
                console.log(sizeA);
            }
            if (unitB === "gb") {
                sizeB = parseInt(sizeB) * 1024;
                console.log(sizeB)
            }

            return sizeA - sizeB;
        });

        //storageInfo.reverse();

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
