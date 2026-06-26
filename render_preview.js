const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML = path.resolve(__dirname, 'charge_preview.html');
const url = (q)=> 'file:///' + HTML.replace(/\\/g,'/') + q;
const specs = process.argv.slice(2).length ? process.argv.slice(2) : ['2','0','3','5'];
(async()=>{
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new',
    args:['--no-sandbox','--allow-file-access-from-files','--mute-audio'] });
  for(const s of specs){
    const page = await browser.newPage();
    await page.setViewport({width:1440,height:900,deviceScaleFactor:1.5});
    await page.goto(url('?spec='+s), {waitUntil:'networkidle2', timeout:60000});
    await new Promise(r=>setTimeout(r,1800));
    await page.screenshot({path: path.join(__dirname,'preview_spec'+s+'.png')});
    await page.close();
    console.log('rendered spec', s);
  }
  await browser.close();
})();
