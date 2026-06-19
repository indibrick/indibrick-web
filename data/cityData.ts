
import { CityData, PreConCityData } from '../types';

const generateCityData = (name: string, slug: string, neighborhoods: string[]): CityData => {
  const intro = `Buying a home in ${name} is a significant financial milestone that requires a balanced approach between mortgage strategy and local real estate insight. Whether you are navigating the competitive bidding wars of downtown ${name} or looking for a family-oriented freehold property in the outskirts, having a licensed expert in your corner is essential. As a professional Mortgage Agent, Mudit Chhura provides clients in ${name}, Ontario with more than just a rate — we provide a complete roadmap to home ownership. In ${name}, the real estate landscape is diverse, ranging from high-density vertical communities to established detached neighborhoods. Our mission is to ensure that your financing is robust enough to compete in this fast-paced market. We help you understand the nuances of ${name} property taxes, local closing costs, and the specific lender appraisal guidelines that apply to properties within this region. By coordinating your mortgage, realtor, and legal needs under one ecosystem, we eliminate the friction typically associated with buying a home in ${name}.`;

  const scenarios = [
    {
      title: `First-Time Home Buyers in ${name}`,
      description: `For those entering the ${name} market, we utilize specific programs like the First Home Savings Account (FHSA) and the Home Buyers' Plan (HBP) to maximize your down payment. Buying your first home in ${name} requires a strategy that accounts for Land Transfer Tax rebates and potential CMHC insurance premiums on high-ratio mortgages. We ensure your first purchase in ${name} is protected by a firm pre-approval.`
    },
    {
      title: `Newcomers to Canada in ${name}`,
      description: `New residents of ${name} often face challenges with limited Canadian credit history. We specialize in Newcomer Mortgage Programs that allow you to qualify with a 5% to 10% down payment, provided you have a stable work history or sufficient international assets. Moving to ${name} is a big step; we make the financing part of your relocation seamless and stress-free.`
    },
    {
      title: `Move-Up Buyers & Refinancing in ${name}`,
      description: `If you already own a home in ${name} and are looking to upgrade to a larger property or leverage equity for a renovation, our strategic refinancing options are designed for you. We analyze the current market value of your ${name} property to unlock capital for your next move, ensuring your debt-to-income ratios remain healthy for your next acquisition.`
    },
    {
      title: `Real Estate Investors in ${name}`,
      description: `${name} is a prime location for residential property investment. We assist investors in structuring their portfolios using rental-offset programs, where up to 80-100% of the rental income from your ${name} properties can be used to help you qualify for subsequent purchases. Our goal is to help you build a sustainable real estate legacy in the ${name} region.`
    }
  ];

  const areaContext = `${name} offers a wide spectrum of housing options tailored to different lifestyles and budgets. From the modern condominium suites in high-traffic corridors to the quiet, tree-lined streets of family-oriented neighborhoods, the ${name} market has something for everyone. Buyers in ${name} must consider proximity to transit, local school board rankings, and the long-term appreciation potential of specific pockets. For example, properties near planned transit expansions in ${name} often see higher demand. Whether you are considering a condo vs. a freehold home in ${name}, it is vital to understand how maintenance fees or property taxes will impact your total debt service ratios. Our deep understanding of the ${name} geographical layout allows us to provide insights that go beyond the balance sheet.`;

  const faqs = [
    { 
      question: `How much down payment is required to buy a home in ${name}?`, 
      answer: `In ${name}, Ontario, the minimum down payment is 5% for the first $500,000, 10% for the portion between $500,000 and $999,999, and a full 20% for any property priced at $1,000,000 or more. Given ${name}'s current market values, we often work with buyers to find the most efficient down payment structure.` 
    },
    { 
      question: `Can first-time buyers purchase property in ${name} with 5% down?`, 
      answer: `Yes, first-time buyers in ${name} can purchase with 5% down as long as the purchase price is under $1 million. We also help ${name} residents utilize the Home Buyers' Plan (HBP) to pull up to $60,000 from their RRSPs tax-free for this down payment.` 
    },
    { 
      question: `Do condo fees affect mortgage approval in ${name}?`, 
      answer: `Absolutely. When you buy a condo in ${name}, lenders include 50% of the monthly maintenance fees in your Debt Service Ratio calculations. This means a high condo fee in ${name} can actually lower the total mortgage amount you qualify for.` 
    },
    { 
      question: `Is foreign income accepted for buying a home in ${name}?`, 
      answer: `Verified foreign income is accepted by select lenders in the ${name} region for newcomers and residents working for international firms. This often requires additional documentation and may affect the required down payment for your ${name} property.` 
    },
    { 
      question: `Do I need a local realtor to buy property in ${name}?`, 
      answer: `While not legally required, a local ${name} realtor is highly recommended. Our ecosystem connects you with vetted ${name} agents who understand street-level trends, upcoming developments, and the competitive negotiation tactics needed to win in ${name}.` 
    },
    {
      question: `What are the typical closing costs when buying in ${name}?`,
      answer: `Closing costs in ${name} typically range from 1.5% to 4% of the purchase price. This includes Land Transfer Tax, legal fees, title insurance, and adjustments. If you are buying in the City of Toronto specifically, you must also account for the Municipal Land Transfer Tax.`
    }
  ];

  const ecosystemIntro = `Navigating the ${name} market requires more than just a mortgage; it requires a synchronized team of professionals. The IndiBrick ecosystem was built to provide ${name} home buyers with a one-stop solution. By bringing together financing, real estate expertise, legal protection, and renovation support, we ensure your ${name} property journey is coordinated from start to finish. Our partners are carefully vetted for their knowledge of the ${name} region, ensuring you get the highest level of service at every phase.`;

  return {
    slug,
    name,
    description: `The premier hub for real estate and mortgage strategy in ${name}, Ontario.`,
    metaDescription: `Looking to buy a home in ${name}? Get expert mortgage guidance, access to trusted realtors, lawyers, and renovation partners in ${name}, Ontario.`,
    intro,
    scenarios,
    areaContext,
    neighborhoods,
    ecosystemIntro,
    avgHomePrice: '$1,100,000+',
    avgRent: '$2,600+',
    marketTrend: 'Steady Growth',
    mortgageInsights: `Lenders frequently update ${name}-specific appraisal rules.`,
    realtorInsights: `Localized data is key to winning bidding wars in ${name}.`,
    legalInsights: `Ensure your ${name} title is clear of any local liens.`,
    renoInsights: `Legalizing basements in ${name} properties offers high ROI.`,
    faqs
  };
};

