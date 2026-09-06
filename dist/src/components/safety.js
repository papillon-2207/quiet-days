import { el, p, heading, card } from '../lib/dom.js';
export function safetyPage() {
  return el('div',{},heading('先照顧現在的你','不必先完成任何紀錄，才能尋求協助。','照顧與協助'),
    card('立即尋求醫療協助',p('突然非常劇烈的頭痛，尤其迅速達到最痛，或伴隨新出現的無力、麻木、說話困難、意識混亂；嚴重出血合併暈眩、昏厥、胸痛或呼吸困難；以及突然嚴重腹痛，都不應因為接近經期而延後求助。'),
      p('如有懷孕可能，單側下腹痛伴出血、肩尖痛、暈眩或昏倒，也需緊急評估。本程式不會詢問或推定你的性生活、懷孕或避孕狀況。'),
      el('a',{href:'tel:119',class:'button danger'},'撥打 119（台灣緊急救護）'),p('台灣以外請使用所在地的緊急救護電話。','hint')),
    card('不舒服不一定是經期將至',p('出血多到每小時浸透一片用品、持續數小時，新的或和平常不同的疼痛、反覆影響生活的頭痛或腸胃症狀，請尋求醫療評估。用品更換頻率並不等同精確出血量，不能單獨診斷。'),p('嚴重疲倦、情緒或專注力變化，也可能有月經以外的原因。不要依據本程式調整用藥、避孕或就醫決定。')),
    card('情緒很難承受時',p('若出現自傷想法或無法維持自身安全，請立刻聯絡可信任的人與當地急救服務。台灣也可撥打 1925 安心專線。'),el('a',{href:'tel:1925',class:'button secondary'},'撥打 1925（台灣安心專線）')),
    card('準備就醫的日誌，而不是診斷',p('「我的資料」可選擇日期與欄位，匯出文字或 CSV。補登會標示為回憶；醫療人員能據此了解記錄限制。正式 PMS／PMDD 評估可能需要至少兩個週期的前瞻性每日量表，不能以這裡的快速標記、縮短題目或事後補登取代。'),
      el('p',{},el('a',{href:'https://www.rcog.org.uk/for-the-public/browse-our-patient-information/managing-premenstrual-syndrome-pms/',target:'_blank',rel:'noreferrer noopener'},'RCOG：PMS 與症狀日誌（英文，開新分頁）'))),
    card('資料依據（開啟外部網站）',p('外部網站有自己的隱私政策；點選才會連線。'),...[["NHS：子宮外孕症狀（英文）","https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/"],["Mayo Clinic：大量經血與就醫時機（英文）","https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20352829"],["American Migraine Foundation：突發劇烈頭痛（英文）","https://americanmigrainefoundation.org/resource-library/thunderclap-headaches/"],["衛生福利部：1925 安心專線","https://dep.mohw.gov.tw/DOMHAOH/cp-4906-54077-107.html"]].map(([label,url])=>el('p',{},el('a',{href:url,target:'_blank',rel:'noreferrer noopener'},label)))),
    p('本頁是一般性安全資訊，不是完整分診工具；沒有符合上述描述，也不能排除需要就醫的狀況。內容依據與查核日期見專案研究文件（2026-09-06）。','hint'));
}
