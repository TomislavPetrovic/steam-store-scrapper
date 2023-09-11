const puppeteer = require('puppeteer');

(async () => {
  // Launch a headless Chromium browser
  const browser = await puppeteer.launch();

  // Open a new page
  const page = await browser.newPage();

  // List of URLs to scrape
  const urlsToScrape = [
    'https://example.com/page1',
    'https://example.com/page2',
    // Add more URLs here
  ];

  // Array to store the scraped data
  const scrapedData = [];

  // Loop through the list of URLs
  for (const url of urlsToScrape) {
    // Navigate to the URL
    await page.goto(url);

    // Extract data from the page (modify this part as per your needs)
    const data = await page.evaluate(() => {
      // Modify this code to scrape the data you want from the page
      const title = document.title;
      const content = document.querySelector('p').textContent;

      return { title, content };
    });

    // Push the scraped data into the array
    scrapedData.push(data);
  }

  // Close the browser
  await browser.close();

  // Do something with the scraped data, for example, print it
  console.log(scrapedData);

  // You can save the data to a file or perform any other desired actions here

})().catch((error) => {
  console.error('Error:', error);
});