import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Check, ChevronDown, Download,
  FileText, Globe2, Image, Layers3, LayoutTemplate, ListPlus, MapPin, Palette, Plus,
  Rocket, Search, Settings2, ShieldCheck, Sparkles, Trash2, WandSparkles, X
} from 'lucide-react';
import './LaunchStudio.css';

const PALETTES = [
  {id:'C01',name:'Neutral SaaS Blue',bg:'#f8fafc',surface:'#ffffff',ink:'#0f172a',muted:'#64748b',primary:'#2563eb',accent:'#0ea5e9',secondary:'#dbeafe',gradient:'linear-gradient(125deg,#1d4ed8,#06b6d4)'},
  {id:'C02',name:'Midnight Electric',bg:'#050914',surface:'#0b1426',ink:'#f8fbff',muted:'#a4b6cf',primary:'#176bff',accent:'#31d5ff',secondary:'#112c52',gradient:'linear-gradient(125deg,#104fff,#05d5ff)'},
  {id:'C03',name:'Graphite Lime',bg:'#101412',surface:'#19211d',ink:'#f5f8f4',muted:'#a7b3aa',primary:'#a3e635',accent:'#d9f99d',secondary:'#273a2b',gradient:'linear-gradient(125deg,#65a30d,#bef264)'},
  {id:'C04',name:'Black Gold Luxury',bg:'#0b0b0b',surface:'#171512',ink:'#fffaf0',muted:'#b8ad99',primary:'#c9a45c',accent:'#f5df9b',secondary:'#302718',gradient:'linear-gradient(125deg,#8f6b2e,#e8d39a)'},
  {id:'C05',name:'Warm Editorial',bg:'#faf5ee',surface:'#fffdf9',ink:'#29241f',muted:'#796e63',primary:'#8b4c32',accent:'#d97745',secondary:'#f3dfd0',gradient:'linear-gradient(125deg,#8b4c32,#e9a17a)'},
  {id:'C06',name:'Indigo Violet',bg:'#0d1024',surface:'#171b37',ink:'#f7f7ff',muted:'#b5b9de',primary:'#6366f1',accent:'#c084fc',secondary:'#292750',gradient:'linear-gradient(125deg,#4f46e5,#c026d3)'},
  {id:'C07',name:'Ocean Teal',bg:'#061b20',surface:'#0d2a30',ink:'#effdfb',muted:'#a5c8c9',primary:'#0d9488',accent:'#5eead4',secondary:'#16464b',gradient:'linear-gradient(125deg,#0f766e,#22d3ee)'},
  {id:'C08',name:'Emerald Finance',bg:'#071a14',surface:'#10291f',ink:'#f0fdf4',muted:'#a7c8b2',primary:'#059669',accent:'#6ee7b7',secondary:'#174632',gradient:'linear-gradient(125deg,#047857,#34d399)'},
  {id:'C09',name:'Coral Commerce',bg:'#fff7f4',surface:'#ffffff',ink:'#2c1714',muted:'#896c66',primary:'#e45745',accent:'#fb923c',secondary:'#ffe2d9',gradient:'linear-gradient(125deg,#e45745,#fb923c)'},
  {id:'C10',name:'Rose Creator',bg:'#1b0d17',surface:'#2b1424',ink:'#fff4fa',muted:'#d3a9bf',primary:'#e11d75',accent:'#fb7185',secondary:'#48203b',gradient:'linear-gradient(125deg,#be185d,#fb7185)'},
  {id:'C11',name:'Amber Utility',bg:'#1b1308',surface:'#2b2011',ink:'#fffbeb',muted:'#d5c29d',primary:'#d97706',accent:'#fcd34d',secondary:'#4b3518',gradient:'linear-gradient(125deg,#b45309,#fbbf24)'},
  {id:'C12',name:'Slate Cyan',bg:'#0b1220',surface:'#151f30',ink:'#f1f7ff',muted:'#9aafc7',primary:'#0284c7',accent:'#67e8f9',secondary:'#17334a',gradient:'linear-gradient(125deg,#0369a1,#22d3ee)'},
  {id:'C13',name:'Soft Lavender',bg:'#f7f5ff',surface:'#ffffff',ink:'#282044',muted:'#766b91',primary:'#7c3aed',accent:'#c4b5fd',secondary:'#e9e2ff',gradient:'linear-gradient(125deg,#7c3aed,#c084fc)'},
  {id:'C14',name:'Earth Sand',bg:'#f5f0e6',surface:'#fffdf7',ink:'#302b22',muted:'#817866',primary:'#78613e',accent:'#c6a76a',secondary:'#e7dcc5',gradient:'linear-gradient(125deg,#78613e,#c6a76a)'},
  {id:'C15',name:'Monochrome High Contrast',bg:'#050505',surface:'#151515',ink:'#ffffff',muted:'#b8b8b8',primary:'#ffffff',accent:'#c7f36b',secondary:'#303030',gradient:'linear-gradient(125deg,#ffffff,#c7f36b)'},
  {id:'C16',name:'Frost Glass',bg:'#edf5fa',surface:'#ffffff',ink:'#102538',muted:'#61798c',primary:'#3478a8',accent:'#7dd3fc',secondary:'#d6eaf5',gradient:'linear-gradient(125deg,#1d4ed8,#67e8f9)'},
  {id:'C17',name:'Neon Dark',bg:'#080b13',surface:'#121725',ink:'#f8fafc',muted:'#9ba6bc',primary:'#a3ff12',accent:'#ff3bd4',secondary:'#222b3d',gradient:'linear-gradient(125deg,#a3ff12,#00e5ff,#ff3bd4)'},
  {id:'C18',name:'Health Mint',bg:'#f1fbf6',surface:'#ffffff',ink:'#16352a',muted:'#668276',primary:'#15966b',accent:'#78d9b3',secondary:'#d8f5e7',gradient:'linear-gradient(125deg,#059669,#99f6e4)'},
  {id:'C19',name:'Royal Navy',bg:'#08162d',surface:'#102445',ink:'#f4f8ff',muted:'#a6b9d6',primary:'#3b82f6',accent:'#f0c66e',secondary:'#1b355b',gradient:'linear-gradient(125deg,#1d4ed8,#d4a84e)'},
  {id:'C20',name:'Sunset Gradient',bg:'#1c1020',surface:'#2b1830',ink:'#fff7fb',muted:'#d1afc9',primary:'#f97316',accent:'#f472b6',secondary:'#48243d',gradient:'linear-gradient(125deg,#f97316,#ec4899,#8b5cf6)'}
];