export const CITIES: CityData[] = [
  generateCityData('Toronto', 'toronto', ['The Annex', 'Liberty Village', 'Leslieville', 'Bridle Path', 'Distillery District', 'High Park']),
  generateCityData('Brampton', 'brampton', ['Mount Pleasant', 'Castlemore', 'Heart Lake', 'Bramalea', 'Peel Village', 'Credit Valley']),
  generateCityData('Mississauga', 'mississauga', ['Port Credit', 'Erin Mills', 'City Centre', 'Streetsville', 'Cooksville', 'Lakeview']),
  generateCityData('Vaughan', 'vaughan', ['Woodbridge', 'Maple', 'Thornhill', 'Kleinburg', 'Vaughan Metropolitan Centre', 'Concord']),
  generateCityData('Scarborough', 'scarborough', ['Guildwood', 'Agincourt', 'Wexford', 'Rouge', 'Cliffside', 'Birch Cliff']),
  generateCityData('Oakville', 'oakville', ['Old Oakville', 'Glen Abbey', 'Bronte Village', 'Clearview', 'River Oaks', 'Iroquois Ridge']),
  generateCityData('Milton', 'milton', ['Dempsey', 'Beaty', 'Clarke', 'Coates', 'Harrison', 'Scott']),
  generateCityData('Markham', 'markham', ['Unionville', 'Cornell', 'Wismer', 'Berczy Village', 'Milliken', 'Thornhill']),
  generateCityData('Richmond Hill', 'richmond-hill', ['Oak Ridges', 'Jefferson', 'Bayview Hill', 'Mill Pond', 'Doncrest', 'Elgin West']),
  generateCityData('Etobicoke', 'etobicoke', ['Mimico', 'Humber Bay', 'Islington Village', 'The Kingsway', 'Richview', 'New Toronto']),
  // Halton + Hamilton corridor
  generateCityData('Burlington', 'burlington', ['Downtown Burlington', 'Aldershot', 'Roseland', 'Tyandaga', 'Alton Village', 'Millcroft']),
  generateCityData('Hamilton', 'hamilton', ['Westdale', 'Locke Street', 'Stoney Creek', 'Ancaster', 'Dundas', 'Durand']),
  generateCityData('Halton Hills', 'halton-hills', ['Georgetown', 'Acton', 'Glen Williams', 'Norval', 'Limehouse', 'Stewarttown']),
  // Niagara region
  generateCityData('St. Catharines', 'st-catharines', ['Grapeview', 'Port Dalhousie', 'Glenridge', 'Martindale', 'Western Hill', 'Old Town']),
  generateCityData('Niagara Falls', 'niagara-falls', ['Stamford', 'Chippawa', 'Drummond Park', 'Mount Carmel', 'Dorchester', 'Westlane']),
  generateCityData('Welland', 'welland', ['Cooks Mills', 'Dain City', 'Crowland', 'Chippawa Park', 'Welland South', 'East Welland']),
  generateCityData('Niagara-on-the-Lake', 'niagara-on-the-lake', ['Old Town', 'Virgil', 'St. Davids', 'Queenston', 'Glendale', 'Garrison Village']),
  generateCityData('Fort Erie', 'fort-erie', ['Crystal Beach', 'Ridgeway', 'Stevensville', 'Bridgeburg', 'Black Creek', 'Garrison Village']),
  generateCityData('Grimsby', 'grimsby', ['Grimsby Beach', 'Casablanca', 'Park Road', 'West Grimsby', 'Mountain Estates', 'Vineland Estates']),
  // KW + Guelph
  generateCityData('Kitchener', 'kitchener', ['Downtown Kitchener', 'Doon', 'Forest Heights', 'Stanley Park', 'Country Hills', 'Huron South']),
  generateCityData('Waterloo', 'waterloo', ['Uptown Waterloo', 'Beechwood', 'Westmount', 'Lakeshore', 'University Heights', 'Lincoln Heights']),
  generateCityData('Cambridge', 'cambridge', ['Galt', 'Preston', 'Hespeler', 'Blair', 'West Galt', 'East Galt']),
  generateCityData('Guelph', 'guelph', ['Downtown Guelph', 'Old University', 'Exhibition Park', 'Kortright Hills', 'Westminster Woods', 'Pine Ridge']),
  // London + SW Ontario
  generateCityData('London', 'london', ['Old North', 'Wortley Village', 'Byron', 'Westmount', 'Masonville', 'Sunningdale']),
  generateCityData('Windsor', 'windsor', ['Walkerville', 'Riverside', 'Sandwich', 'South Walkerville', 'Old Riverside', 'Forest Glade']),
  // North GTA / Simcoe
  generateCityData('Barrie', 'barrie', ['Downtown Barrie', 'Allandale', 'South Shore', 'Innishore', 'Painswick', 'Sunnidale']),
  generateCityData('Innisfil', 'innisfil', ['Alcona', 'Lefroy', 'Stroud', 'Cookstown', 'Sandy Cove', 'Big Bay Point']),
  generateCityData('Bradford', 'bradford', ['Bradford West', 'Bond Head', 'Newton Robinson', 'Holland Marsh', 'Bradford East', 'Bradford South']),
  generateCityData('Newmarket', 'newmarket', ['Stonehaven', 'Glenway', 'Bristol-London', 'Summerhill Estates', 'Woodland Hill', 'Gorham-College Manor']),
  generateCityData('Aurora', 'aurora', ['Aurora Village', 'Hills of St. Andrew', 'Aurora Heights', 'Bayview Wellington', 'Aurora Estates', 'Aurora Grove']),
  generateCityData('King City', 'king-city', ['Nobleton', 'Schomberg', 'Pottageville', 'Kettleby', 'Snowball', 'Eversley']),
  // Durham region
  generateCityData('Pickering', 'pickering', ['Bay Ridges', 'Liverpool', 'Amberlea', 'Rougemount', 'Rosebank', 'Brock Ridge']),
  generateCityData('Ajax', 'ajax', ['Central Ajax', 'South Ajax', 'Pickering Beach', 'Audley', 'Riverside', 'Lakeside']),
  generateCityData('Whitby', 'whitby', ['Downtown Whitby', 'Brooklin', 'Williamsburg', 'Pringle Creek', 'Lynde Creek', 'Port Whitby']),
  generateCityData('Oshawa', 'oshawa', ['McLaughlin', 'O\'Neill', 'Eastdale', 'Lakeview', 'Pinecrest', 'Vanier']),
  generateCityData('Clarington', 'clarington', ['Bowmanville', 'Courtice', 'Newcastle', 'Orono', 'Newtonville', 'Hampton']),
  // Peel north
  generateCityData('Caledon', 'caledon', ['Bolton', 'Caledon East', 'Inglewood', 'Mono Mills', 'Palgrave', 'Cheltenham']),
  // Ottawa region
  generateCityData('Ottawa', 'ottawa', ['Westboro', 'The Glebe', 'Rockcliffe Park', 'Centretown', 'Old Ottawa South', 'Hintonburg']),
  generateCityData('Kanata', 'kanata', ['Kanata Lakes', 'Beaverbrook', 'Bridlewood', 'Glen Cairn', 'Katimavik-Hazeldean', 'Morgan\'s Grant']),
  generateCityData('Nepean', 'nepean', ['Barrhaven', 'Bells Corners', 'Crystal Beach', 'Bayshore', 'Centrepointe', 'Manordale']),
  generateCityData('Orleans', 'orleans', ['Avalon', 'Convent Glen', 'Fallingbrook', 'Chapel Hill', 'Queenswood Heights', 'Cardinal Creek'])
];

export const PRE_CON_CITIES: PreConCityData[] = CITIES.map(city => ({
  slug: city.slug,
  cityName: city.name,
  projects: [
    {
      name: `${city.name} Elite Residences`,
      builder: 'IndiBrick Partners',
      type: 'Mixed-Use Community',
      status: 'Priority Registration',
      highlights: ['Master-Planned Community', 'Transit-Adjacent', 'Platinum Pricing'],
      description: `A transformative development project in ${city.name} offering investors and families a unique chance to build equity in a high-growth corridor.`
    }
  ]
}));
