import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from "../lib/prisma.js";
import sendAlert from '../utils/sendAlert.js';


// Target pages from eprocure.gov.in (no CAPTCHA required)
const TARGET_SOURCES = [
  {
    name: 'Tenders by Closing Date',
    url: 'https://eprocure.gov.in/epublish/app?page=FrontEndListTendersbyDate&service=page',
  },
  {
    name: 'Latest Active Tenders',
    url: 'https://eprocure.gov.in/epublish/app?page=FrontEndLatestActiveTenders&service=page',
  },
];

// Helper to route through ScraperAPI (with country_code=in) if SCRAPER_API_KEY is configured
function resolveFetchUrl(targetUrl) {
  if (process.env.SCRAPER_API_KEY) {
    return `https://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`;
  }
  return targetUrl;
}

async function scrapeSinglePage(targetUrl) {
  const fetchUrl = resolveFetchUrl(targetUrl);
  if (process.env.SCRAPER_API_KEY) {
    console.log(`[Proxy] Fetching via ScraperAPI (India IP): ${targetUrl}`);
  } else {
    console.log(`[Direct] Fetching directly: ${targetUrl}`);
  }
  const { data } = await axios.get(fetchUrl, {
    timeout: 30000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  const $ = cheerio.load(data);
  const tenders = [];

  // Loop through every row in the tender table
  $('table.list_table tr').each((i, row) => {
    const cells = $(row).find('td');

    // Skip header rows or empty state rows
    if (cells.length < 5) return;

    // Title + Reference No sit in cell 4 wrapped in brackets: [Title] [RefNo] [TenderID]
    const titleCellText = $(cells[4]).text().trim();
    const titleLink = $(cells[4]).find('a').attr('href');

    const matches = [...titleCellText.matchAll(/\[(.*?)\]/gs)].map(m => m[1].trim());
    if (matches.length < 2) return; // Skip header row ("Title and Ref.No./Tender ID")

    const cleanTitle = matches[0];
    const referenceNo = matches[1] || matches[2];

    const deadlineText = $(cells[2]).text().trim(); // Bid Submission Closing Date
    const department = $(cells[5]).text().trim();   // Organisation Chain

    if (cleanTitle && referenceNo) {
      tenders.push({
        title: cleanTitle,
        referenceNo,
        deadlineText,
        department,
        sourceUrl: titleLink
          ? `https://eprocure.gov.in${titleLink}`
          : targetUrl,
      });
    }
  });

  return tenders;
}

async function scrapeTenders() {
  const allTenders = [];
  const seenRefs = new Set();

  for (const source of TARGET_SOURCES) {
    try {
      console.log(`Scraping source: ${source.name}...`);
      const items = await scrapeSinglePage(source.url);
      console.log(`  Found ${items.length} raw tenders on ${source.name}`);
      for (const item of items) {
        if (item.referenceNo && !seenRefs.has(item.referenceNo)) {
          seenRefs.add(item.referenceNo);
          allTenders.push(item);
        }
      }
    } catch (pageErr) {
      console.error(`Failed to scrape ${source.name}:`, pageErr.message);
    }
  }

  return allTenders;
}

// Keyword-based category matcher
function getCategoryForTender(tender, categoryMap) {
  const text = `${tender.title} ${tender.department}`.toLowerCase();

  if (text.includes("defence") || text.includes("defense") || text.includes("ordnance") || text.includes("air force") || text.includes("gun") || text.includes("space")) {
    return categoryMap["Defense & Aerospace"];
  }
  if (text.includes("rail") || text.includes("siding") || text.includes("container") || text.includes("jnpt") || text.includes("fmlm") || text.includes("transport")) {
    return categoryMap["Railways & Transport"];
  }
  if (text.includes("electric") || text.includes("light") || text.includes("voltage") || text.includes("wire") || text.includes("led") || text.includes("power") || text.includes("solar")) {
    return categoryMap["Electrical & Electronics"];
  }
  if (text.includes("hospital") || text.includes("medical") || text.includes("health") || text.includes("pump") || text.includes("acetone") || text.includes("pharma")) {
    return categoryMap["Healthcare & Medical Supplies"];
  }
  if (text.includes("software") || text.includes("computer") || text.includes("information technology") || text.includes("cyber") || text.includes("cloud")) {
    return categoryMap["Information Technology & Software"];
  }
  return categoryMap["Civil Construction"] || Object.values(categoryMap)[0];
}

// Exported function for cron and manual runs
async function runScraper() {
  console.log("Starting tender scraper...");
  const stats = {
    success: false,
    scraped: 0,
    newSaved: 0,
    duplicatesSkipped: 0,
    savedTenders: [],
    error: null,
  };

  try {
    const tenders = await scrapeTenders();
    stats.scraped = tenders.length;
    console.log(`Total unique scraped tenders from eprocure: ${tenders.length}`);

    if (tenders.length === 0) {
      console.warn("No tenders could be parsed. This usually means the government portal blocked the IP or returned a challenge page.");
    }

    // Load available categories from database
    const allCategories = await prisma.category.findMany();
    const categoryMap = {};
    for (const cat of allCategories) {
      categoryMap[cat.name] = cat.id;
    }

    for (let tender of tenders) {
      if (!tender.referenceNo) continue;

      let existing = await prisma.tender.findUnique({
        where: { referenceNo: tender.referenceNo },
      });

      if (existing) {
        stats.duplicatesSkipped++;
        console.log(`[DUPLICATE SKIP] Ref: ${tender.referenceNo} already exists in DB.`);
        continue;
      }

      const categoryId = getCategoryForTender(tender, categoryMap);

      let deadline = null;
      if (tender.deadlineText) {
        const parsed = new Date(tender.deadlineText);
        if (!isNaN(parsed.getTime())) {
          deadline = parsed;
        }
      }

      const saved = await prisma.tender.create({
        data: {
          title: tender.title,
          department: tender.department,
          referenceNo: tender.referenceNo,
          sourceUrl: tender.sourceUrl,
          categoryId: categoryId || null,
          deadline: deadline,
        },
      });

      stats.newSaved++;
      stats.savedTenders.push({ id: saved.id, title: saved.title, referenceNo: saved.referenceNo });
      console.log(`[NEW TENDER SAVED] "${saved.title}" [Ref: ${saved.referenceNo}]`);

      // Notify users subscribed to this category
      if (saved.categoryId) {
        const interestedUsers = await prisma.userCategory.findMany({
          where: { categoryId: saved.categoryId },
          include: { user: true },
        });

        for (let iu of interestedUsers) {
          if (iu.user?.email) {
            try {
              await sendAlert(iu.user.email, saved);
              console.log(`Alert email sent to ${iu.user.email} for tender "${saved.title}"`);
            } catch (mailErr) {
              console.error(`Failed sending alert to ${iu.user.email}:`, mailErr.message);
            }
          }
        }
      }
    }

    stats.success = true;
    console.log(`Scraping run completed: ${stats.newSaved} new tenders saved, ${stats.duplicatesSkipped} duplicates skipped.`);
    return stats;
  } catch (err) {
    console.error("Scraper failed:", err.message);
    stats.error = err.message;
    return stats;
  }
}

export default runScraper;

// Allows running directly from terminal: "node scripts/scraper.js"
if (process.argv[1]?.endsWith("scraper.js")) {
  runScraper().then(() => prisma.$disconnect());
}