const INDUSTRIES = [
 {id:'home-services',label:'Home Services & Trades',headline:'The trusted team for every home project.',sub:'Reliable workmanship, clear communication, and results built to last.',cta:'Request an Estimate',services:['Repairs & maintenance','Installation','Emergency service','Free estimates'],image:'photo-1600585154340-be6161a56a0c'},
 {id:'roofing',label:'Roofing & Exterior',headline:'Protection above everything.',sub:'Roofing solutions engineered for confidence, durability, and curb appeal.',cta:'Schedule a Roof Inspection',services:['Roof replacement','Roof repairs','Storm damage','Inspections'],image:'photo-1635424710928-6f3c9c1b6e20'},
 {id:'hvac',label:'HVAC & Climate Control',headline:'Comfort you can count on.',sub:'Responsive heating and cooling service for every season.',cta:'Book HVAC Service',services:['AC installation','Heating repair','Preventive maintenance','Indoor air quality'],image:'photo-1631545806609-7f6b5a1b7b5a'},
 {id:'plumbing',label:'Plumbing',headline:'Expert plumbing. No surprises.',sub:'Fast, professional plumbing solutions for homes and businesses.',cta:'Book a Plumber',services:['Leak repair','Drain clearing','Water heaters','New installations'],image:'photo-1621905251189-08b45d6a269e'},
 {id:'electrical',label:'Electrical Contractors',headline:'Powering spaces safely.',sub:'Code-conscious electrical service delivered by qualified professionals.',cta:'Request Electrical Service',services:['Panel upgrades','Lighting','EV chargers','Troubleshooting'],image:'photo-1621905252507-b35492cc74b4'},
 {id:'construction',label:'Construction & Remodeling',headline:'Build better. Build with confidence.',sub:'Thoughtful planning and quality craftsmanship from concept to completion.',cta:'Discuss Your Project',services:['Renovations','Additions','Commercial build-outs','Project management'],image:'photo-1503387762-592deb58ef4e'},
 {id:'real-estate',label:'Real Estate & Property',headline:'Find a place for what comes next.',sub:'Local expertise, curated listings, and guidance at every step.',cta:'Explore Properties',services:['Buy a home','Sell a property','Investment properties','Property valuation'],image:'photo-1600596542815-ffad4c1539a9'},
 {id:'property-management',label:'Property Management',headline:'Better managed properties. Stronger returns.',sub:'Proactive operations and responsive service for owners and residents.',cta:'Request Management',services:['Leasing','Tenant support','Maintenance','Owner reporting'],image:'photo-1560518883-ce09059eeffa'},
 {id:'law',label:'Law Firm & Legal Services',headline:'Clear counsel for consequential decisions.',sub:'Experienced guidance, responsive communication, and a strategy built around you.',cta:'Schedule a Consultation',services:['Business law','Estate planning','Litigation','Contract review'],image:'photo-1589829545856-d10d557cf95f'},
 {id:'medical',label:'Healthcare & Medical',headline:'Care centered on you.',sub:'Patient-first services, clear next steps, and a team that listens.',cta:'Request an Appointment',services:['Primary care','Specialty services','Patient resources','Care coordination'],image:'photo-1576091160399-112ba8d25d1d'},
 {id:'dental',label:'Dental & Orthodontics',headline:'Confident smiles start here.',sub:'Modern dental care designed around comfort, prevention, and long-term health.',cta:'Book an Appointment',services:['Preventive care','Cosmetic dentistry','Restorative care','Emergency visits'],image:'photo-1606811971618-4486d14f3f99'},
 {id:'wellness',label:'Wellness & Fitness',headline:'Make your next level a daily habit.',sub:'Expert coaching and a supportive plan that meets you where you are.',cta:'Start Your Journey',services:['Personal training','Group classes','Wellness coaching','Memberships'],image:'photo-1534438327276-14e5300c3a48'},
 {id:'beauty',label:'Beauty, Salon & Spa',headline:'Your time to feel exceptional.',sub:'Personalized treatments and thoughtful service in a space made for you.',cta:'Book Your Visit',services:['Signature services','Skin treatments','Packages','Gift cards'],image:'photo-1560066984-138dadb4c035'},
 {id:'restaurant',label:'Restaurant & Hospitality',headline:'A table worth gathering around.',sub:'Memorable flavors, warm hospitality, and an experience made to be shared.',cta:'Reserve a Table',services:['Our menu','Private events','Reservations','Catering'],image:'photo-1414235077428-338989a2e8c0'},
 {id:'ecommerce',label:'Ecommerce & Retail',headline:'Find your new favorite.',sub:'Thoughtfully selected products, trusted quality, and a better way to shop.',cta:'Shop the Collection',services:['Featured products','New arrivals','Best sellers','Customer support'],image:'photo-1441986300917-64674bd600d8'},
 {id:'automotive',label:'Automotive & Repair',headline:'Performance, precision, peace of mind.',sub:'Honest recommendations and dependable automotive care from people who know cars.',cta:'Book Auto Service',services:['Diagnostics','Maintenance','Repairs','Fleet service'],image:'photo-1486262715619-67b85e0b08d3'},
 {id:'insurance',label:'Insurance & Financial Protection',headline:'Confidence for what matters most.',sub:'Practical guidance and coverage options tailored to your goals.',cta:'Review Your Options',services:['Personal coverage','Business coverage','Risk review','Claims guidance'],image:'photo-1450101499163-c8848c66ca85'},
 {id:'accounting',label:'Accounting & Tax',headline:'Clear numbers. Better decisions.',sub:'Accurate financial support and proactive advice for individuals and businesses.',cta:'Book a Discovery Call',services:['Tax planning','Bookkeeping','Business advisory','Reporting'],image:'photo-1554224155-8d04cb21cd6c'},
 {id:'consulting',label:'Consulting & Professional Services',headline:'Turn complex challenges into forward motion.',sub:'Strategic expertise that aligns your team, clarifies priorities, and accelerates execution.',cta:'Schedule a Strategy Call',services:['Strategy','Operations','Transformation','Implementation'],image:'photo-1556761175-b413da4baf72'},
 {id:'marketing',label:'Marketing & Creative Agency',headline:'Make your brand impossible to ignore.',sub:'Insight-led creative and campaigns built to earn attention and drive action.',cta:'Plan Your Campaign',services:['Brand strategy','Web design','Content','Performance marketing'],image:'photo-1552664730-d307ca884978'},
 {id:'saas',label:'SaaS & Technology',headline:'Work smarter with a better system.',sub:'A modern platform that helps teams move from busywork to measurable progress.',cta:'Start Free Trial',services:['Platform overview','Integrations','Security','Plans & pricing'],image:'photo-1519389950473-47ba0277781c'},
 {id:'ai',label:'AI & Automation',headline:'Put intelligent automation to work.',sub:'Connect your workflows, reduce repetitive work, and scale with control.',cta:'Explore Automation',services:['AI agents','Workflow automation','Data intelligence','Implementation'],image:'photo-1677442136019-21780ecad995'},
 {id:'education',label:'Education & Training',headline:'Skills that open new possibilities.',sub:'Practical learning, expert instruction, and clear paths to measurable growth.',cta:'Explore Programs',services:['Courses','Certifications','Corporate training','Student support'],image:'photo-1523240795612-9a054b0db644'},
 {id:'childcare',label:'Childcare & Family Services',headline:'A caring place to learn and grow.',sub:'A safe, engaging environment built around every child’s potential.',cta:'Schedule a Tour',services:['Programs by age','Daily activities','Family resources','Enrollment'],image:'photo-1503454537195-1dcabb73ffb9'},
 {id:'nonprofit',label:'Nonprofit & Community',headline:'Together, meaningful change is possible.',sub:'Connect people to your mission and make every contribution count.',cta:'Support the Mission',services:['Our mission','Programs','Volunteer','Donate'],image:'photo-1531206715517-5c0ba140b2b8'},
 {id:'travel',label:'Travel & Tourism',headline:'Your next great story starts here.',sub:'Discover exceptional places and thoughtfully planned experiences.',cta:'Plan Your Trip',services:['Destinations','Experiences','Packages','Travel support'],image:'photo-1464822759023-fed622ff2c3b'},
 {id:'events',label:'Events & Weddings',headline:'Every detail, beautifully considered.',sub:'Creative planning and calm coordination for moments that matter.',cta:'Plan Your Event',services:['Weddings','Corporate events','Design & decor','Coordination'],image:'photo-1511795409834-ef04bbd61622'},
 {id:'logistics',label:'Logistics & Transportation',headline:'Every delivery, moving forward.',sub:'Dependable transport and logistics built around timing, visibility, and service.',cta:'Request a Quote',services:['Freight','Last mile','Fleet solutions','Tracking'],image:'photo-1586528116311-ad8dd3c8310d'},
 {id:'manufacturing',label:'Manufacturing & Industrial',headline:'Precision that powers progress.',sub:'Reliable capabilities, engineered quality, and a partner for demanding operations.',cta:'Talk to Engineering',services:['Capabilities','Quality systems','Industries served','Request a quote'],image:'photo-1567789884554-0b844b597180'},
 {id:'agriculture',label:'Agriculture & Landscaping',headline:'Grow stronger from the ground up.',sub:'Expert services and practical solutions for healthier outdoor spaces.',cta:'Get a Project Quote',services:['Landscape design','Lawn care','Irrigation','Seasonal maintenance'],image:'photo-1416879595882-3373a0480b5b'},
 {id:'pet',label:'Pet Care & Veterinary',headline:'Care that keeps tails wagging.',sub:'Compassionate care, expert guidance, and happier days for pets and people.',cta:'Book Pet Care',services:['Veterinary care','Grooming','Boarding','Wellness plans'],image:'photo-1450778869180-41d0601e046e'},
 {id:'security',label:'Security & Safety',headline:'Protection built on preparation.',sub:'Practical security solutions that help people and property stay protected.',cta:'Request a Security Review',services:['Security systems','Monitoring','Access control','Risk assessment'],image:'photo-1557597774-9d273605dfa9'},
 {id:'telecom',label:'Telecommunications',headline:'Better connections. Smarter communication.',sub:'Modern connectivity and communications solutions for teams that move fast.',cta:'Explore Solutions',services:['Business phone','Network solutions','Cloud communications','Support'],image:'photo-1519389950473-47ba0277781c'},
 {id:'architecture',label:'Architecture & Design',headline:'Spaces shaped around possibility.',sub:'Design-led thinking, technical rigor, and a process built for your vision.',cta:'Discuss a Project',services:['Architecture','Interior design','Planning','Project delivery'],image:'photo-1600210492486-724fe5c67fb0'},
 {id:'photography',label:'Photography & Media',headline:'Stories worth seeing again.',sub:'Distinctive imagery and thoughtful production that brings your story to life.',cta:'View the Portfolio',services:['Brand photography','Events','Video production','Creative direction'],image:'photo-1452587925148-ce544e77e70d'},
 {id:'recruiting',label:'Recruiting & HR',headline:'Build teams that move business forward.',sub:'Connect the right people with the opportunities where they can thrive.',cta:'Talk Talent',services:['Executive search','Recruiting','HR advisory','Workforce planning'],image:'photo-1521737711867-e3b97375f902'},
 {id:'government',label:'Government & Civic',headline:'Public services made more accessible.',sub:'Clear information and straightforward digital services for every community.',cta:'Find a Service',services:['Public resources','Permits & forms','Community updates','Contact services'],image:'photo-1486406146926-c627a92ad1ab'},
 {id:'church',label:'Church & Faith Community',headline:'A place to belong and grow together.',sub:'Find community, discover upcoming gatherings, and take your next step.',cta:'Plan Your Visit',services:['Service times','Ministries','Events','Ways to serve'],image:'photo-1438032005730-c779502df39b'},
 {id:'creator',label:'Creator & Personal Brand',headline:'Your ideas deserve a bigger stage.',sub:'Bring your work, story, and community together in one memorable destination.',cta:'Explore My Work',services:['Portfolio','Content library','Speaking','Collaborations'],image:'photo-1521737711867-e3b97375f902'}
];

