import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from "../lib/prisma.js";
import sendAlert from '../utils/sendAlert.js';

// Target page: Tenders by Closing Date (no CAPTCHA required)
// https://eprocure.gov.in/epublish/app?page=FrontEndListTendersbyDate&service=page

const TARGET_URL =
  'https://eprocure.gov.in/epublish/app?page=FrontEndListTendersbyDate&service=page';

async function scrapeTenders() {
  const { data } = await axios.get(TARGET_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(data);
  const tenders = [];

  // Loop through every row in the tender table
  $('table.list_table tr').each((i, row) => {
    const cells = $(row).find('td');

    // Skip header rows or empty state rows
    if (cells.length < 5) return;

    // Title + Reference No often sit together in one cell
    const titleCellText = $(cells[4]).text().trim();
    const titleLink = $(cells[4]).find('a').attr('href');

    // The actual title is the text before brackets
    const cleanTitle = titleCellText.replace(/\[.*?\]/g, '').trim();

    // Extract reference number from the first bracket [REF-NO]
    const match = [...titleCellText.matchAll(/\[(.*?)\]/g)];
    const referenceNo = match[0] ? match[0][1].trim() : null;

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
          : TARGET_URL,
      });
    }
  });

  return tenders;
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

// Run scraper and notify interested users
scrapeTenders()
  .then(async (tenders) => {
    console.log(`Scraped ${tenders.length} tenders from eprocure.`);

    // Load available categories from database
    const allCategories = await prisma.category.findMany();
    const categoryMap = {};
    for (const cat of allCategories) {
      categoryMap[cat.name] = cat.id;
    }

    for (let tender of tenders) {
      if (!tender.referenceNo) continue;

      let existing = await prisma.tender.findUnique({
        where: { referenceNo: tender.referenceNo }
      });

      if (!existing) {
        const categoryId = getCategoryForTender(tender, categoryMap);

        // Parse deadline string to a Date object safely
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
          }
        });

        console.log(`Saved new tender: "${saved.title}" [Ref: ${saved.referenceNo}]`);

        // Find users subscribed to this category
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
    }
    console.log("Scraping and alert notifications complete.");
  })
  .catch((err) => {
    console.error('Scraper failed:', err.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });