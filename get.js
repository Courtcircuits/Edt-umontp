
const puppeteer = require('puppeteer');

const fs = require('fs');

const url = 'https://proseconsult.umontpellier.fr/direct/?data=9d70788422d098818a1b70d9d14e21834f51f7d91eb3648604d628113e82760dbed8d89011b8db3f565a6eba3fb421d313f6c63370d69630c73e5d47e7b4caa205b671755e2e313accf1c0ae7bea9fe2ffaaa69cbd14fea5a6d0111bfaa17a823cc1c3b4302fc5dd2762be0aa3a53986aa46015363b2752612a410752d15eaafd211eeb7936734e0cd7fd38213cedc0eec845302a004ead06829e11b88069c04e0a1249a51c245e3f446955c31272adc3e005818031c0fd08944daf1a0457ec56a3d3b2718400c8964e2ba6df5e3b37b,1';

async function bot(){
    const browser = await puppeteer.launch();
    let page = await browser.newPage();
    await page.goto(url);
    await page.waitForXPath('//*[@id="Planning"]');
    
    console.log('Page chargée');
    await goToNextWeek(page);
    
    let datas = JSON.stringify(await getData(page));
    
    console.log(datas);
    
    fs.writeFile('datas.json', datas, err => {
        if(err) {
            console.error(err);
            return
        }
        
    })

    await browser.close();
}

async function getData(page){
    let data = [];
    let days;
    let both;
    let contain = true;
    
    
    for(let k = 0 ; k<7;k++){
        await goToNextDay(k,page);
        contain=true;
        days= [];
        try{
            await page.waitForSelector('.eventText', {'timeout': '1000'});
        }catch(error){
            contain = false;
        }
        
        both=[null,null];
        if(contain){
            const hrefElt = await page.$$('.eventText');
            for(let i=0; i<hrefElt.length; i+=2){
                both[0] = await getText(hrefElt[i]);
                both[1] = await getText(hrefElt[i+1]);
                days.push(parse(both[0],both[1],i/2));
            }
        }

        console.log(days);
        let elt = await page.$$('.labelLegend');
        
        let title = await getText(elt[1]);
        let day = {
            title :title,
            datas : days
        }
        data.push(day);
        
    }
    
    return data;
}


async function goToNextDay(i, page){
    let id =13 + i;
    let elta = await page.$$('.labelLegend');
    
    
    await page.waitForTimeout(500);
    await page.click('table[id=x-auto-'+id+'] button');
    await page.waitForTimeout(500);
    
    
    
}



async function goToNextWeek(page){
    //On va d'abord chercher le bon boutton

    let btns = await page.$$('.x-btn-pressed');
    let semaine = btns[btns.length-1];

    let id = await getProper(semaine, 'id');
    let idNext = select(id,id.length-2,id.length);
    idNext = parseInt(idNext) + 1;
    idNext = select(id, 0, id.length-2)+idNext;
    
    /*let btn = await page.$('table[id='+idNext+'] button');
    console.log("Sélection du boutton");*/
    
    await page.waitForTimeout(500);
    await page.click('table[id='+idNext+'] button');
    
    await page.waitForTimeout(500);
    await page.screenshot({'path' : 'screen.png'});
    
}

async function getProper(elt , property){
    return await(await elt.getProperty(property)).jsonValue();
}


async function getText(elt){
    let txt =await elt.getProperty('textContent');
    let rawTxt = await txt.jsonValue();
    return rawTxt;
}

function parse(txt, title , id){
    let start = select(txt, txt.length-13,txt.length-8);
    let end = select(txt, txt.length-5, txt.length)
    let donnee ={
        id : id,
        title : title,
        start : start,
        end : end,
        metadata : txt
    }
    return donnee;
}

function select(txt, start, end){
    let ch="";
    for(let i=start; i<end ; i++){
        ch+= txt.charAt(i);
    }
    return ch;
}


try{
    bot();
}catch{
    console.error();
}

process.on('unhandledRejection', function(err) {
    console.log(err);
});