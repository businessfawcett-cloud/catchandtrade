/**
 * PSA Scraper Service
 * 
 * Fetches population data and certification info from PSA website
 * Note: PSA doesn't have a public API, so we scrape their website
 */

import * as cheerio from 'cheerio';

export interface PsaCertData {
  certNumber: string;
  cardName: string;
  setName?: string;
  cardNumber?: string;
  grade: string;
  popCount?: number;
  lastSalePrice?: number;
  lastSaleDate?: Date;
}

export interface PsaPopData {
  cardName: string;
  totalGraded: number;
  grades: {
    grade: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Scrape PSA certification details from PSA website
 */
export async function scrapePsaCert(certNumber: string): Promise<PsaCertData | null> {
  try {
    // PSA website URL format
    const url = `https://www.psacard.com/cert/${certNumber}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`[PSA Scraper] Failed to fetch ${certNumber}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract card info from PSA page structure
    // Note: PSA page structure changes frequently, this is a basic parser
    
    const cardName = $('h1').first().text().trim() || 'Unknown Card';
    const gradeElement = $('span:contains("Grade:")').next() || $('.cert-grade span').first();
    const grade = gradeElement.text().trim() || 'Unknown';
    
    // Try to extract population data
    let popCount: number | undefined;
    const popElement = $('span:contains("Population")').parent().find('.pop-count');
    if (popElement.length) {
      const popText = popElement.text();
      const popMatch = popText.match(/(\d+)/);
      if (popMatch) {
        popCount = parseInt(popMatch[1]);
      }
    }
    
    // Extract sale price if available
    let lastSalePrice: number | undefined;
    const saleElement = $('span:contains("Recent Sale")').next() || $('.sale-price').first();
    const saleText = saleElement.text();
    const saleMatch = saleText.match(/\$?([\d,]+\.\d{2})/);
    if (saleMatch) {
      lastSalePrice = parseFloat(saleMatch[1].replace(',', ''));
    }
    
    return {
      certNumber,
      cardName,
      grade: grade || 'Unknown',
      popCount,
      lastSalePrice,
      lastSaleDate: new Date()
    };
    
  } catch (error) {
    console.error(`[PSA Scraper] Error scraping cert ${certNumber}:`, error);
    return null;
  }
}

/**
 * Scrape population report for a specific card from PSA
 */
export async function scrapePsaPopulation(cardName: string, setName?: string): Promise<PsaPopData | null> {
  try {
    // Search PSA population reports
    const searchTerm = setName ? `${cardName} ${setName}` : cardName;
    const searchUrl = `https://www.psacard.com/pop/searchresults.aspx?search=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`[PSA Scraper] Failed to fetch population for ${cardName}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Parse population table
    const grades: { grade: string; count: number; percentage: number }[] = [];
    let totalGraded = 0;
    
    // Find table rows with grade data
    $('table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const gradeText = $(cells[0]).text().trim();
        const countText = $(cells[1]).text().trim();
        const percentageText = $(cells[2]).text().trim();
        
        if (gradeText && countText) {
          const count = parseInt(countText.replace(/,/g, ''));
          if (!isNaN(count)) {
            grades.push({
              grade: gradeText,
              count,
              percentage: parseFloat(percentageText) || 0
            });
            totalGraded += count;
          }
        }
      }
    });
    
    if (grades.length === 0) {
      return null;
    }
    
    return {
      cardName,
      totalGraded,
      grades
    };
    
  } catch (error) {
    console.error(`[PSA Scraper] Error scraping population for ${cardName}:`, error);
    return null;
  }
}

/**
 * Mock scraper for development (returns fake data)
 * Use this when you can't scrape PSA directly
 */
export function mockScrapePsaCert(certNumber: string): PsaCertData {
  // Simulate different results based on cert number pattern
  const certNum = certNumber.replace(/[^\d]/g, '');
  
  if (certNum.startsWith('1')) {
    return {
      certNumber,
      cardName: 'Charizard 4/102 Base Set',
      setName: 'Base Set',
      cardNumber: '4',
      grade: '10',
      popCount: 42,
      lastSalePrice: 1200.00,
      lastSaleDate: new Date()
    };
  } else if (certNum.startsWith('2')) {
    return {
      certNumber,
      cardName: 'Blastoise 9/102 Base Set',
      setName: 'Base Set',
      cardNumber: '9',
      grade: '9',
      popCount: 156,
      lastSalePrice: 340.00,
      lastSaleDate: new Date()
    };
  } else if (certNum.startsWith('3')) {
    return {
      certNumber,
      cardName: 'Pikachu 25/102 Jungle',
      setName: 'Jungle',
      cardNumber: '25',
      grade: '10',
      popCount: 89,
      lastSalePrice: 45.00,
      lastSaleDate: new Date()
    };
  } else {
    // Default random card
    const grades = ['10', '9', '8', '7'];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    
    return {
      certNumber,
      cardName: 'Mewtwo 12/102 Base Set',
      setName: 'Base Set',
      cardNumber: '12',
      grade,
      popCount: Math.floor(Math.random() * 500) + 10,
      lastSalePrice: Math.random() * 500 + 50,
      lastSaleDate: new Date()
    };
  }
}
