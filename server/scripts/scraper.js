import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from "../lib/prisma.js";
import sendAlert from '../utils/sendAlert.js';


// Target sources from eprocure.gov.in (no CAPTCHA required)
const TARGET_SOURCES = [
  {
    name: 'eProcure Main Active Tenders',
    url: 'https://eprocure.gov.in/eprocure/app',
    parser: 'activeTendersTable',
  },
  {
    name: 'ePublish Active Tenders',
    url: 'https://eprocure.gov.in/epublish/app',
    parser: 'activeTendersTable',
  },
  {
    name: 'Tenders Closing Today',
    url: 'https://eprocure.gov.in/epublish/app?page=FrontEndListTendersbyDate&service=page',
    parser: 'listTable',
  },
];

// Helper to route through ScraperAPI (with country_code=in) if SCRAPER_API_KEY is configured
function resolveFetchUrl(targetUrl) {
  if (process.env.SCRAPER_API_KEY) {
    return `https://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=in`;
  }
  return targetUrl;
}

async function scrapeSource(source) {
  const fetchUrl = resolveFetchUrl(source.url);
  if (process.env.SCRAPER_API_KEY) {
    console.log(`[Proxy] Fetching ${source.name} via ScraperAPI (India IP)`);
  } else {
    console.log(`[Direct] Fetching ${source.name} directly`);
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

  if (source.parser === 'activeTendersTable') {
    // Parses the activeTenders table on eprocure/app & epublish/app homepages (Deadlines are 1-4 weeks out)
    $('#activeTenders tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;

      const titleLink = $(cells[0]).find('a').attr('href');
      const cleanTitle = $(cells[0]).text().replace(/^\d+\.\s*/, '').trim();
      const referenceNo = $(cells[1]).text().trim();
      const deadlineText = $(cells[2]).text().trim();

      if (cleanTitle && referenceNo) {
        tenders.push({
          title: cleanTitle,
          referenceNo,
          deadlineText,
          department: referenceNo.split('/')[0] || 'Central Government',
          sourceUrl: titleLink
            ? (titleLink.startsWith('http') ? titleLink : `https://eprocure.gov.in${titleLink}`)
            : source.url,
        });
      }
    });
  } else if (source.parser === 'listTable') {
    // Parses standard list_table rows from FrontEndListTendersbyDate
    $('table.list_table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 5) return;

      const titleCellText = $(cells[4]).text().trim();
      const titleLink = $(cells[4]).find('a').attr('href');

      const matches = [...titleCellText.matchAll(/\[(.*?)\]/gs)].map(m => m[1].trim());
      if (matches.length < 2) return;

      const cleanTitle = matches[0];
      const referenceNo = matches[1] || matches[2];
      const deadlineText = $(cells[2]).text().trim();
      const department = $(cells[5]).text().trim();

      if (cleanTitle && referenceNo) {
        tenders.push({
          title: cleanTitle,
          referenceNo,
          deadlineText,
          department,
          sourceUrl: titleLink
            ? (titleLink.startsWith('http') ? titleLink : `https://eprocure.gov.in${titleLink}`)
            : source.url,
        });
      }
    });
  }

  return tenders;
}

async function scrapeTenders() {
  const allTenders = [];
  const seenRefs = new Set();

  for (const source of TARGET_SOURCES) {
    try {
      console.log(`Scraping source: ${source.name}...`);
      const items = await scrapeSource(source);
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
  const text = `${tender.title} ${tender.department} ${tender.referenceNo}`.toLowerCase();

  if (text.includes("defence") || text.includes("defense") || text.includes("ordnance") || text.includes("air force") || text.includes("gun") || text.includes("space") || text.includes("navy") || text.includes("naval") || text.includes("missile") || text.includes("drdo") || text.includes("bsf") || text.includes("radar") || text.includes("oven") || text.includes("shar")) {
    return categoryMap["Defense & Aerospace"];
  }
  if (text.includes("rail") || text.includes("siding") || text.includes("container") || text.includes("jnpt") || text.includes("fmlm") || text.includes("transport") || text.includes("port") || text.includes("ship") || text.includes("tug") || text.includes("fender") || text.includes("dock") || text.includes("csl") || text.includes("bollard")) {
    return categoryMap["Railways & Transport"];
  }
  if (text.includes("electric") || text.includes("light") || text.includes("voltage") || text.includes("wire") || text.includes("led") || text.includes("power") || text.includes("solar") || text.includes("dg set") || text.includes("generator") || text.includes("battery") || text.includes("transformer") || text.includes("vrf") || text.includes("furnace")) {
    return categoryMap["Electrical & Electronics"];
  }
  if (text.includes("hospital") || text.includes("medical") || text.includes("health") || text.includes("pump") || text.includes("acetone") || text.includes("pharma") || text.includes("medicine") || text.includes("microscope") || text.includes("surgical") || text.includes("biotech") || text.includes("aiims") || text.includes("water supply") || text.includes("drinking water")) {
    return categoryMap["Healthcare & Medical Supplies"];
  }
  if (text.includes("software") || text.includes("computer") || text.includes("information technology") || text.includes("cyber") || text.includes("cloud") || text.includes("server") || text.includes("hardware") || text.includes("laptop") || text.includes("amc") || text.includes("data") || text.includes("circuit") || text.includes("laser") || text.includes("radiometer") || text.includes("actuator") || text.includes("it/")) {
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