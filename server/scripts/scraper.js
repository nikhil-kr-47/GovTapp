import axios from 'axios';
import * as cheerio from 'cheerio';



// Target page: Tenders by Closing Date (no CAPTCHA required)
// https://eprocure.gov.in/epublish/app?page=FrontEndListTendersbyDate&service=page



const TARGET_URL =
  'https://eprocure.gov.in/epublish/app?page=FrontEndListTendersbyDate&service=page';

async function scrapeTenders() {
  const { data } = await axios.get(TARGET_URL, {
    headers: {
      // Some government sites block requests with no User-Agent, treating
      // them as obvious bots. This makes the request look like a normal browser.
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(data);
  const tenders = [];

  // Loop through every row in the tender table.
  // the tender rows in your Inspector.
  $('#table tr').each((i, row) => {
    const cells = $(row).find('td');

    // Skip rows that don't look like real data rows (e.g. header rows,
    // which usually have <th> instead of <td>, so cells.length would be 0).
    if (cells.length < 5) return;

    // Title + Reference No often sit together in one cell, formatted like:
    // "Title Text [REF-NUMBER-HERE][internal-id]"
    // We grab the whole cell's text, then split it apart.
    const titleCellText = $(cells[4]).text().trim();
    const titleLink = $(cells[4]).find('a').attr('href');

    // Split "Title [REF][internal-id]" into title + first bracketed reference.
    const match =[ ...titleCellText.matchAll(/\[(.*?)\]/g)];
    const title = match[0] ? match[0][1].trim() : null;
    const referenceNo = match[1] ? match[1][1].trim() : null;

    const deadlineText = $(cells[2]).text().trim(); // Bid Submission Closing Date
    const department = $(cells[5]).text().trim();   // Organisation Chain

    
    if (title) {
      tenders.push({
        title,
        referenceNo,
        deadlineText,   // raw text for now — convert to a real Date once format is confirmed
        department,
        sourceUrl: titleLink
          ? `https://eprocure.gov.in${titleLink}`
          : TARGET_URL,
      });
    }
  });

  return tenders;
}

// Run it and print results so you can check the output by eye.
scrapeTenders()
  .then((tenders) => {
    console.log(`Found ${tenders.length} tenders:\n`);
    console.log(tenders);
  })
  .catch((err) => {
    console.error('Scraper failed:', err.message);
  });