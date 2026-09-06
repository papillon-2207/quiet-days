import {emptyData,newRecord,newSymptom,validateData} from './model.js';
import {addDays,today,recordedMeta} from './dates.js';
export function demoData() {
  const d=emptyData(), end=today();d.settings.lockOnHide=false;
  for(let n=92;n>=2;n--) {
    const day=addDays(end,-n);const phase=(92-n)%30;
    if(n%3!==0 && phase<23 && phase!==0)continue;
    const opts={at:`${day}T12:00:00.000Z`,recordedDay:day};
    const r=newRecord(day,phase>=23?'details':'none',opts);
    if(phase===0){r.bleeding='confirmed';r.periodStart=true;r.continuity='complete';r.provenance.bleeding=recordedMeta(day,opts);}
    if(phase>=23){r.symptoms.fatigue={...newSymptom(),impact:'rest',timing:'afternoon'};r.provenance['symptom:fatigue']=recordedMeta(day,opts);if(phase===26){r.symptoms.headache={...newSymptom(),impact:'slow',timing:'morning'};r.provenance['symptom:headache']=recordedMeta(day,opts);}}
    r.confidence='certain';r.verifiedAt=opts.at;d.records[day]=r;
  }
  validateData(d);return d;
}