const LAYOUTS = [
 {id:'R20',name:'Service Business',desc:'High-conversion service landing page',type:'split'},
 {id:'R21',name:'Corporate / Consulting',desc:'Editorial authority and proof points',type:'editorial'},
 {id:'R05',name:'Ecommerce Store',desc:'Product-led merchandising',type:'commerce'},
 {id:'R06',name:'SaaS Workspace',desc:'Feature hierarchy and product UI',type:'product'},
 {id:'R19',name:'Lead Generation Funnel',desc:'Focused conversion path',type:'funnel'},
 {id:'R18',name:'Real Estate Search',desc:'Listings and location discovery',type:'listings'},
 {id:'R11',name:'Booking / Scheduling',desc:'Appointments and availability',type:'booking'},
 {id:'R22',name:'Product Launch',desc:'Bold announcement and waitlist',type:'launch'},
 {id:'R23',name:'Pricing / Subscription',desc:'Plans and decision support',type:'pricing'},
 {id:'R15',name:'Learning Platform',desc:'Programs, outcomes, and enrollment',type:'education'},
 {id:'R29',name:'Event Experience',desc:'Event details, speakers, and registration',type:'events'},
 {id:'R30',name:'Multi-step Intake',desc:'Guided questionnaire and qualification',type:'intake'},
 {id:'D10',name:'Editorial Hero',desc:'Large typography and image-led story',type:'editorial'},
 {id:'D12',name:'Search & Directory',desc:'Filters, categories, and discovery',type:'directory'},
 {id:'D09',name:'Product Spotlight',desc:'Feature product with gallery',type:'product'},
 {id:'D11',name:'Pricing Comparison',desc:'Compare tiers and key benefits',type:'pricing'},
 {id:'D14',name:'AI Copilot / Platform',desc:'Interactive product demonstration',type:'product'},
 {id:'D08',name:'Marketplace Grid',desc:'Card grid for many offerings',type:'commerce'},
 {id:'D16',name:'Customer Portal',desc:'Account-focused utility layout',type:'portal'},
 {id:'D27',name:'Conversion Analytics',desc:'Proof, metrics, and action blocks',type:'funnel'}
];

const SECTION_LIBRARY = [
 {id:'hero',label:'Hero / Main message',group:'Core'},
 {id:'trust',label:'Trust bar / Certifications',group:'Trust'},
 {id:'services',label:'Services / Offerings',group:'Core'},
 {id:'benefits',label:'Benefits / Outcomes',group:'Conversion'},
 {id:'process',label:'How it works',group:'Conversion'},
 {id:'gallery',label:'Project gallery / Portfolio',group:'Visual'},
 {id:'products',label:'Featured products',group:'Commerce'},
 {id:'stats',label:'Results / Metrics',group:'Trust'},
 {id:'testimonials',label:'Testimonials / Reviews',group:'Trust'},
 {id:'case-studies',label:'Case studies',group:'Trust'},
 {id:'team',label:'Team / Experts',group:'About'},
 {id:'about',label:'About the business',group:'About'},
 {id:'pricing',label:'Pricing / Packages',group:'Commerce'},
 {id:'faq',label:'Frequently asked questions',group:'SEO & Support'},
 {id:'locations',label:'Service areas / Locations',group:'Local SEO'},
 {id:'booking',label:'Booking / Appointment form',group:'Conversion'},
 {id:'lead-form',label:'Lead capture form',group:'Conversion'},
 {id:'blog',label:'Articles / Insights',group:'SEO & Content'},
 {id:'video',label:'Video / Demonstration',group:'Visual'},
 {id:'partners',label:'Partners / Logo wall',group:'Trust'},
 {id:'comparison',label:'Comparison table',group:'Conversion'},
 {id:'newsletter',label:'Newsletter signup',group:'Conversion'},
 {id:'map',label:'Map / Directions',group:'Local SEO'},
 {id:'social',label:'Social proof / Community',group:'Trust'},
 {id:'cta',label:'Closing call to action',group:'Conversion'},
 {id:'contact',label:'Contact / Business details',group:'Core'}
];

const DEFAULT_SECTIONS = ['hero','trust','services','benefits','process','testimonials','faq','locations','cta','contact'];
const DEFAULT_PAGES = ['Home','Services','About','Reviews','Contact'];
const FONTS = ['Inter','Manrope','DM Sans','Plus Jakarta Sans','Playfair Display','Space Grotesk','Lora','Montserrat'];
const LOGO_STYLES = ['Geometric mark','Wordmark','Monogram','Orbit / symbol','Shield / crest','Abstract spark'];
const DEFAULT_PROJECT = {
  businessName:'Northstar Home Services', industry:'home-services', subindustry:'General home services',
  location:'Fort Lauderdale, FL', audience:'Homeowners and property managers', goal:'Lead generation',
  services:'Repairs, installations, maintenance', paletteId:'C02', customAccent:'#176BFF', layoutId:'R20',
  font:'Inter', logoStyle:'Geometric mark', heroImageStyle:'Editorial photography',
  pages:DEFAULT_PAGES, sections:DEFAULT_SECTIONS, generatedContent:null,
  metaTitle:'Northstar Home Services | Trusted Local Experts',
  metaDescription:'Reliable home services, clear estimates, and quality workmanship. Contact Northstar Home Services to discuss your project.',
  faqs:[{q:'What areas do you serve?',a:'We serve Fort Lauderdale and surrounding communities.'},{q:'How do I request an estimate?',a:'Contact our team with a few details about your project.'}],
  launchTargets:[{id:1,location:'Fort Lauderdale, FL',businessName:'Northstar Home Services'},{id:2,location:'Miami, FL',businessName:'Northstar Home Services Miami'}]
};

function downloadFile(name, content, type) {
  const blob = new Blob([content], {type:type || 'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
function safeId(s) { return String(s || 'site').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'site'; }
function makeContent(project, industry) {
  const name = project.businessName || 'Your Business';
  const area = project.location ? ' in ' + project.location : '';
  const services = (project.services || industry.services.join(', ')).split(',').map(s=>s.trim()).filter(Boolean);
  return {
    eyebrow:industry.label,
    headline:industry.headline,
    subheadline:industry.sub,
    primaryCta:industry.cta,
    intro:name + ' helps customers' + area + ' with dependable service, clear communication, and solutions tailored to their needs.',
    serviceCards:services.slice(0,6).map((title,i)=>({title,copy:'Professional ' + title.toLowerCase() + ' designed around your goals, timeline, and expectations.'})),
    benefits:['Clear recommendations and next steps','Responsive communication from start to finish','A process designed around quality and accountability'],
    process:[{title:'Tell us what you need',copy:'Share your goals, timing, and priorities.'},{title:'Get a tailored plan',copy:'We explain the recommended approach and next steps.'},{title:'Move forward with confidence',copy:'Stay informed as the work progresses.'}],
    faq:project.faqs || DEFAULT_PROJECT.faqs,
    seoTitle:project.metaTitle || (name + ' | ' + industry.label),
    seoDescription:project.metaDescription || industry.sub,
    schemaType:industry.id==='restaurant'?'Restaurant':industry.id==='medical'||industry.id==='dental'?'MedicalBusiness':industry.id==='real-estate'?'RealEstateAgent':industry.id==='saas'?'SoftwareApplication':'LocalBusiness',
    imagePrompt:'Create an original premium website hero image for ' + name + ', an ' + industry.label + ' business serving ' + (project.location || 'its local market') + '. Visual direction: ' + project.heroImageStyle + '. Show subject matter relevant to ' + industry.label + '; no text, no logos, wide 16:9 composition, professional art direction.'
  };
}
function makeLogoSvg(project, palette) {
  const name = project.businessName || 'Brand';
  const initials = name.split(/\\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase() || 'B';
  const c1 = project.customAccent || palette.primary;
  const c2 = palette.accent;
  let mark = '';
  if(project.logoStyle==='Wordmark') mark = '<path d="M24 45h48" stroke="'+c1+'" stroke-width="5" stroke-linecap="round"/><circle cx="48" cy="24" r="9" fill="'+c2+'"/>';
  else if(project.logoStyle==='Monogram') mark = '<rect x="14" y="14" width="68" height="68" rx="18" fill="'+c1+'"/><text x="48" y="57" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="'+palette.bg+'">'+initials+'</text>';
  else if(project.logoStyle==='Orbit / symbol') mark = '<circle cx="48" cy="48" r="24" fill="none" stroke="'+c1+'" stroke-width="6"/><ellipse cx="48" cy="48" rx="37" ry="13" transform="rotate(-35 48 48)" fill="none" stroke="'+c2+'" stroke-width="5"/><circle cx="75" cy="27" r="6" fill="'+c1+'"/>';
  else if(project.logoStyle==='Shield / crest') mark = '<path d="M48 10 78 22v24c0 19-12 31-30 40C30 77 18 65 18 46V22z" fill="'+c1+'"/><path d="m33 48 10 10 21-23" fill="none" stroke="'+palette.bg+'" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
  else if(project.logoStyle==='Abstract spark') mark = '<path d="M48 7 58 36 88 48 58 59 48 89 37 59 8 48 37 36z" fill="'+c1+'"/><circle cx="72" cy="20" r="7" fill="'+c2+'"/>';
  else mark = '<path d="M48 8 88 48 48 88 8 48z" fill="'+c1+'"/><path d="M48 25 71 48 48 71 25 48z" fill="'+palette.bg+'"/><circle cx="48" cy="48" r="9" fill="'+c2+'"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="520" height="120" viewBox="0 0 520 120"><rect width="520" height="120" rx="18" fill="'+palette.bg+'"/><g transform="translate(8 8) scale(1.05)">'+mark+'</g><text x="116" y="57" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="'+palette.ink+'">'+name.replace(/&/g,'&amp;').replace(/</g,'&lt;').slice(0,28)+'</text><text x="118" y="82" font-family="Arial,sans-serif" font-size="10" letter-spacing="2.2" fill="'+palette.muted+'">'+project.logoStyle.toUpperCase()+'</text></svg>';
}
function makeHtml(project, palette, content, industry) {
  const sections = project.sections.map(id=>SECTION_LIBRARY.find(s=>s.id===id)).filter(Boolean);
  const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const blocks = sections.filter(s=>s.id!=='hero').map(s=>{
    const title = s.id==='services'?'Services':s.id==='testimonials'?'What customers say':s.id==='faq'?'Frequently asked questions':s.id==='contact'?'Get in touch':s.label;
    const body = s.id==='services' ? '<div class="cards">'+content.serviceCards.map(c=>'<article><h3>'+esc(c.title)+'</h3><p>'+esc(c.copy)+'</p></article>').join('')+'</div>' :
      s.id==='faq' ? content.faq.map(f=>'<details><summary>'+esc(f.q)+'</summary><p>'+esc(f.a)+'</p></details>').join('') :
      s.id==='contact'||s.id==='cta' ? '<p>'+esc(content.intro)+'</p><a class="button" href="mailto:hello@example.com">'+esc(content.primaryCta)+'</a>' :
      '<p>'+esc(content.intro)+'</p>';
    return '<section><div class="wrap"><p class="eyebrow">'+esc(industry.label)+'</p><h2>'+esc(title)+'</h2>'+body+'</div></section>';
  }).join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(content.seoTitle)+'</title><meta name="description" content="'+esc(content.seoDescription)+'"><meta name="robots" content="index,follow"><style>:root{--bg:'+palette.bg+';--surface:'+palette.surface+';--ink:'+palette.ink+';--muted:'+palette.muted+';--primary:'+(project.customAccent||palette.primary)+';--accent:'+palette.accent}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'+project.font+',Arial,sans-serif;line-height:1.6}.wrap{width:min(1120px,90%);margin:auto}nav{display:flex;justify-content:space-between;align-items:center;padding:22px 5%;border-bottom:1px solid color-mix(in srgb,var(--muted) 25%,transparent)}nav strong{font-size:20px}nav a,.button{color:var(--ink);text-decoration:none;border:1px solid var(--primary);border-radius:999px;padding:11px 18px}.hero{padding:100px 0;background:linear-gradient(120deg,var(--bg),var(--surface))}.eyebrow{color:var(--primary);text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800}h1{font-size:clamp(42px,7vw,80px);line-height:1.02;letter-spacing:-.04em;max-width:850px}h2{font-size:clamp(30px,4vw,48px);letter-spacing:-.03em}p{color:var(--muted);max-width:700px}.button{display:inline-block;background:var(--primary);color:white;margin-top:18px}section{padding:72px 0;border-bottom:1px solid color-mix(in srgb,var(--muted) 18%,transparent)}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.cards article{background:var(--surface);padding:22px;border:1px solid color-mix(in srgb,var(--muted) 20%,transparent);border-radius:18px}footer{padding:36px 5%;color:var(--muted)}</style></head><body><nav><strong>'+esc(project.businessName)+'</strong><a href="#contact">'+esc(content.primaryCta)+'</a></nav><header class="hero"><div class="wrap"><p class="eyebrow">'+esc(content.eyebrow)+'</p><h1>'+esc(content.headline)+'</h1><p>'+esc(content.subheadline)+'</p><a class="button" href="#contact">'+esc(content.primaryCta)+'</a></div></header>'+blocks+'<footer>'+esc(project.businessName)+' · '+esc(project.location)+'</footer><script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':content.schemaType,name:project.businessName,areaServed:project.location,description:content.seoDescription}).replace(/</g,'\\u003c')+'</script></body></html>';
}

export default function LaunchStudio() {
  const [project, setProject] = useState(() => {
    try { return {...DEFAULT_PROJECT, ...(JSON.parse(localStorage.getItem('x1-launch-studio-project') || '{}'))}; }
    catch { return DEFAULT_PROJECT; }
  });
  const [activeTab, setActiveTab] = useState('build');
  const [sectionQuery, setSectionQuery] = useState('');
  const [industryQuery, setIndustryQuery] = useState('');
  const [status, setStatus] = useState('Draft ready');
  const [generated, setGenerated] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const industry = INDUSTRIES.find(i=>i.id===project.industry) || INDUSTRIES[0];
  const palette = PALETTES.find(p=>p.id===project.paletteId) || PALETTES[1];
  const content = useMemo(()=>project.generatedContent || makeContent(project,industry),[project,industry]);
  const layout = LAYOUTS.find(l=>l.id===project.layoutId) || LAYOUTS[0];
  const sections = SECTION_LIBRARY.filter(s=>s.label.toLowerCase().includes(sectionQuery.toLowerCase()) || s.group.toLowerCase().includes(sectionQuery.toLowerCase()));
  const industries = INDUSTRIES.filter(i=>i.label.toLowerCase().includes(industryQuery.toLowerCase()));
  const update = (patch) => setProject(prev=>({...prev,...patch,generatedContent:null}));
  useEffect(()=>{ try { localStorage.setItem('x1-launch-studio-project',JSON.stringify(project)); } catch {} },[project]);
  useEffect(()=>{ setGenerated(!!project.generatedContent); },[project.generatedContent]);
  const generateContent = () => {
    const next = makeContent(project,industry);
    setProject(prev=>({...prev,generatedContent:next,metaTitle:next.seoTitle,metaDescription:next.seoDescription}));
    setStatus('Content draft generated'); setActiveTab('content');
  };
  const toggleSection = (id) => update({sections:project.sections.includes(id)?project.sections.filter(x=>x!==id):[...project.sections,id]});
  const addPage = () => {
    const n = prompt('Name this page (e.g. Service Areas, Financing, Case Studies):');
    if(n && n.trim() && !project.pages.some(p=>p.toLowerCase()===n.trim().toLowerCase())) update({pages:[...project.pages,n.trim()]});
  };
  const addTarget = () => update({launchTargets:[...project.launchTargets,{id:Date.now(),location:'New market, ST',businessName:project.businessName}]});
  const exportBlueprint = () => {
    const payload={version:'launch-studio-blueprint-v1',createdAt:new Date().toISOString(),project:{...project,generatedContent:content},industry,palette,layout,requestedPages:project.pages,requestedSections:project.sections.map(id=>SECTION_LIBRARY.find(s=>s.id===id)).filter(Boolean),brand:{primary:project.customAccent||palette.primary,secondary:palette.accent,font:project.font,logoStyle:project.logoStyle},optimization:{seo:true,aeo:true,geo:true},imagePrompt:content.imagePrompt,provisioningStatus:'blueprint-exported-not-deployed'};
    downloadFile(safeId(project.businessName)+'-launch-blueprint.json',JSON.stringify(payload,null,2));
    setStatus('Launch blueprint exported');
  };
  const exportHtml = () => { downloadFile(safeId(project.businessName)+'.html',makeHtml(project,palette,content,industry),'text/html;charset=utf-8'); setStatus('HTML prototype exported'); };
  const exportLogo = () => { downloadFile(safeId(project.businessName)+'-logo.svg',makeLogoSvg(project,palette),'image/svg+xml;charset=utf-8'); setStatus('Logo SVG exported'); };
  const exportBatch = () => {
    setBatchBusy(true);
    const batch=project.launchTargets.map((target,index)=>{
      const clone={...project,businessName:target.businessName||project.businessName,location:target.location,generatedContent:null};
      const c=makeContent(clone,industry);
      return {batchId:'LAUNCH-'+String(index+1).padStart(3,'0'),businessName:clone.businessName,location:clone.location,industry:industry.id,layout:layout.id,palette:palette.id,brandColor:project.customAccent||palette.primary,pages:clone.pages,sections:clone.sections,content:c,seo:{title:c.seoTitle,description:c.seoDescription},provisioningStatus:'queued-for-provisioning-integration'};
    });
    downloadFile('launch-studio-mass-launch.json',JSON.stringify({version:'mass-launch-blueprints-v1',count:batch.length,targets:batch},null,2));
    setBatchBusy(false); setStatus(batch.length+' launch blueprints exported');
  };
  const logoSvg = makeLogoSvg(project,palette);
  const previewStyle = {'--ls-canvas':palette.bg,'--ls-surface':palette.surface,'--ls-ink':palette.ink,'--ls-muted':palette.muted,'--ls-primary':project.customAccent||palette.primary,'--ls-accent':palette.accent,'--ls-secondary':palette.secondary,'--ls-gradient':palette.gradient};
  const tabs=[['build','Builder',LayoutTemplate],['brand','Brand & Colors',Palette],['content','Content Generator',WandSparkles],['pages','Pages & Sections',Layers3],['seo','SEO / AEO / GEO',Globe2],['launch','Mass Launch',Rocket]];

  return (
    <main className="x1-launch-studio" style={previewStyle}>
      <header className="x1-ls-topbar">
        <div className="x1-ls-brand">
          <Link to="/admin/studio" className="x1-ls-back" aria-label="Back to Visual Studio"><ArrowLeft size={16}/></Link>
          <div className="x1-ls-brand-icon"><Sparkles size={19}/></div>
          <div><div className="x1-ls-kicker">STRATEGIC MINDS AI <span>/ ADMIN WORKSPACE</span></div><h1>Launch Studio</h1><p>Industry-aware website factory · design, content, and launch blueprints</p></div>
        </div>
        <div className="x1-ls-top-actions"><span className="x1-ls-status"><i/> {status}</span><button onClick={exportBlueprint}><Download size={15}/> Export blueprint</button><button className="x1-ls-primary-btn" onClick={exportHtml}><Rocket size={15}/> Export HTML</button></div>
      </header>
      <nav className="x1-ls-tabs" aria-label="Launch Studio tools">
        {tabs.map(([id,label,Icon])=><button key={id} className={activeTab===id?'active':''} onClick={()=>setActiveTab(id)}><Icon size={16}/><span>{label}</span></button>)}
      </nav>

      {activeTab==='build' && <div className="x1-ls-workspace">
        <aside className="x1-ls-control-panel">
          <div className="x1-ls-panel-title"><div><span className="x1-ls-step">01 / FOUNDATION</span><h2>Build brief</h2></div><BadgeCheck size={18}/></div>
          <label>Business / brand name<input value={project.businessName} onChange={e=>update({businessName:e.target.value})} placeholder="Business name"/></label>
          <label>Industry <div className="x1-ls-search"><Search size={14}/><input value={industryQuery} onChange={e=>setIndustryQuery(e.target.value)} placeholder="Search 35+ industries"/></div></label>
          <div className="x1-ls-industry-list">{industries.slice(0,7).map(i=><button key={i.id} className={project.industry===i.id?'selected':''} onClick={()=>update({industry:i.id})}>{i.label}{project.industry===i.id&&<Check size={14}/>}</button>)}{industries.length===0&&<small>No matching industries.</small>}</div>
          <label>Service / niche<input value={project.subindustry} onChange={e=>update({subindustry:e.target.value})} placeholder="Specialty or niche"/></label>
          <label>Market / service area<input value={project.location} onChange={e=>update({location:e.target.value})} placeholder="City, State / service area"/></label>
          <label>Target customer<input value={project.audience} onChange={e=>update({audience:e.target.value})} placeholder="Ideal customer"/></label>
          <label>Core services (comma separated)<textarea rows={3} value={project.services} onChange={e=>update({services:e.target.value})}/></label>
          <label>Primary website goal<select value={project.goal} onChange={e=>update({goal:e.target.value})}><option>Lead generation</option><option>Bookings & appointments</option><option>Ecommerce sales</option><option>Demo / trial signups</option><option>Authority & education</option><option>Directory / discovery</option></select></label>
          <button className="x1-ls-primary-btn x1-ls-wide" onClick={generateContent}><WandSparkles size={16}/> Generate industry-specific content</button>
        </aside>
        <section className="x1-ls-preview-column">
          <div className="x1-ls-preview-toolbar"><div><span className="x1-ls-step">LIVE CANVAS</span><strong>{industry.label} <span>· {layout.name}</span></strong></div><div className="x1-ls-preview-actions"><span className="x1-ls-chip">Desktop preview</span><button onClick={()=>setActiveTab('brand')}><Palette size={14}/> Customize</button></div></div>
          <div className="x1-ls-site-preview">
            <div className="x1-ls-browser-bar"><div className="x1-ls-dots"><i/><i/><i/></div><div className="x1-ls-url">preview.{safeId(project.businessName)}.site</div><span>Preview</span></div>
            <div className="x1-ls-site" style={{fontFamily:project.font+', Arial, sans-serif'}}>
              <div className="x1-ls-site-nav"><div className="x1-ls-site-logo"><span className="x1-ls-logo-mark"><Sparkles size={18}/></span><strong>{project.businessName||'Your Business'}</strong></div><div className="x1-ls-site-links">{project.pages.slice(0,4).map(p=><span key={p}>{p}</span>)}</div><button>{content.primaryCta}</button></div>
              <section className={'x1-ls-site-hero layout-'+layout.type}>
                <div className="x1-ls-hero-copy"><span className="x1-ls-eyebrow">{content.eyebrow}</span><h2>{content.headline}</h2><p>{content.subheadline}</p><div className="x1-ls-hero-buttons"><button>{content.primaryCta}</button><span>Explore our services ↗</span></div><div className="x1-ls-proof-line"><span><ShieldCheck size={14}/> Professional service</span><span><Check size={14}/> Clear next steps</span></div></div>
                <div className="x1-ls-hero-art" style={{backgroundImage:'linear-gradient(145deg,rgba(5,12,24,.12),rgba(5,12,24,.45)),url(https://images.unsplash.com/'+industry.image+'?auto=format&fit=crop&w=1000&q=85)'}}><div className="x1-ls-image-label"><Image size={13}/> Industry-matched image direction</div><div className="x1-ls-art-card"><span>BUILT AROUND YOU</span><strong>{project.location||'Your local market'}</strong><small>Tailored service · Clear process</small></div></div>
              </section>
              {project.sections.includes('trust')&&<div className="x1-ls-trust-strip"><span>TRUSTED SERVICE</span><span>QUALITY FIRST</span><span>LOCAL EXPERTISE</span><span>RESPONSIVE SUPPORT</span></div>}
              {project.sections.filter(id=>id!=='hero'&&id!=='trust').slice(0,4).map(id=>{const s=SECTION_LIBRARY.find(x=>x.id===id);if(!s)return null;return <section key={id} className="x1-ls-preview-section"><div><span className="x1-ls-eyebrow">{s.group}</span><h3>{s.label}</h3><p>{id==='services'?industry.services.slice(0,3).join(' · '):id==='faq'?'Answers to the questions customers ask before they get started.':id==='testimonials'?'Real feedback and verified customer experiences build confidence.':content.intro}</p></div>{id==='services'&&<div className="x1-ls-mini-cards">{content.serviceCards.slice(0,3).map(c=><article key={c.title}><strong>{c.title}</strong><small>{c.copy}</small></article>)}</div>}</section>})}
              <div className="x1-ls-site-footer"><strong>{project.businessName}</strong><span>{project.location} · {project.pages.length} pages · {project.sections.length} sections</span></div>
            </div>
          </div>
          <div className="x1-ls-quality-row"><div><ShieldCheck size={17}/><span><strong>Industry relevance</strong><small>Content and image direction follow the selected industry</small></span><b>READY</b></div><div><Globe2 size={17}/><span><strong>SEO / AEO / GEO</strong><small>Metadata, FAQ, schema, and local-market fields</small></span><b>CONFIGURABLE</b></div><div><Rocket size={17}/><span><strong>Launch handoff</strong><small>Exportable blueprint for provisioning workflows</small></span><b>DRAFT</b></div></div>
        </section>
      </div>}

      {activeTab==='brand' && <div className="x1-ls-tab-content">
        <div className="x1-ls-section-heading"><div><span className="x1-ls-step">02 / BRAND SYSTEM</span><h2>Color, typography & logo studio</h2><p>20 curated color systems from the Universal Template Engine, plus a custom accent override.</p></div><button onClick={exportLogo}><Download size={15}/> Download SVG logo</button></div>
        <label className="x1-ls-search x1-ls-palette-search"><Search size={15}/><input value={sectionQuery} onChange={e=>setSectionQuery(e.target.value)} placeholder="Search palette by name"/></label>
        <div className="x1-ls-palette-grid">{PALETTES.filter(p=>p.name.toLowerCase().includes(sectionQuery.toLowerCase())).map(p=><button key={p.id} className={'x1-ls-palette-card '+(project.paletteId===p.id?'selected':'')} onClick={()=>update({paletteId:p.id})}><div className="x1-ls-swatch-strip">{[p.bg,p.surface,p.primary,p.accent,p.ink].map((c,i)=><i key={i} style={{background:c,borderColor:c===p.bg||c===p.surface?'#cbd5e1':'transparent'}}/>)}</div><strong>{p.name}</strong><small>{p.id} · {p.primary} / {p.accent}</small>{project.paletteId===p.id&&<span className="x1-ls-selected-check"><Check size={14}/></span>}</button>)}</div>
        <div className="x1-ls-brand-grid"><div className="x1-ls-card"><h3>Custom accent color</h3><p>Override the selected palette’s primary action color.</p><div className="x1-ls-color-control"><input type="color" value={project.customAccent||palette.primary} onChange={e=>update({customAccent:e.target.value})}/><input value={project.customAccent||palette.primary} onChange={e=>update({customAccent:e.target.value})} aria-label="Custom accent hex"/></div><button className="x1-ls-subtle-btn" onClick={()=>update({customAccent:''})}>Use palette default</button></div><div className="x1-ls-card"><h3>Typography</h3><p>Choose a type system for the website preview and exported HTML.</p><select value={project.font} onChange={e=>update({font:e.target.value})}>{FONTS.map(f=><option key={f}>{f}</option>)}</select><div className="x1-ls-type-sample" style={{fontFamily:project.font}}><strong>Designed to stand out.</strong><span>Readable, responsive, and aligned to the brand.</span></div></div><div className="x1-ls-card"><h3>Logo generator</h3><p>Generate an original vector-style logo concept. Export the current concept as editable SVG.</p><select value={project.logoStyle} onChange={e=>update({logoStyle:e.target.value})}>{LOGO_STYLES.map(s=><option key={s}>{s}</option>)}</select><div className="x1-ls-logo-preview" dangerouslySetInnerHTML={{__html:logoSvg}}/><button onClick={exportLogo}><Download size={14}/> Export SVG</button></div></div>
        <div className="x1-ls-palette-preview"><span className="x1-ls-step">PALETTE PREVIEW</span><div className="x1-ls-color-tokens">{[['Canvas',palette.bg],['Surface',palette.surface],['Text',palette.ink],['Muted',palette.muted],['Primary',project.customAccent||palette.primary],['Accent',palette.accent]].map(([n,c])=><div key={n}><i style={{background:c}}/><span>{n}<small>{c}</small></span></div>)}</div></div>
      </div>}

      {activeTab==='content' && <div className="x1-ls-tab-content">
        <div className="x1-ls-section-heading"><div><span className="x1-ls-step">03 / CONTENT ENGINE</span><h2>Industry-specific content generator</h2><p>Generate a structured first draft using the industry profile, service list, target market, and conversion goal.</p></div><button className="x1-ls-primary-btn" onClick={generateContent}><WandSparkles size={15}/> Generate draft</button></div>
        <div className="x1-ls-content-grid"><div className="x1-ls-card x1-ls-content-main"><label>Hero headline<input value={content.headline} onChange={e=>update({generatedContent:{...content,headline:e.target.value}})}/></label><label>Subheadline<textarea rows={3} value={content.subheadline} onChange={e=>update({generatedContent:{...content,subheadline:e.target.value}})}/></label><label>Primary CTA<input value={content.primaryCta} onChange={e=>update({generatedContent:{...content,primaryCta:e.target.value}})}/></label><label>Business introduction<textarea rows={4} value={content.intro} onChange={e=>update({generatedContent:{...content,intro:e.target.value}})}/></label><div className="x1-ls-content-card-list">{content.serviceCards.map((s,i)=><article key={i}><label>Service {i+1}<input value={s.title} onChange={e=>update({generatedContent:{...content,serviceCards:content.serviceCards.map((x,j)=>j===i?{...x,title:e.target.value}:x)}})}/></label><textarea rows={2} value={s.copy} onChange={e=>update({generatedContent:{...content,serviceCards:content.serviceCards.map((x,j)=>j===i?{...x,copy:e.target.value}:x)}})}/></article>)}</div></div><aside className="x1-ls-card"><h3>Content quality checklist</h3>{[['Industry-specific terms',true],['Service and CTA alignment',true],['Local-market context',!!project.location],['Proof points verified by operator',false],['Original images approved',false],['Claims reviewed before publish',false]].map(([t,ok])=><div className="x1-ls-check-row" key={t}><span className={ok?'ok':''}>{ok?<Check size={13}/>:<span>!</span>}</span><p>{t}<small>{ok?'Present in current draft':'Requires business-specific verification'}</small></p></div>)}<div className="x1-ls-note">Draft generation is currently local/template-based. Connect an approved model gateway to make this step call your live AI content service.</div><button className="x1-ls-wide" onClick={()=>downloadFile(safeId(project.businessName)+'-content.json',JSON.stringify(content,null,2))}><Download size={14}/> Export content pack</button><button className="x1-ls-wide" onClick={()=>downloadFile(safeId(project.businessName)+'-image-prompts.txt',content.imagePrompt+'\n\nAdditional prompt: Generate 4 matching supporting images for the '+industry.label+' industry with a consistent visual direction, no text, and varied subject framing.','text/plain;charset=utf-8')}><Image size={14}/> Export image prompts</button></aside></div>
      </div>}

      {activeTab==='pages' && <div className="x1-ls-tab-content">
        <div className="x1-ls-section-heading"><div><span className="x1-ls-step">04 / SITE ARCHITECTURE</span><h2>Pages, sections & layout recipes</h2><p>Compose a multi-page site using 20 layout recipes and a reusable section library.</p></div><button onClick={addPage}><Plus size={15}/> Add page</button></div>
        <div className="x1-ls-pages-grid"><div className="x1-ls-card"><h3>Pages ({project.pages.length})</h3><p>Choose a navigation map. Add service, industry, location, case study, or campaign pages as needed.</p><div className="x1-ls-page-list">{project.pages.map((p,i)=><div key={p}><span className="x1-ls-page-number">{String(i+1).padStart(2,'0')}</span><input value={p} onChange={e=>update({pages:project.pages.map((x,j)=>i===j?e.target.value:x)})}/><button disabled={project.pages.length===1} onClick={()=>update({pages:project.pages.filter((x,j)=>i!==j)})} aria-label={'Remove '+p}><Trash2 size={14}/></button></div>)}</div><button className="x1-ls-wide" onClick={()=>update({pages:[...new Set([...project.pages,'Service Areas','Case Studies','Resources','Financing','Industries We Serve'])]})}><ListPlus size={15}/> Add recommended pages</button></div>
        <div className="x1-ls-card"><h3>Layout library ({LAYOUTS.length})</h3><p>Choose the structural recipe before styling; content and modules adapt to the selected industry.</p><div className="x1-ls-layout-list">{LAYOUTS.map(l=><button key={l.id} className={project.layoutId===l.id?'selected':''} onClick={()=>update({layoutId:l.id})}><span className="x1-ls-layout-icon"><LayoutTemplate size={17}/></span><span><strong>{l.name}</strong><small>{l.desc}</small></span>{project.layoutId===l.id&&<Check size={15}/>}</button>)}</div></div></div>
        <div className="x1-ls-card x1-ls-sections-card"><div className="x1-ls-section-heading compact"><div><h3>Section library ({SECTION_LIBRARY.length})</h3><p>Add, remove, and reorder website sections. Selection is included in the export blueprint.</p></div><label className="x1-ls-search"><Search size={14}/><input value={sectionQuery} onChange={e=>setSectionQuery(e.target.value)} placeholder="Search sections"/></label></div><div className="x1-ls-section-grid">{sections.map(s=><label key={s.id} className={project.sections.includes(s.id)?'chosen':''}><input type="checkbox" checked={project.sections.includes(s.id)} onChange={()=>toggleSection(s.id)}/><span><strong>{s.label}</strong><small>{s.group}</small></span>{project.sections.includes(s.id)&&<Check size={14}/>}</label>)}</div><div className="x1-ls-selected-order"><strong>Current order:</strong> {project.sections.map(id=>SECTION_LIBRARY.find(s=>s.id===id)?.label).filter(Boolean).join(' → ')}</div></div>
      </div>}

      {activeTab==='seo' && <div className="x1-ls-tab-content">
        <div className="x1-ls-section-heading"><div><span className="x1-ls-step">05 / DISCOVERABILITY</span><h2>SEO · AEO · GEO</h2><p>Configure search snippets, answer-engine FAQs, local entities, and structured data for the selected industry.</p></div><button onClick={()=>downloadFile(safeId(project.businessName)+'-discoverability.json',JSON.stringify({title:project.metaTitle,description:project.metaDescription,faqs:content.faq,schemaType:content.schemaType,areaServed:project.location,industry:industry.label,keywords:[industry.label,project.subindustry,project.location].filter(Boolean),imagePrompt:content.imagePrompt},null,2))}><Download size={15}/> Export metadata</button></div>
        <div className="x1-ls-seo-grid"><div className="x1-ls-card"><h3>Search engine optimization</h3><label>Meta title<input maxLength={60} value={project.metaTitle} onChange={e=>update({metaTitle:e.target.value})}/><small>{project.metaTitle.length}/60 characters</small></label><label>Meta description<textarea maxLength={160} rows={4} value={project.metaDescription} onChange={e=>update({metaDescription:e.target.value})}/><small>{project.metaDescription.length}/160 characters</small></label><label>Target location / service area<input value={project.location} onChange={e=>update({location:e.target.value})}/></label><div className="x1-ls-search-result"><small>SEARCH PREVIEW</small><strong>{project.metaTitle}</strong><span>{safeId(project.businessName)}.com · {project.location}</span><p>{project.metaDescription}</p></div></div><div className="x1-ls-card"><h3>Answer engine optimization</h3><p>FAQs create direct answers for voice search, AI answers, and customer objections. Verify answers against the actual business before publishing.</p>{(project.faqs||[]).map((faq,i)=><div className="x1-ls-faq-editor" key={i}><label>Question<input value={faq.q} onChange={e=>update({faqs:project.faqs.map((f,j)=>j===i?{...f,q:e.target.value}:f)})}/></label><label>Answer<textarea rows={2} value={faq.a} onChange={e=>update({faqs:project.faqs.map((f,j)=>j===i?{...f,a:e.target.value}:f)})}/></label><button onClick={()=>update({faqs:project.faqs.filter((_,j)=>j!==i)})}><Trash2 size={13}/> Remove FAQ</button></div>)}<button onClick={()=>update({faqs:[...(project.faqs||[]),{q:'New customer question?',a:'Add a verified answer from the business owner.'}]})}><Plus size={14}/> Add FAQ</button></div><div className="x1-ls-card"><h3>Generative engine optimization</h3><div className="x1-ls-schema"><span>Recommended schema type</span><strong>{content.schemaType}</strong><small>Industry profile: {industry.label}</small></div><p>Recommended entities for the page</p><div className="x1-ls-entity-tags">{[project.businessName,industry.label,project.subindustry,project.location].filter(Boolean).map(t=><span key={t}>{t}</span>)}</div><div className="x1-ls-note">SEO/AEO/GEO settings are exported as a metadata pack and blueprint. Final structured data should be validated against the actual business and page content before publishing.</div></div></div>
      </div>}

      {activeTab==='launch' && <div className="x1-ls-tab-content">
        <div className="x1-ls-section-heading"><div><span className="x1-ls-step">06 / MASS LAUNCH</span><h2>Multi-market launch queue</h2><p>Create a tailored website blueprint per location while reusing approved brand, layout, and content rules.</p></div><button className="x1-ls-primary-btn" onClick={exportBatch} disabled={batchBusy}><Rocket size={15}/>{batchBusy?'Preparing...':'Export batch blueprints'}</button></div>
        <div className="x1-ls-launch-summary"><div><strong>{project.launchTargets.length}</strong><span>Target launches</span></div><div><strong>{project.pages.length}</strong><span>Pages per site</span></div><div><strong>{project.sections.length}</strong><span>Selected modules</span></div><div><strong>{industry.label}</strong><span>Industry profile</span></div></div>
        <div className="x1-ls-card"><div className="x1-ls-section-heading compact"><div><h3>Target markets</h3><p>Each row becomes a unique launch manifest with localized content and SEO fields.</p></div><button onClick={addTarget}><Plus size={14}/> Add market</button></div><div className="x1-ls-target-table"><div className="x1-ls-target-head"><span>Business / brand</span><span>Market / location</span><span>Industry</span><span>Actions</span></div>{project.launchTargets.map((target,i)=><div className="x1-ls-target-row" key={target.id}><input value={target.businessName} onChange={e=>update({launchTargets:project.launchTargets.map((t,j)=>i===j?{...t,businessName:e.target.value}:t)})} placeholder="Business name"/><input value={target.location} onChange={e=>update({launchTargets:project.launchTargets.map((t,j)=>i===j?{...t,location:e.target.value}:t)})} placeholder="City, State"/><span className="x1-ls-chip">{industry.label}</span><button onClick={()=>update({launchTargets:project.launchTargets.filter((_,j)=>i!==j)})} disabled={project.launchTargets.length===1} aria-label="Remove launch target"><Trash2 size={14}/></button></div>)}</div><div className="x1-ls-note">This exports batch-ready blueprints. Actual repository creation, domain provisioning, and Vercel production deployment require the connected provisioning pipeline and its credentials; this screen does not claim sites are live.</div></div>
        <div className="x1-ls-card"><h3>Batch configuration snapshot</h3><div className="x1-ls-batch-snapshot"><span><Palette size={15}/> {palette.name}</span><span><LayoutTemplate size={15}/> {layout.name}</span><span><FileText size={15}/> {project.pages.length} pages / site</span><span><MapPin size={15}/> {project.launchTargets.length} markets</span></div><button className="x1-ls-wide" onClick={exportBlueprint}><Download size={15}/> Export master blueprint</button></div>
      </div>}

      <footer className="x1-ls-footer"><span><Sparkles size={14}/> X1 LAUNCH STUDIO <i/> Universal Template Engine patterns integrated</span><span>Draft workspace · No production sites changed by this screen</span></footer>
    </main>
  );
}
